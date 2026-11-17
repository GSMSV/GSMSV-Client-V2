/**
 * 함수 코드를 Web Worker에서 실행할 수 있는 스크립트로 바꾼다.
 * sucrase는 처음 필요할 때만 불러와 첫 화면 번들에 넣지 않는다.
 * TypeScript는 타입만 지우고(형 검사는 하지 않는다), `export default`는 CommonJS 형태로 바꾼다.
 */
export type ServerlessCompileRuntime = 'javascript' | 'typescript';
export interface ServerlessCompileError { line: number; column: number; message: string }
export type ServerlessCompileResult = { ok: true; code: string } | { ok: false; error: ServerlessCompileError };

type SucraseTransform = typeof import('sucrase').transform;

let transformFn: SucraseTransform | undefined;
let loading: Promise<SucraseTransform> | undefined;
const readyListeners = new Set<() => void>();

export function isServerlessCompilerReady(): boolean { return Boolean(transformFn); }

export function loadServerlessCompiler(): Promise<SucraseTransform> {
  if (transformFn) return Promise.resolve(transformFn);
  loading ??= import('sucrase').then(module => {
    transformFn = module.transform;
    for (const listener of readyListeners) listener();
    return module.transform;
  }).catch(error => {
    loading = undefined;
    throw error;
  });
  return loading;
}

export function onServerlessCompilerReady(listener: () => void): () => void {
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

const knownMessages: Array<[RegExp, string]> = [
  [/^Unterminated string constant$/, '닫는 따옴표가 필요합니다.'],
  [/^Unterminated template$/, '닫는 백틱(`)이 필요합니다.'],
  [/^Unterminated comment$/, '닫는 주석(*/)이 필요합니다.'],
  [/^Unexpected token, expected "(.+)"$/, '"$1"이(가) 필요합니다.'],
  [/^Unexpected token$/, '예상하지 못한 코드가 있습니다.'],
];

function translate(message: string): string {
  for (const [pattern, replacement] of knownMessages) if (pattern.test(message)) return message.replace(pattern, replacement);
  return message;
}

function toCompileError(error: unknown): ServerlessCompileError {
  const raw = error instanceof Error ? error.message : String(error);
  const loc = (error as { loc?: { line?: number; column?: number } } | null)?.loc;
  const position = /\((\d+):(\d+)\)\s*$/.exec(raw);
  const message = raw.replace(/^Error transforming [^:]*:\s*/, '').replace(/\s*\(\d+:\d+\)\s*$/, '');
  return {
    line: loc?.line ?? (position ? Number(position[1]) : 1),
    column: (loc?.column ?? (position ? Number(position[2]) : 0)) + 1,
    message: translate(message),
  };
}

/** 이미 불러온 sucrase로 바로 변환한다. 아직 불러오지 않았으면 undefined. */
export function compileServerlessCodeSync(code: string, runtime: ServerlessCompileRuntime): ServerlessCompileResult | undefined {
  if (!transformFn) return undefined;
  try {
    const output = transformFn(code, {
      transforms: runtime === 'typescript' ? ['typescript', 'imports'] : ['imports'],
      filePath: runtime === 'typescript' ? 'index.ts' : 'index.js',
      disableESTransforms: true,
    });
    return { ok: true, code: output.code };
  } catch (error) {
    return { ok: false, error: toCompileError(error) };
  }
}

export async function compileServerlessCode(code: string, runtime: ServerlessCompileRuntime): Promise<ServerlessCompileResult> {
  await loadServerlessCompiler();
  return compileServerlessCodeSync(code, runtime) as ServerlessCompileResult;
}

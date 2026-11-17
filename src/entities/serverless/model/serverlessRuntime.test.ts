import { describe, expect, it } from 'vitest';
import { compileServerlessCode } from './serverlessCompiler';
import { runServerlessInSandbox, serverlessSandboxLimits, type ServerlessWorkerFactory, type ServerlessWorkerLike } from './serverlessSandbox';
import { withServerlessExecutionSlot } from './serverlessExecutionSlots';
import { pickServerlessVmSlot, serverlessFunctionsPerVm } from './serverlessPlacement';

type VmModule = {
  createContext: (sandbox: Record<string, unknown>) => Record<string, unknown>;
  runInContext: (code: string, context: Record<string, unknown>) => unknown;
};

/** 브라우저 Worker 대신 node:vm의 새 realm에서 같은 스크립트를 돌린다. */
async function vmWorkerFactory(fetched: string[] = []): Promise<ServerlessWorkerFactory> {
  const vm = await import(/* @vite-ignore */ ['node', 'vm'].join(':')) as VmModule;
  return source => {
    let terminated = false;
    const worker: ServerlessWorkerLike = { onmessage: null, onerror: null, terminate: () => { terminated = true; } };
    const context = vm.createContext({
      Request, Response, Headers, URL, TextDecoder, AbortSignal, performance, setTimeout, clearTimeout,
      location: { origin: 'https://app.test' },
      navigator: {},
      console: {},
      fetch: async (url: string) => { fetched.push(url); return new Response('remote'); },
      postMessage: (data: unknown) => { if (!terminated) queueMicrotask(() => worker.onmessage?.({ data: structuredClone(data) })); },
      addEventListener: () => undefined,
    });
    vm.runInContext('globalThis.self = globalThis;', context);
    setTimeout(() => {
      try {
        vm.runInContext(source, context);
      } catch (error) {
        const line = /:(\d+)/.exec(String((error as Error).stack))?.[1];
        worker.onerror?.({ message: `Uncaught ${(error as Error).name}: ${(error as Error).message}`, lineno: line ? Number(line) : undefined });
      }
    }, 0);
    return { worker, dispose: () => undefined };
  };
}

const request = { method: 'POST', url: 'https://fn.example.com/', headers: [['content-type', 'application/json']] as Array<[string, string]>, body: '{"name":"지민"}' };

async function run(code: string, runtime: 'javascript' | 'typescript' = 'javascript', options: { timeoutMs?: number; env?: Record<string, string>; fetched?: string[] } = {}) {
  const compiled = await compileServerlessCode(code, runtime);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return runServerlessInSandbox({ compiledCode: compiled.code, request, env: options.env ?? {}, timeoutMs: options.timeoutMs ?? 2000, createWorker: await vmWorkerFactory(options.fetched) });
}

describe('serverless compiler', () => {
  it('strips TypeScript types and reports real syntax errors with their line', async () => {
    const ok = await compileServerlessCode('export default async function handler(request: Request, env: Env) {\n  return Response.json({ ok: true as boolean });\n}', 'typescript');
    expect(ok.ok).toBe(true);
    const broken = await compileServerlessCode('export default async function handler(request: Request) {\n  const value: number = ;\n}', 'typescript');
    expect(broken).toMatchObject({ ok: false, error: { line: 2 } });
    const typesInJs = await compileServerlessCode('export default function handler(request: Request) {}', 'javascript');
    expect(typesInJs.ok).toBe(false);
  });
});

describe('serverless sandbox', () => {
  it('runs the starter handler for real with request body, env and console output', async () => {
    const outcome = await run(`export default async function handler(request, env) {
  const body = await request.json();
  console.log("Greeting sent", body.name, { method: request.method });
  console.warn("careful");
  return Response.json({ message: \`\${env.GREETING}, \${body.name}!\`, url: request.url });
}`, 'javascript', { env: { GREETING: '반가워요' } });
    expect(outcome.kind).toBe('response');
    if (outcome.kind !== 'response') return;
    expect(outcome.status).toBe(200);
    expect(JSON.parse(outcome.body)).toEqual({ message: '반가워요, 지민!', url: 'https://fn.example.com/' });
    expect(outcome.logs.map(log => [log.level, log.text])).toEqual([['log', 'Greeting sent 지민 {"method":"POST"}'], ['warn', 'careful']]);
    expect(outcome.logs[0].time).toBeGreaterThan(0);
  });

  it('reports thrown errors with the user line and keeps earlier logs', async () => {
    const outcome = await run('export default async function handler() {\n  console.log("before");\n  throw new TypeError("고장났습니다");\n}');
    expect(outcome).toMatchObject({ kind: 'error', message: 'TypeError: 고장났습니다' });
    expect(outcome.logs.map(log => log.text)).toEqual(['before']);
  });

  it('rejects handlers that do not return a Response or are not exported', async () => {
    expect(await run('export default async function handler() { return { ok: true }; }')).toMatchObject({ kind: 'error', message: expect.stringContaining('Response를 반환해야') });
    expect(await run('export const x = 1;')).toMatchObject({ kind: 'error', message: expect.stringContaining('export default') });
  });

  it('terminates the worker when the time limit passes', async () => {
    const outcome = await run('export default async function handler() {\n  console.log("waiting");\n  await new Promise(() => {});\n}', 'javascript', { timeoutMs: 50 });
    expect(outcome.kind).toBe('timeout');
    expect(outcome.logs.map(log => log.text)).toEqual(['waiting']);
  });

  it('blocks app storage, same-origin requests and eval, but allows other-origin fetch', async () => {
    const fetched: string[] = [];
    const outcome = await run(`export default async function handler() {
  const results = { indexedDB: typeof indexedDB, caches: typeof caches };
  try { await fetch("https://app.test/api/me"); results.sameOrigin = "allowed"; } catch (error) { results.sameOrigin = error.message; }
  try { eval("1"); results.eval = "allowed"; } catch (error) { results.eval = error.message; }
  try { (async () => {}).constructor("return 1"); results.fn = "allowed"; } catch (error) { results.fn = error.message; }
  results.remote = await (await fetch("https://api.other.test/data")).text();
  return Response.json(results);
}`, 'javascript', { fetched });
    expect(outcome.kind).toBe('response');
    if (outcome.kind !== 'response') return;
    const body = JSON.parse(outcome.body);
    expect(body).toMatchObject({ indexedDB: 'undefined', caches: 'undefined', remote: 'remote' });
    expect(body.sameOrigin).toContain('fetch할 수 없습니다');
    expect(body.eval).toContain('eval');
    expect(body.fn).toContain('Function');
    expect(fetched).toEqual(['https://api.other.test/data']);
  });

  it('caps response size and log lines', async () => {
    const big = await run(`export default async function handler() { return new Response("x".repeat(${serverlessSandboxLimits.maxResponseBytes + 1})); }`);
    expect(big).toMatchObject({ kind: 'error', message: expect.stringContaining('제한을 넘었습니다') });
    const noisy = await run(`export default async function handler() { for (let i = 0; i < 500; i++) console.log(i); return new Response("ok"); }`);
    expect(noisy.logs.length).toBe(serverlessSandboxLimits.maxLogLines + 1);
  });

  it('surfaces script syntax errors that the transpiler lets through', async () => {
    const outcome = await run('export default async function handler() {\n  const a = 1;\n  const a = 2;\n}');
    expect(outcome).toMatchObject({ kind: 'error', message: expect.stringContaining('SyntaxError') });
  });
});

describe('serverless limits', () => {
  it('allows two concurrent executions per function and rejects the third', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const first = withServerlessExecutionSlot('fn', () => gate.then(() => 1));
    const second = withServerlessExecutionSlot('fn', () => gate.then(() => 2));
    expect(await withServerlessExecutionSlot('fn', async () => 3)).toEqual({ acquired: false });
    expect(await withServerlessExecutionSlot('other', async () => 4)).toEqual({ acquired: true, value: 4 });
    release();
    expect(await first).toEqual({ acquired: true, value: 1 });
    expect(await second).toEqual({ acquired: true, value: 2 });
    expect(await withServerlessExecutionSlot('fn', async () => 5)).toEqual({ acquired: true, value: 5 });
  });

  it('spreads functions over Serverless VMs 5~7 and reports a shortage when all are full', () => {
    const placed: Array<{ active: boolean; vmSlot?: number }> = [];
    for (let index = 0; index < 3 * serverlessFunctionsPerVm; index += 1) {
      const slot = pickServerlessVmSlot(placed);
      expect(slot).not.toBeNull();
      placed.push({ active: true, vmSlot: slot as number });
    }
    expect(placed.slice(0, 3).map(item => item.vmSlot)).toEqual([4, 5, 6]);
    expect(pickServerlessVmSlot(placed)).toBeNull();
    expect(pickServerlessVmSlot([...placed.slice(1), { active: false, vmSlot: 4 }])).toBe(4);
  });
});

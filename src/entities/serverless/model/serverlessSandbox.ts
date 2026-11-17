/**
 * 사용자 함수를 실행 한 번마다 새 Web Worker에서 돌린다.
 *
 * 격리되는 것
 * - DOM·React 상태·localStorage/sessionStorage: Worker에는 처음부터 없다.
 * - IndexedDB·Cache Storage·OPFS(navigator.storage)·BroadcastChannel·Web Locks: 실행 전에 막는다.
 * - XMLHttpRequest·WebSocket·EventSource·importScripts·중첩 Worker·eval·Function 생성자: 막는다.
 * - fetch: 다른 출처의 http(s) 주소만, 쿠키 없이(credentials: 'omit'), 10초 제한으로 허용한다.
 *   이 사이트와 같은 출처(/api 등)는 막는다.
 * - 실행이 끝나거나 시간이 지나면 Worker를 terminate해 남은 타이머·반복도 함께 끝낸다.
 *
 * 브라우저에서 할 수 없는 것
 * - Worker 메모리를 128/256MB로 강제로 자를 수 없다. 대신 응답 본문 1MB, 출력 Log 200줄·줄당 2,000자로 제한한다.
 * - 같은 브라우저 안에서 도는 코드라 CPU를 나눠 쓴다. 무한 반복은 제한 시간에 Worker를 끝내서 멈춘다.
 */

export interface ServerlessSandboxRequest { method: string; url: string; headers: Array<[string, string]>; body?: string }
export interface ServerlessSandboxLog { level: 'log' | 'info' | 'warn' | 'error' | 'debug'; text: string; time: number }
export type ServerlessSandboxOutcome =
  | { kind: 'response'; status: number; statusText: string; headers: Array<[string, string]>; body: string; bytes: number; durationMs: number; logs: ServerlessSandboxLog[] }
  | { kind: 'error'; message: string; line?: number; durationMs: number; logs: ServerlessSandboxLog[] }
  | { kind: 'timeout'; durationMs: number; logs: ServerlessSandboxLog[] };

export const serverlessSandboxLimits = {
  maxResponseBytes: 1024 * 1024,
  maxLogLines: 200,
  maxLogLineLength: 2000,
  fetchTimeoutMs: 10_000,
} as const;

/** Worker 쪽 준비 코드. 사용자 코드와 다른 함수 범위에 있어 nonce·postMessage 원본에 닿지 못한다. */
const bootstrap = String.raw`(function () {
  'use strict';
  var config = __CONFIG__;
  var scope = self;
  var realPost = scope.postMessage.bind(scope);
  var send = function (type, payload) { realPost(Object.assign({ nonce: config.nonce, type: type }, payload)); };
  var blocked = function (name) {
    return function () { throw new Error(name + '은(는) 이 실행 환경에서 사용할 수 없습니다'); };
  };
  var lock = function (target, name, value) {
    try { Object.defineProperty(target, name, { value: value, writable: false, configurable: false }); } catch (error) { /* already locked */ }
  };
  var format = function (value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.stack || String(value);
    try { var json = JSON.stringify(value); return json === undefined ? String(value) : json; } catch (error) { return String(value); }
  };
  var logCount = 0;
  var consoleObject = scope.console;
  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    consoleObject[level] = function () {
      logCount += 1;
      if (logCount > config.limits.maxLogLines) {
        if (logCount === config.limits.maxLogLines + 1) send('log', { level: 'warn', text: '출력 Log가 ' + config.limits.maxLogLines + '줄을 넘어 이후 내용은 남기지 않았습니다', time: Date.now() });
        return;
      }
      var text = Array.prototype.map.call(arguments, format).join(' ');
      if (text.length > config.limits.maxLogLineLength) text = text.slice(0, config.limits.maxLogLineLength) + '…';
      send('log', { level: level, text: text, time: Date.now() });
    };
  });

  var realFetch = typeof scope.fetch === 'function' ? scope.fetch.bind(scope) : undefined;
  var appOrigin = scope.location && scope.location.origin;
  lock(scope, 'fetch', function (input, init) {
    var raw = typeof input === 'string' || input instanceof URL ? String(input) : input && input.url;
    var url;
    try { url = new URL(raw); } catch (error) { return Promise.reject(new TypeError('fetch에는 https://로 시작하는 전체 주소를 넣어 주세요')); }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return Promise.reject(new TypeError(url.protocol + ' 주소는 fetch할 수 없습니다'));
    if (appOrigin && url.origin === appOrigin) return Promise.reject(new TypeError('이 사이트 주소는 함수에서 fetch할 수 없습니다'));
    if (!realFetch) return Promise.reject(new TypeError('fetch를 사용할 수 없습니다'));
    var timeout = AbortSignal.timeout(config.limits.fetchTimeoutMs);
    var signal = init && init.signal && AbortSignal.any ? AbortSignal.any([init.signal, timeout]) : timeout;
    return realFetch(url.href, Object.assign({}, init, { credentials: 'omit', mode: 'cors', signal: signal }));
  });
  ['XMLHttpRequest', 'WebSocket', 'WebTransport', 'EventSource', 'importScripts', 'Worker', 'SharedWorker', 'BroadcastChannel', 'close'].forEach(function (name) {
    lock(scope, name, blocked(name));
  });
  ['indexedDB', 'caches', 'cookieStore'].forEach(function (name) { lock(scope, name, undefined); });
  if (scope.navigator) { lock(scope.navigator, 'storage', undefined); lock(scope.navigator, 'locks', undefined); }
  lock(scope, 'postMessage', function () {});
  var proto = Object.getPrototypeOf(scope);
  if (proto && typeof proto.postMessage === 'function') lock(proto, 'postMessage', function () {});
  lock(scope, 'eval', blocked('eval'));
  var blockedFunction = blocked('Function 생성자');
  [function () {}, async function () {}, function* () {}, async function* () {}].forEach(function (sample) {
    lock(Object.getPrototypeOf(sample), 'constructor', blockedFunction);
  });
  blockedFunction.prototype = Function.prototype;
  lock(scope, 'Function', blockedFunction);
  if (typeof Response === 'function' && typeof Response.json !== 'function') {
    Response.json = function (data, init) {
      var headers = new Headers(init && init.headers);
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      return new Response(JSON.stringify(data), Object.assign({}, init, { headers: headers }));
    };
  }

  var finished = false;
  var fail = function (error) {
    if (finished) return;
    finished = true;
    var name = error && error.name ? error.name : 'Error';
    var message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
    send('error', { name: name, message: message, stack: error && error.stack ? String(error.stack) : '' });
  };
  scope.addEventListener('error', function (event) { event.preventDefault(); fail(event.error || new Error(event.message)); });
  scope.addEventListener('unhandledrejection', function (event) { event.preventDefault(); fail(event.reason); });
  var describe = function (value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };
  var requireModule = function (name) { throw new Error('"' + name + '" 모듈을 불러올 수 없습니다. 이 실행 환경은 import를 지원하지 않습니다'); };

  scope.__gsmsvStart = function (factory) {
    delete scope.__gsmsvStart;
    var started = performance.now();
    Promise.resolve().then(function () {
      var module = { exports: {} };
      factory.call(undefined, module.exports, module, requireModule);
      var handler = module.exports && typeof module.exports === 'object' ? module.exports.default : module.exports;
      if (typeof handler !== 'function') throw new TypeError('export default로 handler 함수를 내보내야 합니다');
      var init = { method: config.request.method, headers: config.request.headers };
      if (config.request.body !== undefined && config.request.method !== 'GET' && config.request.method !== 'HEAD') init.body = config.request.body;
      var env = Object.freeze(Object.assign({}, config.env));
      return handler(new Request(config.request.url, init), env);
    }).then(function (result) {
      if (!(result instanceof Response)) throw new TypeError('handler는 Response를 반환해야 합니다. 받은 값: ' + describe(result));
      return result.arrayBuffer().then(function (buffer) {
        if (buffer.byteLength > config.limits.maxResponseBytes) throw new RangeError('응답 본문이 ' + Math.round(config.limits.maxResponseBytes / 1024) + 'KB 제한을 넘었습니다');
        if (finished) return;
        finished = true;
        var headers = [];
        result.headers.forEach(function (value, key) { headers.push([key, value]); });
        send('result', { status: result.status, statusText: result.statusText, headers: headers, body: new TextDecoder().decode(buffer), bytes: buffer.byteLength, durationMs: performance.now() - started });
      });
    }).catch(fail);
  };
})();
`;

const moduleOpen = 'function __gsmsvModule(exports, module, require) {\n';
const moduleClose = '\n}\n__gsmsvStart(__gsmsvModule);\n';

export interface ServerlessSandboxSource { source: string; lineOffset: number; userLineCount: number }

export function buildServerlessSandboxSource(compiledCode: string, config: { nonce: string; request: ServerlessSandboxRequest; env: Record<string, string> }): ServerlessSandboxSource {
  // `<` 를 이스케이프해 문자열 안의 내용이 스크립트 구조를 바꾸지 못하게 한다.
  // ES2019부터 U+2028/2029는 문자열 안에 그대로 둘 수 있다.
  const json = JSON.stringify({ ...config, limits: serverlessSandboxLimits }).replace(/</g, '\\u003c');
  const prelude = bootstrap.replace('__CONFIG__', () => json) + moduleOpen;
  return {
    source: prelude + compiledCode + moduleClose,
    lineOffset: prelude.split('\n').length - 1,
    userLineCount: compiledCode.split('\n').length,
  };
}

/** 스택에서 사용자 코드 범위에 있는 첫 줄 번호(1부터)를 찾는다. */
export function findUserLine(stack: string, lineOffset: number, userLineCount: number): number | undefined {
  for (const match of stack.matchAll(/:(\d+):\d+\)?\s*$/gm)) {
    const line = Number(match[1]) - lineOffset;
    if (line >= 1 && line <= userLineCount) return line;
  }
  return undefined;
}

export interface ServerlessWorkerLike {
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: { message?: string; lineno?: number; preventDefault?: () => void }) => void) | null;
  terminate(): void;
}
export type ServerlessWorkerFactory = (source: string) => { worker: ServerlessWorkerLike; dispose: () => void };

const browserWorkerFactory: ServerlessWorkerFactory = source => {
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  const worker = new Worker(url, { name: 'gsmsv-serverless-function' });
  return { worker: worker as unknown as ServerlessWorkerLike, dispose: () => URL.revokeObjectURL(url) };
};

export interface RunServerlessOptions {
  compiledCode: string;
  request: ServerlessSandboxRequest;
  env: Record<string, string>;
  timeoutMs: number;
  createWorker?: ServerlessWorkerFactory;
}

export function runServerlessInSandbox({ compiledCode, request, env, timeoutMs, createWorker = browserWorkerFactory }: RunServerlessOptions): Promise<ServerlessSandboxOutcome> {
  const nonce = crypto.randomUUID();
  const { source, lineOffset, userLineCount } = buildServerlessSandboxSource(compiledCode, { nonce, request, env });
  const logs: ServerlessSandboxLog[] = [];
  const started = performance.now();
  return new Promise(resolve => {
    let settled = false;
    let created: ReturnType<ServerlessWorkerFactory>;
    const finish = (outcome: ServerlessSandboxOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      created.worker.onmessage = null;
      created.worker.onerror = null;
      created.worker.terminate();
      created.dispose();
      resolve(outcome);
    };
    const elapsed = () => performance.now() - started;
    const timer = setTimeout(() => finish({ kind: 'timeout', durationMs: elapsed(), logs }), timeoutMs);
    try {
      created = createWorker(source);
    } catch (error) {
      clearTimeout(timer);
      resolve({ kind: 'error', message: error instanceof Error ? error.message : String(error), durationMs: elapsed(), logs });
      return;
    }
    created.worker.onmessage = event => {
      const data = event.data as { nonce?: string; type?: string } & Record<string, unknown>;
      if (!data || data.nonce !== nonce) return;
      if (data.type === 'log') {
        if (logs.length <= serverlessSandboxLimits.maxLogLines) logs.push({ level: data.level as ServerlessSandboxLog['level'], text: String(data.text), time: Number(data.time) || Date.now() });
      } else if (data.type === 'result') {
        finish({
          kind: 'response',
          status: Number(data.status),
          statusText: String(data.statusText ?? ''),
          headers: (data.headers as Array<[string, string]>) ?? [],
          body: String(data.body ?? ''),
          bytes: Number(data.bytes) || 0,
          durationMs: Number(data.durationMs) || elapsed(),
          logs,
        });
      } else if (data.type === 'error') {
        const name = String(data.name || 'Error');
        const message = String(data.message ?? '');
        finish({ kind: 'error', message: message ? `${name}: ${message}` : name, line: findUserLine(String(data.stack ?? ''), lineOffset, userLineCount), durationMs: elapsed(), logs });
      }
    };
    // 스크립트 구문 오류처럼 준비 코드가 잡지 못한 오류.
    created.worker.onerror = event => {
      event.preventDefault?.();
      const line = event.lineno ? event.lineno - lineOffset : undefined;
      finish({ kind: 'error', message: event.message || '함수 스크립트를 불러오지 못했습니다', line: line && line >= 1 && line <= userLineCount ? line : undefined, durationMs: elapsed(), logs });
    };
  });
}

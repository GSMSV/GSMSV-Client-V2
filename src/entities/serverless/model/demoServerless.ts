import { readDemoState, writeDemoState } from '../../../shared/demo';
import { validateCronExpression } from './cron';
export type DemoServerlessRuntime = 'javascript' | 'typescript' | 'python';
export interface DemoServerlessDraft { name: string; runtime: DemoServerlessRuntime; timeoutSeconds: 30 | 60; memoryMb: 128 | 256; description: string; code: string; }

export interface DemoServerlessVariable { name: string; secret: boolean; value?: string; }
export interface DemoServerlessTrigger { id: string; type: 'HTTP' | 'Cron'; schedule: string; enabled: boolean; }
export interface DemoServerlessVersion { id: string; label: string; savedAt: string; author: string; changeSummary: string; current: boolean; code: string; runtime: DemoServerlessRuntime; timeoutSeconds: 30 | 60; memoryMb: 128 | 256; }
export interface DemoServerlessRun { id: string; result: 'success' | 'failure' | 'timeout'; startedAt: string; path: string; duration: string; outputLines?: string[]; }
export interface DemoServerlessTestResult { responseJson: string; statusLabel: string; statusMessage: string; pathLabel: string; pathCaption: string; durationLabel: string; durationCaption: string; logs: string; timestampLabel: string; }
export interface DemoServerlessFunction {
  id: string; name: string; description: string; runtime: DemoServerlessRuntime; timeoutSeconds: 30 | 60; memoryMb: 128 | 256;
  code: string; active: boolean; expiresAt: string; publicUrl?: string; domain?: string | null; databaseId?: string; variables: DemoServerlessVariable[]; triggers: DemoServerlessTrigger[];
  versions: DemoServerlessVersion[]; runs: DemoServerlessRun[]; testResult: DemoServerlessTestResult | null;
}
export interface DemoServerlessState { functions: DemoServerlessFunction[]; dailyLimit: number; executionsToday: number; sequence: number; }

const key = 'serverless.functions';
const jsCode = `export default async function handler(request, env) {\n  const body = request?.method === "POST" ? await request.json().catch(() => ({})) : {};\n  const name = body.name || "지민";\n  const greeting = env.GREETING || "안녕하세요";\n  console.log("Greeting sent", name);\n  return Response.json({ message: greeting + ", " + name + "!" });\n}`;
const pyCode = `def handler(request, env):\n    return {\n        "status": "ok",\n        "service": "health-check"\n    }`;
const seed: DemoServerlessState = {
  dailyLimit: 10_000,
  executionsToday: 1284,
  sequence: 8,
  functions: [
    {
      id: 'welcome-api', name: 'welcome-api', description: '서비스 첫 방문자를 위한 환영 메시지를 반환합니다.', runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128,
      code: jsCode, active: true, expiresAt: '2026. 10. 06.', publicUrl: 'https://q8w2n5r7t1vz.example.com', databaseId: 'student-db',
      variables: [{ name: 'GREETING', secret: false, value: '안녕하세요' }, { name: 'API_KEY', secret: true }],
      triggers: [{ id: 'http', type: 'HTTP', schedule: 'POST', enabled: true }, { id: 'cron', type: 'Cron', schedule: '0 9 * * *', enabled: true }],
      versions: [
        { id: '7', label: '버전 7', savedAt: '2026. 09. 29. 14:32', author: '김지민', changeSummary: '코드', current: true, code: jsCode, runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128 },
        { id: '6', label: '버전 6', savedAt: '2026. 09. 29. 11:05', author: '김지민', changeSummary: '실행 제한', current: false, code: jsCode, runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128 },
        { id: '5', label: '버전 5', savedAt: '2026. 09. 28. 17:20', author: '김지민', changeSummary: '코드 · Runtime', current: false, code: jsCode, runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128 },
      ],
      runs: [
        { id: 'run-1', result: 'success', startedAt: '2026. 09. 29. 14:34:12', path: '수동', duration: '182ms', outputLines: ['Greeting sent 지민', 'Using API_KEY ••••••••'] },
        { id: 'run-2', result: 'success', startedAt: '2026. 09. 29. 13:08:27', path: 'HTTP POST', duration: '95ms' },
        { id: 'run-3', result: 'success', startedAt: '2026. 09. 29. 09:00:00', path: '예약', duration: '1.2초' },
        { id: 'run-4', result: 'timeout', startedAt: '2026. 09. 28. 17:23:41', path: 'HTTP POST', duration: '30초' },
      ],
      testResult: { responseJson: '{\n  "message": "안녕하세요, 지민!"\n}', statusLabel: '성공', statusMessage: '함수가 정상적으로 응답했습니다', pathLabel: '수동 실행', pathCaption: '오늘 실행 횟수에 포함됩니다', durationLabel: '182ms', durationCaption: '메모리 46MB', logs: 'Greeting sent 지민', timestampLabel: '2026. 09. 29. 14:34:12' },
    },
    {
      id: 'health-check', name: 'health-check', description: '개발 중인 서비스의 응답 상태를 확인합니다.', runtime: 'python', timeoutSeconds: 30, memoryMb: 128,
      code: pyCode, active: false, expiresAt: '2026. 10. 02.', variables: [],
      triggers: [{ id: 'health-http', type: 'HTTP', schedule: 'GET', enabled: false }], versions: [], runs: [], testResult: null,
    },
  ],
};

function isState(value: unknown): value is DemoServerlessState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DemoServerlessState>;
  return Array.isArray(candidate.functions) && typeof candidate.dailyLimit === 'number' && typeof candidate.executionsToday === 'number' && candidate.functions.every(fn => Boolean(fn && typeof fn.id === 'string' && typeof fn.name === 'string' && typeof fn.code === 'string' && Array.isArray(fn.variables) && Array.isArray(fn.triggers) && fn.triggers.every(trigger => Boolean(trigger && (trigger.type === 'HTTP' || trigger.type === 'Cron') && typeof trigger.schedule === 'string')) && Array.isArray(fn.versions) && Array.isArray(fn.runs)));
}

export function getDemoServerlessState(): DemoServerlessState {
  const stored = readDemoState<unknown>(key, structuredClone(seed));
  if (!isState(stored)) return structuredClone(seed);
  const migrated = structuredClone(stored);
  let changed = false;
  for (const fn of migrated.functions) {
    for (const trigger of fn.triggers) {
      if (trigger.type === 'HTTP' && trigger.schedule.endsWith(' 요청 시')) {
        trigger.schedule = trigger.schedule.slice(0, -' 요청 시'.length).toUpperCase();
        changed = true;
      } else if (trigger.type === 'Cron' && trigger.schedule === '매일 오전 9:00') {
        trigger.schedule = '0 9 * * *';
        changed = true;
      }
    }
  }
  if (changed) writeDemoState(key, migrated);
  return migrated;
}

export function saveDemoServerlessState(state: DemoServerlessState): void { writeDemoState(key, state); }
export function getDemoServerlessFunctions(): DemoServerlessFunction[] { return getDemoServerlessState().functions; }
export function getDemoServerlessFunction(id: string): DemoServerlessFunction | undefined { return getDemoServerlessFunctions().find(fn => fn.id === id); }
export function getDemoServerlessQuota() { const state = getDemoServerlessState(); return { count: { used: state.functions.length, limit: 3 }, daily_executions: { used: state.executionsToday, limit: state.dailyLimit } }; }

export function getNextDemoServerlessTriggerType(triggers: DemoServerlessTrigger[]): DemoServerlessTrigger['type'] | undefined {
  if (!triggers.some(trigger => trigger.type === 'HTTP')) return 'HTTP';
  if (triggers.filter(trigger => trigger.type === 'Cron').length < 3) return 'Cron';
  return undefined;
}

function mutate(id: string, update: (fn: DemoServerlessFunction, state: DemoServerlessState) => void | false): DemoServerlessFunction | undefined {
  const state = getDemoServerlessState();
  const fn = state.functions.find(item => item.id === id);
  if (!fn) return undefined;
  if (update(fn, state) === false) return undefined;
  saveDemoServerlessState(state);
  return fn;
}

function version(fn: DemoServerlessFunction, state: DemoServerlessState, summary: string) {
  const currentId = String(state.sequence + 1);
  const label = `버전 ${currentId}`;
  const now = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date());
  fn.versions = [{ id: currentId, label, savedAt: now, author: '김민수', changeSummary: summary, current: true, code: fn.code, runtime: fn.runtime, timeoutSeconds: fn.timeoutSeconds, memoryMb: fn.memoryMb }, ...fn.versions.map(item => ({ ...item, current: false }))];
}

export function createDemoServerlessFunction(draft: DemoServerlessDraft): string {
  const state = getDemoServerlessState();
  const id = crypto.randomUUID();
  const fn: DemoServerlessFunction = { id, name: draft.name, description: draft.description, runtime: draft.runtime, timeoutSeconds: draft.timeoutSeconds, memoryMb: draft.memoryMb, code: draft.code, active: false, expiresAt: '생성 후 7일', variables: [], triggers: [], versions: [], runs: [], testResult: null };
  version(fn, state, '함수 생성');
  state.sequence += 1;
  state.functions.unshift(fn);
  saveDemoServerlessState(state);
  return id;
}
export function saveDemoServerlessCode(id: string, code: string) { return mutate(id, (fn, state) => { fn.code = code; version(fn, state, '코드'); state.sequence += 1; }); }
export function saveDemoServerlessSettings(id: string, settings: Pick<DemoServerlessFunction, 'runtime' | 'timeoutSeconds' | 'memoryMb'>) { return mutate(id, (fn, state) => { Object.assign(fn, settings); version(fn, state, '실행 설정'); state.sequence += 1; }); }
export function setDemoServerlessActive(id: string, active: boolean) { return mutate(id, fn => { fn.active = active; }); }
export function extendDemoServerlessFunction(id: string) { return mutate(id, fn => { fn.expiresAt = '2026. 10. 20.'; }); }
export function deleteDemoServerlessFunction(id: string) { const state = getDemoServerlessState(); state.functions = state.functions.filter(fn => fn.id !== id); saveDemoServerlessState(state); }
export function rollbackDemoServerlessVersion(id: string, versionId: string) { return mutate(id, (fn, state) => { const target = fn.versions.find(item => item.id === versionId); if (!target) return; fn.code = target.code; fn.runtime = target.runtime; fn.timeoutSeconds = target.timeoutSeconds; fn.memoryMb = target.memoryMb; version(fn, state, `버전 ${versionId} 복원`); state.sequence += 1; }); }
export function addDemoServerlessVariable(id: string, variable: DemoServerlessVariable) { return mutate(id, fn => { fn.variables = [...fn.variables.filter(item => item.name !== variable.name), variable]; }); }
export function deleteDemoServerlessVariable(id: string, name: string) { return mutate(id, fn => { fn.variables = fn.variables.filter(item => item.name !== name); }); }
export function updateDemoServerlessVariable(id: string, name: string, variable: DemoServerlessVariable) { return mutate(id, fn => { fn.variables = fn.variables.map(item => item.name === name ? variable : item); }); }
export function setDemoServerlessDatabase(id: string, databaseId: string) { return mutate(id, fn => { fn.databaseId = databaseId; fn.variables = [...fn.variables.filter(item => item.name !== 'DATABASE_URL'), ...(databaseId ? [{ name: 'DATABASE_URL', secret: true }] : [])]; }); }
export function setDemoServerlessDomain(id: string, domain: string | null) { return mutate(id, fn => { fn.domain = domain; }); }
export async function addDemoServerlessTrigger(id: string, trigger: Omit<DemoServerlessTrigger, 'id'>): Promise<boolean | string> {
  if (typeof navigator === 'undefined' || !navigator.locks?.request) {
    return '이 브라우저에서는 여러 탭의 동시 변경을 안전하게 처리할 수 없습니다. 다른 탭을 닫고 다시 시도해 주세요.';
  }

  try {
    return await navigator.locks.request('gsmsv:demo:serverless-trigger-write', { mode: 'exclusive' }, () => Boolean(mutate(id, fn => {
      if (trigger.type === 'HTTP') {
        if (fn.triggers.some(item => item.type === 'HTTP')) return false;
        if (!['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(trigger.schedule)) return false;
      } else {
        if (fn.triggers.filter(item => item.type === 'Cron').length >= 3) return false;
        if (!validateCronExpression(trigger.schedule).valid) return false;
      }
      fn.triggers.push({ ...trigger, id: crypto.randomUUID(), enabled: true });
    })));
  } catch {
    return '최신 Trigger 상태와 달라 추가하지 못했습니다. 취소한 뒤 목록을 확인하고 다시 시도해 주세요.';
  }
}
export function updateDemoServerlessTrigger(id: string, triggerId: string, enabled: boolean) { return mutate(id, fn => { fn.triggers = fn.triggers.map(item => item.id === triggerId ? { ...item, enabled } : item); }); }
export function deleteDemoServerlessTrigger(id: string, triggerId: string) { return mutate(id, fn => { fn.triggers = fn.triggers.filter(item => item.id !== triggerId); }); }
export function regenerateDemoServerlessUrl(id: string) { return mutate(id, fn => { fn.publicUrl = `https://${crypto.randomUUID().slice(0, 12)}.example.com`; }); }
export function executeDemoServerlessTest(id: string, payload: string): DemoServerlessTestResult | undefined {
  let output: DemoServerlessTestResult | undefined;
  mutate(id, (fn, state) => {
    const body = JSON.parse(payload) as { name?: string };
    const name = typeof body.name === 'string' ? body.name : '지민';
    const greeting = fn.variables.find(item => item.name === 'GREETING')?.value ?? '안녕하세요';
    const message = fn.runtime === 'python' ? '함수가 정상적으로 응답했습니다' : `${greeting}, ${name}!`;
    const timestamp = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Seoul' }).format(new Date());
    output = { responseJson: JSON.stringify({ message: fn.runtime === 'python' ? 'ok' : message, ...(fn.runtime === 'python' ? { service: fn.name } : {}) }, null, 2), statusLabel: '성공', statusMessage: message, pathLabel: '수동 실행', pathCaption: '오늘 실행 횟수에 포함됩니다', durationLabel: '182ms', durationCaption: `메모리 ${Math.min(128, fn.memoryMb)}MB`, logs: `Greeting sent ${name}`, timestampLabel: timestamp };
    fn.testResult = output;
    state.executionsToday += 1;
    fn.runs.unshift({ id: crypto.randomUUID(), result: 'success', startedAt: timestamp, path: '수동', duration: '182ms', outputLines: output.logs.split('\n') });
  });
  return output;
}
export function deleteDemoServerlessRuns(id: string) { return mutate(id, fn => { fn.runs = []; }); }
export function getDemoServerlessUrl(id: string) { const fn = getDemoServerlessFunction(id); return fn?.publicUrl ?? `https://${id === 'welcome-api' ? 'q8w2n5r7t1vz' : id}.example.com`; }

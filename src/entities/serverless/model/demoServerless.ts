import { isDemoFixtureMode, readDemoState } from '../../../shared/demo';
import { DemoServerlessStorageError, transactDemoServerlessState } from './demoServerlessStorage';
import { validateCronExpression } from './cron';
export type DemoServerlessRuntime = 'javascript' | 'typescript' | 'python';
export interface DemoServerlessDraft { name: string; runtime: DemoServerlessRuntime; timeoutSeconds: 30 | 60; memoryMb: 128 | 256; description: string; code: string; }

export interface DemoServerlessVariable { name: string; secret: boolean; value?: string; }
export interface DemoServerlessTrigger { id: string; type: 'HTTP' | 'Cron'; schedule: string; enabled: boolean; }
export interface DemoServerlessVersion { id: string; label: string; savedAt: string; author: string; changeSummary: string; current: boolean; code: string; runtime: DemoServerlessRuntime; timeoutSeconds: 30 | 60; memoryMb: 128 | 256; }
export interface DemoServerlessRun { id: string; result: 'success' | 'failure' | 'timeout'; startedAt: string; path: string; duration: string; outputLines?: string[]; }
export interface DemoServerlessTestResult { responseJson: string; statusLabel: string; statusMessage: string; pathLabel: string; pathCaption: string; durationLabel: string; durationCaption: string; logs: string; timestampLabel: string; dailyExecutionsUsed?: number; }
export interface DemoServerlessRuntimeFailure { message: string; location: string }
export type DemoServerlessTestExecution =
  | { kind: 'executed'; result: DemoServerlessTestResult }
  | { kind: 'runtime-error'; error: DemoServerlessRuntimeFailure }
  | { kind: 'timeout'; timeoutSeconds: 30 | 60; memoryMb: 128 | 256 }
  | { kind: 'inactive' | 'quota' | 'missing' };
/** 저장·생성 전에 찾은 코드 형식 오류. line은 1부터 센다. */
export interface DemoServerlessCodeError { fileName: string; line: number; message: string }
export interface DemoServerlessFunction {
  id: string; name: string; description: string; runtime: DemoServerlessRuntime; timeoutSeconds: 30 | 60; memoryMb: 128 | 256;
  code: string; active: boolean; expiresAt: string;
  /** 사용 기간이 끝나 정지된 함수. 연장하면 풀린다. */
  suspended?: { expiredAtLabel: string; deleteAtLabel: string };
  /** 오늘 동시 실행 한도를 넘어 429로 거절한 요청 수. */
  rejectedRequestsToday?: number;
  publicUrl?: string; domain?: string | null; databaseId?: string; teamId?: string; variables: DemoServerlessVariable[]; triggers: DemoServerlessTrigger[];
  versions: DemoServerlessVersion[]; runs: DemoServerlessRun[]; testResult: DemoServerlessTestResult | null;
}
export interface DemoServerlessState { functions: DemoServerlessFunction[]; dailyLimit: number; executionsToday: number; sequence: number; }

const key = 'serverless.functions';
/** 개인 함수 개수 한도. Figma 13-02(698:3860)의 "개인 3 / 3"을 따른다. */
export const demoServerlessFunctionLimit = 3;
export class DemoServerlessFunctionLimitError extends Error {
  constructor() {
    super('함수를 더 만들 수 없습니다');
    this.name = 'DemoServerlessFunctionLimitError';
  }
}
const defaultWelcomePublicUrl = 'https://q8w2n5r7t1vz.example.com';
const jsCode = `export default async function handler(request, env) {
  let name = "GSM";
  if (request?.method === "POST") {
    const body = await request.json().catch(() => ({}));
    name = body.name || name;
  }
  const greeting = env.GREETING || "안녕하세요";
  console.log("Greeting sent", name);
  return Response.json({ message: \`\${greeting}, \${name}!\` });
}`;
const pyCode = `def handler(request, env):\n    return {\n        "status": "ok",\n        "service": "health-check"\n    }`;
const initialRuns: DemoServerlessRun[] = [
  { id: 'run-1', result: 'success', startedAt: '2026. 09. 29. 14:34:12', path: '수동', duration: '182ms', outputLines: ['Greeting sent 지민', 'Using API_KEY ••••••••'] },
  { id: 'run-2', result: 'success', startedAt: '2026. 09. 29. 13:08:27', path: 'HTTP POST', duration: '95ms' },
  { id: 'run-3', result: 'success', startedAt: '2026. 09. 29. 09:00:00', path: '예약', duration: '1.2초' },
  { id: 'run-4', result: 'timeout', startedAt: '2026. 09. 28. 17:23:41', path: 'HTTP POST', duration: '30초' },
];
const initialLogHistory: DemoServerlessRun[] = [
  ...initialRuns,
  ...Array.from({ length: 244 }, (_, index) => ({
    id: `run-seed-${index + 5}`,
    result: index % 13 === 0 ? 'failure' as const : 'success' as const,
    startedAt: '2026. 09. 28. 16:00:00',
    path: index % 2 === 0 ? 'HTTP POST' : '예약',
    duration: index % 13 === 0 ? '실패' : '120ms',
  })),
];
const seed: DemoServerlessState = {
  dailyLimit: 10_000,
  executionsToday: 1284,
  sequence: 8,
  functions: [
    {
      id: 'welcome-api', name: 'welcome-api', description: '서비스 첫 방문자를 위한 환영 메시지를 반환합니다.', runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128,
      code: jsCode, active: true, expiresAt: '2026. 10. 06.', publicUrl: defaultWelcomePublicUrl, databaseId: 'welcome-db',
      variables: [{ name: 'GREETING', secret: false, value: '안녕하세요' }, { name: 'API_KEY', secret: true }],
      triggers: [{ id: 'http', type: 'HTTP', schedule: 'POST', enabled: true }, { id: 'cron', type: 'Cron', schedule: '0 9 * * *', enabled: true }],
      versions: [
        { id: '7', label: '버전 7', savedAt: '2026. 09. 29. 14:32', author: '김지민', changeSummary: '코드', current: true, code: jsCode, runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128 },
        { id: '6', label: '버전 6', savedAt: '2026. 09. 29. 11:05', author: '김지민', changeSummary: '실행 제한', current: false, code: jsCode, runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128 },
        { id: '5', label: '버전 5', savedAt: '2026. 09. 28. 17:20', author: '김지민', changeSummary: '코드 · Runtime', current: false, code: jsCode, runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128 },
      ],
      runs: initialLogHistory,
      testResult: { responseJson: '{\n  "message": "안녕하세요, 지민!"\n}', statusLabel: '성공', statusMessage: '함수가 정상적으로 응답했습니다', pathLabel: '수동 실행', pathCaption: '오늘 실행 1,285 / 10,000회에 포함됩니다', durationLabel: '182ms', durationCaption: '메모리 46MB 사용', logs: 'Greeting sent 지민', timestampLabel: '2026. 09. 29. 14:34:12', dailyExecutionsUsed: 1285 },
    },
    {
      id: 'health-check', name: 'health-check', description: '개발 중인 서비스의 응답 상태를 확인합니다.', runtime: 'python', timeoutSeconds: 30, memoryMb: 128,
      code: pyCode, active: false, expiresAt: '2026. 10. 02.', variables: [],
      triggers: [{ id: 'health-http', type: 'HTTP', schedule: 'GET', enabled: false }], versions: [], runs: [], testResult: null,
    },
    {
      id: 'connect-api', name: 'connect-api', description: 'GSM Connect 팀 API', runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128,
      code: jsCode, active: true, expiresAt: '2026. 10. 06.', teamId: 'demo-team', variables: [],
      triggers: [{ id: 'connect-http', type: 'HTTP', schedule: 'POST', enabled: true }], versions: [], runs: [], testResult: null,
    },
  ],
};

const emptySeed: DemoServerlessState = { dailyLimit: 10_000, executionsToday: 0, sequence: 0, functions: [] };
const getSeed = (): DemoServerlessState => isDemoFixtureMode() ? seed : emptySeed;

function isState(value: unknown): value is DemoServerlessState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DemoServerlessState>;
  return Array.isArray(candidate.functions) && typeof candidate.dailyLimit === 'number' && typeof candidate.executionsToday === 'number' && candidate.functions.every(fn => Boolean(fn && typeof fn.id === 'string' && typeof fn.name === 'string' && typeof fn.code === 'string' && Array.isArray(fn.variables) && Array.isArray(fn.triggers) && fn.triggers.every(trigger => Boolean(trigger && (trigger.type === 'HTTP' || trigger.type === 'Cron') && typeof trigger.schedule === 'string')) && Array.isArray(fn.versions) && Array.isArray(fn.runs)));
}

function normalizeState(value: unknown): { value: DemoServerlessState; changed: boolean } {
  if (!isState(value)) return { value: structuredClone(getSeed()), changed: true };
  const migrated = structuredClone(value);
  let changed = false;
  for (const fn of migrated.functions) {
    if (fn.id === 'welcome-api' && fn.databaseId === 'student-db') {
      fn.databaseId = 'welcome-db';
      changed = true;
    }
    for (const trigger of fn.triggers) {
      if (trigger.type === 'HTTP' && trigger.schedule.endsWith(' 요청 시')) {
        trigger.schedule = trigger.schedule.slice(0, -' 요청 시'.length).toUpperCase();
        changed = true;
      } else if (trigger.type === 'Cron' && trigger.schedule === '매일 오전 9:00') {
        trigger.schedule = '0 9 * * *';
        changed = true;
      }
    }
    if (fn.id === 'welcome-api' && fn.runs.length === initialRuns.length && initialRuns.every((run, index) => fn.runs[index]?.id === run.id)) {
      fn.runs = structuredClone(initialLogHistory);
      changed = true;
    }
    if (fn.id === 'welcome-api' && fn.testResult && fn.testResult.dailyExecutionsUsed === undefined) {
      const used = migrated.executionsToday === 1284 ? 1285 : migrated.executionsToday;
      fn.testResult.dailyExecutionsUsed = used;
      fn.testResult.pathCaption = `오늘 실행 ${used.toLocaleString('ko-KR')} / ${migrated.dailyLimit.toLocaleString('ko-KR')}회에 포함됩니다`;
      changed = true;
    }
  }
  return { value: migrated, changed };
}

export function getDemoServerlessState(): DemoServerlessState {
  return normalizeState(readDemoState<unknown>(key, structuredClone(getSeed()))).value;
}

/**
 * `?demoServerless=<scenario>`(쉼표로 여러 개)로 오래 사용해야만 생기는 상태를 바로 만든다.
 * - usage-warning: 오늘 실행 8,240 / 10,000회(80% 경고)
 * - usage-limit: 오늘 실행 한도 도달
 * - suspended: welcome-api 사용 기간 만료로 정지
 * - throttled: welcome-api 동시 실행 한도 초과 요청 12건
 * 한 페이지 로드에서 한 번만 적용하므로 이후 조작(연장 등)은 그대로 남는다.
 */
const appliedScenarios = new Set<string>();
function pendingScenarios(): string[] {
  if (typeof window === 'undefined') return [];
  const value = new URLSearchParams(window.location.search).get('demoServerless');
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(item => item && !appliedScenarios.has(item));
}
function applyScenario(state: DemoServerlessState, scenario: string) {
  const welcome = state.functions.find(fn => fn.id === 'welcome-api');
  if (scenario === 'usage-warning') state.executionsToday = Math.max(state.executionsToday, Math.round(state.dailyLimit * 0.824));
  else if (scenario === 'usage-limit') state.executionsToday = state.dailyLimit;
  else if (scenario === 'suspended' && welcome) welcome.suspended = { expiredAtLabel: '10월 6일 14:00', deleteAtLabel: '10월 9일 14:00' };
  else if (scenario === 'throttled' && welcome) welcome.rejectedRequestsToday = 12;
}

export async function loadDemoServerlessState(): Promise<DemoServerlessState> {
  const scenarios = pendingScenarios();
  if (scenarios.length) {
    scenarios.forEach(scenario => appliedScenarios.add(scenario));
    const { state } = await transactDemoServerlessState(getSeed(), normalizeState, current => { scenarios.forEach(scenario => applyScenario(current, scenario)); });
    return state;
  }
  const { state } = await transactDemoServerlessState(getSeed(), normalizeState);
  return state;
}

export async function clearDemoServerlessFunctions(): Promise<void> {
  await transactDemoServerlessState(getSeed(), normalizeState, state => {
    state.functions = state.functions.filter(fn => Boolean(fn.teamId));
    state.executionsToday = 0;
  });
}

export async function removeDemoServerlessFunctionsByTeam(teamId: string): Promise<void> {
  await transactDemoServerlessState(getSeed(), normalizeState, state => {
    state.functions = state.functions.filter(fn => fn.teamId !== teamId);
  });
}

export function getDemoServerlessFunctions(): DemoServerlessFunction[] { return getDemoServerlessState().functions.filter(fn => !fn.teamId); }
export function getDemoServerlessTeamFunctionCount(teamId: string): number { return getDemoServerlessState().functions.filter(fn => fn.teamId === teamId).length; }
export function getDemoServerlessFunction(id: string): DemoServerlessFunction | undefined { return getDemoServerlessFunctions().find(fn => fn.id === id); }
/** 개인 함수와, 내가 속한 팀(teamIds)의 함수를 함께 찾는다. */
export function getDemoServerlessAccessibleFunction(id: string, teamIds: readonly string[]): DemoServerlessFunction | undefined {
  return getDemoServerlessState().functions.find(fn => fn.id === id && (!fn.teamId || teamIds.includes(fn.teamId)));
}
export function getDemoServerlessQuota() { const state = getDemoServerlessState(); return { count: { used: state.functions.filter(fn => !fn.teamId).length, limit: demoServerlessFunctionLimit }, daily_executions: { used: state.executionsToday, limit: state.dailyLimit } }; }

export function getDemoServerlessFileName(runtime: DemoServerlessRuntime): string {
  if (runtime === 'python') return 'main.py';
  return runtime === 'typescript' ? 'index.ts' : 'index.js';
}

const closingName: Record<string, string> = { '}': '중괄호', ')': '괄호', ']': '대괄호' };
const pairs: Record<string, string> = { '{': '}', '(': ')', '[': ']' };

/**
 * 목데이터용 간이 형식 검사. 문자열·주석을 건너뛰고 괄호 짝과 닫히지 않은 문자열을 확인한다.
 * 실제 컴파일러를 대신하지는 않지만 Figma의 "N번째 줄: 닫는 중괄호가 필요합니다" 상태를 재현한다.
 */
export function findDemoServerlessCodeError(code: string, runtime: DemoServerlessRuntime): DemoServerlessCodeError | null {
  const fileName = getDemoServerlessFileName(runtime);
  const stack: Array<{ char: string; line: number }> = [];
  let line = 1;
  let quote: string | null = null;
  let quoteLine = 1;
  let blockComment = false;
  for (let index = 0; index < code.length; index += 1) {
    const char = code[index];
    const next = code[index + 1];
    if (char === '\n') {
      if (quote && quote !== '`') return { fileName, line: quoteLine, message: '닫는 따옴표가 필요합니다.' };
      line += 1;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') { blockComment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (char === '\\') { index += 1; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (runtime === 'python' ? char === '#' : char === '/' && next === '/') {
      while (index + 1 < code.length && code[index + 1] !== '\n') index += 1;
      continue;
    }
    if (runtime !== 'python' && char === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (char === '"' || char === "'" || (char === '`' && runtime !== 'python')) { quote = char; quoteLine = line; continue; }
    if (pairs[char]) { stack.push({ char, line }); continue; }
    if (closingName[char]) {
      const open = stack.pop();
      if (!open) return { fileName, line, message: `여는 ${closingName[char]} 없이 닫는 ${closingName[char]}가 있습니다.` };
      if (pairs[open.char] !== char) return { fileName, line, message: `닫는 ${closingName[pairs[open.char]]}가 필요합니다.` };
    }
  }
  if (quote) return { fileName, line: quoteLine, message: '닫는 따옴표가 필요합니다.' };
  const unclosed = stack.pop();
  if (unclosed) return { fileName, line: unclosed.line, message: `닫는 ${closingName[pairs[unclosed.char]]}가 필요합니다.` };
  return null;
}

/** 실행을 흉내 낸다: 끝나지 않는 반복은 시간 초과, throw/raise 문은 실행 오류로 본다. */
function simulateRuntime(code: string, runtime: DemoServerlessRuntime): { kind: 'timeout' } | { kind: 'error'; error: DemoServerlessRuntimeFailure } | null {
  const lines = code.split('\n');
  const fileName = getDemoServerlessFileName(runtime);
  if (lines.some(item => /\bwhile\s*\(\s*true\s*\)|\bfor\s*\(\s*;\s*;\s*\)|^\s*while\s+True\s*:/.test(item))) return { kind: 'timeout' };
  const throwLine = lines.findIndex(item => /^\s*(throw|raise)\b/.test(item));
  if (throwLine < 0) return null;
  const statement = lines[throwLine];
  const message = statement.match(/["'`]([^"'`]*)["'`]/)?.[1] ?? '';
  const type = statement.match(/(?:new\s+|raise\s+)([A-Za-z]*(?:Error|Exception))/)?.[1] ?? (runtime === 'python' ? 'Exception' : 'Error');
  return { kind: 'error', error: { message: message ? `${type}: ${message}` : type, location: `${fileName} · ${throwLine + 1}번째 줄` } };
}

export function getNextDemoServerlessTriggerType(triggers: DemoServerlessTrigger[]): DemoServerlessTrigger['type'] | undefined {
  if (!triggers.some(trigger => trigger.type === 'HTTP')) return 'HTTP';
  if (triggers.filter(trigger => trigger.type === 'Cron').length < 3) return 'Cron';
  return undefined;
}

function mutate(id: string, update: (fn: DemoServerlessFunction, state: DemoServerlessState) => void | false): Promise<DemoServerlessFunction | undefined> {
  return transactDemoServerlessState(getSeed(), normalizeState, state => {
    const fn = state.functions.find(item => item.id === id);
    if (!fn || update(fn, state) === false) return undefined;
    return fn;
  }).then(({ result }) => result);
}

function version(fn: DemoServerlessFunction, state: DemoServerlessState, summary: string) {
  const currentId = String(state.sequence + 1);
  const label = `버전 ${currentId}`;
  const now = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date());
  fn.versions = [{ id: currentId, label, savedAt: now, author: '김지민', changeSummary: summary, current: true, code: fn.code, runtime: fn.runtime, timeoutSeconds: fn.timeoutSeconds, memoryMb: fn.memoryMb }, ...fn.versions.map(item => ({ ...item, current: false }))].slice(0, 10);
}

function formatExpiry(timestamp: number): string {
  const date = new Date(timestamp + 9 * 60 * 60 * 1000);
  return `${date.getUTCFullYear()}. ${date.getUTCMonth() + 1}. ${date.getUTCDate()}.`;
}

function parseExpiry(value: string): number {
  const match = /^(\d{4})\. (\d{1,2})\. (\d{1,2})\.$/.exec(value);
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) - 9 * 60 * 60 * 1000 : NaN;
}

export function createDemoServerlessFunction(draft: DemoServerlessDraft): Promise<string> {
  const id = crypto.randomUUID();
  const fn: DemoServerlessFunction = { id, name: draft.name, description: draft.description, runtime: draft.runtime, timeoutSeconds: draft.timeoutSeconds, memoryMb: draft.memoryMb, code: draft.code, active: false, expiresAt: formatExpiry(Date.now() + 7 * 86_400_000), variables: [], triggers: [], versions: [], runs: [], testResult: null };
  return transactDemoServerlessState(getSeed(), normalizeState, state => {
    if (state.functions.filter(existing => !existing.teamId).length >= demoServerlessFunctionLimit) {
      return { limit: true as const };
    }
    if (state.functions.some(existing => !existing.teamId && existing.name.trim().toLowerCase() === draft.name.trim().toLowerCase())) {
      return { duplicate: true as const };
    }
    version(fn, state, '함수 생성');
    state.sequence += 1;
    state.functions.unshift(fn);
    return { id } as const;
  }).then(({ result }) => {
    if (result && 'limit' in result) throw new DemoServerlessFunctionLimitError();
    if (result && 'duplicate' in result) throw new Error('이미 사용 중인 함수 이름입니다. 다른 이름을 입력하세요.');
    return (result as { id: string }).id;
  });
}
export function saveDemoServerlessCode(id: string, code: string) { return mutate(id, (fn, state) => { fn.code = code; version(fn, state, '코드'); state.sequence += 1; }); }
export function saveDemoServerlessSettings(id: string, settings: Pick<DemoServerlessFunction, 'runtime' | 'timeoutSeconds' | 'memoryMb'>) { return mutate(id, (fn, state) => { Object.assign(fn, settings); version(fn, state, '실행 설정'); state.sequence += 1; }); }
export function setDemoServerlessActive(id: string, active: boolean) { return mutate(id, fn => { fn.active = active; }); }
export function extendDemoServerlessFunction(id: string) { return mutate(id, fn => { fn.expiresAt = formatExpiry(Math.max(Date.now(), parseExpiry(fn.expiresAt) || 0) + 14 * 86_400_000); delete fn.suspended; }); }
export function deleteDemoServerlessFunction(id: string) { return transactDemoServerlessState(getSeed(), normalizeState, state => { state.functions = state.functions.filter(fn => fn.id !== id); }); }
export function rollbackDemoServerlessVersion(id: string, versionId: string) { return mutate(id, (fn, state) => { const target = fn.versions.find(item => item.id === versionId); if (!target) return; fn.code = target.code; fn.runtime = target.runtime; fn.timeoutSeconds = target.timeoutSeconds; fn.memoryMb = target.memoryMb; version(fn, state, `버전 ${versionId} 복원`); state.sequence += 1; }); }
export function addDemoServerlessVariable(id: string, variable: DemoServerlessVariable) { return mutate(id, fn => { fn.variables = [...fn.variables.filter(item => item.name !== variable.name), variable]; }); }
export function deleteDemoServerlessVariable(id: string, name: string) { return mutate(id, fn => { fn.variables = fn.variables.filter(item => item.name !== name); }); }
export function updateDemoServerlessVariable(id: string, name: string, variable: DemoServerlessVariable) { return mutate(id, fn => { fn.variables = fn.variables.map(item => item.name === name ? variable : item); }); }
export function setDemoServerlessDatabase(id: string, databaseId: string) { return mutate(id, fn => { fn.databaseId = databaseId; fn.variables = [...fn.variables.filter(item => item.name !== 'DATABASE_URL'), ...(databaseId ? [{ name: 'DATABASE_URL', secret: true }] : [])]; }); }
export function setDemoServerlessDomain(id: string, domain: string | null) { return mutate(id, fn => { fn.domain = domain; }); }
export async function addDemoServerlessTrigger(id: string, trigger: Omit<DemoServerlessTrigger, 'id'>): Promise<boolean | string> {
  try {
    return await transactDemoServerlessState(getSeed(), normalizeState, state => {
      const fn = state.functions.find(item => item.id === id);
      if (!fn) return false;
      if (trigger.type === 'HTTP') {
        if (fn.triggers.some(item => item.type === 'HTTP')) return false;
        if (!['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(trigger.schedule)) return false;
      } else {
        if (fn.triggers.filter(item => item.type === 'Cron').length >= 3) return false;
        if (!validateCronExpression(trigger.schedule).valid) return false;
      }
      fn.triggers.push({ ...trigger, id: crypto.randomUUID(), enabled: true });
      return true;
    }).then(({ result }) => result ?? false);
  } catch (error) {
    if (error instanceof DemoServerlessStorageError) {
      return 'Trigger를 저장하지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.';
    }
    return '최신 Trigger 상태와 달라 추가하지 못했습니다. 취소한 뒤 목록을 확인하고 다시 시도해 주세요.';
  }
}
export function updateDemoServerlessTrigger(id: string, triggerId: string, enabled: boolean) { return mutate(id, fn => { fn.triggers = fn.triggers.map(item => item.id === triggerId ? { ...item, enabled } : item); }); }
export function deleteDemoServerlessTrigger(id: string, triggerId: string) { return mutate(id, fn => { fn.triggers = fn.triggers.filter(item => item.id !== triggerId); }); }
export function regenerateDemoServerlessUrl(id: string) { return mutate(id, fn => { fn.publicUrl = `https://${crypto.randomUUID().slice(0, 12)}.example.com`; }); }
export async function executeDemoServerlessTest(id: string, payload: string): Promise<DemoServerlessTestExecution> {
  const { result } = await transactDemoServerlessState(getSeed(), normalizeState, state => {
    const fn = state.functions.find(item => item.id === id);
    if (!fn) return { kind: 'missing' } as const;
    if (!fn.active) return { kind: 'inactive' } as const;
    if (state.executionsToday >= state.dailyLimit) return { kind: 'quota' } as const;
    const timestamp = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Seoul' }).format(new Date());
    const simulated = simulateRuntime(fn.code, fn.runtime);
    if (simulated) {
      state.executionsToday += 1;
      if (simulated.kind === 'timeout') {
        fn.runs.unshift({ id: crypto.randomUUID(), result: 'timeout', startedAt: timestamp, path: '수동', duration: `${fn.timeoutSeconds}초`, outputLines: [`Task timed out after ${fn.timeoutSeconds} seconds`] });
        return { kind: 'timeout', timeoutSeconds: fn.timeoutSeconds, memoryMb: fn.memoryMb } as const;
      }
      fn.runs.unshift({ id: crypto.randomUUID(), result: 'failure', startedAt: timestamp, path: '수동', duration: '실패', outputLines: [simulated.error.message, `    at ${simulated.error.location}`] });
      return { kind: 'runtime-error', error: simulated.error } as const;
    }
    const parsedPayload: unknown = JSON.parse(payload);
    const body = parsedPayload && typeof parsedPayload === 'object' && !Array.isArray(parsedPayload)
      ? parsedPayload as { name?: string }
      : {};
    const name = typeof body.name === 'string' ? body.name : '지민';
    const greeting = fn.variables.find(item => item.name === 'GREETING')?.value ?? '안녕하세요';
    const message = fn.runtime === 'python' ? '함수가 정상적으로 응답했습니다' : `${greeting}, ${name}!`;
    state.executionsToday += 1;
    const execution: DemoServerlessTestResult = { responseJson: JSON.stringify({ message: fn.runtime === 'python' ? 'ok' : message, ...(fn.runtime === 'python' ? { service: fn.name } : {}) }, null, 2), statusLabel: '성공', statusMessage: '함수가 정상적으로 응답했습니다', pathLabel: '수동 실행', pathCaption: `오늘 실행 ${state.executionsToday.toLocaleString('ko-KR')} / ${state.dailyLimit.toLocaleString('ko-KR')}회에 포함됩니다`, durationLabel: '182ms', durationCaption: '메모리 46MB 사용', logs: `Greeting sent ${name}`, timestampLabel: timestamp, dailyExecutionsUsed: state.executionsToday };
    fn.testResult = execution;
    fn.runs.unshift({ id: crypto.randomUUID(), result: 'success', startedAt: timestamp, path: '수동', duration: '182ms', outputLines: execution.logs.split('\n') });
    return { kind: 'executed', result: execution } as const;
  });
  return result ?? { kind: 'missing' };
}
export function deleteDemoServerlessRuns(id: string) { return mutate(id, fn => { fn.runs = []; fn.testResult = null; }); }
export function redactDemoServerlessSecrets(text: string, variables: DemoServerlessVariable[]): string {
  return variables.reduce((visible, variable) => {
    if (!variable.secret || !variable.value) return visible;
    return visible.split(variable.value).join('••••••••');
  }, text);
}
export function getDemoServerlessUrl(id: string) {
  const fn = getDemoServerlessFunction(id);
  return fn?.publicUrl ?? (id === 'welcome-api' ? defaultWelcomePublicUrl : `https://${id}.example.com`);
}

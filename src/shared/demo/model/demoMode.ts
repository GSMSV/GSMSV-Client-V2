import { saveSessionUser, type SessionUserRole } from '../../../entities/session';

const demoModeKey = 'gsmsv.demo.mode.v2';
const workspaceStatePrefix = 'gsmsv.demo.state.v2.';
const fixtureStatePrefix = 'gsmsv.demo.state.v1.';
const demoResetGenerationKey = 'gsmsv.demo.reset.generation';

export function getDemoResetGeneration(): string {
  if (typeof window === 'undefined') return '0';
  try {
    return window.localStorage.getItem(demoResetGenerationKey) ?? '0';
  } catch {
    return '0';
  }
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const requested = new URLSearchParams(window.location.search).get('demo');
    if (requested === '1' || requested === 'fixture') window.localStorage.setItem(demoModeKey, requested);
    return ['1', 'fixture'].includes(window.localStorage.getItem(demoModeKey) ?? '');
  } catch {
    return ['1', 'fixture'].includes(new URLSearchParams(window.location.search).get('demo') ?? '');
  }
}

export function isDemoFixtureMode(): boolean {
  if (!isDemoMode() || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(demoModeKey) === 'fixture';
  } catch {
    return new URLSearchParams(window.location.search).get('demo') === 'fixture';
  }
}

function demoStateKey(slice: string): string {
  return `${isDemoFixtureMode() ? fixtureStatePrefix : workspaceStatePrefix}${slice}`;
}

export function startDemoSession(role: SessionUserRole): boolean {
  if (typeof window === 'undefined' || !isDemoMode()) {
    return false;
  }

  try {
    window.localStorage.setItem(demoModeKey, isDemoFixtureMode() ? 'fixture' : '1');
  } catch {
    return false;
  }

  saveSessionUser({
    id: role === 'admin' ? 'demo-admin' : 'demo-student',
    name: role === 'admin' ? '관리자' : '김지민',
    role,
  });
  return true;
}

export function readDemoState<T>(slice: string, seed: T): T {
  if (!isDemoMode() || typeof window === 'undefined') return seed;

  try {
    const raw = window.localStorage.getItem(demoStateKey(slice));
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as { version?: unknown; value?: unknown };
    if (parsed.version !== 1 || parsed.value === undefined) return seed;
    return parsed.value as T;
  } catch {
    return seed;
  }
}

export function writeDemoState<T>(slice: string, value: T): boolean {
  if (!isDemoMode() || typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(demoStateKey(slice), JSON.stringify({ version: 1, value }));
    return true;
  } catch {
    return false;
  }
}

export function resetDemoState(): void {
  if (typeof window === 'undefined') return;

  try {
    const nextGeneration = String(Math.max(0, Number(getDemoResetGeneration()) || 0) + 1);
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith('gsmsv.demo.') && key !== demoResetGenerationKey) window.localStorage.removeItem(key);
    }
    window.localStorage.setItem(demoResetGenerationKey, nextGeneration);
  } catch {
    // Demo reset is best effort when browser storage is unavailable.
  }
}

export function stopDemoMode(): void {
  resetDemoState();
  if (typeof window !== 'undefined') window.location.assign('/');
}

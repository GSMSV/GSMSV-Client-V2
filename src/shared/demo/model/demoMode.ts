import { saveSessionUser, type SessionUserRole } from '../../../entities/session';

const demoModeKey = 'gsmsv.demo.mode.v1';
const demoStatePrefix = 'gsmsv.demo.state.v1.';

export function isDemoMode(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false;
  }

  try {
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      window.localStorage.setItem(demoModeKey, '1');
    }
    return window.localStorage.getItem(demoModeKey) === '1';
  } catch {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  }
}

export function startDemoSession(role: SessionUserRole): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(demoModeKey, '1');
  } catch {
    return false;
  }

  saveSessionUser({
    id: role === 'admin' ? 'demo-admin' : 'demo-student',
    name: role === 'admin' ? 'Demo Admin' : '김민수',
    role,
  });
  return true;
}

export function readDemoState<T>(slice: string, seed: T): T {
  if (!isDemoMode() || typeof window === 'undefined') return seed;

  try {
    const raw = window.localStorage.getItem(`${demoStatePrefix}${slice}`);
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
    window.localStorage.setItem(`${demoStatePrefix}${slice}`, JSON.stringify({ version: 1, value }));
    return true;
  } catch {
    return false;
  }
}

export function resetDemoState(): void {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return;

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith('gsmsv.demo.')) window.localStorage.removeItem(key);
    }
  } catch {
    // Demo reset is best effort when browser storage is unavailable.
  }
}

export function stopDemoMode(): void {
  resetDemoState();
  if (typeof window !== 'undefined') window.location.assign('/');
}

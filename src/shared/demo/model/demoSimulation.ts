import { isDemoMode } from './demoMode';

/**
 * 목데이터 모드에서 Figma의 로딩·오류 상태를 실제로 볼 수 있게 하는 시뮬레이션 도구.
 *
 * - 로딩: 목데이터 요청에 짧은 지연을 넣어 로딩 화면이 보이게 한다.
 * - 오류: 주소에 `?demoError=<scope>`(쉼표로 여러 개, `all`은 전체)를 붙이면
 *   해당 범위의 첫 요청만 실패한다. 같은 페이지에서 재시도하면 성공하므로
 *   오류 화면이 막다른 길이 되지 않는다. 새로고침하면 다시 한 번 실패한다.
 */

export const demoLatencyMs = 600;

const demoErrorParam = 'demoError';
const consumedFailures = new Set<string>();

export class DemoSimulatedError extends Error {
  readonly scope: string;

  constructor(scope: string) {
    super(`목데이터 오류 시뮬레이션: ${scope}`);
    this.name = 'DemoSimulatedError';
    this.scope = scope;
  }
}

function requestedFailureScopes(): string[] {
  if (typeof window === 'undefined') return [];
  const value = new URLSearchParams(window.location.search).get(demoErrorParam);
  return value ? value.split(',').map(scope => scope.trim()).filter(Boolean) : [];
}

/** 목데이터 모드일 때만 지연한다. 중단 신호가 오면 즉시 끝낸다. */
export function waitForDemoLatency(signal?: AbortSignal, ms = demoLatencyMs): Promise<void> {
  if (!isDemoMode() || ms <= 0 || signal?.aborted) return Promise.resolve();
  return new Promise(resolve => {
    const timer = window.setTimeout(done, ms);
    function done() {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done, { once: true });
  });
}

/** `?demoError`로 요청된 범위면 첫 호출에서만 true를 돌려준다. */
export function consumeDemoFailure(scope: string): boolean {
  if (!isDemoMode()) return false;
  const scopes = requestedFailureScopes();
  if (!scopes.includes(scope) && !scopes.includes('all')) return false;
  const key = `${window.location.pathname}|${scope}`;
  if (consumedFailures.has(key)) return false;
  consumedFailures.add(key);
  return true;
}

/** 목데이터 요청 한 번을 흉내 낸다: 지연 후, 요청된 경우 한 번 실패한다. */
export async function simulateDemoRequest(scope: string, signal?: AbortSignal): Promise<void> {
  await waitForDemoLatency(signal);
  // 중단된 요청은 화면에 반영되지 않으므로 1회 실패 기회를 소비하지 않는다.
  if (signal?.aborted) return;
  if (consumeDemoFailure(scope)) throw new DemoSimulatedError(scope);
}

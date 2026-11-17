/** 함수마다 동시 실행 개수. Trigger 화면의 "함수마다 동시 실행 2개"와 같다. */
export const serverlessConcurrentLimit = 2;

const localRunning = new Map<string, number>();

type LockManagerLike = { request: <T>(name: string, options: { ifAvailable: boolean }, callback: (lock: unknown) => Promise<T>) => Promise<T> };

function lockManager(): LockManagerLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { locks?: LockManagerLike }).locks;
}

const busy = Symbol('busy');

/**
 * 빈 실행 칸을 잡아 run을 실행한다. 칸이 없으면 실행하지 않고 { acquired: false }.
 * Web Locks API가 있으면 같은 브라우저의 다른 탭과도 칸을 나눠 쓴다.
 */
export async function withServerlessExecutionSlot<T>(functionId: string, run: () => Promise<T>, limit = serverlessConcurrentLimit): Promise<{ acquired: true; value: T } | { acquired: false }> {
  const locks = lockManager();
  if (!locks) {
    const running = localRunning.get(functionId) ?? 0;
    if (running >= limit) return { acquired: false };
    localRunning.set(functionId, running + 1);
    try {
      return { acquired: true, value: await run() };
    } finally {
      const next = (localRunning.get(functionId) ?? 1) - 1;
      if (next > 0) localRunning.set(functionId, next);
      else localRunning.delete(functionId);
    }
  }
  for (let slot = 0; slot < limit; slot += 1) {
    const outcome = await locks.request(`gsmsv-serverless:${functionId}:${slot}`, { ifAvailable: true }, async lock => lock ? { value: await run() } : busy);
    if (outcome !== busy) return { acquired: true, value: (outcome as { value: T }).value };
  }
  return { acquired: false };
}

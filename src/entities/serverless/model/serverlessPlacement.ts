import { allocateDemoSshSlot, configuredDemoSshTargets, demoVmPoolNumber, demoVmPoolRoles } from '../../vm/model/demoSshSlots';

/** Serverless VM 한 대에 배포할 수 있는 함수 수. VM 5~7번 3대라 전체 6개까지 동시에 배포된다. */
export const serverlessFunctionsPerVm = 2;
export const serverlessVmCount = demoVmPoolRoles.serverless.length;

interface Placed { active: boolean; vmSlot?: number }

export function serverlessVmLoads(functions: readonly Placed[]): Map<number, number> {
  const loads = new Map<number, number>(demoVmPoolRoles.serverless.map(slot => [slot, 0]));
  for (const fn of functions) {
    if (fn.active && fn.vmSlot !== undefined && loads.has(fn.vmSlot)) loads.set(fn.vmSlot, (loads.get(fn.vmSlot) ?? 0) + 1);
  }
  return loads;
}

/** 가장 덜 찬 Serverless VM을 고른다. 모두 가득 차면 null. */
export function pickServerlessVmSlot(functions: readonly Placed[]): number | null {
  const loads = serverlessVmLoads(functions);
  const open = [...loads].filter(([, load]) => load < serverlessFunctionsPerVm);
  if (!open.length) return null;
  const lightest = Math.min(...open.map(([, load]) => load));
  const occupied = [...loads].filter(([, load]) => load !== lightest).map(([slot]) => slot);
  return allocateDemoSshSlot(occupied, 'serverless');
}

export function describeServerlessVm(slot: number | undefined): string | undefined {
  if (slot === undefined) return undefined;
  const target = configuredDemoSshTargets()[slot];
  const name = `Serverless VM ${demoVmPoolNumber(slot)}`;
  return target ? `${name} · ${target.host}:${target.port}` : name;
}

export const serverlessVmShortageCopy = {
  title: `Serverless용 VM ${serverlessVmCount}대가 모두 가득 찼습니다`,
  description: `VM마다 함수 ${serverlessFunctionsPerVm}개까지 배포합니다. 다른 함수를 비활성화하거나 삭제한 뒤 다시 활성화해 주세요.`,
};

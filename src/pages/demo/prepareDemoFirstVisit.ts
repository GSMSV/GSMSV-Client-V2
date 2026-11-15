/**
 * 목데이터 학생을 Figma 04(첫 방문) 상태로 만든다: 개인 VM·함수를 비우고 첫 방문 안내를 켠다.
 * firstVisit=false면 첫 방문 안내만 끈다.
 */
export async function prepareDemoFirstVisit(firstVisit: boolean): Promise<void> {
  const [{ setDemoFirstVisit }, vm, serverless] = await Promise.all([
    import('../../entities/home'),
    import('../../entities/vm'),
    import('../../entities/serverless'),
  ]);
  setDemoFirstVisit(firstVisit);
  if (!firstVisit) return;
  const state = vm.getDemoVmState();
  vm.saveDemoVmState({
    ...state,
    vms: state.vms.filter(item => item.owner !== 'personal'),
    personalQuota: { ...state.personalQuota, cpu: 0, memory: 0, disk: 0 },
  });
  await serverless.clearDemoServerlessFunctions();
}

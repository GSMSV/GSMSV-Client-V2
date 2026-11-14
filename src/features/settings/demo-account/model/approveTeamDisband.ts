import { getDemoApps, removeDemoAppsByTeam } from '../../../../entities/app/demo';
import { listDemoDatabases, removeDemoDatabasesByOwner } from '../../../../entities/database/demo';
import { approveDemoDisbandRequest, getDemoTeam } from '../../../../entities/team/demo';
import { getDemoServerlessTeamFunctionCount, removeDemoServerlessFunctionsByTeam } from '../../../../entities/serverless';
import { getDemoVmState, saveDemoVmState } from '../../../../entities/vm';

export function getDemoDisbandResources(teamId: string) {
  return {
    vms: getDemoVmState().vms.filter(vm => vm.owner === 'team' && vm.teamId === teamId),
    databaseCount: listDemoDatabases(teamId).length,
    functionCount: getDemoServerlessTeamFunctionCount(teamId),
    appCount: getDemoApps().filter(app => app.owner?.type === 'team' && app.owner.id === teamId).length,
  };
}

export async function approveDemoTeamDisband(teamId: string): Promise<boolean> {
  if (!getDemoTeam(teamId)?.demoDisbandPending) return false;
  try {
    await removeDemoServerlessFunctionsByTeam(teamId);
  } catch {
    return false;
  }
  const vmState = getDemoVmState();
  return saveDemoVmState({ ...vmState, vms: vmState.vms.filter(vm => vm.owner !== 'team' || vm.teamId !== teamId) })
    && removeDemoDatabasesByOwner('team', teamId)
    && removeDemoAppsByTeam(teamId)
    && approveDemoDisbandRequest(teamId);
}

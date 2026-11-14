import { getDemoApps, removeDemoAppsByTeam } from '../../../../entities/app/demo';
import { listDemoDatabases, removeDemoDatabasesByOwner } from '../../../../entities/database/demo';
import { approveDemoDisbandRequest, getDemoTeam } from '../../../../entities/team/demo';
import { getDemoVmState, saveDemoVmState } from '../../../../entities/vm';

export function getDemoDisbandResources(teamId: string) {
  return {
    vms: getDemoVmState().vms.filter(vm => vm.owner === 'team' && vm.teamId === teamId),
    databaseCount: listDemoDatabases(teamId).length,
    appCount: getDemoApps().filter(app => app.owner?.type === 'team' && app.owner.id === teamId).length,
  };
}

export function approveDemoTeamDisband(teamId: string): boolean {
  if (!getDemoTeam(teamId)?.demoDisbandPending) return false;
  const vmState = getDemoVmState();
  return saveDemoVmState({ ...vmState, vms: vmState.vms.filter(vm => vm.owner !== 'team' || vm.teamId !== teamId) })
    && removeDemoDatabasesByOwner('team', teamId)
    && removeDemoAppsByTeam(teamId)
    && approveDemoDisbandRequest(teamId);
}

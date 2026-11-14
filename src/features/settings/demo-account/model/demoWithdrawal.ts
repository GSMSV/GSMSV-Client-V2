import { getDemoApps, saveDemoApps } from '../../../../entities/app/demo';
import { listDemoDatabases, removeDemoDatabasesByOwner } from '../../../../entities/database/demo';
import { getDemoAccounts } from '../../../../entities/demo-workflows';
import { getDemoHomeState, saveDemoHomeState } from '../../../../entities/home';
import { getDemoProfile, updateDemoProfile } from '../../../../entities/profile';
import { getDemoServerlessState, saveDemoServerlessState } from '../../../../entities/serverless';
import { getSessionUser } from '../../../../entities/session';
import { leaveDemoTeamsForWithdrawal, listDemoTeams } from '../../../../entities/team/demo';
import type { TeamSummary } from '../../../../entities/team';
import { getDemoVmState, saveDemoVmState } from '../../../../entities/vm';
import { writeDemoState } from '../../../../shared/demo';

export type WithdrawalStep =
  | { kind: 'last-admin' }
  | { kind: 'only-member' | 'team-lead'; team: TeamSummary }
  | { kind: 'confirm' };

export function getWithdrawalStep(allowAutomaticHandoff = false): WithdrawalStep {
  const admins = getDemoAccounts().filter(account => account.role === '관리자');
  if (getSessionUser()?.role === 'admin' && admins.length <= 1) return { kind: 'last-admin' };

  const teams = listDemoTeams();
  const onlyMember = teams.find(team => team.member_count <= 1);
  if (onlyMember) return { kind: 'only-member', team: onlyMember };
  const lead = teams.find(team => team.my_role === 'leader');
  return lead && !allowAutomaticHandoff ? { kind: 'team-lead', team: lead } : { kind: 'confirm' };
}

export function getWithdrawalItems() {
  const vms = getDemoVmState().vms.filter(vm => vm.owner === 'personal').map(vm => vm.name);
  const databases = listDemoDatabases().map(database => database.name);
  const fnCount = getDemoServerlessState().functions.length;
  const apps = getDemoApps().filter(app => app.owner?.type === 'user' && app.owner.id === 'demo-student').map(app => app.name);
  return [
    `· VM ${vms.length}개${vms.length ? ` · ${vms.join(', ')}` : ''}`,
    `· Database ${databases.length}개${databases.length ? ` · ${databases.join(', ')}` : ''}`,
    `· 함수 ${fnCount}개`,
    `· 앱 ${apps.length}개${apps.length ? ` · ${apps.join(', ')}` : ''}`,
  ].join('\n');
}

export function withdrawDemoAccount(email: string, allowAutomaticHandoff: boolean): boolean {
  const profile = getDemoProfile();
  if (!profile || profile.accountDeleted || email !== profile.email || getWithdrawalStep(allowAutomaticHandoff).kind !== 'confirm') {
    return false;
  }

  const vmState = getDemoVmState();
  const serverless = getDemoServerlessState();
  const apps = getDemoApps();
  const home = getDemoHomeState();
  // Apply from the account's local repositories. Replacement writes are idempotent on retry.
  if (!saveDemoVmState({
    ...vmState,
    vms: vmState.vms.filter(vm => vm.owner === 'team'),
  }) || !saveDemoServerlessState({ ...serverless, functions: [], executionsToday: 0 })
    || !saveDemoApps(apps.filter(app => app.owner?.type !== 'user' || app.owner.id !== 'demo-student'))
    || !removeDemoDatabasesByOwner('user', 'demo-student')
    || (home && !saveDemoHomeState({ ...home, firstVisit: true, functions: [] }))
    || !writeDemoState('notifications', null)
    || !leaveDemoTeamsForWithdrawal()) return false;

  return Boolean(updateDemoProfile({
    accountDeleted: true,
    signedOut: true,
    photoDataUrl: null,
    github: null,
    discordConnected: false,
    cliDevices: [],
  }));
}

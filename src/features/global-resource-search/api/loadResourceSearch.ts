import { getAppStatusDisplay, listPersonalApps, listTeamApps, type AppSummary } from '../../../entities/app';
import { listDatabases } from '../../../entities/database';
import type { DatabaseSummary } from '../../../entities/database';
import { listMyTeams } from '../../../entities/team';
import type { TeamSummary } from '../../../entities/team';
import { isDemoMode } from '../../../shared/demo';

export type SearchableResource = {
  id: string;
  name: string;
  grn: string;
  kind: 'app' | 'database' | 'vm' | 'function';
  status: string;
  scopeId: string;
  scopeLabel: string;
  path: string;
};

export interface ResourceSearchResult {
  resources: SearchableResource[];
  hadError: boolean;
}

const databaseStatusLabel: Record<DatabaseSummary['status'], string> = {
  active: '사용 중',
  creating: '생성 중',
  suspended: '정지',
  deleting: '삭제 중',
  failed: '오류',
};

function mapApps(apps: AppSummary[], teams: Map<string, TeamSummary>): SearchableResource[] {
  return apps.map(app => {
    const team = app.owner.type === 'team' ? teams.get(app.owner.id) : undefined;
    return {
      id: `app:${app.grn}`,
      name: app.name,
      grn: app.grn,
      kind: 'app',
      status: getAppStatusDisplay(app.status).label,
      scopeId: team?.id ?? (app.owner.type === 'team' ? app.owner.id : 'personal'),
      scopeLabel: app.owner.type === 'team' ? `${team?.name ?? app.owner.name} · 팀` : '내 Resources',
      path: `/apps/${encodeURIComponent(app.grn)}`,
    };
  });
}

function mapDatabases(databases: DatabaseSummary[], teamById: Map<string, TeamSummary>, scopeId: string): SearchableResource[] {
  return databases.map(database => {
    const team = teamById.get(scopeId);
    return {
      id: `database:${database.grn}`,
      name: database.name,
      grn: database.grn,
      kind: 'database',
      status: databaseStatusLabel[database.status],
      scopeId: team?.id ?? 'personal',
      scopeLabel: team ? `${team.name} · 팀` : '내 Resources',
      path: `/databases/${encodeURIComponent(database.grn)}`,
    };
  });
}

export async function loadResourceSearch(signal: AbortSignal): Promise<ResourceSearchResult> {
  if (isDemoMode()) {
    const [appDemo, databaseDemo, teamDemo, vmDemo, serverlessDemo] = await Promise.all([
      import('../../../entities/app/demo'),
      import('../../../entities/database/demo'),
      import('../../../entities/team/demo'),
      import('../../../entities/vm'),
      import('../../../entities/serverless'),
    ]);
    if (signal.aborted) return { resources: [], hadError: false };
    const teams = teamDemo.listDemoTeams();
    const teamById = new Map(teams.map(team => [team.id, team]));
    const personalApps = appDemo.getDemoAppSummaries(appDemo.demoPersonalAppOwner);
    const teamApps = teams.flatMap(team => appDemo.getDemoAppSummaries({ type: 'team', id: team.id, name: team.name }));
    const resources: SearchableResource[] = [
      ...mapApps([...personalApps, ...teamApps], teamById),
      ...mapDatabases(databaseDemo.listDemoDatabases(), teamById, 'personal'),
      ...teams.flatMap(team => mapDatabases(databaseDemo.listDemoDatabases(team.id), teamById, team.id)),
    ];
    for (const vm of vmDemo.getDemoVmState().vms) {
      const team = vm.teamId ? teamById.get(vm.teamId) : undefined;
      if (vm.owner === 'team' && !team) continue;
      const scopePath = team ? `/teams/${encodeURIComponent(team.id)}` : '';
      resources.push({
        id: `vm:${vm.grn}`,
        grn: vm.grn,
        name: vm.name,
        kind: 'vm',
        status: vm.status === 'running' ? '실행 중' : vm.status === 'queued' ? '생성 중' : '정지',
        scopeId: team?.id ?? 'personal',
        scopeLabel: team ? `${team.name} · 팀` : '내 Resources',
        path: `${scopePath}/vms/${encodeURIComponent(vm.id)}`,
      });
    }
    try {
      const state = await serverlessDemo.loadDemoServerlessState();
      if (signal.aborted) return { resources: [], hadError: false };
      for (const fn of state.functions.filter(item => !item.teamId)) {
        resources.push({
          id: `function:${fn.id}`,
          grn: fn.id,
          name: fn.name,
          kind: 'function',
          status: fn.active ? '사용 중' : '정지',
          scopeId: 'personal',
          scopeLabel: '내 Resources',
          path: `/serverless/${encodeURIComponent(fn.id)}`,
        });
      }
    } catch {
      return { resources, hadError: true };
    }
    return { resources, hadError: false };
  }

  // Current user-facing list contracts cover Apps and Database. VM and function entries can be added once their APIs are available.
  const [personalAppsResult, personalDatabasesResult, teamsResult] = await Promise.allSettled([
    listPersonalApps({ signal }),
    listDatabases({ owner: 'me', signal }),
    listMyTeams(signal),
  ]);

  if (signal.aborted) return { resources: [], hadError: false };

  const teams = teamsResult.status === 'fulfilled' ? teamsResult.value : [];
  const teamById = new Map(teams.map(team => [team.id, team]));
  const resources: SearchableResource[] = [];
  let hadError = personalAppsResult.status === 'rejected'
    || personalDatabasesResult.status === 'rejected'
    || teamsResult.status === 'rejected';

  if (personalAppsResult.status === 'fulfilled') resources.push(...mapApps(personalAppsResult.value, teamById));
  if (personalDatabasesResult.status === 'fulfilled') resources.push(...mapDatabases(personalDatabasesResult.value, teamById, 'personal'));

  const teamResults = await Promise.all(teams.map(async team => {
    const [appsResult, databasesResult] = await Promise.allSettled([
      listTeamApps({ teamId: team.id, signal }),
      listDatabases({ owner: team.id, signal }),
    ]);
    if (signal.aborted) return { items: [], hadError: false };
    const items = [
      ...(appsResult.status === 'fulfilled' ? mapApps(appsResult.value, teamById) : []),
      ...(databasesResult.status === 'fulfilled' ? mapDatabases(databasesResult.value, teamById, team.id) : []),
    ];
    return { items, hadError: appsResult.status === 'rejected' || databasesResult.status === 'rejected' };
  }));

  teamResults.forEach(result => {
    resources.push(...result.items);
    hadError ||= result.hadError;
  });

  return { resources, hadError };
}

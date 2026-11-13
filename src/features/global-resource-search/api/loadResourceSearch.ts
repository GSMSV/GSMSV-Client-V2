import { listPersonalApps, listTeamApps } from '../../../entities/app';
import type { AppSummary } from '../../../entities/app';
import { listDatabases } from '../../../entities/database';
import type { DatabaseSummary } from '../../../entities/database';
import { listMyTeams } from '../../../entities/team';
import type { TeamSummary } from '../../../entities/team';

export type SearchableResource = {
  id: string;
  name: string;
  grn: string;
  kind: 'app' | 'database';
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

function appStatusLabel(status: AppSummary['status']) {
  const labels: Record<string, string> = {
    active: '실행 중',
    running: '실행 중',
    stopped: '정지',
    suspended: '정지',
    creating: '생성 중',
    deploying: '배포 중',
    failed: '오류',
    expired: '만료',
  };
  return labels[status.toLowerCase()] ?? status;
}

function mapApps(apps: AppSummary[], teams: Map<string, TeamSummary>): SearchableResource[] {
  return apps.map(app => {
    const team = app.owner.type === 'team' ? teams.get(app.owner.id) : undefined;
    return {
      id: `app:${app.grn}`,
      name: app.name,
      grn: app.grn,
      kind: 'app',
      status: appStatusLabel(app.status),
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

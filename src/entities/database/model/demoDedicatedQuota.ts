import { getDemoDatabaseState } from './demoDatabase';

export const DEMO_TEAM_DEDICATED_DATABASE_LIMIT = 1;

export function getDemoTeamDedicatedDatabaseQuota(teamId: string) {
  const used = getDemoDatabaseState().databases.filter(database =>
    database.owner.type === 'team' &&
    database.owner.id === teamId &&
    database.isolation === 'dedicated',
  ).length;

  return {
    used,
    limit: DEMO_TEAM_DEDICATED_DATABASE_LIMIT,
    available: Math.max(0, DEMO_TEAM_DEDICATED_DATABASE_LIMIT - used),
  };
}

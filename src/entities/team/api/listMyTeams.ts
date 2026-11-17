import { requestJson } from '../../../shared/api';
import type { TeamSummary, TeamSummaryPage } from '../model/types';

const PAGE_LIMIT = 100;

export async function listMyTeams(signal?: AbortSignal): Promise<TeamSummary[]> {
  const teams: TeamSummary[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });
    if (cursor) params.set('cursor', cursor);
    const page = await requestJson<TeamSummaryPage>(`/api/v2/teams?${params}`, { signal });
    teams.push(...page.items);
    cursor = page.next_cursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error('Team list returned a repeated cursor');
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return teams;
}

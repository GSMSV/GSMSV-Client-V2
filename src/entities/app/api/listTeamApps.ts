import { requestJson } from '../../../shared/api';
import type { AppPage, AppSummary } from '../model/types';

interface ListTeamAppsOptions {
  teamId: string;
  limit?: number;
  signal?: AbortSignal;
}

export async function listTeamApps({ teamId, limit = 100, signal }: ListTeamAppsOptions) {
  if (!teamId.trim()) {
    throw new TypeError('Team id is required');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError('App list limit must be an integer from 1 to 100');
  }

  const items: AppSummary[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const search = new URLSearchParams({ limit: String(limit) });
    if (cursor) search.set('cursor', cursor);

    const page = await requestJson<AppPage>(
      `/api/v2/teams/${encodeURIComponent(teamId)}/apps?${search}`,
      { signal },
    );
    items.push(...page.items);

    cursor = page.next_cursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error('Team app list returned a repeated cursor');
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return items;
}

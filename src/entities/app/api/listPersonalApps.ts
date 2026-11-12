import { requestJson } from '../../../shared/api';
import type { AppPage, AppSummary } from '../model/types';

interface ListPersonalAppsOptions {
  limit?: number;
  signal?: AbortSignal;
}

export async function listPersonalApps({ limit = 100, signal }: ListPersonalAppsOptions = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError('App list limit must be an integer from 1 to 100');
  }

  const items: AppSummary[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const search = new URLSearchParams({ limit: String(limit) });
    if (cursor) search.set('cursor', cursor);

    const page = await requestJson<AppPage>(`/api/v2/apps?${search}`, { signal });
    items.push(...page.items);

    cursor = page.next_cursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error('App list returned a repeated cursor');
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return items;
}

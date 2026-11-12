import { requestJson } from '../../../shared/api';
import type { DatabaseSummary, DatabaseSummaryPage } from '../model/types';

interface ListDatabaseOptions {
  owner?: string;
  limit?: number;
  signal?: AbortSignal;
}

export async function listDatabases({ owner = 'me', limit = 100, signal }: ListDatabaseOptions = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError('Database list limit must be an integer from 1 to 100');
  }

  const items: DatabaseSummary[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const search = new URLSearchParams({ owner, limit: String(limit) });
    if (cursor) {
      search.set('cursor', cursor);
    }

    const page = await requestJson<DatabaseSummaryPage>(`/api/v2/databases?${search}`, { signal });
    items.push(...page.items);

    cursor = page.next_cursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error('Database list returned a repeated cursor');
    }
    if (cursor) {
      seenCursors.add(cursor);
    }
  } while (cursor);

  return items;
}

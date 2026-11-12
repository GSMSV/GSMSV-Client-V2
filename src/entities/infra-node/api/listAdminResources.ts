import { requestJson } from '../../../shared/api';
import type { AdminResource, AdminResourcePage } from '../model/types';

/** Reads every cursor page so the infrastructure summary is based on the complete result. */
export async function listAdminResources(signal?: AbortSignal): Promise<AdminResource[]> {
  const resources: AdminResource[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ type: 'vm', limit: '100' });
    if (cursor) params.set('cursor', cursor);
    const page = await requestJson<AdminResourcePage>(`/api/v2/admin/resources?${params.toString()}`, { signal });
    resources.push(...page.items);
    cursor = page.next_cursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error('Admin resource list returned a repeated cursor');
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return resources;
}

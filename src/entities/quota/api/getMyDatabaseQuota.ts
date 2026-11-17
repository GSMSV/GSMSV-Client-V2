import { requestJson } from '../../../shared/api';
import type { DatabaseQuota } from '../model/types';

export function getMyDatabaseQuota(signal?: AbortSignal) {
  return requestJson<DatabaseQuota>('/api/v2/users/me/quota', { signal });
}

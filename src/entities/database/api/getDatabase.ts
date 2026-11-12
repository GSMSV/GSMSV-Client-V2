import { requestJson } from '../../../shared/api';
import type { DatabaseDetail } from '../model/types';

export function getDatabase(databaseGrn: string, signal?: AbortSignal) {
  return requestJson<DatabaseDetail>(`/api/v2/databases/${encodeURIComponent(databaseGrn)}`, { signal });
}

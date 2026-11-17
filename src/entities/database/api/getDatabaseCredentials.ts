import { requestJson } from '../../../shared/api';
import type { DatabaseCredentials } from '../model/types';

export function getDatabaseCredentials(databaseGrn: string, signal?: AbortSignal) {
  return requestJson<DatabaseCredentials>(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}/credentials`,
    { signal, cache: 'no-store' },
  );
}

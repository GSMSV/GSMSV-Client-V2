import { requestJson } from '../../../shared/api';
import type { DatabaseBackup } from '../model/types';

export async function listDatabaseBackups(databaseGrn: string, signal?: AbortSignal) {
  const response = await requestJson<{ items: DatabaseBackup[] }>(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}/backups`,
    { signal },
  );
  return response.items;
}

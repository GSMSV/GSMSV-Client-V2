import { requestBlob } from '../../../shared/api';

export function downloadDatabaseBackup(databaseGrn: string, backupId: string, signal?: AbortSignal) {
  return requestBlob(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}/backups/${encodeURIComponent(backupId)}/download`,
    { signal, cache: 'no-store' },
  );
}

import { requestJson } from '../../../shared/api';

export interface RestoreDatabaseBackupResponse {
  operation: { id: string; type: string; status: string };
  resource: { grn: string };
  pre_restore_backup: { id: string };
}

export function restoreDatabaseBackup(databaseGrn: string, backupId: string, confirmName: string, signal?: AbortSignal) {
  return requestJson<RestoreDatabaseBackupResponse>(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}/backups/${encodeURIComponent(backupId)}/restore`,
    { method: 'POST', body: JSON.stringify({ confirm_name: confirmName }), signal },
  );
}

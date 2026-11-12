import { requestJson } from '../../../shared/api';

export function extendDatabase(databaseGrn: string, signal?: AbortSignal) {
  return requestJson<{ expires_at: string }>(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}/extend`,
    { method: 'POST', signal },
  );
}

import { requestJson } from '../../../shared/api';

export interface RenameDatabaseResponse {
  grn: string;
  name: string;
}

export function renameDatabase(databaseGrn: string, name: string, signal?: AbortSignal) {
  return requestJson<RenameDatabaseResponse>(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}`,
    { method: 'PATCH', body: JSON.stringify({ name }), signal },
  );
}

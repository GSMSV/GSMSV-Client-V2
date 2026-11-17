import { requestJson } from '../../../shared/api';
import type { DatabaseOperation } from '../model/types';

interface DeleteDatabaseOptions {
  idempotencyKey: string;
  signal?: AbortSignal;
}

export function deleteDatabase(databaseGrn: string, confirmationName: string, { idempotencyKey, signal }: DeleteDatabaseOptions) {
  return requestJson<DatabaseOperation>(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}`,
    {
      method: 'DELETE',
      headers: {
        'X-Confirm-Name': encodeURIComponent(confirmationName),
        'Idempotency-Key': idempotencyKey,
      },
      signal,
    },
  );
}

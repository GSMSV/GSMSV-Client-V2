import { requestJson } from '../../../shared/api';
import type { DatabaseEngine, DatabaseOperation } from '../model/types';

interface CreatePersonalDatabaseOptions {
  idempotencyKey: string;
  signal?: AbortSignal;
}

export function createPersonalDatabase(name: string, engine: DatabaseEngine, { idempotencyKey, signal }: CreatePersonalDatabaseOptions) {
  return requestJson<DatabaseOperation>('/api/v2/databases', {
    method: 'POST',
    body: JSON.stringify({ name, engine }),
    headers: { 'Idempotency-Key': idempotencyKey },
    signal,
  });
}

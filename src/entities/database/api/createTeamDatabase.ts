import { requestJson } from '../../../shared/api';
import type { DatabaseEngine, DatabaseOperation } from '../model/types';

interface CreateTeamDatabaseOptions {
  idempotencyKey: string;
  signal?: AbortSignal;
}

export function createTeamDatabase(teamId: string, name: string, engine: DatabaseEngine, { idempotencyKey, signal }: CreateTeamDatabaseOptions) {
  return requestJson<DatabaseOperation>(`/api/v2/teams/${encodeURIComponent(teamId)}/databases`, {
    method: 'POST',
    body: JSON.stringify({ name, engine }),
    headers: { 'Idempotency-Key': idempotencyKey },
    signal,
  });
}

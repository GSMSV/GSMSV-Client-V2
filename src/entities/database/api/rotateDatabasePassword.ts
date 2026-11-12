import { requestJson } from '../../../shared/api';
import type { DatabasePasswordRotation } from '../model/types';

export function rotateDatabasePassword(databaseGrn: string, signal?: AbortSignal) {
  return requestJson<DatabasePasswordRotation>(
    `/api/v2/databases/${encodeURIComponent(databaseGrn)}/password-rotation`,
    { method: 'POST', signal, cache: 'no-store' },
  );
}

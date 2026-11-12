import { requestNoContent } from '../../../../shared/api';

export function logout(): Promise<void> {
  return requestNoContent('/api/v2/auth/logout', { method: 'POST' });
}

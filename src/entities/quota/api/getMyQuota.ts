import { requestJson } from '../../../shared/api';
import type { MyQuota } from '../model/types';

export function getMyQuota(signal?: AbortSignal) {
  return requestJson<MyQuota>('/api/v2/users/me/quota', { signal });
}

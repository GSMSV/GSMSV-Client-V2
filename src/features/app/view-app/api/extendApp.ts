import { requestJson } from '../../../../shared/api';
import type { AppDetail } from './getApp';

export function extendApp(appGrn: string, signal?: AbortSignal) {
  return requestJson<AppDetail>(`/api/v2/apps/${encodeURIComponent(appGrn)}/extend`, {
    method: 'POST',
    signal,
  });
}

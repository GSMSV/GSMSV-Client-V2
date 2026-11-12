import { requestJson } from '../../../../shared/api';

export interface CreatedPersonalApp {
  grn: string;
}

export function createPersonalApp(name: string, signal?: AbortSignal) {
  return requestJson<CreatedPersonalApp>('/api/v2/apps', {
    method: 'POST',
    body: JSON.stringify({ name }),
    signal,
  });
}

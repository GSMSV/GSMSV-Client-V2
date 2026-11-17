import { requestJson } from '../../../../../shared/api';

export interface AppSubdomainAvailability {
  available: boolean;
  reason: 'taken' | 'reserved' | 'invalid_format' | null;
}

export function checkAppSubdomain(name: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ name });
  return requestJson<AppSubdomainAvailability>(`/api/v2/apps/subdomains/availability?${query}`, { signal });
}

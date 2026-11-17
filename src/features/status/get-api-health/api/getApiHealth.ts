import { ApiRequestError, requestJson } from '../../../../shared/api';

export interface ApiHealth {
  status: 'UP' | 'DOWN';
}

export async function getApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  try {
    return await requestJson<ApiHealth>('/actuator/health', { signal });
  } catch (error) {
    // The public contract returns HTTP 503 with { status: DOWN } for an unhealthy API.
    if (error instanceof ApiRequestError && error.status === 503) return { status: 'DOWN' };
    throw error;
  }
}

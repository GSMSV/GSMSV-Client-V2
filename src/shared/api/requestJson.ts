export interface ApiErrorPayload {
  code?: string;
  request_id?: string;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number | null,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(code);
    this.name = 'ApiRequestError';
  }
}

function getApiUrl(path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    throw new TypeError('API paths must be relative to the configured API origin');
  }

  const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/+$/, '') ?? '';
  return `${apiOrigin}${path}`;
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(getApiUrl(path), {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch (error) {
    if (init.signal?.aborted) {
      throw error;
    }
    throw new ApiRequestError(null, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
    throw new ApiRequestError(response.status, payload?.code ?? 'UNKNOWN_ERROR', payload?.request_id);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiRequestError(response.status, 'INVALID_RESPONSE');
  }
}

export async function requestBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(getApiUrl(path), { ...init, credentials: 'include' });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiRequestError(null, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
    throw new ApiRequestError(response.status, payload?.code ?? 'UNKNOWN_ERROR', payload?.request_id);
  }

  return response.blob();
}

/** 서버 오류 본문 `{code, message, request_id, details?}`. `details`는 값이 없으면 빠진다. */
export interface ApiErrorPayload {
  code?: string;
  message?: string;
  request_id?: string;
  details?: Record<string, unknown>;
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

// 인증 API 자체는 갱신 대상에서 뺀다(로그인·갱신·로그아웃 실패가 다시 갱신을 부르지 않게).
const refreshExemptPrefix = '/api/v2/auth/';
let refreshInFlight: Promise<boolean> | null = null;

const refreshLockName = 'gsmsv-auth-refresh';

function postRefresh(): Promise<boolean> {
  return fetch(getApiUrl('/api/v2/auth/refresh'), { method: 'POST', credentials: 'include' })
    .then(response => response.status === 204)
    .catch(() => false);
}

/**
 * 리프레시 쿠키로 액세스 토큰을 갱신한다. 동시에 여러 요청이 401을 받아도 한 번만 호출한다.
 * 서버는 리프레시 토큰을 한 번 쓰면 바꾸고, 이미 쓴 토큰이 오면 401과 함께 쿠키를 지운다.
 * 그래서 여러 탭이 같은 토큰으로 동시에 갱신하지 않도록 Web Locks로 탭 사이에서도 차례로 보낸다.
 * 앞 탭이 갱신을 마치면 쿠키 저장소에 새 토큰이 있으므로 다음 탭은 새 토큰으로 갱신한다.
 */
function refreshSession(): Promise<boolean> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  refreshInFlight ??= (locks ? locks.request(refreshLockName, postRefresh) : postRefresh())
    .catch(() => false)
    .finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

/** 401이면 토큰을 한 번 갱신하고 같은 요청을 다시 보낸다. */
async function fetchWithRefresh(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(getApiUrl(path), init);
  if (response.status !== 401 || path.startsWith(refreshExemptPrefix) || init.signal?.aborted) return response;
  if (!(await refreshSession())) return response;
  return fetch(getApiUrl(path), init);
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetchWithRefresh(path, {
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

  return response;
}

export async function requestNoContent(path: string, init: RequestInit = {}): Promise<void> {
  const response = await request(path, init);
  if (response.status !== 204) {
    throw new ApiRequestError(response.status, 'INVALID_RESPONSE');
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await request(path, init);
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiRequestError(response.status, 'INVALID_RESPONSE');
  }
}

export async function requestBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  let response: Response;
  try {
    response = await fetchWithRefresh(path, { ...init, credentials: 'include' });
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

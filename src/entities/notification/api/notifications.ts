import { ApiRequestError, requestJson } from '../../../shared/api';

export interface NotificationResource {
  grn: string;
  name: string;
}

export interface NotificationItem {
  id: string;
  kind: string;
  category: string;
  group: string;
  title: string;
  body: string;
  resource: NotificationResource | null;
  read: boolean;
  created_at: string;
}

export interface NotificationList {
  items: NotificationItem[];
  unread_count: number;
}

export function listNotifications(signal?: AbortSignal) {
  return requestJson<NotificationList>('/api/v2/notifications', { signal });
}

export function markNotificationRead(id: string, signal?: AbortSignal) {
  return requestNoContent(`/api/v2/notifications/${encodeURIComponent(id)}/read`, 'POST', signal);
}

export function markAllNotificationsRead(signal?: AbortSignal) {
  return requestNoContent('/api/v2/notifications/read-all', 'POST', signal);
}

export function deleteNotification(id: string, signal?: AbortSignal) {
  return requestNoContent(`/api/v2/notifications/${encodeURIComponent(id)}`, 'DELETE', signal);
}

async function requestNoContent(path: string, method: 'POST' | 'DELETE', signal?: AbortSignal): Promise<void> {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/+$/, '') ?? '';
  let response: Response;
  try {
    response = await fetch(`${apiOrigin}${path}`, { method, credentials: 'include', signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiRequestError(null, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { code?: string; request_id?: string } | null;
    throw new ApiRequestError(response.status, payload?.code ?? 'UNKNOWN_ERROR', payload?.request_id);
  }
}

import { ApiRequestError, requestJson } from '../../../shared/api';
import { isDemoMode, readDemoState, writeDemoState } from '../../../shared/demo';

const demoNotificationSlice = 'notifications';

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

function seededDemoNotifications(): NotificationItem[] {
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  return [
    { id: 'demo-vm-expiring', kind: 'vm-expiring', category: 'VM', group: 'Resource', title: 'portfolio-api가 3일 뒤 만료됩니다', body: '만료 7일 전부터 사용 기간을 14일씩 연장할 수 있습니다.', resource: null, read: false, created_at: ago(5) },
    { id: 'demo-inquiry-replied', kind: 'inquiry-replied', category: '문의', group: 'Support', title: '문의에 답변이 등록됐습니다', body: 'SSH 접속 문의에 관리자가 답변했습니다.', resource: null, read: false, created_at: ago(18) },
    { id: 'demo-db-capacity', kind: 'database-capacity', category: 'Database', group: 'Resource', title: 'welcome-db 용량을 80% 넘게 쓰고 있습니다', body: '저장 공간을 확인하고 사용하지 않는 데이터를 정리해 주세요.', resource: null, read: true, created_at: ago(60) },
    { id: 'demo-app-deploy-failed', kind: 'app-deploy-failed', category: 'Apps', group: 'Resource', title: 'portfolio-web 배포에 실패했습니다', body: '최근 배포 로그에서 빌드 오류를 확인해 주세요.', resource: null, read: true, created_at: ago(180) },
    { id: 'demo-team-approved', kind: 'team-approved', category: '팀', group: 'Team', title: 'GSM Connect 팀이 승인됐습니다', body: '팀 VM과 공유 Resource를 사용할 수 있습니다.', resource: null, read: true, created_at: ago(24 * 60) },
  ];
}

function getDemoNotifications(): NotificationItem[] {
  const seed = seededDemoNotifications();
  const stored = readDemoState<unknown>(demoNotificationSlice, seed);
  if (Array.isArray(stored) && stored.every(item => item && typeof item.id === 'string')) return stored;
  return seed;
}

function saveDemoNotifications(items: NotificationItem[]): boolean {
  return writeDemoState(demoNotificationSlice, items);
}

function persistDemoNotifications(items: NotificationItem[]): void {
  if (!saveDemoNotifications(items)) throw new Error('Demo notifications could not be saved.');
}

export function addDemoNotification(notification: Omit<NotificationItem, 'id' | 'read' | 'created_at'>): boolean {
  if (!isDemoMode()) return false;
  const next = [{ ...notification, id: `demo-${crypto.randomUUID()}`, read: false, created_at: new Date().toISOString() }, ...getDemoNotifications()].slice(0, 50);
  return saveDemoNotifications(next);
}

export function listNotifications(signal?: AbortSignal) {
  if (isDemoMode()) {
    if (signal?.aborted) return Promise.reject(signal.reason);
    const items = getDemoNotifications();
    return Promise.resolve({ items, unread_count: items.filter(item => !item.read).length });
  }
  return requestJson<NotificationList>('/api/v2/notifications', { signal });
}

export function markNotificationRead(id: string, signal?: AbortSignal) {
  if (isDemoMode()) {
    if (signal?.aborted) return Promise.reject(signal.reason);
    return Promise.resolve().then(() => persistDemoNotifications(getDemoNotifications().map(item => item.id === id ? { ...item, read: true } : item)));
  }
  return requestNoContent(`/api/v2/notifications/${encodeURIComponent(id)}/read`, 'POST', signal);
}

export function markAllNotificationsRead(signal?: AbortSignal) {
  if (isDemoMode()) {
    if (signal?.aborted) return Promise.reject(signal.reason);
    return Promise.resolve().then(() => persistDemoNotifications(getDemoNotifications().map(item => ({ ...item, read: true }))));
  }
  return requestNoContent('/api/v2/notifications/read-all', 'POST', signal);
}

export function deleteNotification(id: string, signal?: AbortSignal) {
  if (isDemoMode()) {
    if (signal?.aborted) return Promise.reject(signal.reason);
    return Promise.resolve().then(() => persistDemoNotifications(getDemoNotifications().filter(item => item.id !== id)));
  }
  return requestNoContent(`/api/v2/notifications/${encodeURIComponent(id)}`, 'DELETE', signal);
}

const demoNotificationPaths: Record<string, string> = {
  'vm-expiring': '/vms/portfolio-api',
  'inquiry-replied': '/support/inquiries',
  'database-capacity': `/databases/${encodeURIComponent('grn:gsmsv:database:demo-student:welcome-db')}`,
  'app-deploy-failed': '/apps/demo-portfolio-web/demo',
  'team-approved': '/teams/demo-team',
};

/** 목데이터 알림에는 실제 GRN이 없으므로 종류별로 관련 화면을 연결한다. */
export function getDemoNotificationPath(item: NotificationItem): string | null {
  return isDemoMode() ? demoNotificationPaths[item.kind] ?? null : null;
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

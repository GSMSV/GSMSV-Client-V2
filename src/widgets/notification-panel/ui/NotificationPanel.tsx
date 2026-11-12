import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  deleteNotification,
  getNotificationResourcePath,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../../../entities/notification';
import { ApiRequestError } from '../../../shared/api';
import { Button } from '../../../shared/ui/controls';
import { LoadingCard } from '../../../shared/ui/feedback';
import { Octicon, type OcticonName } from '../../../shared/ui/icons';

const Panel = styled.aside<{ $top: number; $right: number }>`
  position: fixed;
  z-index: 40;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  display: flex;
  width: min(480px, calc(100vw - 32px));
  max-height: min(720px, calc(100vh - 82px));
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 36px #0007;
`;

const Heading = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`;

const IconWrap = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const CloseButton = styled.button`
  display: inline-grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: transparent;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.overlayHover}; color: ${({ theme }) => theme.colors.text}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li<{ $unread: boolean; $selected: boolean }>`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 28px;
  align-items: start;
  gap: 12px;
  padding: 10px 8px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : 'transparent'};

  &:hover { background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : theme.colors.overlayHover}; }
`;

const CategoryIcon = styled.span`
  display: inline-flex;
  justify-content: center;
  padding-top: 2px;
  color: ${({ theme }) => theme.colors.muted};
`;

const NotificationContent = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`;

const NotificationButton = styled.button<{ $unread: boolean }>`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme, $unread }) => `${$unread ? theme.typography.bodySmall.weight : theme.typography.caption.weight} ${$unread ? theme.typography.bodySmall.size : theme.typography.caption.size}px/${$unread ? theme.typography.bodySmall.lineHeight : theme.typography.caption.lineHeight}px ${theme.typography.bodySmall.family}, sans-serif`};
  text-align: left;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Time = styled.time`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const UnreadDot = styled.span`
  width: 8px;
  height: 8px;
  margin: 6px auto 0;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
`;

const RowAction = styled.button`
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: transparent;
  color: ${({ theme }) => theme.colors.faint};
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.raised}; color: ${({ theme }) => theme.colors.text}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 1px; }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

const Empty = styled.div`
  display: flex;
  min-height: 96px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const LoadError = styled.div`
  display: flex;
  min-height: 104px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: center;
`;

export interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  top?: number;
  right?: number;
  onUnreadCountChange?: (count: number) => void;
  onOpenResource?: (path: string) => void;
}

type LoadErrorKind = 'unauthenticated' | 'forbidden' | 'not-found' | 'retryable' | 'unknown';

interface LoadState {
  items: NotificationItem[];
  unreadCount: number;
  loaded: boolean;
  loading: boolean;
  error: LoadErrorKind | null;
}

interface ActionError {
  message: string;
  action?: 'login' | 'refresh';
}

const initialState: LoadState = { items: [], unreadCount: 0, loaded: false, loading: false, error: null };

function relativeTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return '시간 확인 불가';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '어제' : `${days}일 전`;
}

function iconFor(notification: NotificationItem): OcticonName {
  const category = notification.category.toLowerCase();
  if (category.includes('db') || category.includes('database')) return 'database';
  if (category.includes('team') || category.includes('member') || category.includes('invite')) return 'people';
  if (category.includes('app') || category.includes('deploy')) return 'upload';
  if (category.includes('expire') || category.includes('renew')) return 'clock';
  return notification.kind === 'warning' ? 'alert' : 'bell';
}

export function NotificationPanel({ open, onClose, top = 66, right = 24, onUnreadCountChange, onOpenResource }: NotificationPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<LoadState>(initialState);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setState(current => ({ ...current, loading: true, error: null }));
    try {
      const result = await listNotifications(signal);
      if (signal.aborted) return;
      setState({ items: result.items, unreadCount: result.unread_count, loaded: true, loading: false, error: null });
      setSelected(new Set());
      onUnreadCountChange?.(result.unread_count);
    } catch (errorCause) {
      if (!signal.aborted) {
        let error: LoadErrorKind = 'unknown';
        if (errorCause instanceof ApiRequestError) {
          if (errorCause.status === 401) error = 'unauthenticated';
          else if (errorCause.status === 403) error = 'forbidden';
          else if (errorCause.status === 404) error = 'not-found';
          else if (errorCause.status === null || errorCause.status >= 500 || errorCause.status === 429) error = 'retryable';
        }
        setState(current => ({ ...current, loaded: true, loading: false, error }));
      }
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [open, load, retryKey]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const markRead = async (item: NotificationItem): Promise<boolean> => {
    if (item.read) return true;
    if (busy) return false;
    setBusy(true);
    setActionError(null);
    try {
      await markNotificationRead(item.id);
      const unreadCount = Math.max(0, state.unreadCount - 1);
      setState(current => {
        const items = current.items.map(candidate => candidate.id === item.id ? { ...candidate, read: true } : candidate);
        return { ...current, items, unreadCount: Math.max(0, current.unreadCount - 1) };
      });
      onUnreadCountChange?.(unreadCount);
      return true;
    } catch (errorCause) {
      setActionError(getMutationError(errorCause, '읽음 처리'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    if (state.unreadCount === 0 || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await markAllNotificationsRead();
      setState(current => ({ ...current, items: current.items.map(item => ({ ...item, read: true })), unreadCount: 0 }));
      setSelected(new Set());
      onUnreadCountChange?.(0);
    } catch (errorCause) {
      setActionError(getMutationError(errorCause, '모든 알림 읽음 처리'));
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0 || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const selectedIds = [...selected];
      const results = await Promise.allSettled(selectedIds.map(id => deleteNotification(id)));
      const deletedIds = new Set(selectedIds.filter((_, index) => results[index].status === 'fulfilled'));
      const failedIds = new Set(selectedIds.filter((_, index) => results[index].status === 'rejected'));
      const removedUnread = state.items.filter(item => deletedIds.has(item.id) && !item.read).length;
      const unreadCount = Math.max(0, state.unreadCount - removedUnread);
      setState(current => {
        const items = current.items.filter(item => !deletedIds.has(item.id));
        return { ...current, items, unreadCount: Math.max(0, current.unreadCount - removedUnread) };
      });
      onUnreadCountChange?.(unreadCount);
      setSelected(failedIds);
      if (failedIds.size > 0) {
        const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
        const failure = failures.map(result => getMutationError(result.reason, '삭제')).find(error => error.action === 'login')
          ?? failures.map(result => getMutationError(result.reason, '삭제')).find(error => error.action === 'refresh')
          ?? getMutationError(failures[0]?.reason, '삭제');
        setActionError({
          ...failure,
          message: failedIds.size === selectedIds.length
            ? failure.message
            : `일부 알림만 삭제했습니다. ${failure.message}`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const loadErrorMessage = state.error === 'unauthenticated'
    ? '로그인이 만료되었습니다. 로그인한 뒤 다시 알림을 열어 주세요.'
    : state.error === 'forbidden'
      ? '이 알림을 볼 권한이 없습니다.'
      : state.error === 'not-found'
        ? '알림을 찾을 수 없습니다.'
        : state.error === 'retryable'
          ? '알림을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
          : '알림을 불러오지 못했습니다.';

  return (
    <Panel
      id="notification-panel"
      ref={panelRef}
      $top={top}
      $right={right}
      role="dialog"
      aria-label="알림"
      aria-modal="false"
      tabIndex={-1}
    >
      <Heading>
        <TitleGroup><IconWrap><Octicon name="bell" size={24} /></IconWrap><Title>알림</Title></TitleGroup>
        <CloseButton type="button" aria-label="알림 닫기" onClick={onClose}><Octicon name="x" size={16} /></CloseButton>
      </Heading>
      <Description>
        {state.loading || !state.loaded ? '알림을 불러오는 중입니다.' : state.error ? loadErrorMessage : state.unreadCount > 0 ? `읽지 않은 알림이 ${state.unreadCount}개 있습니다. 알림을 선택하면 읽음 처리됩니다.` : '모든 알림을 읽었습니다.'}
      </Description>

      {state.loading || !state.loaded ? <LoadingCard height={132} /> : state.error ? (
        <LoadError role="alert">
          <span>{loadErrorMessage}</span>
          {state.error === 'unauthenticated' && <Button variant="secondary" onClick={() => window.location.assign('/login')}>로그인</Button>}
          {state.error === 'retryable' && <Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => setRetryKey(value => value + 1)}>다시 시도</Button>}
        </LoadError>
      ) : state.items.length === 0 ? (
        <Empty><Octicon name="check-circle" size={24} /><span>새로운 알림이 없습니다.</span></Empty>
      ) : (
        <List>
          {state.items.map(item => (
            <Row key={item.id} $unread={!item.read} $selected={selected.has(item.id)}>
              <CategoryIcon aria-hidden="true"><Octicon name={iconFor(item)} size={16} /></CategoryIcon>
              <NotificationContent>
                <NotificationButton
                  type="button"
                  $unread={!item.read}
                  disabled={busy}
                  onClick={() => void (async () => {
                    if (!(await markRead(item))) return;
                    const path = item.resource ? getNotificationResourcePath(item.resource.grn) : null;
                    if (path && onOpenResource) {
                      onClose();
                      onOpenResource(path);
                    } else if (item.resource) {
                      setActionError({ message: '알림은 읽음 처리했지만 연결된 자원 화면은 아직 제공되지 않습니다.' });
                    }
                  })()}
                  aria-label={`${item.title}${item.read ? '' : ' · 읽지 않음'}`}
                >
                  {item.title}
                </NotificationButton>
                <Time dateTime={item.created_at}>{relativeTime(item.created_at)}</Time>
              </NotificationContent>
              <RowAction
                type="button"
                aria-label={selected.has(item.id) ? `${item.title} 선택 해제` : `${item.title} 삭제 대상으로 선택`}
                aria-pressed={selected.has(item.id)}
                disabled={busy}
                onClick={() => setSelected(current => {
                  const next = new Set(current);
                  if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                  return next;
                })}
              >
                {selected.has(item.id) ? <Octicon name="check-circle" size={16} /> : item.read ? <Octicon name="trashcan" size={16} /> : <UnreadDot aria-label="읽지 않음" />}
              </RowAction>
            </Row>
          ))}
        </List>
      )}

      {actionError && (
        <InlineError role="alert">
          <span>{actionError.message}</span>
          {actionError.action === 'login' && <Button variant="secondary" onClick={() => window.location.assign('/login')}>로그인</Button>}
          {actionError.action === 'refresh' && <Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => setRetryKey(value => value + 1)}>목록 새로고침</Button>}
        </InlineError>
      )}
      {!state.loading && !state.error && state.items.length > 0 && (
        <Actions>
          <Button variant="ghost" icon={<Octicon name="trashcan" size={16} />} disabled={selected.size === 0 || busy} onClick={() => void deleteSelected()}>
            선택 알림 삭제{selected.size > 0 ? ` · ${selected.size}` : ''}
          </Button>
          <Button variant="secondary" icon={<Octicon name="check" size={16} />} disabled={state.unreadCount === 0 || busy} onClick={() => void markAllRead()}>
            모두 읽음
          </Button>
        </Actions>
      )}
    </Panel>
  );
}

function getMutationError(error: unknown, action: string): ActionError {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return { message: '로그인이 만료되었습니다. 로그인한 뒤 알림을 다시 확인해 주세요.', action: 'login' };
    if (error.status === 403) return { message: `알림 ${action} 권한이 없습니다.` };
    if (error.status === 404) return { message: '알림이 이미 삭제되었거나 찾을 수 없습니다. 목록을 새로고침해 주세요.', action: 'refresh' };
    if (error.status === null || error.status === 429 || error.status >= 500) {
      return { message: `알림 ${action} 결과를 확인하지 못했습니다. 중복 요청을 피하려면 먼저 목록을 새로고침해 주세요.`, action: 'refresh' };
    }
  }
  return { message: `알림 ${action} 요청을 완료하지 못했습니다. 목록을 새로고침해 주세요.`, action: 'refresh' };
}

import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { listNotifications } from '../../../entities/notification';
import { Button } from '../../../shared/ui/controls';
import { Octicon } from '../../../shared/ui/icons';
import { NotificationPanel } from '../../notification-panel';

const Header = styled.header`
  display: flex;
  width: 100%;
  min-height: 74px;
  flex: 0 0 74px;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[16]}px 40px;
`;

const HeaderContent = styled.div`
  display: flex;
  width: 100%;
  max-width: 1144px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
  margin: 0 auto;
`;

const HeaderStart = styled.div`
  display: flex;
  position: relative;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const ScopeSelector = styled.div`
  position: relative;
  flex: 0 0 220px;
`;

const ScopeTrigger = styled.button`
  display: inline-flex;
  width: 220px;
  height: 42px;
  flex: 0 0 220px;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const ScopeText = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ScopeMenu = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 4px);
  left: 0;
  display: flex;
  width: 220px;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 8px 24px #0005;
`;

const ScopeOption = styled.button<{ $selected: boolean }>`
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.text};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  text-align: left;
  cursor: pointer;

  &:hover { background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 1px; }
`;

const OptionLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SearchAction = styled(Button)`
  width: 520px;
  min-width: 180px;
  justify-content: flex-start;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
`;

const RightActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const ActionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Count = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

export interface StudentTopbarProps {
  scopeLabel: string;
  userName: string;
  notificationCount?: number;
  scopeOptions?: Array<{ id: string; label: string; selected: boolean; onSelect: () => void }>;
  onSelectScope: () => void;
  onSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export function StudentTopbar({
  scopeLabel,
  userName,
  notificationCount,
  scopeOptions,
  onSelectScope,
  onSearch,
  onOpenNotifications,
  onOpenProfile,
}: StudentTopbarProps) {
  const navigate = useNavigate();
  const [scopeOpen, setScopeOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notificationCount ?? 0);
  const [activeScopeIndex, setActiveScopeIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!scopeOpen || !scopeOptions?.length) return;
    const selectedIndex = scopeOptions.findIndex(option => option.selected);
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveScopeIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }, [scopeOpen, scopeOptions]);

  useEffect(() => {
    const controller = new AbortController();
    void listNotifications(controller.signal)
      .then(result => { if (!controller.signal.aborted) setUnreadCount(result.unread_count); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
    window.requestAnimationFrame(() => document.getElementById('student-notifications-trigger')?.focus());
  }, []);

  const onScopeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const optionCount = scopeOptions?.length ?? 0;
    if (event.key === 'Escape') {
      setScopeOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (!optionCount) return;
    if (!scopeOpen && event.target === triggerRef.current && event.key === 'ArrowDown') {
      event.preventDefault();
      setScopeOpen(true);
      return;
    }
    if (!scopeOpen) return;

    let nextIndex = activeScopeIndex;
    if (event.key === 'ArrowDown') nextIndex = (activeScopeIndex + 1) % optionCount;
    else if (event.key === 'ArrowUp') nextIndex = (activeScopeIndex - 1 + optionCount) % optionCount;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = optionCount - 1;
    else return;
    event.preventDefault();
    setActiveScopeIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  const onScopeBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setScopeOpen(false);
  };

  return (
    <Header>
      <HeaderContent>
        <HeaderStart>
          <ScopeSelector onBlur={onScopeBlur} onKeyDown={onScopeKeyDown}>
            <ScopeTrigger
              ref={triggerRef}
              type="button"
              aria-haspopup={scopeOptions?.length ? 'listbox' : undefined}
              aria-expanded={scopeOptions?.length ? scopeOpen : undefined}
              aria-controls={scopeOptions?.length ? 'scope-menu' : undefined}
              onClick={() => {
                onSelectScope();
                if (scopeOptions?.length) {
                  const selectedIndex = scopeOptions.findIndex(option => option.selected);
                  setActiveScopeIndex(selectedIndex >= 0 ? selectedIndex : 0);
                  setScopeOpen(value => !value);
                }
              }}
            >
              <ScopeText>{scopeLabel}</ScopeText>
              <Octicon name="chevron-down" size={16} />
            </ScopeTrigger>
            {scopeOpen && scopeOptions && scopeOptions.length > 0 && (
              <ScopeMenu id="scope-menu" role="listbox" aria-label="작업 범위 선택" aria-activedescendant={`scope-option-${activeScopeIndex}`}>
                {scopeOptions.map((option, index) => (
                  <ScopeOption
                    key={option.id}
                    id={`scope-option-${index}`}
                    ref={element => { optionRefs.current[index] = element; }}
                    type="button"
                    role="option"
                    aria-selected={option.selected}
                    tabIndex={index === activeScopeIndex ? 0 : -1}
                    $selected={option.selected}
                    onClick={() => { setScopeOpen(false); option.onSelect(); }}
                  >
                    <OptionLabel>{option.label}</OptionLabel>
                    {option.selected && <Octicon name="check" size={16} aria-hidden="true" />}
                  </ScopeOption>
                ))}
              </ScopeMenu>
            )}
          </ScopeSelector>
          <SearchAction variant="secondary" icon={<Octicon name="search" size={16} />} onClick={onSearch}>
            이름 또는 GRN으로 검색
          </SearchAction>
        </HeaderStart>
        <RightActions>
          <Button
            id="student-notifications-trigger"
            variant="ghost"
            icon={<Octicon name="bell" size={16} />}
            aria-expanded={notificationsOpen}
            aria-controls="notification-panel"
            onClick={() => {
              onOpenNotifications();
              setNotificationsOpen(open => !open);
            }}
          >
            <ActionLabel>알림{unreadCount > 0 && <Count>{unreadCount}</Count>}</ActionLabel>
          </Button>
          <Button variant="ghost" icon={<Octicon name="person" size={16} />} onClick={onOpenProfile}>
            {userName}
          </Button>
        </RightActions>
      </HeaderContent>
      <NotificationPanel
        open={notificationsOpen}
        onClose={closeNotifications}
        onUnreadCountChange={setUnreadCount}
        onOpenResource={path => navigate(path)}
      />
    </Header>
  );
}

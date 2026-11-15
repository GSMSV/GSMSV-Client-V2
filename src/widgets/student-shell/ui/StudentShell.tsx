import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { StudentSidebar, type StudentNavigationKey } from './StudentSidebar';
import { StudentTopbar } from './StudentTopbar';
import { getDemoProfile } from '../../../entities/profile';
import { isDemoMode } from '../../../shared/demo';
import { UnsavedChangesDialog } from '../../../shared/ui/feedback';

const Layout = styled.div`
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
`;

const MainColumn = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
`;

const PageContent = styled.main`
  min-width: 0;
  flex: 1;
`;

const NavigationOverlay = styled.button`
  display: none;

  @media (max-width: 960px) {
    position: fixed;
    z-index: 70;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: rgb(0 0 0 / 55%);
  }
`;

export interface StudentShellProps {
  children: ReactNode;
  activeItem: StudentNavigationKey;
  scopeLabel: string;
  teamScopeId?: string;
  userName: string;
  profilePhotoUrl?: string | null;
  notificationCount?: number;
  scopeOptions?: Array<{ id: string; label: string; selected: boolean; onSelect: () => void }>;
  scopeDisabled?: boolean;
  scopeDisabledReason?: string;
  onNavigate: (item: Exclude<StudentNavigationKey, 'none'>) => void;
  onCreateTeam: () => void;
  onOpenStatus: () => void;
  onSelectScope: () => void;
  onSearch: () => void;
  onOpenNotifications: () => void;
  hasUnsavedInput?: boolean;
  onLogoutPendingChange?: (pending: boolean) => void;
  onLogoutRequest?: () => void;
  disabledNavigationItems?: readonly StudentNavigationKey[];
  sidebarActionsAtBottom?: boolean;
  showTopbarDivider?: boolean;
}

export function StudentShell({
  children,
  activeItem,
  scopeLabel,
  teamScopeId,
  userName,
  profilePhotoUrl,
  notificationCount,
  scopeOptions,
  scopeDisabled,
  scopeDisabledReason,
  onNavigate,
  onCreateTeam,
  onOpenStatus,
  onSelectScope,
  onSearch,
  onOpenNotifications,
  hasUnsavedInput = false,
  onLogoutPendingChange,
  onLogoutRequest,
  disabledNavigationItems,
  sidebarActionsAtBottom = true,
  showTopbarDivider = false,
}: StudentShellProps) {
  const navigate = useNavigate();
  const [logoutPending, setLogoutPending] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!navigationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setNavigationOpen(false);
      window.requestAnimationFrame(() => navigationTriggerRef.current?.focus());
    };
    window.addEventListener('keydown', closeOnEscape);
    window.requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLElement>('button:not(:disabled), a[href]')?.focus());
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [navigationOpen]);

  const closeNavigation = () => {
    setNavigationOpen(false);
    window.requestAnimationFrame(() => navigationTriggerRef.current?.focus());
  };

  const requestNavigation = (action: () => void) => {
    if (logoutPending) return;
    if (hasUnsavedInput) {
      setPendingNavigation(() => action);
      return;
    }
    action();
  };

  const handleNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    requestNavigation(() => {
      closeNavigation();
      if (item === 'serverless') {
        void navigate('/serverless');
        return;
      }
      if (item === 'docs') {
        void navigate('/help');
        return;
      }
      onNavigate(item);
    });
  };

  const handleLogoutPendingChange = (pending: boolean) => {
    setLogoutPending(pending);
    onLogoutPendingChange?.(pending);
  };

  return (
    <Layout>
      <StudentSidebar
        sidebarRef={sidebarRef}
        open={navigationOpen}
        activeItem={activeItem}
        onNavigate={handleNavigate}
        onCreateTeam={() => requestNavigation(() => { closeNavigation(); onCreateTeam(); })}
        onOpenStatus={() => requestNavigation(() => { closeNavigation(); onOpenStatus(); })}
        disabledItems={disabledNavigationItems}
        actionsAtBottom={sidebarActionsAtBottom}
      />
      <MainColumn>
        <StudentTopbar
          navigationOpen={navigationOpen}
          navigationTriggerRef={navigationTriggerRef}
          onToggleNavigation={() => setNavigationOpen(open => !open)}
          scopeLabel={scopeLabel}
          teamScopeId={teamScopeId}
          userName={userName}
          profilePhotoUrl={profilePhotoUrl ?? (import.meta.env.DEV && isDemoMode() ? getDemoProfile()?.photoDataUrl : undefined)}
          notificationCount={notificationCount}
          scopeOptions={scopeOptions}
          scopeDisabled={scopeDisabled}
          scopeDisabledReason={scopeDisabledReason}
          onSelectScope={onSelectScope}
          onSearch={onSearch}
          onOpenNotifications={onOpenNotifications}
          onRequestNavigation={requestNavigation}
          onLogoutPendingChange={handleLogoutPendingChange}
          onLogoutRequest={onLogoutRequest}
          showBottomBorder={showTopbarDivider}
        />
        <PageContent>{children}</PageContent>
      </MainColumn>
      {navigationOpen && <NavigationOverlay type="button" aria-label="메뉴 닫기" onClick={closeNavigation} />}
      {pendingNavigation && (
        <UnsavedChangesDialog
          onLeave={() => {
            const action = pendingNavigation;
            setPendingNavigation(null);
            action();
          }}
          onStay={() => setPendingNavigation(null)}
        />
      )}
    </Layout>
  );
}

import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { StudentSidebar, type StudentNavigationKey } from './StudentSidebar';
import { StudentTopbar } from './StudentTopbar';
import { getDemoProfile } from '../../../entities/profile';
import { isDemoMode } from '../../../shared/demo';
import { mobileNavigationMedia, useResponsiveNavigation } from '../../../shared/ui/controls/useResponsiveNavigation';
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

  @media ${mobileNavigationMedia} {
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
  onNavigate: (item: Exclude<StudentNavigationKey, 'none'>) => boolean;
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
  onCreateTeam,
  onNavigate,
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
  const navigation = useResponsiveNavigation();
  const demoMode = isDemoMode();
  const selectedTeamId = teamScopeId ?? scopeOptions?.find(option => option.selected && option.id !== 'personal')?.id;
  const unavailableItems: StudentNavigationKey[] = [
    ...(!demoMode ? ['vm-create' as const, 'support' as const] : []),
    ...(disabledNavigationItems ?? []),
  ];

  const navigateToItem = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const teamPath = selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}` : undefined;
    const paths: Partial<Record<StudentNavigationKey, string>> = {
      home: teamPath ?? '/',
      'vm-create': selectedTeamId && demoMode
        ? `${teamPath}/vms/new`
        : demoMode ? '/vms/new' : undefined,
      serverless: '/serverless',
      database: selectedTeamId ? `/databases?owner=${encodeURIComponent(selectedTeamId)}` : '/databases',
      apps: teamPath ? `${teamPath}/apps` : '/apps',
      team: teamPath ?? '/teams',
      docs: '/help',
      support: demoMode ? '/support/inquiries' : undefined,
      settings: teamPath ? `${teamPath}/settings` : '/settings',
    };
    const path = paths[item];
    if (path) void navigate(path);
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
      navigation.close();
      if (!onNavigate(item)) navigateToItem(item);
    });
  };

  const handleLogoutPendingChange = (pending: boolean) => {
    setLogoutPending(pending);
    onLogoutPendingChange?.(pending);
  };

  return (
    <Layout>
      <StudentSidebar
        sidebarRef={navigation.sidebarRef}
        open={navigation.open}
        onKeyDown={navigation.onKeyDown}
        activeItem={activeItem}
        onNavigate={handleNavigate}
        onCreateTeam={() => requestNavigation(() => { navigation.close(); onCreateTeam(); })}
        onOpenStatus={() => requestNavigation(() => { navigation.close(); onOpenStatus(); })}
        disabledItems={unavailableItems}
        disabledReasons={{
          'vm-create': 'VM 생성은 현재 운영 환경에서 제공되지 않습니다. 로컬 데모 모드에서 확인할 수 있습니다.',
          support: '문의 화면은 현재 운영 환경에서 제공되지 않습니다. 로컬 데모 모드에서 확인할 수 있습니다.',
        }}
        actionsAtBottom={sidebarActionsAtBottom}
      />
      <MainColumn inert={navigation.open}>
        <StudentTopbar
          navigationOpen={navigation.open}
          navigationTriggerRef={navigation.triggerRef}
          onToggleNavigation={navigation.toggle}
          scopeLabel={scopeLabel}
          teamScopeId={teamScopeId}
          userName={userName}
          profilePhotoUrl={profilePhotoUrl ?? (demoMode ? getDemoProfile()?.photoDataUrl : undefined)}
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
      {navigation.open && <NavigationOverlay type="button" tabIndex={-1} aria-label="메뉴 닫기" onClick={navigation.close} />}
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

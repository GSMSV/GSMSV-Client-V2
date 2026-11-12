import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { StudentSidebar, type StudentNavigationKey } from './StudentSidebar';
import { StudentTopbar } from './StudentTopbar';

const Layout = styled.div`
  display: flex;
  min-width: 1200px;
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

export interface StudentShellProps {
  children: ReactNode;
  activeItem: StudentNavigationKey;
  scopeLabel: string;
  teamScopeId?: string;
  userName: string;
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
  disabledNavigationItems,
  sidebarActionsAtBottom = true,
  showTopbarDivider = false,
}: StudentShellProps) {
  const navigate = useNavigate();
  const [logoutPending, setLogoutPending] = useState(false);

  const handleNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item !== 'docs') {
      onNavigate(item);
      return;
    }
    if (logoutPending) return;
    if (hasUnsavedInput && !window.confirm('저장하지 않은 내용이 있습니다. 저장하지 않고 Docs로 이동할까요?')) return;
    void navigate('/help');
  };

  const handleLogoutPendingChange = (pending: boolean) => {
    setLogoutPending(pending);
    onLogoutPendingChange?.(pending);
  };

  return (
    <Layout>
      <StudentSidebar
        activeItem={activeItem}
        onNavigate={handleNavigate}
        onCreateTeam={onCreateTeam}
        onOpenStatus={onOpenStatus}
        disabledItems={disabledNavigationItems}
        actionsAtBottom={sidebarActionsAtBottom}
      />
      <MainColumn>
        <StudentTopbar
          scopeLabel={scopeLabel}
          teamScopeId={teamScopeId}
          userName={userName}
          notificationCount={notificationCount}
          scopeOptions={scopeOptions}
          scopeDisabled={scopeDisabled}
          scopeDisabledReason={scopeDisabledReason}
          onSelectScope={onSelectScope}
          onSearch={onSearch}
          onOpenNotifications={onOpenNotifications}
          hasUnsavedInput={hasUnsavedInput}
          onLogoutPendingChange={handleLogoutPendingChange}
          showBottomBorder={showTopbarDivider}
        />
        <PageContent>{children}</PageContent>
      </MainColumn>
    </Layout>
  );
}

import type { ReactNode } from 'react';
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
  userName: string;
  notificationCount?: number;
  scopeOptions?: Array<{ id: string; label: string; selected: boolean; onSelect: () => void }>;
  onNavigate: (item: Exclude<StudentNavigationKey, 'none'>) => void;
  onCreateTeam: () => void;
  onOpenStatus: () => void;
  onSelectScope: () => void;
  onSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export function StudentShell({
  children,
  activeItem,
  scopeLabel,
  userName,
  notificationCount,
  scopeOptions,
  onNavigate,
  onCreateTeam,
  onOpenStatus,
  onSelectScope,
  onSearch,
  onOpenNotifications,
  onOpenProfile,
}: StudentShellProps) {
  return (
    <Layout>
      <StudentSidebar
        activeItem={activeItem}
        onNavigate={onNavigate}
        onCreateTeam={onCreateTeam}
        onOpenStatus={onOpenStatus}
      />
      <MainColumn>
        <StudentTopbar
          scopeLabel={scopeLabel}
          userName={userName}
          notificationCount={notificationCount}
          scopeOptions={scopeOptions}
          onSelectScope={onSelectScope}
          onSearch={onSearch}
          onOpenNotifications={onOpenNotifications}
          onOpenProfile={onOpenProfile}
        />
        <PageContent>{children}</PageContent>
      </MainColumn>
    </Layout>
  );
}

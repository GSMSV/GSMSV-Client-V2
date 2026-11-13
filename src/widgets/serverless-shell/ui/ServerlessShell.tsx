import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { getSessionUser } from '../../../entities/session';
import type { StudentNavigationKey } from '../../student-shell';
import { StudentShell } from '../../student-shell';

export function ServerlessShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = getSessionUser();

  const onNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home') void navigate('/');
    if (item === 'database') void navigate('/databases');
    if (item === 'apps') void navigate('/apps');
    if (item === 'team') void navigate('/teams');
    if (item === 'settings') void navigate('/settings');
  };

  return (
    <StudentShell
      activeItem="serverless"
      scopeLabel="내 Resources"
      userName={user?.name ?? '사용자'}
      onNavigate={onNavigate}
      onCreateTeam={() => void navigate('/teams/new')}
      onOpenStatus={() => void navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      {children}
    </StudentShell>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { getSessionUser } from '../../../entities/session';
import type { TeamSummary } from '../../../entities/team';
import { isDemoMode } from '../../../shared/demo';
import type { StudentNavigationKey } from '../../student-shell';
import { StudentShell } from '../../student-shell';

export function ServerlessShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  useEffect(() => {
    if (!(import.meta.env.DEV && isDemoMode())) {
      setTeams([]);
      return;
    }
    let cancelled = false;
    void import('../../../entities/team/demo').then(({ listDemoTeams }) => {
      if (!cancelled) setTeams(listDemoTeams());
    });
    return () => { cancelled = true; };
  }, []);
  const scopeOptions = [
    { id: 'personal', label: '내 Resources', selected: true, onSelect: () => void navigate('/') },
    ...teams.map(team => ({
      id: team.id,
      label: `${team.name} · ${team.my_role === 'leader' ? '팀장' : team.my_role === 'devops' ? 'DevOps' : '멤버'}`,
      selected: false,
      onSelect: () => void navigate(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ];

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
      scopeOptions={scopeOptions}
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

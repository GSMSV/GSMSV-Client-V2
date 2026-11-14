import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { getSessionUser } from '../../../entities/session';
import { listDemoTeams } from '../../../entities/team/demo';
import type { StudentNavigationKey } from '../../student-shell';
import { StudentShell } from '../../student-shell';

export function ServerlessShell({ children, teamScopeId }: { children: ReactNode; teamScopeId?: string }) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const teams = listDemoTeams();
  const currentTeam = teams.find(team => team.id === teamScopeId);
  const roleLabel = (role: 'leader' | 'devops' | 'member') => role === 'leader' ? '팀장' : role === 'devops' ? 'DevOps' : '멤버';
  const currentTeamLabel = currentTeam
    ? `${currentTeam.name} · ${roleLabel(currentTeam.my_role)}`
    : teamScopeId ? '팀 Resources · 팀' : '내 Resources';
  const scopeOptions = [
    { id: 'personal', label: '내 Resources', selected: !teamScopeId, onSelect: () => void navigate('/') },
    ...teams.map(team => ({
      id: team.id,
      label: `${team.name} · ${roleLabel(team.my_role)}`,
      selected: team.id === teamScopeId,
      onSelect: () => void navigate(`/teams/${encodeURIComponent(team.id)}`),
    })),
    ...(teamScopeId && !teams.some(team => team.id === teamScopeId)
      ? [{ id: teamScopeId, label: currentTeamLabel, selected: true, onSelect: () => void navigate(`/teams/${encodeURIComponent(teamScopeId)}`) }]
      : []),
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
      scopeLabel={currentTeamLabel}
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

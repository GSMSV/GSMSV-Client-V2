import { listDemoTeams } from '../../entities/team/demo';
import type { AppOwner } from '../../entities/app';

export function demoAppScopeOptions(owner: AppOwner | undefined, navigate: (path: string) => void) {
  const currentTeamId = owner?.type === 'team' ? owner.id : undefined;
  const teams = listDemoTeams().map(team => ({
    id: team.id,
    label: `${team.name} · ${team.my_role === 'leader' ? '팀장' : team.my_role === 'devops' ? 'DevOps' : '멤버'}`,
  }));

  if (owner?.type === 'team' && !teams.some(team => team.id === owner.id)) {
    teams.push({ id: owner.id, label: `${owner.name} · 팀` });
  }

  return [
    { id: 'personal', label: '내 Resources', selected: !currentTeamId, onSelect: () => navigate('/apps') },
    ...teams.map(team => ({
      ...team,
      selected: team.id === currentTeamId,
      onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}/apps`),
    })),
  ];
}

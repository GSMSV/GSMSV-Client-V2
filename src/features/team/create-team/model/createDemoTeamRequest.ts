import { getDemoTeamRequests, saveDemoTeamRequests, type TeamRequest } from '../../../../entities/demo-workflows';
import { createDemoTeam } from '../../../../entities/team/demo';

export function createDemoTeamRequest(name: string, purpose: string) {
  const team = createDemoTeam(name);
  const requests = getDemoTeamRequests();
  const request: TeamRequest = {
    id: `team-request-${team.id}`,
    teamId: team.id,
    name: team.name,
    leader: '김민수 · 2107',
    members: team.member_count,
    purpose: purpose.trim(),
    requestedAt: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short' }).format(new Date()),
    status: '검토 중',
    tier: '소형',
    vcpu: 4,
    ram: 8,
    ssd: 60,
    rejectReason: '',
  };
  saveDemoTeamRequests([request, ...requests]);
  return team;
}

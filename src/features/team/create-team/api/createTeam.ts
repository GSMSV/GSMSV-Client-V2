import { requestJson } from '../../../../shared/api';

export interface CreateTeamResponse {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  my_role: 'leader' | 'devops' | 'member';
  created_at: string;
}

export function createTeam(name: string, signal?: AbortSignal) {
  return requestJson<CreateTeamResponse>('/api/v2/teams', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
    signal,
  });
}

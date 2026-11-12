import { requestJson } from '../../../../shared/api';

export interface CreatedTeamApp {
  grn: string;
}

export function createTeamApp(teamId: string, name: string, signal?: AbortSignal) {
  if (!teamId.trim()) throw new TypeError('Team id is required');
  return requestJson<CreatedTeamApp>(`/api/v2/teams/${encodeURIComponent(teamId)}/apps`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    signal,
  });
}

import { requestJson } from '../../../shared/api';
import type { TeamDetail } from '../model/types';

export function getTeam(teamId: string, signal?: AbortSignal) {
  return requestJson<TeamDetail>(`/api/v2/teams/${encodeURIComponent(teamId)}`, { signal });
}

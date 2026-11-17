import { requestJson, requestNoContent } from '../../../../shared/api';

export interface TeamInvitation {
  id: string;
  email: string;
  sent_at: string;
  expires_at: string;
}

interface TeamInvitationPage {
  items: TeamInvitation[];
  next_cursor: string | null;
}

const PAGE_LIMIT = 100;

export async function listTeamInvitations(teamId: string, signal?: AbortSignal): Promise<TeamInvitation[]> {
  const items: TeamInvitation[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });
    if (cursor) params.set('cursor', cursor);
    const page = await requestJson<TeamInvitationPage>(
      `/api/v2/teams/${encodeURIComponent(teamId)}/invitations?${params}`,
      { signal },
    );
    items.push(...page.items);
    cursor = page.next_cursor;
    if (cursor && seenCursors.has(cursor)) throw new Error('Invitation list returned a repeated cursor');
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return items;
}

export function inviteTeamMember(teamId: string, email: string, signal?: AbortSignal) {
  return requestJson<{ message: string }>(`/api/v2/teams/${encodeURIComponent(teamId)}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    signal,
  });
}

/** 서버는 204로 답한다. 공통 요청 함수를 써서 401 갱신 재시도와 오류 code 처리를 함께 받는다. */
export function cancelTeamInvitation(teamId: string, invitationId: string, signal?: AbortSignal): Promise<void> {
  return requestNoContent(
    `/api/v2/teams/${encodeURIComponent(teamId)}/invitations/${encodeURIComponent(invitationId)}`,
    { method: 'DELETE', signal },
  );
}

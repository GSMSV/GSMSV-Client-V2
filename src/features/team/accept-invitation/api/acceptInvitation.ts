import { ApiRequestError, requestJson } from '../../../../shared/api';

export interface AcceptInvitationResponse {
  team: {
    id: string;
    name: string;
  };
  my_role: 'member';
}

export async function acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
  return requestJson<AcceptInvitationResponse>('/api/v2/invitations/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

export function getInvitationAcceptanceError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return '초대를 수락하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  if (error.status === 401) {
    return '로그인이 필요합니다. 학교 계정으로 로그인해 주세요.';
  }

  if (error.status === 403 && error.code === 'INVITATION_EMAIL_MISMATCH') {
    return '초대받은 학교 계정으로 로그인해 주세요. 현재 계정은 초대 대상과 다릅니다.';
  }

  if (error.status === 409 && error.code === 'ALREADY_MEMBER') {
    return '이미 팀에 참여 중인 계정입니다.';
  }

  if (error.status === 410 && error.code === 'GONE') {
    return '이 초대는 만료되었거나 이미 사용 또는 취소되었습니다.';
  }

  return '초대를 수락하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

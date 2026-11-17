import { ApiRequestError, requestJson } from '../../../../shared/api';

export interface LoginExchangeResponse {
  user: {
    id: string;
    name: string;
    role: 'user' | 'admin';
  };
  redirect: string;
}

export type LoginExchangeFailureKind = 'expired' | 'failed';

export class LoginExchangeFailure extends Error {
  constructor(readonly kind: LoginExchangeFailureKind, readonly requestId?: string) {
    super(kind === 'expired' ? 'Login code expired' : 'Login code exchange failed');
    this.name = 'LoginExchangeFailure';
  }
}

export async function exchangeLoginCode(code: string): Promise<LoginExchangeResponse> {
  try {
    return await requestJson<LoginExchangeResponse>('/api/v2/auth/token-exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  } catch (error) {
    throw new LoginExchangeFailure(
      error instanceof ApiRequestError && error.status === 410 ? 'expired' : 'failed',
      error instanceof ApiRequestError ? error.requestId : undefined,
    );
  }
}

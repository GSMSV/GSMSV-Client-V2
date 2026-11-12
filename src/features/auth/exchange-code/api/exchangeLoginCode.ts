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
  constructor(readonly kind: LoginExchangeFailureKind) {
    super(kind === 'expired' ? 'Login code expired' : 'Login code exchange failed');
    this.name = 'LoginExchangeFailure';
  }
}

export async function exchangeLoginCode(code: string): Promise<LoginExchangeResponse> {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/+$/, '') ?? '';
  let response: Response;

  try {
    response = await fetch(`${apiOrigin}/api/v2/auth/token-exchange`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  } catch {
    throw new LoginExchangeFailure('failed');
  }

  if (response.status === 410) {
    throw new LoginExchangeFailure('expired');
  }

  if (!response.ok) {
    throw new LoginExchangeFailure('failed');
  }

  try {
    return (await response.json()) as LoginExchangeResponse;
  } catch {
    throw new LoginExchangeFailure('failed');
  }
}

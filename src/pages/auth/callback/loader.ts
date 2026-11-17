import { redirect, type LoaderFunctionArgs } from 'react-router';
import { saveSessionUser } from '../../../entities/session';
import { exchangeLoginCode, LoginExchangeFailure } from '../../../features/auth/exchange-code/api/exchangeLoginCode';

export async function loginCallbackLoader({ request }: LoaderFunctionArgs) {
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get('code');

  if (!code) {
    return redirect('/login?error=OAUTH_EXCHANGE_FAILED');
  }

  try {
    const result = await exchangeLoginCode(code);
    saveSessionUser(result.user);
    return redirect(getSafeRedirect(result.redirect));
  } catch (error) {
    const errorCode = error instanceof LoginExchangeFailure && error.kind === 'expired'
      ? 'GONE'
      : 'OAUTH_EXCHANGE_FAILED';

    return redirect(`/login?error=${errorCode}`);
  }
}

function getSafeRedirect(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return '/';
  }

  return path;
}

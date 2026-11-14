import { Navigate, Outlet, useLocation } from 'react-router';
import { getDemoProfile } from '../../entities/profile';
import { getSessionUser } from '../../entities/session';

export default function DemoSessionGate() {
  const { pathname } = useLocation();
  const profile = getDemoProfile();
  const canVisitSignedOut = pathname === '/login'
    || pathname === '/__demo'
    || pathname === '/docs'
    || pathname === '/status'
    || pathname === '/__design-system'
    || (pathname === '/settings' && profile?.accountDeleted)
    || (pathname.startsWith('/admin/') && getSessionUser()?.id === 'demo-admin');

  if (profile?.signedOut && !canVisitSignedOut) return <Navigate to="/login" replace />;
  return <Outlet />;
}

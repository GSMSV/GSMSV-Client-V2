import { Navigate, Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { getDemoProfile } from '../../entities/profile';
import { getSessionUser } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';

export default function DemoSessionGate() {
  const location = useLocation();
  const { pathname } = location;
  const [, refreshSession] = useState(0);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === 'gsmsv.demo.state.v1.profile' || event.key === null) refreshSession(value => value + 1);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  if (!isDemoMode()) return <Outlet />;

  const profile = getDemoProfile();
  const canVisitSignedOut = pathname === '/login'
    || pathname === '/__demo/role-selection'
    || pathname === '/docs'
    || pathname === '/status'
    || pathname.startsWith('/public/')
    || pathname === '/__design-system'
    || (pathname === '/settings' && profile?.accountDeleted)
    || (pathname.startsWith('/admin/') && getSessionUser()?.id === 'demo-admin');

  if (profile?.signedOut && !canVisitSignedOut) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <Outlet />;
}

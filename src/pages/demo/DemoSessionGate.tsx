import { Navigate, Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { getDemoProfile } from '../../entities/profile';
import { getSessionUser } from '../../entities/session';

export default function DemoSessionGate() {
  const { pathname } = useLocation();
  const [, refreshSession] = useState(0);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === 'gsmsv.demo.state.v1.profile' || event.key === null) refreshSession(value => value + 1);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
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

import { getDemoProfile } from '../../../entities/profile';
import { getSessionUser } from '../../../entities/session';
import { isDemoMode, startDemoSession } from './demoMode';

export function ensureWorkspaceSession(pathname: string): void {
  if (!isDemoMode() || getSessionUser()) return;
  if (pathname === '/login' || pathname === '/__demo/role-selection' || pathname.startsWith('/admin')) return;
  if (getDemoProfile()?.signedOut) return;
  startDemoSession('user');
}

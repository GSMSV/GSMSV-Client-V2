import type { SessionUserRole } from '../../../../entities/session';
import { resumeDemoProfile } from '../../../../entities/profile';
import { isDemoMode, startDemoSession } from '../../../../shared/demo';

const lastRoleKey = 'gsmsv.demo.last-role.v1';

export function getLastUsedDemoRole(): SessionUserRole {
  try {
    return window.localStorage.getItem(lastRoleKey) === 'admin' ? 'admin' : 'user';
  } catch {
    return 'user';
  }
}

export function selectDemoRole(role: SessionUserRole): string | null {
  if (!isDemoMode()) return null;
  if (role === 'user' && !resumeDemoProfile()) return null;
  if (!startDemoSession(role)) return null;

  try {
    window.localStorage.setItem(lastRoleKey, role);
  } catch {
    // Keep the selected role usable when browser storage is unavailable.
  }

  return role === 'admin' ? '/admin/infra' : '/';
}

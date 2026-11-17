import type { SessionUserRole } from '../../../../entities/session';
import { getDemoProfile, resumeDemoProfile } from '../../../../entities/profile';
import { getDemoAccountRecords, saveDemoAccounts, type DemoAccount } from '../../../../entities/demo-workflows';
import { isDemoFixtureMode, isDemoMode, startDemoSession } from '../../../../shared/demo';

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

  if (!isDemoFixtureMode()) {
    const accounts = getDemoAccountRecords();
    const id = role === 'admin' ? 'demo-admin' : 'demo-student';
    if (!accounts.some(account => account.id === id)) {
      const profile = getDemoProfile();
      const account: DemoAccount = role === 'admin'
        ? { id, name: '관리자', studentId: '—', email: '', role: '관리자', team: '—', github: '연결 안 됨', discord: '연결 안 됨' }
        : { id, name: profile?.name ?? '사용자', studentId: profile ? `${profile.grade}${profile.classNumber}${String(profile.studentNumber).padStart(2, '0')}` : '—', email: profile?.email ?? '', role: '일반 사용자', team: profile?.teamName ?? '—', github: profile?.github ?? '연결 안 됨', discord: profile?.discordConnected ? '연결됨' : '연결 안 됨' };
      saveDemoAccounts([...accounts, account]);
    }
  }

  try {
    window.localStorage.setItem(lastRoleKey, role);
  } catch {
    // Keep the selected role usable when browser storage is unavailable.
  }

  return role === 'admin' ? '/admin/infra' : '/';
}

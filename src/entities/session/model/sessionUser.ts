export type SessionUserRole = 'user' | 'admin';

export interface SessionUser {
  id: string;
  name: string;
  role: SessionUserRole;
}

const sessionUserKey = 'gsmsv.session.user';

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && (candidate.role === 'user' || candidate.role === 'admin');
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(sessionUserKey);
    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    if (isSessionUser(parsed)) {
      return parsed;
    }

    window.sessionStorage.removeItem(sessionUserKey);
  } catch {
    return null;
  }

  return null;
}

export function saveSessionUser(user: SessionUser) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(sessionUserKey, JSON.stringify(user));
  } catch {
    // Session storage may be unavailable; the HttpOnly auth cookies remain authoritative.
  }
}

export function clearSessionUser() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(sessionUserKey);
  } catch {
    // Clearing display metadata must not interfere with server-side logout.
  }
}

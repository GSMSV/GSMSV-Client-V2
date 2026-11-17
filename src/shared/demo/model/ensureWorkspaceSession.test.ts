import { afterEach, describe, expect, it } from 'vitest';
import { getSessionUser } from '../../../entities/session';
import { writeDemoState } from './demoMode';
import { ensureWorkspaceSession } from './ensureWorkspaceSession';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
}

function visit() {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { search: '' }, localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() },
  });
}

afterEach(() => { Reflect.deleteProperty(globalThis, 'window'); });

describe('default workspace session', () => {
  it('prepares a student session before opening the ordinary home page', () => {
    visit();
    expect(getSessionUser()).toBeNull();
    ensureWorkspaceSession('/');
    expect(getSessionUser()).toMatchObject({ id: 'demo-student', role: 'user' });
  });

  it('preserves a signed-out profile for the login flow', () => {
    visit();
    expect(writeDemoState('profile', { signedOut: true })).toBe(true);
    ensureWorkspaceSession('/vms/new');
    expect(getSessionUser()).toBeNull();
  });

  it('leaves direct role selection available', () => {
    visit();
    ensureWorkspaceSession('/__demo/role-selection');
    expect(getSessionUser()).toBeNull();
  });
});

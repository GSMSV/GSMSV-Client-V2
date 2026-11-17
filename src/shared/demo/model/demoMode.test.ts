import { afterEach, describe, expect, it } from 'vitest';
import { isDemoFixtureMode, isDemoMode, readDemoState, resetDemoState, writeDemoState } from './demoMode';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
}

function visit(search: string, storage = new MemoryStorage()) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { search }, localStorage: storage },
  });
  return storage;
}

afterEach(() => { Reflect.deleteProperty(globalThis, 'window'); });

describe('demo workspace mode', () => {
  it('starts with a clean workspace while keeping Figma fixtures explicit', () => {
    const storage = visit('?demo=1');
    expect(isDemoMode()).toBe(true);
    expect(isDemoFixtureMode()).toBe(false);
    expect(readDemoState('vms', [] as string[])).toEqual([]);

    visit('?demo=fixture', storage);
    expect(isDemoFixtureMode()).toBe(true);
    expect(readDemoState('vms', ['figma-vm'])).toEqual(['figma-vm']);
  });

  it('persists user records separately from fixtures and clears them on reset', () => {
    const storage = visit('?demo=1');
    expect(writeDemoState('vms', ['user-vm'])).toBe(true);
    expect(readDemoState('vms', [] as string[])).toEqual(['user-vm']);

    visit('?demo=fixture', storage);
    expect(readDemoState('vms', ['figma-vm'])).toEqual(['figma-vm']);

    visit('?demo=1', storage);
    resetDemoState();
    expect(readDemoState('vms', [] as string[])).toEqual([]);
  });
});

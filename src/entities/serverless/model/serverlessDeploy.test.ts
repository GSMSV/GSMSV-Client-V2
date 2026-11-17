import { afterEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { writeDemoState } from '../../../shared/demo';
import { executeDemoServerlessTest, getDemoServerlessState, loadDemoServerlessState, setDemoServerlessActive, type DemoServerlessFunction } from './demoServerless';

const factory = new IDBFactory();

function visitWorkspace() {
  // 저장소 모듈이 IndexedDB 연결을 재사용하므로 초기화 세대를 바꿔 매번 새 상태에서 시작한다.
  const data = new Map<string, string>([['gsmsv.demo.reset.generation', crypto.randomUUID()]]);
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: { search: '?demo=1' },
      indexedDB: factory,
      addEventListener: () => undefined,
      dispatchEvent: () => true,
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
        removeItem: (key: string) => { data.delete(key); },
        key: (index: number) => [...data.keys()][index] ?? null,
        get length() { return data.size; },
      },
    },
  });
}

afterEach(() => { Reflect.deleteProperty(globalThis, 'window'); });

const base = (id: string, extra: Partial<DemoServerlessFunction>): DemoServerlessFunction => ({
  id, name: id, description: '', runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128, code: 'export default async () => new Response("ok")',
  active: false, expiresAt: '2026. 12. 1.', variables: [], triggers: [], versions: [], runs: [], testResult: null, ...extra,
});

describe('serverless deploy placement and python honesty', () => {
  it('places legacy active functions, refuses to deploy when VMs 5~7 are full, and frees a VM on deactivate', async () => {
    visitWorkspace();
    const teamFunctions = Array.from({ length: 6 }, (_, index) => base(`team-${index}`, { active: true, teamId: 'team' }));
    writeDemoState('serverless.functions', { dailyLimit: 10_000, executionsToday: 0, sequence: 0, functions: [base('mine', {}), ...teamFunctions] });
    const loaded = await loadDemoServerlessState();
    expect(loaded.functions.filter(fn => fn.active).map(fn => fn.vmSlot).sort()).toEqual([4, 4, 5, 5, 6, 6]);

    expect(await setDemoServerlessActive('mine', true)).toBe('vm-full');
    expect(getDemoServerlessState().functions.find(fn => fn.id === 'mine')).toMatchObject({ active: false });

    expect(await setDemoServerlessActive('team-1', false)).toBe('ok');
    expect(await setDemoServerlessActive('mine', true)).toBe('ok');
    const state = getDemoServerlessState();
    expect(state.functions.find(fn => fn.id === 'mine')).toMatchObject({ active: true, vmSlot: 5 });
    expect(state.functions.find(fn => fn.id === 'team-1')?.vmSlot).toBeUndefined();
  });

  it('does not pretend to run Python functions', async () => {
    visitWorkspace();
    writeDemoState('serverless.functions', { dailyLimit: 10_000, executionsToday: 0, sequence: 0, functions: [base('py', { runtime: 'python', code: 'def handler(request, env):\n    return {}', active: true })] });
    const execution = await executeDemoServerlessTest('py', '{}');
    expect(execution).toMatchObject({ kind: 'runtime-error', error: { message: expect.stringContaining('실행하지 않았습니다') } });
    const state = getDemoServerlessState();
    expect(state.executionsToday).toBe(0);
    expect(state.functions[0].testResult).toBeNull();
    expect(state.functions[0].runs[0]).toMatchObject({ result: 'failure' });
  });
});

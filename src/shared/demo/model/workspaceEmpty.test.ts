import { afterEach, describe, expect, it } from 'vitest';
import { indexedDB } from 'fake-indexeddb';
import { getDemoVmDraft, getDemoVmState, isDemoVmSharedPoolBlocked, makeDemoVm, removeDemoVm, resetDemoVmDraft, saveDemoVmState } from '../../../entities/vm/model/demoVmStore';
import { demoVmPoolSize } from '../../../entities/vm/model/demoSshSlots';
import { createDemoServerlessFunction, extendDemoServerlessFunction, getDemoServerlessState, loadDemoServerlessState } from '../../../entities/serverless/model/demoServerless';
import { getDemoDatabaseState } from '../../../entities/database/model/demoDatabase';
import { addDemoApp, demoPersonalAppOwner, getDemoAppSummaries, getDemoApps } from '../../../entities/app/model/demoAppState';
import { getDemoProfile } from '../../../entities/profile/model/demoProfile';
import { isDemoWorkspaceFirstVisit } from '../../../entities/home/model/demoHome';
import { selectDemoRole } from '../../../features/auth/select-demo-role/model/selectDemoRole';
import { getDemoAccountRecords, getDemoAccounts } from '../../../entities/demo-workflows/model/demoData';
import { listDemoTeams } from '../../../entities/team/demo';
import { findDemoStudentAccount, getDemoTeam, setDemoTeamApproval } from '../../../entities/team/demo';
import { createDemoTeamRequest } from '../../../features/team/create-team/model/createDemoTeamRequest';
import { getDefaultDemoAppSourceDraft, getDemoInstalledRepositories, installDemoRepository } from '../../../features/apps/createDemoAppDraft';
import { getDemoInquiries, getDemoDbRequests, getDemoTeamRequests, getDemoAdminVms, getDemoAdminGrantCandidates } from '../../../entities/demo-workflows/model/demoData';
import { getDemoInfraSnapshot, setDemoAdminVmPower } from '../../../entities/infra-node/demo';
import { listNotifications } from '../../../entities/notification/api/notifications';

function visitWorkspace() {
  const data = new Map<string, string>();
  const session = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: { search: '?demo=1' },
      indexedDB,
      addEventListener: () => undefined,
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
        removeItem: (key: string) => { data.delete(key); },
        key: (index: number) => [...data.keys()][index] ?? null,
        get length() { return data.size; },
      },
      sessionStorage: {
        getItem: (key: string) => session.get(key) ?? null,
        setItem: (key: string, value: string) => { session.set(key, value); },
        removeItem: (key: string) => { session.delete(key); },
      },
      dispatchEvent: () => true,
    },
  });
}

afterEach(() => { Reflect.deleteProperty(globalThis, 'window'); });

describe('fresh interactive workspace', () => {
  it('starts VM drafts without example names or purposes and resets them the same way', () => {
    visitWorkspace();
    expect(getDemoVmDraft('personal')).toMatchObject({ name: '', purpose: '' });
    expect(getDemoVmDraft('team', 'my-team')).toMatchObject({ name: '', purpose: '' });
    resetDemoVmDraft('personal');
    expect(getDemoVmDraft('personal')).toMatchObject({ name: '', purpose: '' });
  });
  it('has no precreated personal or team resources or requests', async () => {
    visitWorkspace();
    expect(getDemoVmState().vms).toEqual([]);
    expect(isDemoVmSharedPoolBlocked(getDemoVmState(), 2)).toBe(false);
    expect(getDemoServerlessState().functions).toEqual([]);
    expect(getDemoDatabaseState().databases).toEqual([]);
    expect(getDemoApps()).toEqual([]);
    expect(getDemoProfile()?.github).toBeNull();
    expect(getDemoProfile()?.cliDevices).toEqual([]);
    expect(listDemoTeams()).toEqual([]);
    expect(getDemoInquiries()).toEqual([]);
    expect(getDemoDbRequests()).toEqual([]);
    expect(getDemoTeamRequests()).toEqual([]);
    expect(getDemoAdminVms()).toEqual([]);
    expect(getDemoAdminGrantCandidates()).toEqual([]);
    expect(getDemoInfraSnapshot().resources).toEqual([]);
    expect((await listNotifications()).items).toEqual([]);
  });

  it('reserves the shared VM pool without fabricating SSH access', () => {
    visitWorkspace();
    const draft = { name: 'my-vm', purpose: 'test', cpu: 1, memory: 1, disk: 10, os: 'Linux Ubuntu 22.04 LTS' as const };
    let state = getDemoVmState();
    for (let slot = 0; slot < demoVmPoolSize; slot += 1) {
      const created = makeDemoVm(state, { ...draft, name: `my-vm-${slot}` }, 'personal');
      expect(created.vm.sshSlot).toBe(slot);
      expect(created.vm.sshPort).toBe(0);
      expect(created.vm.password).toBe('');
      state = created.state;
    }
    expect(() => makeDemoVm(state, draft, 'personal')).toThrow('준비된 VM 9개');
  });

  it('shows the assigned SSH port and display password after VM setup', () => {
    visitWorkspace();
    const draft = { name: 'my-vm', purpose: 'test', cpu: 1, memory: 1, disk: 10, os: 'Linux Ubuntu 22.04 LTS' as const };
    const created = makeDemoVm(getDemoVmState(), draft, 'personal');
    created.vm.requestedAtMs = Date.now() - 30_000;
    expect(saveDemoVmState(created.state)).toBe(true);
    const ready = getDemoVmState().vms[0];
    expect(ready.sshPort).toBe(21141);
    expect(ready.sshUser).toBe('ubuntu');
    expect(ready.internalIp).toBe('');
    expect(ready.password).toBeTruthy();
    expect(getDemoInfraSnapshot().vmDetails[ready.grn].initialPassword).toBe(ready.password);
  });

  it('reuses a VM slot only after that VM is deleted', () => {
    visitWorkspace();
    const draft = { name: 'vm', purpose: 'test', cpu: 1, memory: 1, disk: 10, os: 'Linux Ubuntu 22.04 LTS' as const };
    const first = makeDemoVm(getDemoVmState(), draft, 'personal');
    const second = makeDemoVm(first.state, { ...draft, name: 'vm-2' }, 'personal');
    expect(second.vm.sshSlot).toBe(1);
    const deleted = removeDemoVm(second.state, first.vm);
    const replacement = makeDemoVm(deleted, { ...draft, name: 'vm-3' }, 'personal');
    expect(replacement.vm.sshSlot).toBe(0);
  });

  it('shows a user-created VM in the admin inventory', () => {
    visitWorkspace();
    const state = getDemoVmState();
    const created = makeDemoVm(state, { name: 'my-vm', purpose: 'study', cpu: 1, memory: 1, disk: 10, os: 'Linux Ubuntu 22.04 LTS' }, 'personal');
    expect(saveDemoVmState(created.state)).toBe(true);
    expect(getDemoInfraSnapshot().resources.map(vm => vm.name)).toEqual(['my-vm']);
    expect(getDemoAdminVms().map(vm => vm.name)).toEqual(['my-vm']);
    expect(setDemoAdminVmPower(created.vm.grn, 'running')).toBe(true);
    expect(getDemoVmState().vms.find(vm => vm.id === created.vm.id)?.status).toBe('running');
    expect(getDemoInfraSnapshot().resources[0].power_state).toBe('running');
  });

  it('carries a user-created team from request to admin approval', () => {
    visitWorkspace();
    const team = createDemoTeamRequest('영상제작팀', '영상 서비스 운영');
    expect(getDemoTeamRequests().map(request => request.teamId)).toContain(team.id);
    expect(getDemoTeam(team.id)?.status).toBe('pending');
    expect(setDemoTeamApproval(team.id, 'approved')).toBe(true);
    expect(getDemoTeam(team.id)?.status).toBe('approved');
    expect(listDemoTeams().map(item => item.name)).toContain('영상제작팀');
    expect(getDemoProfile()?.teamName).toBe('영상제작팀');
    expect(findDemoStudentAccount('guest@example.com')?.email).toBe('guest@example.com');
    expect(findDemoStudentAccount('bad-address')).toBeUndefined();
  });

  it('starts without a GitHub repository and accepts the one the user enters', () => {
    visitWorkspace();
    expect(getDemoInstalledRepositories()).toEqual([]);
    expect(getDefaultDemoAppSourceDraft().repository).toBe('');
    expect(installDemoRepository('my-account/video-service')).toBe(true);
    expect(getDemoInstalledRepositories()).toEqual(['my-account/video-service']);
  });

  it('shows a user-created app with its actual creation date', () => {
    visitWorkspace();
    const id = addDemoApp({
      name: 'video-service', repository: 'my-account/video-service', branch: 'main', sourceType: 'github', folder: '/', owner: demoPersonalAppOwner,
      service: { name: 'web', type: '웹', subdomain: 'video-service', memoryMb: 256, cpu: 0.25 },
    });
    expect(id).toBeTruthy();
    const summary = getDemoAppSummaries(demoPersonalAppOwner).find(app => app.id === id)!;
    expect(Math.abs(Date.parse(summary.created_at) - Date.now())).toBeLessThan(60_000);
    expect(isDemoWorkspaceFirstVisit()).toBe(false);
  });

  it('adds only identities chosen in the role selector to admin accounts', () => {
    visitWorkspace();
    expect(getDemoAccountRecords()).toEqual([]);
    expect(selectDemoRole('user')).toBe('/');
    expect(getDemoAccountRecords().map(account => account.id)).toEqual(['demo-student']);
    expect(selectDemoRole('admin')).toBe('/admin/infra');
    expect(getDemoAccountRecords().map(account => account.id)).toEqual(['demo-student', 'demo-admin']);
    const team = createDemoTeamRequest('영상제작팀', '영상 서비스 운영');
    expect(getDemoAccounts().find(account => account.id === 'demo-student')?.team).toContain(team.name);
  });

  it('uses current dates for a newly created and extended function', async () => {
    visitWorkspace();
    const id = await createDemoServerlessFunction({ name: 'my-api', description: '', runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128, code: 'export default () => 1' });
    const initial = getDemoServerlessState().functions.find(fn => fn.id === id)!;
    expect(initial.expiresAt).toMatch(/^\d{4}\. \d{1,2}\. \d{1,2}\.$/);
    expect(initial.expiresAt).not.toBe('생성 후 7일');
    await extendDemoServerlessFunction(id);
    const extended = getDemoServerlessState().functions.find(fn => fn.id === id)!;
    expect(extended.expiresAt).not.toBe('2026. 10. 20.');
    expect(extended.expiresAt).not.toBe(initial.expiresAt);
  });

  it('keeps IndexedDB function data separate between workspace and fixture', async () => {
    visitWorkspace();
    const id = await createDemoServerlessFunction({ name: 'workspace-api', description: '', runtime: 'javascript', timeoutSeconds: 30, memoryMb: 128, code: 'export default () => 1' });
    window.location.search = '?demo=fixture';
    const fixture = await loadDemoServerlessState();
    expect(fixture.functions.some(fn => fn.id === 'welcome-api')).toBe(true);
    expect(fixture.functions.some(fn => fn.id === id)).toBe(false);
    window.location.search = '?demo=1';
    const restored = await loadDemoServerlessState();
    expect(restored.functions.some(fn => fn.id === id)).toBe(true);
    expect(restored.functions.some(fn => fn.id === 'welcome-api')).toBe(false);
  });
});

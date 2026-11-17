import { getDemoTeam } from '../../team/demo';
import { isDemoFixtureMode, readDemoState, writeDemoState } from '../../../shared/demo';
import { allocateDemoSshSlot, configuredDemoSshTargets, demoVmPoolSize } from './demoSshSlots';

export type VmStatus = 'queued' | 'running' | 'stopped';
export type VmOwner = 'personal' | 'team';

export interface DemoSnapshot {
  id: string;
  name: string;
  kind: 'manual' | 'automatic';
  createdAt: string;
}

export interface DemoVm {
  id: string;
  grn: string;
  name: string;
  purpose: string;
  owner: VmOwner;
  teamId?: string;
  teamName?: string;
  /** Keeps the member-view Figma fixture separate from the leader create-flow quota scenario. */
  teamScenario?: 'member-view' | 'leader-create';
  creator: string;
  role: 'leader' | 'member';
  status: VmStatus;
  lastRestartedAt?: string;
  powerRequestTimes?: number[];
  requestedAtMs?: number;
  cpu: number;
  memory: number;
  disk: number;
  /** Demo-only quota consumption for Figma fixtures; never populated from production/API records. */
  demoQuotaDisk?: number;
  /** Number of completed demo period extensions. */
  extensionCount?: number;
  os: 'Linux Ubuntu 22.04 LTS' | 'Ubuntu Server';
  nodeType: string;
  createdAt: string;
  expiresAt: string;
  internalIp: string;
  sshPort: number;
  sshSlot?: number;
  sshUser: string;
  password: string;
  autoSnapshots: boolean;
  snapshots: DemoSnapshot[];
}

export interface DemoVmQuota {
  cpu: number;
  memory: number;
  disk: number;
  cpuLimit: number;
  memoryLimit: number;
  diskLimit: number;
}

export interface DeletedDemoVm {
  id: string;
  grn: string;
  teamId?: string;
  reason: 'expired' | 'manual';
}

export interface DemoVmState {
  schemaVersion?: number;
  vms: DemoVm[];
  deletedVms?: DeletedDemoVm[];
  personalQuota: DemoVmQuota;
  /** Legacy default-team quota retained for callers and stored demos created before per-team quotas. */
  teamQuota: DemoVmQuota;
  teamQuotas?: Record<string, DemoVmQuota>;
  sequence: number;
  /** Demo-only: when the simulated student-wide pool shortage ends (other students' work finishes). */
  studentPoolReleaseAt?: number;
}

export interface VmDraft {
  cpu: number;
  memory: number;
  disk: number;
  os: DemoVm['os'];
  name: string;
  purpose: string;
}

const stateKey = 'vm-resources';
const personalDraftKey = 'vm-personal-create-draft';
const teamDraftKey = 'vm-team-create-draft';
// The team VM Figma states use 2026-10-26 00:00 KST as their reference time.
// Keep the demo gate deterministic instead of tying the Figma interaction to the visitor's clock.
export const demoTeamReferenceTime = Date.UTC(2026, 9, 25, 15);

export function getDemoVmExpiryTime(expiresAt: string): number | undefined {
  const match = expiresAt.match(/^(\d{4})\.(\d{2})\.(\d{2})(?: (\d{2}):(\d{2}))?/);
  if (!match) return undefined;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4] ?? 14) - 9, Number(match[5] ?? 0));
}

const dayMs = 24 * 60 * 60 * 1000;

export function getDemoVmGraceEnd(vm: DemoVm): number | undefined {
  if (vm.status === 'queued' || vm.requestedAtMs === undefined) return undefined;
  const expiry = getDemoVmExpiryTime(vm.expiresAt);
  return expiry === undefined ? undefined : expiry + 3 * dayMs;
}

export function isDemoVmExpired(vm: DemoVm): boolean {
  const graceEnd = getDemoVmGraceEnd(vm);
  return graceEnd !== undefined && Date.now() >= graceEnd - 3 * dayMs;
}

export function canRecoverDemoVm(vm: DemoVm): boolean {
  const graceEnd = getDemoVmGraceEnd(vm);
  return graceEnd !== undefined && isDemoVmExpired(vm) && Date.now() < graceEnd;
}

export function getDemoVmDaysRemaining(expiresAt: string, referenceTime = demoTeamReferenceTime): number | undefined {
  const expiryTime = getDemoVmExpiryTime(expiresAt);
  if (expiryTime === undefined) return undefined;
  return Math.max(0, Math.ceil((expiryTime - referenceTime) / (24 * 60 * 60 * 1000)));
}

export function canCreateDemoTeamVm(teamId: string): boolean {
  const team = getDemoTeam(teamId);
  return team?.status === 'approved' && (team.my_role === 'leader' || team.my_role === 'devops');
}

export function canManageDemoVm(vm: DemoVm): boolean {
  if (vm.owner === 'personal') return true;
  return vm.role !== 'member' && Boolean(vm.teamId && canCreateDemoTeamVm(vm.teamId));
}

export function canExtendDemoTeamVm(vm: DemoVm): boolean {
  if (!vm.teamId || !getDemoTeam(vm.teamId)?.my_role) return false;
  if (isDemoVmExpired(vm)) return canRecoverDemoVm(vm);
  const expiryTime = getDemoVmExpiryTime(vm.expiresAt);
  const referenceTime = vm.requestedAtMs !== undefined ? Date.now() : demoTeamReferenceTime;
  return vm.status !== 'queued'
    && expiryTime !== undefined
    && referenceTime >= expiryTime - 7 * 24 * 60 * 60 * 1000
    && referenceTime < expiryTime;
}

/**
 * connect-db is the Figma "만료되어 정지됐습니다" / "연장했습니다 · VM은 정지 상태입니다" fixture:
 * it expired one day before the visitor opened the demo and is inside the 3-day grace period.
 */
function expiredTeamVmTimes(now = Date.now()): Pick<DemoVm, 'requestedAtMs' | 'createdAt' | 'expiresAt'> {
  const expiresAt = now - dayMs;
  const createdAt = expiresAt - 30 * dayMs;
  return { requestedAtMs: createdAt, createdAt: formatDemoVmDate(createdAt), expiresAt: formatDemoVmDate(expiresAt) };
}

const currentSchemaVersion = 5;

const initialVmState: DemoVmState = {
  schemaVersion: currentSchemaVersion,
  vms: [
    {
      id: 'portfolio-api',
      grn: 'vm-portfolio-api',
      name: 'portfolio-api',
      purpose: '포트폴리오 프로젝트의 API 서버 운영',
      owner: 'personal',
      creator: '김지민',
      role: 'leader',
      status: 'running',
      cpu: 2,
      memory: 4,
      disk: 20,
      demoQuotaDisk: 10,
      os: 'Linux Ubuntu 22.04 LTS',
      nodeType: '일반 Node',
      createdAt: '2026.09.26 14:00 (KST)',
      expiresAt: '2026.10.03 14:00 (KST)',
      internalIp: '10.20.0.104',
      sshPort: 32104,
      sshUser: 'ubuntu',
      password: 'gsvm-demo-initial-password',
      autoSnapshots: true,
      snapshots: [
        { id: 'snapshot-auto', name: 'auto-20260929', kind: 'automatic', createdAt: '2026.09.29 00:01' },
        { id: 'snapshot-release', name: 'before-release', kind: 'manual', createdAt: '2026.09.28 17:42' },
      ],
    },
    {
      id: 'portfolio-worker',
      grn: 'vm-portfolio-worker',
      name: 'portfolio-worker',
      purpose: '포트폴리오 프로젝트의 백그라운드 작업 서버 운영',
      owner: 'personal',
      creator: '김지민',
      role: 'leader',
      status: 'queued',
      cpu: 2,
      memory: 4,
      disk: 20,
      demoQuotaDisk: 10,
      os: 'Linux Ubuntu 22.04 LTS',
      nodeType: '자원이 많이 남은 Node에 자동 배분',
      createdAt: '요청 접수 · 대기 2건',
      expiresAt: '생성 완료 후 7일',
      internalIp: '배정 대기 중',
      sshPort: 0,
      sshUser: 'ubuntu',
      password: '대기 중',
      autoSnapshots: false,
      snapshots: [],
    },
    {
      id: 'connect-api',
      grn: 'team-vm-connect-api',
      name: 'connect-api',
      purpose: 'GSM Connect 서비스 API 서버 운영',
      owner: 'team',
      teamId: 'demo-team',
      teamName: 'GSM Connect',
      teamScenario: 'member-view',
      creator: '김지민',
      role: 'member',
      status: 'running',
      cpu: 2,
      memory: 4,
      disk: 20,
      os: 'Linux Ubuntu 22.04 LTS',
      nodeType: '일반 Node',
      createdAt: '2026.10.01 14:00 (KST)',
      expiresAt: '2026.10.30 14:00 (KST)',
      internalIp: '10.20.0.117',
      sshPort: 32117,
      sshUser: 'ubuntu',
      password: 'gsvm-demo-team-password',
      autoSnapshots: true,
      snapshots: [],
    },
    {
      id: 'connect-db',
      grn: 'team-vm-connect-db',
      name: 'connect-db',
      purpose: 'GSM Connect 서비스 Database 운영',
      owner: 'team',
      teamId: 'demo-team',
      teamName: 'GSM Connect',
      teamScenario: 'member-view',
      creator: '한도윤',
      role: 'member',
      status: 'stopped',
      ...expiredTeamVmTimes(),
      cpu: 2,
      memory: 2,
      disk: 30,
      os: 'Linux Ubuntu 22.04 LTS',
      nodeType: '일반 Node',
      internalIp: '10.20.0.118',
      sshPort: 32118,
      sshUser: 'ubuntu',
      password: 'gsvm-demo-team-database-password',
      autoSnapshots: true,
      snapshots: [],
    },
  ],
  // Matches the seed rows (portfolio-api and portfolio-worker each count 10 GB of SSD); saveDemoVmState recomputes the same totals.
  personalQuota: { cpu: 4, memory: 8, disk: 20, cpuLimit: 4, memoryLimit: 8, diskLimit: 30 },
  teamQuota: { cpu: 0, memory: 0, disk: 0, cpuLimit: 4, memoryLimit: 8, diskLimit: 60 },
  teamQuotas: { 'demo-team': { cpu: 0, memory: 0, disk: 0, cpuLimit: 4, memoryLimit: 8, diskLimit: 60 } },
  sequence: 1,
};

const emptyVmState: DemoVmState = {
  schemaVersion: currentSchemaVersion,
  vms: [],
  deletedVms: [],
  personalQuota: { cpu: 0, memory: 0, disk: 0, cpuLimit: 4, memoryLimit: 8, diskLimit: 30 },
  teamQuota: { cpu: 0, memory: 0, disk: 0, cpuLimit: 4, memoryLimit: 8, diskLimit: 60 },
  teamQuotas: {},
  sequence: 1,
};

const personalDraft: VmDraft = {
  cpu: 2,
  memory: 4,
  disk: 20,
  os: 'Linux Ubuntu 22.04 LTS',
  name: 'portfolio-worker',
  purpose: '포트폴리오 프로젝트의 백그라운드 작업 서버 운영',
};

const teamDraft: VmDraft = {
  cpu: 2,
  memory: 4,
  disk: 20,
  os: 'Linux Ubuntu 22.04 LTS',
  name: 'connect-web',
  purpose: 'GSM Connect 서비스 API 서버 운영',
};

const queueDurationMs = 15_000;
const setupDurationMs = 5_000;

export function isDemoVmInitializing(vm: DemoVm): boolean {
  return vm.status === 'queued' && vm.requestedAtMs !== undefined && Date.now() >= vm.requestedAtMs + queueDurationMs;
}

export function formatDemoVmDate(timestamp: number): string {
  const local = new Date(timestamp + 9 * 60 * 60 * 1000).toISOString();
  return local.slice(0, 10).replaceAll('-', '.') + ' ' + local.slice(11, 16) + ' (KST)';
}

export function getDemoVmState(): DemoVmState {
  const state = readStoredDemoVmState();
  const now = Date.now();
  let changed = false;
  const deletedVms = [...(state.deletedVms ?? [])];
  const vms = state.vms.flatMap(vm => {
    const graceEnd = getDemoVmGraceEnd(vm);
    if (graceEnd !== undefined && now >= graceEnd) {
      changed = true;
      deletedVms.push({ id: vm.id, grn: vm.grn, teamId: vm.teamId, reason: 'expired' });
      return [];
    }
    if (vm.status === 'running' && isDemoVmExpired(vm)) {
      changed = true;
      return { ...vm, status: 'stopped' as const };
    }
    if (vm.status !== 'queued' || vm.requestedAtMs === undefined) return vm;
    const completedAt = vm.requestedAtMs + queueDurationMs + setupDurationMs;
    if (now < completedAt) return vm;
    changed = true;
    const duration = vm.owner === 'team' ? 30 : 7;
    const expiresAt = completedAt + duration * dayMs;
    if (now >= expiresAt + 3 * dayMs) {
      deletedVms.push({ id: vm.id, grn: vm.grn, teamId: vm.teamId, reason: 'expired' });
      return [];
    }
    return {
      ...vm,
      status: now >= expiresAt ? 'stopped' as const : 'running' as const,
      createdAt: formatDemoVmDate(completedAt),
      expiresAt: formatDemoVmDate(expiresAt),
      internalIp: isDemoFixtureMode() ? '10.20.0.' + (100 + vm.requestedAtMs % 100) : '접속 정보 준비 중',
      sshPort: isDemoFixtureMode() ? (vm.owner === 'team' ? 32117 : 32104) : (configuredDemoSshTargets()[vm.sshSlot ?? -1]?.port ?? 0),
      sshUser: isDemoFixtureMode() ? vm.sshUser : (configuredDemoSshTargets()[vm.sshSlot ?? -1]?.user ?? '준비 중'),
      password: isDemoFixtureMode() ? 'gsvm-demo-' + vm.requestedAtMs.toString(36) : '',
    };
  });
  if (!changed) return state;
  const next = { ...state, vms, deletedVms };
  return saveDemoVmState(next) ? readStoredDemoVmState() : state;
}

function migrateToSchema5(stored: DemoVmState): DemoVmState {
  const vms = stored.vms.map(vm => {
    if (vm.id === 'portfolio-worker' && vm.owner === 'personal' && vm.status === 'queued'
      && vm.requestedAtMs === undefined && vm.demoQuotaDisk === 20) {
      return { ...vm, demoQuotaDisk: 10 };
    }
    if (vm.id === 'connect-db' && vm.owner === 'team' && vm.status === 'stopped'
      && vm.requestedAtMs === undefined && vm.expiresAt === '2026.10.31 14:00 (KST)') {
      return { ...vm, ...expiredTeamVmTimes() };
    }
    return vm;
  });
  const migrated = { ...stored, schemaVersion: currentSchemaVersion, vms };
  saveDemoVmState(migrated);
  return readDemoState<DemoVmState | null>(stateKey, migrated) ?? migrated;
}

function readStoredDemoVmState(): DemoVmState {
  const stored = readDemoState<DemoVmState | null>(stateKey, null);
  if (!stored || !Array.isArray(stored.vms) || !stored.personalQuota || !stored.teamQuota) return isDemoFixtureMode() ? initialVmState : emptyVmState;
  if ((stored.schemaVersion ?? 0) >= currentSchemaVersion) return stored;
  if ((stored.schemaVersion ?? 0) === 4) return migrateToSchema5(stored);

  if ((stored.schemaVersion ?? 0) >= 3) {
    const vms = stored.vms.map(vm => {
      if (vm.id === 'portfolio-api' && vm.owner === 'personal' && vm.disk === 20) {
        return { ...vm, demoQuotaDisk: 10 };
      }
      if (vm.id === 'portfolio-worker' && vm.owner === 'personal' && vm.status === 'queued'
        && vm.cpu === 2 && vm.memory === 4 && vm.disk === 10
        && vm.createdAt === '요청 접수 · 대기 2건') {
        return { ...vm, disk: 20, demoQuotaDisk: 20 };
      }
      return vm;
    });
    return migrateToSchema5({ ...stored, schemaVersion: 4, vms });
  }

  const legacySeedVms = initialVmState.vms
    .filter(vm => vm.id === 'portfolio-api' || vm.id === 'connect-api')
    .map(vm => vm.owner === 'team' ? { ...vm, teamId: 'gsm-connect' } : vm);
  const hasUnchangedLegacySeed = stored.schemaVersion === undefined
    && stored.vms.length === legacySeedVms.length
    && legacySeedVms.every(seed => {
      const existing = stored.vms.find(vm => vm.id === seed.id);
      return Boolean(existing && JSON.stringify(existing) === JSON.stringify(seed));
    })
    && stored.personalQuota.cpu === 2 && stored.personalQuota.memory === 4 && stored.personalQuota.disk === 20
    && stored.personalQuota.cpuLimit === 4 && stored.personalQuota.memoryLimit === 8 && stored.personalQuota.diskLimit === 30
    && stored.teamQuota.cpu === 0 && stored.teamQuota.memory === 0 && stored.teamQuota.disk === 0
    && stored.teamQuota.cpuLimit === 4 && stored.teamQuota.memoryLimit === 8 && stored.teamQuota.diskLimit === 60;

  let vms = stored.vms.map(vm => {
    if (vm.owner !== 'team') return vm;
    const normalized = vm.teamId === 'gsm-connect'
      ? { ...vm, teamId: 'demo-team', teamName: vm.teamName || 'GSM Connect' }
      : vm;
    return {
      ...normalized,
      teamScenario: normalized.teamScenario ?? (normalized.role === 'member' ? 'member-view' : 'leader-create'),
    };
  });
  // Add the newer Figma rows only when the complete persisted state still matches
  // the original seed. An absent row in any user-modified state may be a deletion.
  if (hasUnchangedLegacySeed) {
    for (const seedId of ['portfolio-worker', 'connect-db']) {
      const seed = initialVmState.vms.find(vm => vm.id === seedId);
      if (seed && !vms.some(vm => vm.id === seed.id)) vms = [...vms, seed];
    }
  }
  const existingTeamQuotas = stored.teamQuotas && typeof stored.teamQuotas === 'object' ? stored.teamQuotas : {};
  const teamIds = new Set(vms.filter(vm => vm.owner === 'team').map(vm => vm.teamId || 'demo-team'));
  teamIds.add('demo-team');
  const teamQuotas: Record<string, DemoVmQuota> = {};

  for (const id of teamIds) {
    const previous = existingTeamQuotas[id] ?? (id === 'demo-team' ? stored.teamQuota : undefined);
    const teamVms = vms.filter(vm => vm.owner === 'team'
      && (vm.teamId || 'demo-team') === id
      && teamQuotaScenario(vm) === 'leader-create');
    teamQuotas[id] = {
      cpu: teamVms.reduce((sum, vm) => sum + vm.cpu, 0),
      memory: teamVms.reduce((sum, vm) => sum + vm.memory, 0),
      disk: teamVms.reduce((sum, vm) => sum + quotaDisk(vm), 0),
      cpuLimit: previous?.cpuLimit ?? 4,
      memoryLimit: previous?.memoryLimit ?? 8,
      diskLimit: previous?.diskLimit ?? 60,
    };
  }

  const personalVms = vms.filter(vm => vm.owner === 'personal');
  const personalQuota = {
    ...stored.personalQuota,
    cpu: personalVms.reduce((sum, vm) => sum + vm.cpu, 0),
    memory: personalVms.reduce((sum, vm) => sum + vm.memory, 0),
    disk: personalVms.reduce((sum, vm) => sum + quotaDisk(vm), 0),
  };

  const migratedState: DemoVmState = {
    ...stored,
    schemaVersion: 4,
    vms,
    personalQuota,
    teamQuotas,
    teamQuota: teamQuotas['demo-team'],
  };
  return migrateToSchema5(migratedState);
}

export function removeDemoVm(state: DemoVmState, vm: DemoVm): DemoVmState {
  return {
    ...state,
    vms: state.vms.filter(item => item.id !== vm.id),
    deletedVms: [...(state.deletedVms ?? []), { id: vm.id, grn: vm.grn, teamId: vm.teamId, reason: 'manual' }],
  };
}

export function cancelDemoVmCreateRequest(vmId: string): boolean {
  const current = getDemoVmState();
  const target = current.vms.find(vm => vm.id === vmId);
  if (!target || target.status !== 'queued' || isDemoVmInitializing(target) || !canManageDemoVm(target)) return false;
  return saveDemoVmState({ ...current, vms: current.vms.filter(vm => vm.id !== vmId) });
}

export function saveDemoVmState(state: DemoVmState): boolean {
  const personalVms = state.vms.filter(vm => vm.owner === 'personal');
  const teamIds = new Set([
    'demo-team',
    ...Object.keys(state.teamQuotas ?? {}),
    ...state.vms.filter(vm => vm.owner === 'team').map(vm => vm.teamId || 'demo-team'),
  ]);
  const teamQuotas = Object.fromEntries([...teamIds].map(teamId => {
    const previous = state.teamQuotas?.[teamId] ?? (teamId === 'demo-team' ? state.teamQuota : undefined);
    const vms = state.vms.filter(vm => vm.owner === 'team'
      && (vm.teamId || 'demo-team') === teamId
      && teamQuotaScenario(vm) === 'leader-create');
    return [teamId, {
      cpu: vms.reduce((sum, vm) => sum + vm.cpu, 0),
      memory: vms.reduce((sum, vm) => sum + vm.memory, 0),
      disk: vms.reduce((sum, vm) => sum + quotaDisk(vm), 0),
      cpuLimit: previous?.cpuLimit ?? 4,
      memoryLimit: previous?.memoryLimit ?? 8,
      diskLimit: previous?.diskLimit ?? 60,
    } satisfies DemoVmQuota];
  }));
  return writeDemoState(stateKey, {
    ...state,
    schemaVersion: currentSchemaVersion,
    personalQuota: {
      ...state.personalQuota,
      cpu: personalVms.reduce((sum, vm) => sum + vm.cpu, 0),
      memory: personalVms.reduce((sum, vm) => sum + vm.memory, 0),
      disk: personalVms.reduce((sum, vm) => sum + quotaDisk(vm), 0),
    },
    teamQuotas,
    teamQuota: teamQuotas['demo-team'],
  });
}

function teamQuotaScenario(vm: DemoVm): 'member-view' | 'leader-create' {
  return vm.teamScenario ?? (vm.role === 'member' ? 'member-view' : 'leader-create');
}

function quotaDisk(vm: DemoVm): number {
  return vm.demoQuotaDisk ?? vm.disk;
}

function vmDraftKey(owner: VmOwner, teamId?: string): string {
  if (owner === 'personal') return personalDraftKey;
  return !teamId || teamId === 'demo-team' ? teamDraftKey : `${teamDraftKey}.${teamId}`;
}

export function getDemoVmDraft(owner: VmOwner, teamId?: string): VmDraft {
  const draft = readDemoState<VmDraft | null>(vmDraftKey(owner, teamId), null);
  if (!draft) return owner === 'team' ? teamDraft : personalDraft;
  const isPreviousPersonalSeed = owner === 'personal'
    && draft.cpu === 2 && draft.memory === 4 && draft.disk === 10
    && draft.os === 'Linux Ubuntu 22.04 LTS'
    && draft.name === 'portfolio-batch'
    && draft.purpose === '포트폴리오 프로젝트의 배치 작업 서버 운영';
  const isPreviousTeamSeed = owner === 'team' && draft.name === 'connect-api'
    && draft.purpose === teamDraft.purpose && draft.cpu === teamDraft.cpu
    && draft.memory === teamDraft.memory && draft.disk === teamDraft.disk && draft.os === teamDraft.os;
  if (isPreviousTeamSeed) return teamDraft;
  return isPreviousPersonalSeed ? personalDraft : draft;
}

export function saveDemoVmDraft(owner: VmOwner, draft: VmDraft, teamId?: string): void {
  writeDemoState(vmDraftKey(owner, teamId), draft);
}

export function resetDemoVmDraft(owner: VmOwner, teamId?: string): void {
  saveDemoVmDraft(owner, owner === 'team' ? teamDraft : personalDraft, teamId);
}

export function getDemoVmQuota(state: DemoVmState, teamId: string): DemoVmQuota {
  const quota = (teamId === 'demo-team' ? state.teamQuota : state.teamQuotas?.[teamId])
    ?? { cpu: 0, memory: 0, disk: 0, cpuLimit: 4, memoryLimit: 8, diskLimit: 60 };
  const limits = getDemoTeam(teamId)?.quota?.vm;
  if (!limits) return quota;
  return {
    ...quota,
    cpuLimit: limits.vcpu.limit,
    memoryLimit: limits.ram_gb.limit,
    diskLimit: limits.ssd_gb.limit,
  };
}

export function listDemoTeamVms(state: DemoVmState, teamId: string): DemoVm[] {
  return state.vms.filter(vm => vm.owner === 'team' && (vm.teamId || 'demo-team') === teamId);
}

export function makeDemoVm(state: DemoVmState, draft: VmDraft, owner: VmOwner, teamId = 'demo-team', teamName = 'GSM Connect', creatorName = '김지민'): { state: DemoVmState; vm: DemoVm } {
  const sshSlot = isDemoFixtureMode() ? null : allocateDemoSshSlot(state.vms.map(vm => vm.sshSlot).filter((slot): slot is number => slot !== undefined));
  if (!isDemoFixtureMode() && sshSlot === null) throw new Error(`준비된 VM ${demoVmPoolSize}개를 모두 사용 중입니다. 기존 VM을 삭제한 뒤 다시 시도해 주세요.`);
  const target = sshSlot === null ? undefined : configuredDemoSshTargets()[sshSlot];
  const sequence = state.sequence;
  const team = owner === 'team';
  const suffix = String(sequence).padStart(3, '0');
  const id = `${team ? 'team-' : ''}${draft.name.trim() || `${team ? 'team-vm' : 'vm'}-${suffix}`}`;
  const vm: DemoVm = {
    id: `${id}-${suffix}`,
    grn: `${team ? 'team-vm' : 'vm'}-${id}-${suffix}`,
    name: draft.name.trim() || `${team ? 'team-vm' : 'vm'}-${suffix}`,
    purpose: draft.purpose.trim(),
    owner,
    ...(team ? { teamId, teamName } : {}),
    ...(team ? { teamScenario: 'leader-create' as const } : {}),
    creator: team ? creatorName : '김지민',
    role: 'leader',
    status: 'queued',
    requestedAtMs: Date.now(),
    cpu: draft.cpu,
    memory: draft.memory,
    disk: draft.disk,
    os: draft.os,
    nodeType: '자원이 많이 남은 Node에 자동 배분',
    createdAt: '생성 요청 접수',
    expiresAt: team ? '생성 완료 시각부터 30일' : '생성 완료 시각부터 7일',
    internalIp: '배정 대기 중',
    sshPort: 0,
    sshSlot: sshSlot ?? undefined,
    sshUser: target?.user ?? (isDemoFixtureMode() ? 'ubuntu' : '준비 중'),
    password: isDemoFixtureMode() ? '대기 중' : '',
    autoSnapshots: false,
    snapshots: [],
  };
  const next: DemoVmState = {
    ...state,
    vms: [...state.vms, vm],
    sequence: sequence + 1,
    ...(team ? {
      teamQuota: teamId === 'demo-team' ? { ...getDemoVmQuota(state, teamId), cpu: state.teamQuota.cpu + vm.cpu, memory: state.teamQuota.memory + vm.memory, disk: state.teamQuota.disk + vm.disk } : state.teamQuota,
      teamQuotas: {
        ...state.teamQuotas,
        [teamId]: { ...getDemoVmQuota(state, teamId), cpu: getDemoVmQuota(state, teamId).cpu + vm.cpu, memory: getDemoVmQuota(state, teamId).memory + vm.memory, disk: getDemoVmQuota(state, teamId).disk + vm.disk },
      },
    } : {
      personalQuota: { ...state.personalQuota, cpu: state.personalQuota.cpu + vm.cpu, memory: state.personalQuota.memory + vm.memory, disk: state.personalQuota.disk + quotaDisk(vm) },
    }),
  };
  return { state: next, vm };
}

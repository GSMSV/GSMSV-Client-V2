import { readDemoState, writeDemoState } from '../../../shared/demo';

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
  creator: string;
  role: 'leader' | 'member';
  status: VmStatus;
  cpu: number;
  memory: number;
  disk: number;
  os: 'Linux Ubuntu 22.04 LTS' | 'Ubuntu Server';
  nodeType: string;
  createdAt: string;
  expiresAt: string;
  internalIp: string;
  sshPort: number;
  sshUser: string;
  password: string;
  autoSnapshots: boolean;
  snapshots: DemoSnapshot[];
}

export interface DemoVmState {
  vms: DemoVm[];
  personalQuota: { cpu: number; memory: number; disk: number; cpuLimit: number; memoryLimit: number; diskLimit: number };
  teamQuota: { cpu: number; memory: number; disk: number; cpuLimit: number; memoryLimit: number; diskLimit: number };
  sequence: number;
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

const initialVmState: DemoVmState = {
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
      id: 'connect-api',
      grn: 'team-vm-connect-api',
      name: 'connect-api',
      purpose: 'GSM Connect 서비스 API 서버 운영',
      owner: 'team',
      teamId: 'gsm-connect',
      teamName: 'GSM Connect',
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
  ],
  personalQuota: { cpu: 2, memory: 4, disk: 20, cpuLimit: 4, memoryLimit: 8, diskLimit: 30 },
  teamQuota: { cpu: 0, memory: 0, disk: 0, cpuLimit: 4, memoryLimit: 8, diskLimit: 60 },
  sequence: 1,
};

const personalDraft: VmDraft = {
  cpu: 2,
  memory: 4,
  disk: 10,
  os: 'Linux Ubuntu 22.04 LTS',
  name: 'portfolio-worker',
  purpose: '포트폴리오 프로젝트의 백그라운드 작업 서버 운영',
};

const teamDraft: VmDraft = {
  cpu: 2,
  memory: 4,
  disk: 20,
  os: 'Linux Ubuntu 22.04 LTS',
  name: 'connect-api',
  purpose: 'GSM Connect 서비스 API 서버 운영',
};

export function getDemoVmState(): DemoVmState {
  const stored = readDemoState<DemoVmState | null>(stateKey, null);
  return stored && Array.isArray(stored.vms) && stored.personalQuota && stored.teamQuota ? stored : initialVmState;
}

export function saveDemoVmState(state: DemoVmState): void {
  writeDemoState(stateKey, state);
}

export function getDemoVmDraft(owner: VmOwner): VmDraft {
  return readDemoState(owner === 'team' ? teamDraftKey : personalDraftKey, owner === 'team' ? teamDraft : personalDraft);
}

export function saveDemoVmDraft(owner: VmOwner, draft: VmDraft): void {
  writeDemoState(owner === 'team' ? teamDraftKey : personalDraftKey, draft);
}

export function resetDemoVmDraft(owner: VmOwner): void {
  saveDemoVmDraft(owner, owner === 'team' ? teamDraft : personalDraft);
}

export function makeDemoVm(state: DemoVmState, draft: VmDraft, owner: VmOwner, teamId = 'gsm-connect'): { state: DemoVmState; vm: DemoVm } {
  const sequence = state.sequence;
  const team = owner === 'team';
  const ownerLabel = team ? 'GSM Connect · 팀장' : '나 · 김지민';
  const suffix = String(sequence).padStart(3, '0');
  const id = `${team ? 'team-' : ''}${draft.name.trim() || `${team ? 'team-vm' : 'vm'}-${suffix}`}`;
  const vm: DemoVm = {
    id: `${id}-${suffix}`,
    grn: `${team ? 'team-vm' : 'vm'}-${id}-${suffix}`,
    name: draft.name.trim() || `${team ? 'team-vm' : 'vm'}-${suffix}`,
    purpose: draft.purpose.trim(),
    owner,
    ...(team ? { teamId, teamName: 'GSM Connect' } : {}),
    creator: team ? ownerLabel : '김지민',
    role: team ? 'leader' : 'leader',
    status: 'queued',
    cpu: draft.cpu,
    memory: draft.memory,
    disk: draft.disk,
    os: draft.os,
    nodeType: '자원이 많이 남은 Node에 자동 배분',
    createdAt: '생성 요청 접수',
    expiresAt: team ? '생성 완료 시각부터 30일' : '생성 완료 시각부터 7일',
    internalIp: '배정 대기 중',
    sshPort: 0,
    sshUser: 'ubuntu',
    password: '대기 중',
    autoSnapshots: false,
    snapshots: [],
  };
  const next: DemoVmState = {
    ...state,
    vms: [...state.vms, vm],
    sequence: sequence + 1,
    ...(team ? {
      teamQuota: { ...state.teamQuota, cpu: state.teamQuota.cpu + vm.cpu, memory: state.teamQuota.memory + vm.memory, disk: state.teamQuota.disk + vm.disk },
    } : {
      personalQuota: { ...state.personalQuota, cpu: state.personalQuota.cpu + vm.cpu, memory: state.personalQuota.memory + vm.memory, disk: state.personalQuota.disk + vm.disk },
    }),
  };
  return { state: next, vm };
}

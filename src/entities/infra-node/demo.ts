import type { AdminResource, InfraNode, NodeVm } from './model/types';

export interface DemoInfraFailure {
  name: string;
  reason: string;
  occurredAt: string;
  category: string;
  vmGrn: string | null;
}

export interface DemoInfraSnapshot {
  nodes: InfraNode[];
  resources: AdminResource[];
  nodeVms: Record<string, NodeVm[]>;
  nodeKinds: Record<string, string>;
  creationInProgress: number;
  expiringWithinThreeDays: number;
  expiringToday: number;
  deletionGrace: number;
  recentFailures: DemoInfraFailure[];
  expiringGrns: string[];
}

const nodes: InfraNode[] = [
  {
    node: 'node-01', online: true,
    usage: { cpu_percent: 34, memory_used_gb: 39.68, memory_total_gb: 64, uptime_sec: 18 * 86_400 + 6 * 3_600 },
    allocation: { vcpu: { allocated: 28, allocatable: 48 }, ram_gb: { allocated: 40, allocatable: 64 }, ssd_gb: { allocated: 420, allocatable: 800 } },
    clone_queue_length: 1,
  },
  {
    node: 'node-02', online: true,
    usage: { cpu_percent: 21, memory_used_gb: 30.72, memory_total_gb: 64, uptime_sec: 12 * 86_400 + 3 * 3_600 },
    allocation: { vcpu: { allocated: 20, allocatable: 48 }, ram_gb: { allocated: 31, allocatable: 64 }, ssd_gb: { allocated: 350, allocatable: 800 } },
    clone_queue_length: 2,
  },
  {
    node: 'node-03', online: false,
    usage: { cpu_percent: 0, memory_used_gb: 0, memory_total_gb: 0, uptime_sec: 0 },
    allocation: { vcpu: { allocated: 0, allocatable: 0 }, ram_gb: { allocated: 0, allocatable: 0 }, ssd_gb: { allocated: 0, allocatable: 0 } },
    clone_queue_length: 0,
  },
];

const vmSeeds = [
  ['portfolio-api', 'node-01', 'jimin@example.com', '실행 중', 'running'],
  ['meal-web', 'node-01', 'seojun@example.com', '실행 중', 'running'],
  ['club-storage', 'node-01', 'jiwoo@example.com', '만료 정지', 'stopped'],
  ['study-api', 'node-01', 'doyun@example.com', '실행 중', 'running'],
  ['image-worker', 'node-01', 'jimin@example.com', '실행 중', 'running'],
  ['notice-api', 'node-01', 'seojun@example.com', '실행 중', 'running'],
  ['club-web', 'node-01', 'jiwoo@example.com', '정지됨', 'stopped'],
  ['attendance-api', 'node-01', 'doyun@example.com', '실행 중', 'running'],
  ['portfolio-db', 'node-01', 'jimin@example.com', '실행 중', 'running'],
  ['weather-worker', 'node-01', 'seojun@example.com', '실행 중', 'running'],
  ['school-map', 'node-01', 'jiwoo@example.com', '실행 중', 'running'],
  ['schedule-api', 'node-01', 'doyun@example.com', '실행 중', 'running'],
  ['project-docs', 'node-01', 'jimin@example.com', '실행 중', 'running'],
  ['image-cache', 'node-01', 'seojun@example.com', '실행 중', 'running'],
  ['connect-api', 'node-02', 'GSM Connect', '실행 중', 'running'],
  ['connect-db', 'node-02', 'GSM Connect', '실행 중', 'running'],
  ['connect-web', 'node-02', 'GSM Connect', '실행 중', 'running'],
  ['team-bot', 'node-02', 'GSM Connect', '실행 중', 'running'],
  ['deploy-runner', 'node-02', 'GSM Connect', '정지됨', 'stopped'],
  ['docs-preview', 'node-02', 'GSM Connect', '실행 중', 'running'],
  ['monitoring', 'node-02', 'GSM Connect', '실행 중', 'running'],
  ['student-api', 'node-02', 'jimin@example.com', '실행 중', 'running'],
  ['cron-worker', 'node-02', 'seojun@example.com', '실행 중', 'running'],
  ['mail-relay', 'node-02', 'jiwoo@example.com', '정지됨', 'stopped'],
] as const;

const resources: AdminResource[] = vmSeeds.map(([name, node, owner, status, power], index) => ({
  grn: `grn:gsmsv:vm:demo-${String(index + 1).padStart(3, '0')}`,
  type: 'vm', name, node,
  vmid: index < 14 ? 191 + index : 301 + index - 14,
  owner_email: owner,
  status,
  power_state: power,
}));

function nodeVms(node: string, count: number): NodeVm[] {
  return resources.filter(resource => resource.node === node).slice(0, count).map((resource, index) => ({
    vmid: resource.vmid ?? index + 1,
    proxmox_name: resource.name,
    classification: resource.name === 'club-storage' ? 'orphan' : 'managed',
    grn: resource.grn,
  }));
}

const snapshot: DemoInfraSnapshot = {
  nodes,
  resources,
  nodeVms: { 'node-01': nodeVms('node-01', 14), 'node-02': nodeVms('node-02', 10), 'node-03': [] },
  nodeKinds: { 'node-01': '일반', 'node-02': '팀 GPU', 'node-03': '조회 실패' },
  creationInProgress: 1,
  expiringWithinThreeDays: 4,
  expiringToday: 1,
  deletionGrace: 1,
  recentFailures: [
    { name: 'study-api', reason: 'Node의 사용 가능한 자원이 부족합니다.', occurredAt: '2분 전 · 용량 부족', category: 'quota', vmGrn: null },
    { name: 'image-worker', reason: '생성 중 내부 오류가 발생했습니다.', occurredAt: '28분 전 · 내부 오류', category: 'internal', vmGrn: null },
  ],
  expiringGrns: resources.filter(resource => ['portfolio-api', 'meal-web', 'club-storage', 'connect-api'].includes(resource.name)).map(resource => resource.grn),
};

export function getDemoInfraSnapshot(): DemoInfraSnapshot {
  return structuredClone(snapshot);
}

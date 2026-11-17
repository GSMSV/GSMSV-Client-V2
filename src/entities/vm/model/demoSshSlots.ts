export interface DemoSshTarget { host: string; port: number; user: string; password?: string }
export const demoVmPoolSize = 9;

/**
 * 준비된 VM 9개(기존 03번 제외 후 1~9번)의 용도. 용도끼리 서로 빌려 쓰지 않는다.
 * 1~4번: 사용자 VM, 5~7번: Serverless 실행, 8~9번: MySQL Database.
 */
export type DemoVmPoolRole = 'vm' | 'serverless' | 'database';
export const demoVmPoolRoles: Record<DemoVmPoolRole, readonly number[]> = {
  vm: [0, 1, 2, 3],
  serverless: [4, 5, 6],
  database: [7, 8],
};

const suppliedDemoSshTargets: DemoSshTarget[] = [
  { host: 'ssh.gsmsv.site', port: 21141, user: 'ubuntu', password: '9NX#MVft' },
  { host: 'ssh.gsmsv.site', port: 21142, user: 'ubuntu', password: 'k31m!Ww7' },
  { host: 'ssh.gsmsv.site', port: 21145, user: 'ubuntu', password: 'Z%dCE3tt' },
  { host: 'ssh.gsmsv.site', port: 21146, user: 'ubuntu', password: 'tKO2!tLr' },
  { host: 'ssh.gsmsv.site', port: 21147, user: 'ubuntu', password: '@0!%zcHh' },
  { host: 'ssh.gsmsv.site', port: 21148, user: 'ubuntu', password: 'rW%1UD5C' },
  { host: 'ssh.gsmsv.site', port: 21149, user: 'ubuntu', password: 'A8TZA#9a' },
  { host: 'ssh.gsmsv.site', port: 27140, user: 'ubuntu', password: '7IS@HS%U' },
  { host: 'ssh.gsmsv.site', port: 27141, user: 'ubuntu', password: 'tcX4or!7' },
];

export function parseDemoSshSlots(value: string | undefined): DemoSshTarget[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length > demoVmPoolSize) return [];
    if (!parsed.every((item): item is DemoSshTarget =>
      Boolean(item && typeof item === 'object'
        && typeof item.host === 'string' && /^(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/.test(item.host)
        && Number.isInteger(item.port) && item.port >= 1 && item.port <= 65535
        && typeof item.user === 'string' && /^[a-z_][a-z0-9_-]*$/i.test(item.user)
        && (item.password === undefined || (typeof item.password === 'string' && item.password.length <= 128))))) return [];
    if (new Set(parsed.map(item => `${item.host.toLowerCase()}:${item.port}`)).size !== parsed.length) return [];
    return parsed;
  } catch {
    return [];
  }
}

/** 해당 용도의 VM 중 비어 있는 첫 번째 칸을 돌려준다. 없으면 null. */
export function allocateDemoSshSlot(occupied: readonly number[], role: DemoVmPoolRole = 'vm'): number | null {
  for (const slot of demoVmPoolRoles[role]) if (!occupied.includes(slot)) return slot;
  return null;
}

/** 칸 번호(0부터)를 화면에 쓰는 VM 번호(1부터)로 바꾼다. */
export function demoVmPoolNumber(slot: number): number {
  return slot + 1;
}

export function sshCommandForSlot(slot: number | undefined, targets: readonly DemoSshTarget[]): string | null {
  const target = slot === undefined ? undefined : targets[slot];
  return target ? `ssh ${target.user}@${target.host} -p ${target.port}` : null;
}

export function configuredDemoSshTargets(): DemoSshTarget[] {
  return import.meta.env.VITE_DEMO_SSH_SLOTS
    ? parseDemoSshSlots(import.meta.env.VITE_DEMO_SSH_SLOTS)
    : suppliedDemoSshTargets;
}

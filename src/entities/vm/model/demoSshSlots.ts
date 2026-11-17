export interface DemoSshTarget { host: string; port: number; user: string }
export const demoVmPoolSize = 10;

export function parseDemoSshSlots(value: string | undefined): DemoSshTarget[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length > demoVmPoolSize) return [];
    if (!parsed.every((item): item is DemoSshTarget =>
      Boolean(item && typeof item === 'object'
        && typeof item.host === 'string' && /^(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/.test(item.host)
        && Number.isInteger(item.port) && item.port >= 1 && item.port <= 65535
        && typeof item.user === 'string' && /^[a-z_][a-z0-9_-]*$/i.test(item.user)))) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function allocateDemoSshSlot(occupied: readonly number[]): number | null {
  for (let slot = 0; slot < demoVmPoolSize; slot += 1) if (!occupied.includes(slot)) return slot;
  return null;
}

export function sshCommandForSlot(slot: number | undefined, targets: readonly DemoSshTarget[]): string | null {
  const target = slot === undefined ? undefined : targets[slot];
  return target ? `ssh ${target.user}@${target.host} -p ${target.port}` : null;
}

export function configuredDemoSshTargets(): DemoSshTarget[] {
  return parseDemoSshSlots(import.meta.env.VITE_DEMO_SSH_SLOTS);
}

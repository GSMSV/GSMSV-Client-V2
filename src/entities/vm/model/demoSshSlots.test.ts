import { describe, expect, it } from 'vitest';
import { allocateDemoSshSlot, configuredDemoSshTargets, demoVmPoolRoles, parseDemoSshSlots, sshCommandForSlot } from './demoSshSlots';

describe('precreated VM SSH pool', () => {
  it('maps the supplied VM slots in creation order with display passwords', () => {
    const slots = configuredDemoSshTargets();
    expect(slots).toHaveLength(9);
    expect(slots.map(slot => slot.port)).toEqual([21141, 21142, 21145, 21146, 21147, 21148, 21149, 27140, 27141]);
    expect(new Set(slots.map(slot => `${slot.host}:${slot.port}`)).size).toBe(9);
    expect(slots.every(slot => slot.host === 'ssh.gsmsv.site' && slot.user === 'ubuntu' && Boolean(slot.password))).toBe(true);
    expect(sshCommandForSlot(0, slots)).toBe('ssh ubuntu@ssh.gsmsv.site -p 21141');
  });
  it('allocates in order and releases a slot after deletion', () => {
    expect(allocateDemoSshSlot([])).toBe(0);
    expect(allocateDemoSshSlot([0])).toBe(1);
    expect(allocateDemoSshSlot([0, 1])).toBe(2);
    expect(allocateDemoSshSlot([0, 1, 2, 3])).toBeNull();
    expect(allocateDemoSshSlot([0, 2])).toBe(1);
  });

  it('keeps each role inside its own VMs (1~4 VM, 5~7 Serverless, 8~9 Database)', () => {
    expect(demoVmPoolRoles).toEqual({ vm: [0, 1, 2, 3], serverless: [4, 5, 6], database: [7, 8] });
    expect(allocateDemoSshSlot([], 'serverless')).toBe(4);
    expect(allocateDemoSshSlot([4, 5, 6], 'serverless')).toBeNull();
    expect(allocateDemoSshSlot([0, 1, 2, 3, 4, 5, 6], 'database')).toBe(7);
    expect(allocateDemoSshSlot([7, 8], 'database')).toBeNull();
  });

  it('does not invent a command for an unconfigured slot', () => {
    expect(sshCommandForSlot(0, [])).toBeNull();
    const slots = parseDemoSshSlots('[{"host":"vm.example.com","port":2222,"user":"student"}]');
    expect(sshCommandForSlot(0, slots)).toBe('ssh student@vm.example.com -p 2222');
    expect(sshCommandForSlot(1, slots)).toBeNull();
  });

  it('rejects malformed or unsafe SSH configuration', () => {
    expect(parseDemoSshSlots('[{"host":"vm.example.com;echo bad","port":22,"user":"student"}]')).toEqual([]);
    expect(parseDemoSshSlots('[{"host":"vm.example.com","port":0,"user":"student"}]')).toEqual([]);
    expect(parseDemoSshSlots('[{"host":"vm.example.com","port":22,"user":"student"},{"host":"vm.example.com","port":22,"user":"student"}]')).toEqual([]);
  });
});

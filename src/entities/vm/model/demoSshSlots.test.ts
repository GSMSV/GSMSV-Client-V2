import { describe, expect, it } from 'vitest';
import { allocateDemoSshSlot, demoVmPoolSize, parseDemoSshSlots, sshCommandForSlot } from './demoSshSlots';

describe('precreated VM SSH pool', () => {
  it('allocates in order and releases a slot after deletion', () => {
    expect(allocateDemoSshSlot([])).toBe(0);
    expect(allocateDemoSshSlot([0])).toBe(1);
    expect(allocateDemoSshSlot([0, 1])).toBe(2);
    expect(allocateDemoSshSlot(Array.from({ length: demoVmPoolSize }, (_, index) => index))).toBeNull();
    expect(allocateDemoSshSlot([0, 2])).toBe(1);
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
  });
});

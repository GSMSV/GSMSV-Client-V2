import { useEffect, useState } from 'react';
import { isDemoMode } from '../../../shared/demo';
import { getDemoVmState } from './demoVmStore';

export function useDemoVmResourceState(identifier?: string) {
  const [state, setState] = useState(getDemoVmState);
  const enabled = isDemoMode();
  const target = state.vms.find(vm => vm.id === identifier || vm.grn === identifier);
  const scheduled = target?.requestedAtMs !== undefined;
  const queued = target?.status === 'queued';

  useEffect(() => {
    if (!enabled) return;
    const refresh = () => setState({ ...getDemoVmState() });
    function sync(event: StorageEvent) {
      if (!event.key || event.key.startsWith('gsmsv.demo.state.v1.')) refresh();
    }
    window.addEventListener('storage', sync);
    const timer = scheduled ? window.setInterval(refresh, queued ? 1_000 : 30_000) : undefined;
    return () => {
      window.removeEventListener('storage', sync);
      window.clearInterval(timer);
    };
  }, [enabled, queued, scheduled]);

  return [state, setState] as const;
}

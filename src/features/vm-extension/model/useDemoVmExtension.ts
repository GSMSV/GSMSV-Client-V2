import { useRef, useState } from 'react';
import type { DemoVm, DemoVmState } from '../../../entities/vm';

interface PurposeConfirmation {
  vmId: string;
  purpose: string;
  extensionCount: number;
}

interface DemoVmExtensionOptions {
  onStateChange: (state: DemoVmState) => void;
  onExtended: (vm: DemoVm) => void;
  onError: (message: string) => void;
}

export function useDemoVmExtension({ onStateChange, onExtended, onError }: DemoVmExtensionOptions) {
  const [confirmation, setConfirmation] = useState<PurposeConfirmation | null>(null);
  const [error, setError] = useState('');
  const pending = useRef(false);

  function dismiss() {
    setConfirmation(null);
    setError('');
  }

  async function extend(vmId: string, approval?: { previous: PurposeConfirmation; purpose?: string }) {
    if (!import.meta.env.DEV || pending.current) return;
    pending.current = true;
    setError('');
    const reportError = (message: string) => approval ? setError(message) : onError(message);

    try {
      const repository = await import('../../../entities/vm');
      const state = repository.getDemoVmState();
      const vm = state.vms.find(item => item.id === vmId);
      if (!vm || vm.status === 'queued' || (vm.owner === 'team' && !repository.canExtendDemoTeamVm(vm))) {
        onStateChange(state);
        dismiss();
        onError('현재 상태에서는 사용 기간을 연장할 수 없습니다.');
        return;
      }

      const extensionCount = (vm.extensionCount ?? 0) + 1;
      const needsPurpose = vm.owner === 'personal' && extensionCount % 4 === 0;
      const approvedLatest = approval?.previous.extensionCount === extensionCount && approval.previous.purpose === vm.purpose;
      if (needsPurpose && !approvedLatest) {
        onStateChange(state);
        setConfirmation({ vmId, purpose: vm.purpose, extensionCount });
        return;
      }
      if (approval && !approvedLatest) {
        onStateChange(state);
        dismiss();
        onError('다른 곳에서 사용 기간이 변경됐습니다. 만료일을 확인한 뒤 다시 시도해 주세요.');
        return;
      }

      const expiryTime = repository.getDemoVmExpiryTime(vm.expiresAt);
      if (expiryTime === undefined) {
        reportError('만료일을 확인할 수 없어 사용 기간을 연장하지 못했습니다.');
        return;
      }
      const nextDate = new Date(expiryTime);
      nextDate.setUTCDate(nextDate.getUTCDate() + 14);
      const updated = {
        ...vm,
        expiresAt: `${nextDate.toISOString().slice(0, 10).replaceAll('-', '.')} 14:00 (KST)`,
        purpose: approval?.purpose ?? vm.purpose,
        extensionCount,
      };
      const next = { ...state, vms: state.vms.map(item => item.id === vm.id ? updated : item) };
      if (!repository.saveDemoVmState(next)) {
        reportError('사용 기간을 저장하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      onStateChange(next);
      dismiss();
      onExtended(updated);
    } catch {
      reportError('사용 기간을 연장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      pending.current = false;
    }
  }

  function confirm(purpose?: string) {
    if (!confirmation) return;
    const revised = purpose?.trim();
    if (revised !== undefined && (!revised || revised.length > 100)) return;
    void extend(confirmation.vmId, { previous: confirmation, purpose: revised });
  }

  return { extend, confirmation, confirm, dismiss, error };
}

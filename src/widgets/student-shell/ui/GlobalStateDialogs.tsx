import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { signOutDemoProfile } from '../../../entities/profile';
import { consumeDemoFailure, isDemoMode } from '../../../shared/demo';
import { Button } from '../../../shared/ui/controls';
import { ModalSurface } from '../../../shared/ui/feedback';
import { Octicon } from '../../../shared/ui/icons';
import { StatePanel, StatePanelCaption, StatePanelCopy } from './StatePanel';

/**
 * S03 · 공통 예외 다이얼로그(연결 끊김 · 다시 로그인 · 요청 제한).
 *
 * - 연결이 끊겼습니다: 브라우저가 오프라인이 되면 모든 화면에서 열린다. 목데이터 모드에서는 `?demoError=offline`.
 * - 다시 로그인해 주세요: 목데이터 모드에서 `?demoError=session`.
 * - 요청이 너무 많습니다: 목데이터 모드에서 `?demoError=rate-limit`.
 */
export function GlobalStateDialogs() {
  const { pathname } = useLocation();
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    if (!isDemoMode()) return;
    if (consumeDemoFailure('offline')) setSimulatedOffline(true);
    if (consumeDemoFailure('session')) setSessionExpired(true);
    if (consumeDemoFailure('rate-limit')) setRateLimited(true);
  }, [pathname]);

  if (sessionExpired) return <SessionExpiredDialog onClose={() => setSessionExpired(false)} />;
  if (offline || simulatedOffline) {
    return <ConnectionLostDialog onRecheck={() => {
      if (simulatedOffline) {
        setSimulatedOffline(false);
        return;
      }
      if (navigator.onLine) {
        setOffline(false);
        window.location.reload();
      }
    }} />;
  }
  if (rateLimited) return <RateLimitDialog onClose={() => setRateLimited(false)} />;
  return null;
}

function ConnectionLostDialog({ onRecheck }: { onRecheck: () => void }) {
  const titleId = useId();
  return (
    <ModalSurface labelledBy={titleId}>
      <StatePanel
        titleId={titleId}
        icon="alert"
        tone="warning"
        title="연결이 끊겼습니다"
        actions={<Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={onRecheck}>다시 확인</Button>}
      >
        <StatePanelCopy>인터넷 연결을 확인해 주세요. 연결이 복구되면 최신 데이터를 다시 불러옵니다.</StatePanelCopy>
        <StatePanelCopy>· 화면에 보이는 상태는 마지막으로 확인한 정보입니다.</StatePanelCopy>
      </StatePanel>
    </ModalSurface>
  );
}

function currentReturnPath() {
  const url = new URL(window.location.href);
  url.searchParams.delete('demoError');
  return `${url.pathname}${url.search}${url.hash}`;
}

function SessionExpiredDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const navigate = useNavigate();
  const editingVm = /\/vms\/new(?:\/|$)/.test(window.location.pathname);
  return (
    <ModalSurface labelledBy={titleId}>
      <StatePanel
        titleId={titleId}
        icon="lock"
        tone="primary"
        title="다시 로그인해 주세요"
        actions={<Button variant="primary" icon={<Octicon name="sign-in" size={16} />} onClick={() => {
          const returnTo = currentReturnPath();
          if (isDemoMode()) signOutDemoProfile();
          onClose();
          void navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
        }}>DataGSM으로 로그인</Button>}
      >
        <StatePanelCopy>세션이 만료됐습니다. 로그인 후 지금 보던 화면으로 돌아옵니다.</StatePanelCopy>
        {editingVm && <StatePanelCopy>· 작성 중이던 VM 생성 내용은 보존됩니다.</StatePanelCopy>}
      </StatePanel>
    </ModalSurface>
  );
}

const rateLimitSeconds = 24;

function RateLimitDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [remaining, setRemaining] = useState(rateLimitSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining(value => value - 1), 1_000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  return (
    <ModalSurface labelledBy={titleId} onDismiss={remaining <= 0 ? onClose : undefined}>
      <StatePanel
        titleId={titleId}
        icon="clock"
        tone="warning"
        title="요청이 너무 많습니다"
        actions={<Button variant="secondary" icon={<Octicon name="sync" size={16} />} disabled={remaining > 0} onClick={onClose}>
          {remaining > 0 ? `${remaining}초 후 다시 시도` : '다시 시도'}
        </Button>}
        footer={<StatePanelCaption role="status" aria-live="polite">{remaining > 0 ? '요청 제한 시간이 지나면 다시 사용할 수 있습니다.' : '이제 다시 시도할 수 있습니다.'}</StatePanelCaption>}
      >
        <StatePanelCopy>{remaining > 0 ? `${remaining}초 뒤 다시 시도해 주세요.` : '다시 시도할 수 있습니다.'}</StatePanelCopy>
        <StatePanelCopy>· 학교처럼 같은 Network를 사용하는 경우 제한을 함께 받을 수 있습니다.</StatePanelCopy>
      </StatePanel>
    </ModalSurface>
  );
}

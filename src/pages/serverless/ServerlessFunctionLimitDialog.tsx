import { Button } from '../../shared/ui/controls';
import { ModalSurface } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { ServerlessStateCard, StateCopy } from './ServerlessStateCard';

/** Figma 13-02 · 함수를 더 만들 수 없어요 (698:3860). */
export function ServerlessFunctionLimitDialog({ used, limit, onClose }: { used: number; limit: number; onClose: () => void }) {
  return (
    <ModalSurface labelledBy="serverless-limit-title" onDismiss={onClose}>
      <ServerlessStateCard
        floating
        titleId="serverless-limit-title"
        icon="alert"
        tone="warning"
        title="함수를 더 만들 수 없습니다"
        actions={<Button variant="secondary" icon={<Octicon name="checklist" size={16} />} onClick={onClose}>함수 목록</Button>}
      >
        <StateCopy>· 내 함수 {limit}개를 모두 쓰고 있습니다. 개인 {used} / {limit}</StateCopy>
        <StateCopy>· 쓰지 않는 함수를 지우면 다시 만들 수 있습니다.</StateCopy>
      </ServerlessStateCard>
    </ModalSurface>
  );
}

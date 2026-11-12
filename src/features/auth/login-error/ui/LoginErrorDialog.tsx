import styled from 'styled-components';
import { Button } from '../../../../shared/ui/controls';
import { Octicon } from '../../../../shared/ui/icons';

export type LoginErrorKind = 'failed' | 'not-enrolled' | 'inactive' | 'unavailable' | 'expired';

interface LoginErrorCopy {
  title: string;
  description: string;
  icon: 'alert' | 'person' | 'lock' | 'clock';
  action: 'retry' | 'login' | 'status';
}

const errorCopy: Record<LoginErrorKind, LoginErrorCopy> = {
  failed: {
    title: '로그인을 완료하지 못했습니다',
    description: '인증이 취소되었거나 처리 중 문제가 생겼습니다. DataGSM 인증을 다시 시작해 주세요.',
    icon: 'alert',
    action: 'retry',
  },
  'not-enrolled': {
    title: '재학생만 이용할 수 있습니다',
    description: 'DataGSM의 학생 정보에서 재학 상태를 확인할 수 없습니다. 정보가 다르다면 학교 담당자에게 확인해 주세요.',
    icon: 'person',
    action: 'login',
  },
  inactive: {
    title: '현재 사용할 수 없는 계정입니다',
    description: '계정이 비활성화되어 로그인할 수 없습니다. 관리자에게 계정 상태를 문의해 주세요.',
    icon: 'lock',
    action: 'login',
  },
  unavailable: {
    title: 'DataGSM이 응답하지 않습니다',
    description: '인증 서비스 또는 학생 정보 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    icon: 'alert',
    action: 'status',
  },
  expired: {
    title: '인증 시간이 지났습니다',
    description: '인증 절차가 오래 걸려 연결이 만료되었습니다. 처음부터 다시 로그인해 주세요.',
    icon: 'clock',
    action: 'retry',
  },
};

const Scrim = styled.div`
  position: fixed;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: ${({ theme }) => theme.colors.sidebar};
`;

const Dialog = styled.section`
  display: flex;
  width: 480px;
  max-width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 16px rgb(0 0 0 / 45%);
`;

const Header = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
`;

const IconSlot = styled.span<{ $kind: LoginErrorKind }>`
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  color: ${({ $kind, theme }) => $kind === 'not-enrolled'
    ? theme.colors.warning
    : $kind === 'inactive'
      ? theme.colors.muted
      : $kind === 'expired'
        ? theme.colors.warning
        : theme.colors.danger};
`;

const Title = styled.h2`
  flex: 1;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.h2.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.h2.size}px;
  font-weight: ${({ theme }) => theme.typography.h2.weight};
  line-height: ${({ theme }) => theme.typography.h2.lineHeight}px;
`;

const Description = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const Actions = styled.div<{ $kind: LoginErrorKind }>`
  display: flex;
  width: 100%;
  min-height: ${({ $kind }) => $kind === 'unavailable' ? 88 : $kind === 'inactive' ? 44 : 66}px;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

interface LoginErrorDialogProps {
  kind: LoginErrorKind;
  onClose: () => void;
  onRetry: () => void;
}

export function LoginErrorDialog({ kind, onClose, onRetry }: LoginErrorDialogProps) {
  const copy = errorCopy[kind];

  return (
    <Scrim>
      <Dialog role="alertdialog" aria-modal="true" aria-labelledby="login-error-title" aria-describedby="login-error-description">
        <Header>
          <IconSlot $kind={kind} aria-hidden="true"><Octicon name={copy.icon} size={24} /></IconSlot>
          <Title id="login-error-title">{copy.title}</Title>
        </Header>
        <Description id="login-error-description">{copy.description}</Description>
        <Actions $kind={kind}>
          {kind === 'failed' && <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={onClose}>닫기</Button>}
          {kind === 'unavailable' && <Button variant="secondary" icon={<Octicon name="pulse" size={16} />} onClick={() => window.location.assign('/status')}>서비스 상태 보기</Button>}
          {copy.action === 'login' && <Button variant="secondary" icon={<Octicon name="arrow-left" size={16} />} onClick={onClose}>로그인 화면으로</Button>}
          {(copy.action === 'retry' || copy.action === 'status') && (
            <Button variant="primary" icon={<Octicon name={copy.action === 'retry' ? 'sign-in' : 'sync'} size={16} />} onClick={onRetry}>
              {copy.action === 'retry' ? '다시 로그인' : '다시 시도'}
            </Button>
          )}
        </Actions>
      </Dialog>
    </Scrim>
  );
}

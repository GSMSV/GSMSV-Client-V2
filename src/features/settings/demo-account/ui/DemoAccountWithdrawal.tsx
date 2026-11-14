import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../../shared/ui/controls';
import { DeleteConfirmDialog } from '../../../../shared/ui/feedback';
import { ModalSurface } from '../../../../shared/ui/feedback/ModalSurface';
import { getWithdrawalItems, getWithdrawalStep, withdrawDemoAccount, type WithdrawalStep } from '../model/demoWithdrawal';
import { AccountDialog, DialogCopy } from './AccountDialog';

export function DemoAccountWithdrawal({ email, deleted, onWithdraw, onLogin }: {
  email: string;
  deleted: boolean;
  onWithdraw: () => void;
  onLogin: () => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WithdrawalStep | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [automaticHandoff, setAutomaticHandoff] = useState(false);
  const [items, setItems] = useState('');
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dismiss = () => setStep(null);

  function start(allowAutomaticHandoff = false) {
    setAutomaticHandoff(allowAutomaticHandoff);
    setConfirmation('');
    setFailed(false);
    const next = getWithdrawalStep(allowAutomaticHandoff);
    if (next.kind === 'confirm') setItems(getWithdrawalItems());
    setStep(next);
  }

  const visitTeamSettings = (teamId: string) => {
    dismiss();
    void navigate(`/teams/${encodeURIComponent(teamId)}/settings`);
  };

  let modal;
  if (deleted) {
    modal = <AccountDialog title="탈퇴했습니다" icon="check-circle" description="다시 로그인하면 새 계정으로 시작합니다."
      actions={<Button onClick={onLogin}>로그인 화면으로</Button>} />;
  } else if (step?.kind === 'last-admin') {
    modal = <AccountDialog title="마지막 관리자는 탈퇴할 수 없습니다" icon="shield"
      description="다른 관리자가 있어야 탈퇴할 수 있습니다." onDismiss={dismiss}
      actions={<Button variant="secondary" onClick={dismiss}>닫기</Button>} />;
  } else if (step?.kind === 'only-member') {
    const { team } = step;
    modal = <AccountDialog title="팀 해체를 먼저 요청해 주세요" icon="alert"
      description={`· ${team.name}에 남은 팀원이 나뿐입니다.\n· 팀 해체가 승인되면 탈퇴할 수 있습니다.`}
      onDismiss={dismiss} actions={<>
        <Button variant="secondary" onClick={dismiss}>닫기</Button>
        <Button onClick={() => visitTeamSettings(team.id)}>팀 설정</Button>
      </>} />;
  } else if (step?.kind === 'team-lead') {
    const { team } = step;
    modal = <AccountDialog title="팀장 역할을 넘겨 주세요" icon="people"
      description={`· ${team.name}의 팀장입니다.\n· 넘기지 않고 탈퇴하면 정해진 순서에 따라 다른 팀원이 팀장을 맡습니다.`}
      onDismiss={dismiss} actions={<>
        <Button variant="secondary" onClick={() => start(true)}>넘기지 않고 계속</Button>
        <Button onClick={() => visitTeamSettings(team.id)}>팀장 넘기기</Button>
      </>} />;
  } else if (step?.kind === 'confirm') {
    modal = <ModalSurface labelledBy="delete-confirm-title" onDismiss={dismiss}>
      <DeleteConfirmDialog open title="계정을 탈퇴하시겠습니까?"
        description="되돌릴 수 없습니다. 아래 개인 자원이 모두 삭제되고 팀 자원은 팀에 남습니다."
        items={items} fieldLabel="확인하려면 학교 이메일을 입력하세요"
        confirmationName={email} value={confirmation} onValueChange={setConfirmation}
        onCancel={dismiss} confirmDisabled={submitting} onConfirm={() => {
          const next = getWithdrawalStep(automaticHandoff);
          if (next.kind !== 'confirm') {
            setStep(next);
          } else {
            setSubmitting(true);
            void withdrawDemoAccount(confirmation, automaticHandoff).then(success => {
              if (success) {
                dismiss();
                onWithdraw();
              } else setFailed(true);
            }).catch(() => setFailed(true)).finally(() => setSubmitting(false));
          }
        }}
        caption="다시 로그인하면 새 계정으로 시작합니다."
        hint={`${email}을 정확하게 입력해 주세요`}
        confirmLabel="계정 탈퇴" />
      {failed && <DialogCopy role="alert">계정 탈퇴를 완료하지 못했습니다. 다시 시도해 주세요.</DialogCopy>}
    </ModalSurface>;
  }

  return <>
    <Button variant="danger" disabled={deleted} onClick={() => start()}>계정 탈퇴</Button>
    {modal}
  </>;
}

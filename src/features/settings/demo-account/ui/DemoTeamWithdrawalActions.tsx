import { useState } from 'react';
import { getDemoDisbandResources } from '../model/approveTeamDisband';
import type { TeamMember } from '../../../../entities/team';
import { leaveDemoTeam, removeDemoTeamMember, setDemoDisbandRequest, transferDemoTeamLeadership, updateDemoTeamMemberRole, type DemoTeamDetail } from '../../../../entities/team/demo';
import { Button, TextField } from '../../../../shared/ui/controls';
import { AccountDialog, DialogCopy } from './AccountDialog';

export function TransferDemoTeamLeader({ teamId, successor, onDismiss, onSave }: {
  teamId: string;
  successor: TeamMember;
  onDismiss: () => void;
  onSave: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <AccountDialog title={`${successor.name}에게 팀장을 넘기시겠습니까?`} icon="people"
      description={`· ${successor.name}이 팀장이 되고, 나는 일반 팀원이 됩니다.\n· 넘긴 뒤에는 되돌릴 수 없습니다. 새 팀장이 다시 넘겨줘야 합니다.\n· 팀원 전원에게 알림이 갑니다.`}
      onDismiss={onDismiss} actions={<>
        <Button variant="secondary" onClick={onDismiss}>취소</Button>
        <Button onClick={() => {
          if (transferDemoTeamLeadership(teamId, successor.member_id)) onSave();
          else setFailed(true);
        }}>팀장 넘기기</Button>
      </>}>
      {failed && <DialogCopy role="alert">팀장을 넘기지 못했습니다.</DialogCopy>}
    </AccountDialog>
  );
}

export function DemoTeamDisbandRequest({ team, onDismiss, onSave }: {
  team: DemoTeamDetail;
  onDismiss: () => void;
  onSave: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const [failed, setFailed] = useState(false);
  const pending = Boolean(team.demoDisbandPending);
  const { vms, databaseCount, functionCount, appCount } = getDemoDisbandResources(team.id);
  return (
    <AccountDialog title={pending ? '해체 요청을 취소하시겠습니까?' : '팀 해체를 요청하시겠습니까?'}
      icon={pending ? 'history' : 'alert'}
      description={pending ? '관리자 승인 전이라 취소할 수 있습니다. 팀 VM은 그대로 유지됩니다.'
        : '· 관리자가 승인하면 팀의 VM·Database·함수·앱이 모두 삭제되고 복구할 수 없습니다.\n· 승인 전에는 요청을 취소할 수 있습니다.'}
      onDismiss={onDismiss} actions={<>
        <Button variant="secondary" onClick={onDismiss}>{pending ? '닫기' : '취소'}</Button>
        <Button variant={pending ? 'primary' : 'danger'} disabled={!pending && confirmation !== team.name} onClick={() => {
          if (setDemoDisbandRequest(team.id, !pending)) onSave();
          else setFailed(true);
        }}>{pending ? '요청 취소' : '해체 요청'}</Button>
      </>}>
      {!pending && <>
        <DialogCopy>{[
          ...vms.map(vm => `· ${vm.name} · ${vm.cpu} vCPU · RAM ${vm.memory} GB · SSD ${vm.disk} GB`),
          `· Database ${databaseCount}개 · 함수 ${functionCount}개 · 앱 ${appCount}개`,
          '· 관리자가 승인하면 팀의 VM·Database·함수·앱이 모두 삭제되고 복구할 수 없습니다.',
          '· 승인 전에는 요청을 취소할 수 있습니다.',
        ].join('\n')}</DialogCopy>
        <TextField label="확인을 위해 팀 이름을 입력하세요" placeholder={team.name} value={confirmation}
          onChange={event => setConfirmation(event.currentTarget.value)} />
      </>}
      {failed && <DialogCopy role="alert">해체 요청을 변경하지 못했습니다.</DialogCopy>}
    </AccountDialog>
  );
}

export function LeaveDemoTeam({ team, onDismiss, onLeave, onRequestDisband }: {
  team: DemoTeamDetail;
  onDismiss: () => void;
  onLeave: () => void;
  onRequestDisband: () => void;
}) {
  const onlyMember = team.members.length <= 1;
  const [failed, setFailed] = useState(false);
  if (onlyMember) {
    return <AccountDialog title="마지막 팀원은 탈퇴할 수 없습니다" icon="info"
      description="팀에 남은 사람이 나뿐입니다. 팀을 없애려면 해체를 요청하세요."
      onDismiss={onDismiss} actions={<>
        <Button variant="secondary" onClick={onDismiss}>닫기</Button>
        <Button variant="secondary" disabled>탈퇴</Button>
        {team.my_role === 'leader' && <Button variant="danger" onClick={onRequestDisband}>해체 요청</Button>}
      </>}>
      <DialogCopy>탈퇴하면 아무도 관리할 수 없는 팀 VM이 생깁니다.</DialogCopy>
    </AccountDialog>;
  }
  return <AccountDialog title="팀을 탈퇴하시겠습니까?" icon="sign-out"
    description="탈퇴하면 팀 VM은 팀에 그대로 남고, 이 계정에서는 팀을 볼 수 없습니다."
    onDismiss={onDismiss} actions={<>
      <Button variant="secondary" onClick={onDismiss}>취소</Button>
      <Button variant="danger" onClick={() => {
        if (leaveDemoTeam(team.id)) onLeave();
        else setFailed(true);
      }}>팀 탈퇴</Button>
    </>}>
    {failed && <DialogCopy role="alert">팀을 탈퇴하지 못했습니다.</DialogCopy>}
  </AccountDialog>;
}

export function DemoTeamMemberAction({ teamId, member, action, onDismiss, onSave }: {
  teamId: string;
  member: TeamMember;
  action: 'grant' | 'revoke' | 'remove';
  onDismiss: () => void;
  onSave: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const copy = action === 'grant'
    ? { title: 'DevOps 역할을 주시겠습니까?', description: `${member.name}이 팀 VM 생성·삭제, 전원 제어, 설정 변경을 할 수 있게 됩니다. 팀장이나 본인이 언제든 회수할 수 있습니다.`, confirm: 'DevOps 부여' }
    : action === 'revoke'
      ? { title: 'DevOps 역할을 회수하시겠습니까?', description: `${member.name}은 팀 VM과 인프라 설정을 변경할 수 없게 됩니다. 팀원 권한은 그대로 유지됩니다.`, confirm: 'DevOps 회수' }
      : { title: `${member.name}을 팀에서 제외하시겠습니까?`, description: '제외하면 바로 팀 VM을 볼 수 없습니다. 이 팀원이 만든 VM은 팀에 그대로 남습니다.', confirm: '제외' };
  return <AccountDialog title={copy.title} icon={action === 'remove' ? 'trashcan' : 'shield'}
    description={copy.description} onDismiss={onDismiss} actions={<>
      <Button variant="secondary" onClick={onDismiss}>취소</Button>
      <Button variant={action === 'remove' ? 'danger' : 'primary'} onClick={() => {
        const success = action === 'remove'
          ? removeDemoTeamMember(teamId, member.member_id)
          : updateDemoTeamMemberRole(teamId, member.member_id, action === 'grant' ? 'devops' : 'member');
        if (success) onSave();
        else setFailed(true);
      }}>{copy.confirm}</Button>
    </>}>
    {failed && <DialogCopy role="alert">변경을 적용하지 못했습니다.</DialogCopy>}
  </AccountDialog>;
}

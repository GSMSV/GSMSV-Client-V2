import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { canCreateDemoTeamVm, getDemoVmDraft, getDemoVmQuota, getDemoVmState, makeDemoVm, resetDemoVmDraft, saveDemoVmState, saveDemoVmDraft, type VmDraft, type VmOwner } from '../../entities/vm';
import { getSessionUser } from '../../entities/session';
import { createDemoTeamQuotaRequest, getDemoTeam } from '../../entities/team/demo';
import { TeamQuotaRequestDialog } from '../../features/team/request-quota';
import { recordDemoVmCreateFailure } from '../../entities/home';
import { consumeDemoFailure, isDemoMode } from '../../shared/demo';
import { useVmPageLoad, VmPagePlaceholder } from './VmPageLoad';
import { ModalSurface } from '../../shared/ui/feedback/ModalSurface';
import { Button, SliderField, StepConnector, StepIndicator } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import {
  Banner, BannerCopy, Breadcrumb, DemoPage, DemoShell, Fact, FactLabel, FactValue, Field, Hint, InlineFact,
  Input, OsSelector, PrimaryButton, Row, Stack, Surface, SurfaceTitle, Textarea, Title,
} from './VmDemoPrimitives';

const Steps = styled.nav`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 600px) { flex-wrap: wrap; gap: 8px; }
`;

const StepArea = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 600px) { gap: 8px; }
`;

const StepHead = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 760px) { flex-wrap: wrap; justify-content: flex-start; }
`;

const TextButton = styled.button`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.overlayHover}; }
`;

const LabelWithRequired = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  &::after { content: ' *'; color: ${({ theme }) => theme.colors.primary}; }
`;

const ReviewRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DataRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DataRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  svg { flex: 0 0 16px; color: ${({ theme }) => theme.colors.muted}; margin-top: 2px; }
`;

const SelectionTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const TablelessQuota = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Accent = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font: 500 ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const QuotaTrack = styled.div`
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const QuotaFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => Math.min(100, $percent)}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.primary};
`;

const RequestDialog = styled(Surface)`
  width: 480px;
  max-width: calc(100vw - 32px);
`;

const DialogField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const FieldError = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

/**
 * 목데이터의 학생 전체 몫(vCPU). 다른 학생들의 VM이 처음에는 몫을 거의 다 쓰고 있고,
 * 부족 안내를 처음 본 뒤 잠시 지나면 그 작업이 끝나 자원이 돌아온다.
 */
const studentPoolCpuLimit = 14;
const otherStudentsBusyCpu = 11;
const otherStudentsFreedCpu = 8;
const studentPoolRecoveryMs = 20_000;

function otherStudentsCpu(state: { studentPoolReleaseAt?: number }) {
  return state.studentPoolReleaseAt !== undefined && Date.now() >= state.studentPoolReleaseAt
    ? otherStudentsFreedCpu
    : otherStudentsBusyCpu;
}

/** 목데이터에서는 로그인된 데모 사용자(학생·관리자 모두)를 유효한 세션으로 본다. */
function hasDemoSession() {
  return getSessionUser() !== null;
}

interface DraftValidation {
  summary: string;
  name?: string;
  purpose?: string;
}

function formatShortfall(parts: { cpu: number; memory: number; disk: number }) {
  return [
    parts.cpu > 0 ? `vCPU ${parts.cpu}개` : '',
    parts.memory > 0 ? `RAM ${parts.memory} GB` : '',
    parts.disk > 0 ? `SSD ${parts.disk} GB` : '',
  ].filter(Boolean).join(' · ');
}

export type VmCreateStep = 'spec' | 'details' | 'review';

export function VmCreatePage({ owner, step }: { owner: VmOwner; step: VmCreateStep }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId: routeTeamId } = useParams<{ teamId: string }>();
  const isTeam = owner === 'team';
  const [draft, setDraft] = useState<VmDraft>(() => getDemoVmDraft(owner, routeTeamId));
  const [state, setState] = useState(getDemoVmState);
  const [error, setError] = useState('');
  const [reauthenticate, setReauthenticate] = useState(() => owner === 'personal' && !hasDemoSession());
  const [sharedQuotaBlocked, setSharedQuotaBlocked] = useState(false);
  const [validation, setValidation] = useState<DraftValidation | null>(null);
  const [createFailed, setCreateFailed] = useState(false);
  const [personalQuotaDialog, setPersonalQuotaDialog] = useState(true);
  const [teamQuotaShortfall, setTeamQuotaShortfall] = useState<{ cpu: number; memory: number; disk: number } | null>(null);
  const [quotaRequestOpen, setQuotaRequestOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const load = useVmPageLoad('vm-create-page', step);
  const teamId = routeTeamId || 'demo-team';
  const prefix = isTeam ? `/teams/${encodeURIComponent(teamId)}/vms/new` : '/vms/new';
  const team = isTeam ? getDemoTeam(teamId) : undefined;
  const teamName = team?.name ?? 'GSM Connect';
  const creatorName = team?.members.find(member => member.role === team.my_role)?.name ?? team?.members[0]?.name ?? '김지민';
  const canCreateInTeam = canCreateDemoTeamVm(teamId);

  useEffect(() => saveDemoVmDraft(owner, draft, isTeam ? teamId : undefined), [draft, isTeam, owner, teamId]);

  const quota = isTeam ? getDemoVmQuota(state, teamId) : state.personalQuota;
  const available = useMemo(() => ({
    cpu: Math.max(0, quota.cpuLimit - quota.cpu),
    memory: Math.max(0, quota.memoryLimit - quota.memory),
    disk: Math.max(0, quota.diskLimit - quota.disk),
  }), [quota]);
  const quotaExhausted = available.cpu < 1 || available.memory < 1 || available.disk < 10;
  const included = { cpu: quota.cpu + draft.cpu, memory: quota.memory + draft.memory, disk: quota.disk + draft.disk };

  if (!isDemoMode()) return <Navigate to="/" replace />;
  if (isTeam && !canCreateInTeam) {
    if (team?.status === 'approved' && team.my_role === 'member') {
      return <TeamMemberCreateBlocked teamId={teamId} teamName={teamName} memberName={team.members.find(member => member.member_id === getSessionUser()?.id)?.name ?? creatorName} />;
    }
    return <Navigate to={`/teams/${encodeURIComponent(teamId)}`} replace />;
  }

  function changeDraft(updates: Partial<VmDraft>) {
    setDraft(current => ({ ...current, ...updates }));
    setError('');
  }

  function validateFields(current: typeof state): DraftValidation | null {
    const purpose = !draft.purpose.trim() || draft.purpose.trim().length > 100
      ? '사용 목적을 100자 이내로 입력해 주세요. 공백만 입력할 수 없습니다.'
      : undefined;
    const trimmedName = draft.name.trim();
    let name: string | undefined;
    if (trimmedName.length > 40 || (trimmedName && !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(trimmedName))) {
      name = '영문·숫자로 시작하는 40자 이내 이름을 입력해 주세요. 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.';
    } else if (trimmedName && current.vms.some(vm => vm.owner === owner
      && (!isTeam || vm.teamId === teamId)
      && vm.name.toLowerCase() === trimmedName.toLowerCase())) {
      name = '같은 소유자 안에서 VM 이름을 중복해서 사용할 수 없습니다. 다른 이름을 입력해 주세요.';
    }
    if (!purpose && !name) return null;
    return {
      summary: !draft.purpose.trim() ? '사용 목적은 반드시 입력해야 합니다.' : purpose ? '사용 목적은 100자 이내로 입력해야 합니다.' : 'VM 이름을 확인해 주세요.',
      name,
      purpose,
    };
  }

  function validDraft(current: typeof state) {
    const fieldErrors = validateFields(current);
    if (fieldErrors) {
      setValidation(fieldErrors);
      return false;
    }
    if (isTeam) return true;
    const currentQuota = current.personalQuota;
    if (draft.cpu > currentQuota.cpuLimit - currentQuota.cpu || draft.memory > currentQuota.memoryLimit - currentQuota.memory || draft.disk > currentQuota.diskLimit - currentQuota.disk) {
      setError('남은 할당량 안에서 사양을 선택해 주세요.');
      return false;
    }
    return true;
  }

  function ensureSession() {
    if (isTeam || hasDemoSession()) return true;
    setReauthenticate(true);
    return false;
  }

  function next() {
    if (!ensureSession()) return;
    if (step === 'spec') {
      if (!isTeam) {
        changeDraft({
          cpu: Math.min(draft.cpu, available.cpu),
          memory: Math.min(draft.memory, available.memory),
          disk: Math.min(draft.disk, Math.floor(available.disk / 10) * 10),
        });
      }
      navigate(`${prefix}/details`);
    } else if (step === 'details' && validDraft(getDemoVmState())) {
      navigate(`${prefix}/review`);
    }
  }

  function back() {
    navigate(step === 'review' ? `${prefix}/details` : step === 'details' ? prefix : (isTeam ? `/teams/${encodeURIComponent(teamId)}` : '/'));
  }

  /**
   * 개인 VM 요청 실패는 홈의 "VM을 만들지 못했습니다" 배너로 보여준다(요청 후 홈으로 이동하는 흐름).
   * 홈 배너가 없는 팀 VM이나 기록에 실패한 경우에는 이 화면의 대화상자로 보여준다. 작성한 초안은 그대로 둔다.
   */
  function reportCreateFailure() {
    if (!isTeam && recordDemoVmCreateFailure({
      name: draft.name.trim() || `vm-${String(state.sequence).padStart(3, '0')}`,
      purpose: draft.purpose.trim(),
      cpu: draft.cpu,
      memory: draft.memory,
      disk: draft.disk,
      os: draft.os,
    })) {
      navigate('/');
      return;
    }
    setCreateFailed(true);
  }

  function createRequest() {
    if (!ensureSession()) return;
    if (isTeam && !canCreateDemoTeamVm(teamId)) {
      setError('팀장 또는 DevOps만 팀 VM을 만들 수 있습니다.');
      return;
    }
    let latest = getDemoVmState();
    setState(latest);
    setCreateFailed(false);
    if (!validDraft(latest)) {
      setSharedQuotaBlocked(false);
      return;
    }
    if (isTeam) {
      const teamQuota = getDemoVmQuota(latest, teamId);
      const shortfall = {
        cpu: Math.max(0, draft.cpu - (teamQuota.cpuLimit - teamQuota.cpu)),
        memory: Math.max(0, draft.memory - (teamQuota.memoryLimit - teamQuota.memory)),
        disk: Math.max(0, draft.disk - (teamQuota.diskLimit - teamQuota.disk)),
      };
      if (shortfall.cpu || shortfall.memory || shortfall.disk) {
        setTeamQuotaShortfall(shortfall);
        return;
      }
    } else {
      // 학생 전체 몫은 개인 VM에만 적용된다(팀 VM은 팀 할당량으로 센다).
      const myPersonalCpu = latest.vms.filter(vm => vm.owner === 'personal').reduce((total, vm) => total + vm.cpu, 0);
      if (myPersonalCpu + otherStudentsCpu(latest) + draft.cpu > studentPoolCpuLimit) {
        if (latest.studentPoolReleaseAt === undefined) {
          const withRelease = { ...latest, studentPoolReleaseAt: Date.now() + studentPoolRecoveryMs };
          if (saveDemoVmState(withRelease)) latest = withRelease;
          setState(latest);
        }
        setSharedQuotaBlocked(true);
        return;
      }
    }
    setSharedQuotaBlocked(false);
    if (consumeDemoFailure('vm-create')) {
      reportCreateFailure();
      return;
    }
    let created: ReturnType<typeof makeDemoVm>;
    try {
      created = makeDemoVm(latest, draft, owner, teamId, teamName, creatorName);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'VM을 만들 수 없습니다.');
      return;
    }
    const { state: nextState, vm } = created;
    if (!saveDemoVmState(nextState)) {
      reportCreateFailure();
      return;
    }
    resetDemoVmDraft(owner, routeTeamId);
    navigate(isTeam ? `/teams/${encodeURIComponent(vm.teamId ?? teamId)}/vms` : '/');
  }

  const heading = step === 'spec'
    ? (isTeam ? '팀에 필요한 환경을 선택하세요' : '어떤 환경이 필요합니까?')
    : step === 'details'
      ? (isTeam ? '팀 VM의 이름과 목적을 알려주세요' : 'VM에 이름과 목적을 알려주세요')
      : (isTeam ? '이 설정으로 팀 VM을 만드시겠습니까?' : '이 설정으로 VM을 만드시겠습니까?');

  return <DemoShell activeItem="vm-create" scopeLabel={isTeam ? `${teamName} · ${team?.my_role === 'devops' ? 'DevOps 엔지니어' : '팀장'}` : '내 Resources'} teamScopeId={isTeam ? teamId : undefined} userName={isTeam ? creatorName : '김지민'} hasUnsavedInput={step === 'details'}>
    <DemoPage>
      <Breadcrumb>{isTeam ? `${teamName} / 팀 VM 만들기` : 'VM 생성'}</Breadcrumb>
      <Title>{heading}</Title>
      <StepHead>
        <Steps aria-label="VM 생성 단계">
          <StepArea><StepIndicator number={1} label="사양" active={step === 'spec'} /><StepConnector /></StepArea>
          <StepArea><StepIndicator number={2} label="이름·목적" active={step === 'details'} /><StepConnector /></StepArea>
          <StepIndicator number={3} label="확인" active={step === 'review'} />
        </Steps>
        <TopActions>
          {step !== 'spec' && <TextButton type="button" onClick={back}><Octicon name="arrow-left" />{step === 'review' ? '이전: 이름·목적' : '이전: 사양'}</TextButton>}
          {step === 'review'
            ? <PrimaryButton onClick={createRequest} icon={<Octicon name="plus" />}>{isTeam ? '팀 VM 생성 요청' : 'VM 생성 요청'}</PrimaryButton>
            : <PrimaryButton disabled={step === 'spec' && !isTeam && quotaExhausted} onClick={next} icon={<Octicon name="arrow-right" />}>{step === 'spec' ? '다음: 이름·목적' : '다음: 확인'}</PrimaryButton>}
        </TopActions>
      </StepHead>

      {load.status !== 'ready' ? <VmPagePlaceholder status={load.status} onRetry={load.retry} rows={step === 'spec'
        ? [[452], [148], [isTeam ? 290 : 210]]
        : step === 'details'
          ? (isTeam ? [[290], [366]] : [[366], [284]])
          : (isTeam ? [[449], [284]] : [[424], [210]])} /> : <>
      {step === 'spec' && <>
        <Surface>
          <Row><SurfaceTitle>사양</SurfaceTitle><Hint>{isTeam ? '팀 할당량 · 소형' : '개인 할당량'} vCPU {quota.cpu}/{quota.cpuLimit} · RAM {quota.memory}/{quota.memoryLimit} GB · SSD {quota.disk}/{quota.diskLimit} GB 사용 중 · 남은 할당량 vCPU {available.cpu} · RAM {available.memory} GB · SSD {available.disk} GB</Hint></Row>
          <Stack>
            <SliderField label="vCPU" disabled={!isTeam && quotaExhausted} value={Math.min(draft.cpu, Math.max(1, available.cpu))} min={1} max={Math.max(1, available.cpu)} valueLabel={`${isTeam ? draft.cpu : Math.min(draft.cpu, Math.max(1, available.cpu))} vCPU`} minLabel="최소 1" maxLabel={`최대 ${available.cpu} · 남은 할당량`} onChange={cpu => changeDraft({ cpu })} />
            <SliderField label="RAM" disabled={!isTeam && quotaExhausted} value={Math.min(draft.memory, Math.max(1, available.memory))} min={1} max={Math.max(1, available.memory)} valueLabel={`${isTeam ? draft.memory : Math.min(draft.memory, Math.max(1, available.memory))} GB`} minLabel="최소 1 GB" maxLabel={`최대 ${available.memory} GB · 남은 할당량`} onChange={memory => changeDraft({ memory })} />
            <SliderField label="SSD" disabled={!isTeam && quotaExhausted} value={Math.min(draft.disk, Math.max(10, available.disk))} min={10} max={Math.max(10, available.disk)} step={10} valueLabel={`${isTeam ? draft.disk : Math.min(draft.disk, Math.max(10, available.disk))} GB`} minLabel="최소 10 GB" maxLabel={`최대 ${available.disk} GB · 남은 할당량`} helper="SSD는 나중에 줄일 수 없습니다. 늘리는 것만 가능합니다." showHelper onChange={disk => changeDraft({ disk })} />
            <Hint>최대값은 {isTeam ? '팀 남은 할당량' : '남은 할당량'}과 한 Node에 들어가는 크기 중 작은 쪽입니다.{isTeam && ' 팀 VM은 팀 할당량으로 세고, 만든 사람의 개인 할당량은 줄지 않습니다.'}</Hint>
          </Stack>
        </Surface>
        <Surface><SurfaceTitle>운영체제</SurfaceTitle><OsSelector value={draft.os} onChange={os => changeDraft({ os })} /></Surface>
        {isTeam ? <Surface>
          <SurfaceTitle>선택한 환경</SurfaceTitle>
          <DataRows>
            <DataRow><Octicon name="server" /><Fact><FactLabel>사양</FactLabel><FactValue>{draft.cpu} vCPU · RAM {draft.memory} GB · SSD {draft.disk} GB</FactValue></Fact></DataRow>
            <DataRow><Octicon name="gear" /><Fact><FactLabel>운영체제 · Node</FactLabel><FactValue>{draft.os} · 자원이 많이 남은 Node에 자동 배분</FactValue></Fact></DataRow>
            <DataRow><Octicon name="organization" /><Fact><FactLabel>팀 할당량</FactLabel><FactValue>현재 {quota.cpu}/{quota.cpuLimit} vCPU · RAM {quota.memory}/{quota.memoryLimit} GB · SSD {quota.disk}/{quota.diskLimit} GB<br />요청 포함 {included.cpu}/{quota.cpuLimit} vCPU · RAM {included.memory}/{quota.memoryLimit} GB · SSD {included.disk}/{quota.diskLimit} GB<br />요청 후 남은 할당량 vCPU {available.cpu - draft.cpu} · RAM {available.memory - draft.memory} GB · SSD {available.disk - draft.disk} GB</FactValue></Fact></DataRow>
            <DataRow><Octicon name="calendar" /><Fact><FactLabel>사용 기간</FactLabel><FactValue>생성부터 30일 · 만료 7일 전부터 기존 만료일에 14일씩 연장</FactValue></Fact></DataRow>
          </DataRows>
        </Surface> : <Surface>
          <SurfaceTitle>기본 환경</SurfaceTitle>
          <DataRows>
            <DataRow><Octicon name="server" /><Fact><FactLabel>Node 배치</FactLabel><FactValue>자동 배분 · 자원이 많이 남은 Node에 만듭니다</FactValue></Fact></DataRow>
            <DataRow><Octicon name="calendar" /><Fact><FactLabel>사용 기간</FactLabel><FactValue>생성 후 7일 · 만료 7일 전부터 기존 만료일에 14일씩 연장</FactValue></Fact></DataRow>
          </DataRows>
        </Surface>}
      </>}

      {step === 'details' && <>
        {isTeam && <Surface>
          <SurfaceTitle>선택한 환경</SurfaceTitle>
          <DataRows>
            <InlineFact label="소유자" icon="organization" value={`${teamName} · ${team?.my_role === 'devops' ? 'DevOps' : '팀장'} ${creatorName}`} />
            <InlineFact label="사양 · 운영체제" icon="cpu" value={<>{draft.cpu} vCPU · RAM {draft.memory} GB · SSD {draft.disk} GB<br />{draft.os} · 자원이 많이 남은 Node에 자동 배분</>} />
            <InlineFact label="요청 후 팀 사용량" icon="organization" value={`${included.cpu}/${quota.cpuLimit} vCPU · RAM ${included.memory}/${quota.memoryLimit} GB · SSD ${included.disk}/${quota.diskLimit} GB · 남은 할당량 vCPU ${available.cpu - draft.cpu} · RAM ${available.memory - draft.memory} GB · SSD ${available.disk - draft.disk} GB`} />
            <InlineFact label="사용 기간" icon="calendar" value="생성부터 30일 · 만료 7일 전부터 +14일 연장" />
          </DataRows>
        </Surface>}
        <Surface>
          <SurfaceTitle>이름·사용 목적</SurfaceTitle>
          <Field>VM 이름<Input value={draft.name} maxLength={40} onChange={event => changeDraft({ name: event.currentTarget.value })} aria-describedby="vm-name-hint" /></Field>
          <Hint id="vm-name-hint">{isTeam ? '같은 팀 안에서 중복 불가 · ' : ''}최대 40자 · 영문·숫자로 시작 · 영문, 숫자, 하이픈, 밑줄.{isTeam ? ' ' : ' 같은 소유자 안에서 중복될 수 없습니다. '}비우면 자동 이름을 사용합니다.</Hint>
          <Field><LabelWithRequired>사용 목적</LabelWithRequired><Textarea value={draft.purpose} maxLength={100} onChange={event => changeDraft({ purpose: event.currentTarget.value })} /></Field>
          <Hint>100자 이내 · 공백만 입력할 수 없습니다.{isTeam && ' 관리자가 목적을 확인합니다.'}</Hint>
        </Surface>
        {!isTeam && <Banner><Octicon name="info" size={20} /><BannerCopy><strong>서비스 이용 목적을 구체적으로 적어주세요</strong><span>관리자가 확인하며, 기준에 맞지 않는 용도로 사용하면 VM이 삭제될 수 있습니다.</span></BannerCopy></Banner>}
        {!isTeam && <Surface>
          <SurfaceTitle>선택한 환경</SurfaceTitle>
          <Accent>소유자　나 · 김지민　/　개인 VM</Accent>
          <Hint>요청 후 {included.cpu}/{quota.cpuLimit} vCPU · RAM {included.memory}/{quota.memoryLimit} GB · SSD {included.disk}/{quota.diskLimit} GB · 남은 할당량 vCPU {available.cpu - draft.cpu} · RAM {available.memory - draft.memory} GB · SSD {available.disk - draft.disk} GB · 생성 후 7일</Hint>
          <DataRows>
            <InlineFact label="사양" icon="cpu" value={`${draft.cpu} vCPU · RAM ${draft.memory} GB · SSD ${draft.disk} GB`} />
            <InlineFact label="운영체제 · Node" icon="server" value={`${draft.os} · 자원이 많이 남은 Node에 자동 배분`} />
          </DataRows>
        </Surface>}
      </>}

      {step === 'review' && <>
        <Surface>
          <SelectionTitle>{draft.name.trim() || `${isTeam ? 'team-vm' : 'vm'}-${String(state.sequence).padStart(3, '0')}`}</SelectionTitle>
          {!isTeam && <Accent>소유자　나 · 김지민　/　개인 VM</Accent>}
          {isTeam ? <ReviewRows>
            <InlineFact icon="organization" label="소유자" value={`${teamName} · 팀 VM / 요청자 ${creatorName}(${team?.my_role === 'devops' ? 'DevOps' : '팀장'})`} />
            <InlineFact icon="file-code" label="사용 목적" value={draft.purpose} />
            <InlineFact icon="server" label="사양" value={`${draft.cpu} vCPU · RAM ${draft.memory} GB · SSD ${draft.disk} GB`} />
            <InlineFact icon="gear" label="운영체제 · Node" value={`${draft.os} · 자원이 많이 남은 Node에 자동 배분`} />
            <InlineFact icon="calendar" label="첫 만료" value="생성 완료 시각부터 30일 · 정확한 만료일은 생성 후 확정" />
            <InlineFact icon="clock" label="연장" value="만료 7일 전부터 모든 팀원이 기존 만료일에 14일씩 연장할 수 있습니다." />
          </ReviewRows> : <ReviewRows>
            <InlineFact icon="file-code" label="사용 목적" value={draft.purpose} action={<TextButton type="button" onClick={() => navigate(`${prefix}/details`)}><Octicon name="pencil" />수정</TextButton>} />
            <InlineFact icon="cpu" label="사양" value={`${draft.cpu} vCPU · RAM ${draft.memory} GB · SSD ${draft.disk} GB`} action={<TextButton type="button" onClick={() => navigate(prefix)}><Octicon name="pencil" />변경</TextButton>} />
            <InlineFact icon="terminal" label="운영체제" value={draft.os} />
            <InlineFact icon="server" label="Node 배치" value="자원이 많이 남은 Node에 자동 배분" />
            <InlineFact icon="calendar" label="만료 예정일" value="생성 완료 시각부터 7일 · 정확한 만료일은 생성 후 확정" />
          </ReviewRows>}
        </Surface>
        {isTeam ? <Surface>
          <SurfaceTitle>요청 후 팀 할당량 · 소형</SurfaceTitle>
          <TablelessQuota>
            <QuotaRow label="vCPU" value={included.cpu} total={quota.cpuLimit} unit="" />
            <QuotaRow label="RAM" value={included.memory} total={quota.memoryLimit} unit="GB" />
            <QuotaRow label="SSD" value={included.disk} total={quota.diskLimit} unit="GB" />
            <Hint>현재 사용량은 {quota.cpu === 0 && quota.memory === 0 && quota.disk === 0 ? '0입니다. 생성 대기 요청도 팀 사용량에 포함되며, 김지민의 개인 할당량은 그대로입니다.' : '팀 사용량에 요청이 포함됩니다.'}</Hint>
          </TablelessQuota>
        </Surface> : <Banner $tone="primary"><Octicon name="clock" size={20} /><BannerCopy><Accent>요청이 접수되면 홈으로 이동합니다</Accent><span>대기 순번과 생성 단계를 홈에서 확인할 수 있습니다. 차례가 오면 생성에 1–3분이 걸리며, 이후 초기 설정을 진행합니다. 다른 화면으로 이동해도 작업은 계속됩니다.</span></BannerCopy></Banner>}
        {isTeam && <Banner><Octicon name="info" size={20} /><BannerCopy><strong>팀 범위에서 생성 진행을 확인하세요</strong><span>팀의 할당량과 팀 전체 자원 여유를 확인한 뒤 요청을 접수합니다. 차례가 오면 생성하고 초기 설정을 진행합니다.</span></BannerCopy></Banner>}
        {isTeam ? <Fact><FactLabel>요청 전 확인</FactLabel><FactValue>팀 VM도 만료 시 정지되고 3일 유예 후 삭제됩니다. 팀원 모두에게 알림을 보냅니다.</FactValue></Fact> : <Surface>
          <SurfaceTitle>요청 전 확인</SurfaceTitle>
          <ReviewRows>
            <InlineFact icon="server" label="개인 할당량" value={`이 요청을 포함하면 vCPU ${included.cpu}/${quota.cpuLimit} · RAM ${included.memory}/${quota.memoryLimit}GB · SSD ${included.disk}/${quota.diskLimit}GB · ${included.cpu >= quota.cpuLimit && included.memory >= quota.memoryLimit && included.disk >= quota.diskLimit ? '남은 할당량 없음' : `남은 할당량 vCPU ${Math.max(0, quota.cpuLimit - included.cpu)} · RAM ${Math.max(0, quota.memoryLimit - included.memory)}GB · SSD ${Math.max(0, quota.diskLimit - included.disk)}GB`}`} />
            <InlineFact icon="info" label="이용 규칙" value="만료 7일 전부터 +14일 연장 · 만료 시 정지 · 3일 유예 후 삭제" />
          </ReviewRows>
        </Surface>}
      </>}
      </>}

      {error && <Banner role="alert"><Octicon name="alert" size={20} /><BannerCopy>{error}</BannerCopy></Banner>}
      {notice && <Hint role="status">{notice}</Hint>}
    </DemoPage>
    {reauthenticate && <ModalSurface labelledBy="vm-create-reauth-title" onDismiss={() => void navigate('/')}>
      <RequestDialog>
        <SurfaceTitle id="vm-create-reauth-title"><Octicon name="lock" size={24} /> 다시 로그인해 주세요</SurfaceTitle>
        <Hint>세션이 만료됐습니다. 로그인 후 지금 보던 화면으로 돌아옵니다.</Hint>
        <Hint>· 작성 중이던 VM 생성 내용은 보존됩니다.</Hint>
        <TopActions><PrimaryButton icon={<Octicon name="sign-in" />} onClick={() => {
          saveDemoVmDraft(owner, draft);
          const returnTo = location.pathname + location.search;
          void navigate('/login?returnTo=' + encodeURIComponent(returnTo));
        }}>DataGSM으로 로그인</PrimaryButton></TopActions>
      </RequestDialog>
    </ModalSurface>}
    {sharedQuotaBlocked && !reauthenticate && <ModalSurface labelledBy="vm-create-shared-quota-title" onDismiss={() => setSharedQuotaBlocked(false)}>
      <RequestDialog>
        <SurfaceTitle id="vm-create-shared-quota-title"><Octicon name="alert" size={24} /> 지금은 학생 전체 자원이 부족합니다</SurfaceTitle>
        <Hint>내 할당량은 남아 있지만, 학생 전체 몫이 모두 사용 중입니다. 잠시 후 다시 시도하세요.</Hint>
        <TopActions>
          <Button variant="secondary" icon={<Octicon name="pulse" />} onClick={() => void navigate('/status')}>서비스 상태</Button>
          <PrimaryButton icon={<Octicon name="sync" />} onClick={createRequest}>다시 시도</PrimaryButton>
        </TopActions>
      </RequestDialog>
    </ModalSurface>}
    {step === 'spec' && !isTeam && quotaExhausted && personalQuotaDialog && load.status === 'ready' && !reauthenticate && <ModalSurface labelledBy="vm-create-personal-quota-title" onDismiss={() => setPersonalQuotaDialog(false)}>
      <RequestDialog>
        <SurfaceTitle id="vm-create-personal-quota-title"><Octicon name="cpu" size={24} /> 개인 할당량을 모두 사용하고 있습니다</SurfaceTitle>
        <Hint>· vCPU {quota.cpu}/{quota.cpuLimit} · RAM {quota.memory}/{quota.memoryLimit}GB · SSD {quota.disk}/{quota.diskLimit}GB · {available.cpu === 0 && available.memory === 0 && available.disk === 0 ? '남은 할당량 없음' : `남은 할당량 vCPU ${available.cpu} · RAM ${available.memory}GB · SSD ${available.disk}GB`}</Hint>
        <Hint>· 대기 중인 생성 요청도 할당량에 포함됩니다.</Hint>
        <Hint>· 사용하지 않는 VM을 삭제하면 다시 만들 수 있습니다.</Hint>
        <Hint>· 더 필요하면 팀을 만들어 팀 VM을 사용하세요.</Hint>
        <TopActions>
          <Button variant="secondary" icon={<Octicon name="home" />} onClick={() => void navigate('/')}>내 Resources</Button>
          <PrimaryButton icon={<Octicon name="people" />} onClick={() => void navigate('/teams/new')}>팀 만들기</PrimaryButton>
        </TopActions>
      </RequestDialog>
    </ModalSurface>}
    {validation && <ModalSurface labelledBy="vm-create-validation-title" onDismiss={() => setValidation(null)}>
      <RequestDialog>
        <SurfaceTitle id="vm-create-validation-title"><Octicon name="alert" size={24} /> 입력 내용을 확인해 주세요</SurfaceTitle>
        <Hint>{validation.summary}</Hint>
        <DialogField>VM 이름<Input value={draft.name} maxLength={40} aria-invalid={Boolean(validation.name)} onChange={event => changeDraft({ name: event.currentTarget.value })} />{validation.name && <FieldError>{validation.name}</FieldError>}</DialogField>
        <DialogField><LabelWithRequired>사용 목적</LabelWithRequired><Textarea value={draft.purpose} maxLength={100} placeholder="내용을 입력하세요" aria-invalid={Boolean(validation.purpose)} onChange={event => changeDraft({ purpose: event.currentTarget.value })} />{validation.purpose && <FieldError>{validation.purpose}</FieldError>}</DialogField>
        <TopActions><PrimaryButton icon={<Octicon name="arrow-left" />} onClick={() => setValidation(null)}>입력으로 돌아가기</PrimaryButton></TopActions>
      </RequestDialog>
    </ModalSurface>}
    {createFailed && <ModalSurface labelledBy="vm-create-failed-title" onDismiss={() => setCreateFailed(false)}>
      <RequestDialog>
        <SurfaceTitle id="vm-create-failed-title"><Octicon name="alert" size={24} /> VM을 만들지 못했습니다</SurfaceTitle>
        <Hint>사용 가능한 자원이 부족합니다. 잠시 후 다시 시도하거나 설정을 바꿔 주세요.</Hint>
        <Hint>· {draft.name.trim() || `${isTeam ? 'team-vm' : 'vm'}-${String(state.sequence).padStart(3, '0')}`} · {draft.cpu} vCPU / {draft.memory}GB / {draft.disk}GB</Hint>
        <Hint>· 이름과 사용 목적은 그대로 보관했습니다.</Hint>
        <TopActions>
          <Button variant="ghost" onClick={() => setCreateFailed(false)}>닫기</Button>
          <Button variant="secondary" icon={<Octicon name="pencil" />} onClick={() => { setCreateFailed(false); navigate(prefix); }}>설정 수정</Button>
          <PrimaryButton icon={<Octicon name="sync" />} onClick={createRequest}>같은 설정으로 재시도</PrimaryButton>
        </TopActions>
      </RequestDialog>
    </ModalSurface>}
    {teamQuotaShortfall && !quotaRequestOpen && <ModalSurface labelledBy="vm-create-team-quota-title" onDismiss={() => setTeamQuotaShortfall(null)}>
      <RequestDialog>
        <SurfaceTitle id="vm-create-team-quota-title"><Octicon name="cpu" size={24} /> 팀 할당량이 부족합니다</SurfaceTitle>
        <Hint>{draft.cpu} vCPU · RAM {draft.memory} GB · SSD {draft.disk} GB를 만들려면 {formatShortfall(teamQuotaShortfall)}가 더 필요합니다.</Hint>
        <Hint>· {teamName} · vCPU {quota.cpu}/{quota.cpuLimit} · RAM {quota.memory}/{quota.memoryLimit}GB · SSD {quota.disk}/{quota.diskLimit}GB</Hint>
        <TopActions>
          <Button variant="secondary" icon={<Octicon name="pencil" />} onClick={() => { setTeamQuotaShortfall(null); navigate(prefix); }}>사양 줄이기</Button>
          <PrimaryButton icon={<Octicon name="graph" />} onClick={() => setQuotaRequestOpen(true)}>할당량 늘리기 요청</PrimaryButton>
        </TopActions>
      </RequestDialog>
    </ModalSurface>}
    {quotaRequestOpen && <TeamQuotaRequestDialog
      onDismiss={() => setQuotaRequestOpen(false)}
      onSubmit={(tier, reason) => {
        if (!createDemoTeamQuotaRequest(teamId, tier, reason)) return false;
        setQuotaRequestOpen(false);
        setTeamQuotaShortfall(null);
        setNotice('할당량 요청을 보냈습니다. 관리자가 승인하면 팀원 전원에게 알립니다.');
        return true;
      }}
    />}
  </DemoShell>;
}

function QuotaRow({ label, value, total, unit }: { label: string; value: number; total: number; unit: string }) {
  return <div><Row><FactLabel>{label}</FactLabel><FactValue>{value} / {total}{unit}</FactValue></Row><QuotaTrack><QuotaFill $percent={value / total * 100} /></QuotaTrack></div>;
}

function TeamMemberCreateBlocked({ teamId, teamName, memberName }: { teamId: string; teamName: string; memberName: string }) {
  const navigate = useNavigate();
  const teamHome = `/teams/${encodeURIComponent(teamId)}`;
  return <DemoShell activeItem="vm-create" scopeLabel={`${teamName} · 일반 팀원`} teamScopeId={teamId} userName={memberName}>
    <DemoPage>
      <Breadcrumb>{teamName} / 팀 VM 만들기</Breadcrumb>
      <Title>팀에 필요한 환경을 선택하세요</Title>
    </DemoPage>
    <ModalSurface labelledBy="vm-create-team-member-title" onDismiss={() => void navigate(teamHome)}>
      <RequestDialog>
        <SurfaceTitle id="vm-create-team-member-title"><Octicon name="lock" size={24} /> 일반 팀원은 팀 VM을 만들 수 없습니다</SurfaceTitle>
        <Hint>{teamName} · {memberName}(일반 팀원). 개인 VM은 만들 수 있지만, 팀 생성은 팀장·DevOps에게 요청해야 합니다.</Hint>
        <TopActions>
          <Button variant="secondary" icon={<Octicon name="plus" />} onClick={() => void navigate('/vms/new')}>개인 VM 만들기</Button>
          <PrimaryButton disabled icon={<Octicon name="plus" />}>팀 VM 생성</PrimaryButton>
        </TopActions>
        <Hint>필요 역할: 팀장 또는 DevOps · 내 역할: 일반 팀원</Hint>
      </RequestDialog>
    </ModalSurface>
  </DemoShell>;
}

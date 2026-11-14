import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoVmDraft, getDemoVmState, makeDemoVm, resetDemoVmDraft, saveDemoVmDraft, saveDemoVmState, type VmDraft, type VmOwner } from '../../entities/vm';
import { isDemoMode } from '../../shared/demo';
import { SliderField, StepConnector, StepIndicator } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import {
  Banner, BannerCopy, Breadcrumb, DemoPage, DemoShell, Fact, FactLabel, FactValue, Field, Hint, InlineFact,
  Input, OsSelector, PrimaryButton, Row, Stack, Surface, SurfaceTitle, Textarea,
} from './VmDemoPrimitives';

const Steps = styled.nav`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StepArea = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StepHead = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-weight: 500;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const RequestMeta = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 32px;
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

export type VmCreateStep = 'spec' | 'details' | 'review';

export function VmCreatePage({ owner, step }: { owner: VmOwner; step: VmCreateStep }) {
  const navigate = useNavigate();
  const { teamId: routeTeamId } = useParams<{ teamId: string }>();
  const [draft, setDraft] = useState<VmDraft>(() => getDemoVmDraft(owner));
  const [state, setState] = useState(() => getDemoVmState());
  const [error, setError] = useState('');
  const isTeam = owner === 'team';
  const teamId = routeTeamId || 'gsm-connect';
  const prefix = isTeam ? `/teams/${teamId}/vms/new` : '/vms/new';

  useEffect(() => saveDemoVmDraft(owner, draft), [draft, owner]);

  const quota = isTeam ? state.teamQuota : state.personalQuota;
  const available = useMemo(() => ({
    cpu: quota.cpuLimit - quota.cpu,
    memory: quota.memoryLimit - quota.memory,
    disk: quota.diskLimit - quota.disk,
  }), [quota]);
  const included = { cpu: quota.cpu + draft.cpu, memory: quota.memory + draft.memory, disk: quota.disk + draft.disk };

  if (!isDemoMode()) return <Navigate to="/" replace />;

  function changeDraft(updates: Partial<VmDraft>) {
    setDraft(current => ({ ...current, ...updates }));
    setError('');
  }

  function validDraft() {
    if (!draft.purpose.trim() || draft.purpose.trim().length > 100) {
      setError('사용 목적을 100자 이내로 입력해 주세요. 공백만 입력할 수 없습니다.');
      return false;
    }
    if (draft.name.trim().length > 40 || (draft.name.trim() && !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(draft.name.trim()))) {
      setError('VM 이름은 영문·숫자로 시작하며 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.');
      return false;
    }
    const duplicate = state.vms.some(vm => vm.owner === owner && (isTeam ? vm.teamId === 'gsm-connect' : true) && vm.name.toLowerCase() === draft.name.trim().toLowerCase());
    if (draft.name.trim() && duplicate) {
      setError('같은 소유자 안에서 VM 이름을 중복해서 사용할 수 없습니다.');
      return false;
    }
    if (draft.cpu > available.cpu || draft.memory > available.memory || draft.disk > available.disk) {
      setError('남은 할당량 안에서 사양을 선택해 주세요.');
      return false;
    }
    return true;
  }

  function next() {
    if (step === 'spec') navigate(`${prefix}/details`);
    else if (step === 'details' && validDraft()) navigate(`${prefix}/review`);
  }

  function back() {
    navigate(step === 'review' ? `${prefix}/details` : step === 'details' ? prefix : (isTeam ? '/teams/gsm-connect' : '/'));
  }

  function createRequest() {
    if (!validDraft()) return;
    const { state: nextState, vm } = makeDemoVm(state, draft, owner, teamId);
    saveDemoVmState(nextState);
    setState(nextState);
    resetDemoVmDraft(owner);
    navigate(isTeam ? `/teams/${vm.teamId}/vms/${vm.id}` : `/vms/${vm.id}`);
  }

  const heading = step === 'spec'
    ? (isTeam ? '팀에 필요한 환경을 선택하세요' : '어떤 환경이 필요합니까?')
    : step === 'details'
      ? (isTeam ? '팀 VM의 이름과 목적을 알려주세요' : 'VM에 이름과 목적을 알려주세요')
      : (isTeam ? '이 설정으로 팀 VM을 만드시겠습니까?' : '이 설정으로 VM을 만드시겠습니까?');

  return <DemoShell activeItem="vm-create" scopeLabel={isTeam ? 'GSM Connect · 팀장' : '내 Resources'} userName={isTeam ? '김지민' : '김지민'} hasUnsavedInput={step === 'details'}>
    <DemoPage>
      <Breadcrumb>{isTeam ? 'GSM Connect / 팀 VM 만들기' : 'VM 생성'}</Breadcrumb>
      <StepHead>
        <SelectionTitle as="h1">{heading}</SelectionTitle>
        <TopActions>
          {step !== 'spec' && <TextButton type="button" onClick={back}><Octicon name="arrow-left" />{step === 'review' ? '이전: 이름·목적' : '이전: 사양'}</TextButton>}
          {step === 'review'
            ? <PrimaryButton onClick={createRequest} icon={<Octicon name="plus" />}>{isTeam ? '팀 VM 생성 요청' : 'VM 생성 요청'}</PrimaryButton>
            : <PrimaryButton onClick={next} icon={<Octicon name="arrow-right" />} iconPosition="end">{step === 'spec' ? '다음: 이름·목적' : '다음: 확인'}</PrimaryButton>}
        </TopActions>
      </StepHead>
      <Steps aria-label="VM 생성 단계">
        <StepArea><StepIndicator number={1} label="사양" active={step === 'spec'} /><StepConnector /></StepArea>
        <StepArea><StepIndicator number={2} label="이름·목적" active={step === 'details'} /><StepConnector /></StepArea>
        <StepIndicator number={3} label="확인" active={step === 'review'} />
      </Steps>

      {step === 'spec' && <>
        <Surface>
          <Row><SurfaceTitle>사양</SurfaceTitle><Hint>{isTeam ? '팀 할당량 · 소형' : '개인 할당량'} vCPU {quota.cpu}/{quota.cpuLimit} · RAM {quota.memory}/{quota.memoryLimit} GB · SSD {quota.disk}/{quota.diskLimit} GB 사용 중 · 남은 할당량 vCPU {available.cpu} · RAM {available.memory} GB · SSD {available.disk} GB</Hint></Row>
          <Stack>
            <SliderField label="vCPU" value={draft.cpu} min={1} max={Math.max(1, available.cpu)} valueLabel={`${draft.cpu} vCPU`} minLabel="최소 1" maxLabel={`최대 ${available.cpu} · 남은 할당량`} onChange={cpu => changeDraft({ cpu })} />
            <SliderField label="RAM" value={draft.memory} min={1} max={Math.max(1, available.memory)} valueLabel={`${draft.memory} GB`} minLabel="최소 1 GB" maxLabel={`최대 ${available.memory} GB · 남은 할당량`} onChange={memory => changeDraft({ memory })} />
            <SliderField label="SSD" value={draft.disk} min={10} max={Math.max(10, available.disk)} step={10} valueLabel={`${draft.disk} GB`} minLabel="최소 10 GB" maxLabel={`최대 ${available.disk} GB · 남은 할당량`} helper="SSD는 나중에 줄일 수 없습니다. 늘리는 것만 가능합니다." showHelper onChange={disk => changeDraft({ disk })} />
            <Hint>최대값은 {isTeam ? '팀 남은 할당량' : '남은 할당량'}과 한 Node에 들어가는 크기 중 작은 쪽입니다.{isTeam && ' 팀 VM은 팀 할당량으로 세고, 만든 사람의 개인 할당량은 줄지 않습니다.'}</Hint>
          </Stack>
        </Surface>
        <Surface><SurfaceTitle>운영체제</SurfaceTitle><OsSelector value={draft.os} onChange={os => changeDraft({ os })} /></Surface>
        {isTeam ? <Surface>
          <SurfaceTitle>선택한 환경</SurfaceTitle>
          <DataRows>
            <DataRow><Octicon name="organization" /><Fact><FactLabel>사양</FactLabel><FactValue>{draft.cpu} vCPU · RAM {draft.memory} GB · SSD {draft.disk} GB</FactValue></Fact></DataRow>
            <DataRow><Octicon name="server" /><Fact><FactLabel>운영체제 · Node</FactLabel><FactValue>{draft.os} · 자원이 많이 남은 Node에 자동 배분</FactValue></Fact></DataRow>
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
            <InlineFact label="소유자" icon="organization" value="GSM Connect · 팀장 김지민" />
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
          {!isTeam && <Banner><Octicon name="info" size={20} /><BannerCopy><strong>서비스 이용 목적을 구체적으로 적어주세요</strong><span>관리자가 확인하며, 기준에 맞지 않는 용도로 사용하면 VM이 삭제될 수 있습니다.</span></BannerCopy></Banner>}
        </Surface>
        {!isTeam && <Surface>
          <SurfaceTitle>선택한 환경</SurfaceTitle>
          <Accent>소유자　나 · 김지민　/　개인 VM</Accent>
          <Hint>요청 후 {included.cpu}/{quota.cpuLimit} vCPU · RAM {included.memory}/{quota.memoryLimit} GB · SSD {included.disk}/{quota.diskLimit} GB · 남은 할당량 없음 · 생성 후 7일</Hint>
          <DataRows>
            <InlineFact label="사양" icon="cpu" value={`${draft.cpu} vCPU · RAM ${draft.memory} GB · SSD ${draft.disk} GB`} />
            <InlineFact label="운영체제 · Node" icon="server" value={`${draft.os} · 자원이 많이 남은 Node에 자동 배분`} />
          </DataRows>
        </Surface>}
      </>}

      {step === 'review' && <>
        <Surface>
          <SelectionTitle>{draft.name.trim() || `${isTeam ? 'team-vm' : 'vm'}-${String(state.sequence).padStart(3, '0')}`}</SelectionTitle>
          <Accent>{isTeam ? 'GSM Connect · 팀 VM / 요청자 김지민(팀장)' : '소유자　나 · 김지민　/　개인 VM'}</Accent>
          <DataRows>
            <InlineFact label="사용 목적" value={draft.purpose} />
            {isTeam && <InlineFact label="소유자" value="GSM Connect · 팀 VM / 요청자 김지민(팀장)" />}
            {!isTeam && <InlineFact label="사양" value={`${draft.cpu} vCPU · RAM ${draft.memory} GB · SSD ${draft.disk} GB`} />}
            <InlineFact label="운영체제 · Node" value={`${draft.os} · 자원이 많이 남은 Node에 자동 배분`} />
            <InlineFact label={isTeam ? '첫 만료' : '만료 예정일'} value={`생성 완료 시각부터 ${isTeam ? '30일' : '7일'} · 정확한 만료일은 생성 후 확정`} />
            {isTeam && <InlineFact label="연장" value="만료 7일 전부터 모든 팀원이 기존 만료일에 14일씩 연장할 수 있습니다." />}
          </DataRows>
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
        {isTeam && <Banner><Octicon name="info" size={20} /><BannerCopy><Accent>팀 범위에서 생성 진행을 확인하세요</Accent><span>팀의 할당량과 팀 전체 자원 여유를 확인한 뒤 요청을 접수합니다. 차례가 오면 생성하고 초기 설정을 진행합니다.</span></BannerCopy></Banner>}
        <Surface>
          <SurfaceTitle>요청 전 확인</SurfaceTitle>
          <RequestMeta>
            {!isTeam && <Fact><FactLabel>개인 할당량</FactLabel><FactValue>이 요청을 포함하면 vCPU {included.cpu}/{quota.cpuLimit} · RAM {included.memory}/{quota.memoryLimit} GB · SSD {included.disk}/{quota.diskLimit} GB · 남은 할당량 없음</FactValue></Fact>}
            <Fact><FactLabel>이용 규칙</FactLabel><FactValue>만료 7일 전부터 +14일 연장 · 만료 시 정지 · 3일 유예 후 삭제</FactValue></Fact>
            {isTeam && <Fact><FactLabel>요청 후 팀 사용량</FactLabel><FactValue>vCPU {included.cpu}/{quota.cpuLimit} · RAM {included.memory}/{quota.memoryLimit} GB · SSD {included.disk}/{quota.diskLimit} GB</FactValue></Fact>}
            {isTeam && <Fact><FactLabel>사용 기간</FactLabel><FactValue>생성부터 30일 · 만료 7일 전부터 모든 팀원이 기존 만료일에 14일씩 연장할 수 있습니다.</FactValue></Fact>}
          </RequestMeta>
        </Surface>
      </>}

      {error && <Banner role="alert"><Octicon name="alert" size={20} /><BannerCopy>{error}</BannerCopy></Banner>}
      <Divider />
      <Hint>{isTeam ? '팀 VM도 만료 시 정지되고 3일 유예 후 삭제됩니다. 팀원 모두에게 알림을 보냅니다.' : 'VM 생성 요청은 로컬 미리보기에서만 반영됩니다.'}</Hint>
    </DemoPage>
  </DemoShell>;
}

function QuotaRow({ label, value, total, unit }: { label: string; value: number; total: number; unit: string }) {
  return <div><Row><FactLabel>{label}</FactLabel><FactValue>{value} / {total}{unit}</FactValue></Row><QuotaTrack><QuotaFill $percent={value / total * 100} /></QuotaTrack></div>;
}

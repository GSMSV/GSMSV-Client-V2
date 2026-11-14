import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { canExtendDemoTeamVm, getDemoVmDaysRemaining, getDemoVmState, saveDemoVmState } from '../../entities/vm';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { ModalSurface } from '../../shared/ui/feedback/ModalSurface';
import { Octicon } from '../../shared/ui/icons';
import { Banner, BannerCopy, Breadcrumb, DemoPage, DemoShell, DetailTabs, Fact, FactLabel, FactValue, Facts, Grid2, Hint, MetricCard, MetricLabel, MetricValue, Row, Surface, SurfaceTitle } from './VmDemoPrimitives';

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const StatusLine = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.primary};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const PowerActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

const TwoColumn = styled(Grid2)`
  grid-template-columns: 1fr 1fr;
`;

const KVPairs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SSHLine = styled.code`
  display: block;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;

const NumberLine = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  color: ${({ theme }) => theme.colors.faint};
`;

const PowerPanel = styled.div`
  display: flex;
  width: min(480px, calc(100vw - 48px));
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const PowerTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const PowerCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const PowerActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

type PowerDialog = 'graceful-progress' | 'force-confirm' | 'force-progress' | 'restart-progress' | null;
type PowerOperation = 'normal' | 'force' | 'restart' | null;

export function VmOverviewPage() {
  const { vmId, teamId: routeTeamId } = useParams<{ vmId: string; teamId?: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState(() => getDemoVmState());
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notice, setNotice] = useState('');
  const [powerDialog, setPowerDialog] = useState<PowerDialog>(null);
  const [powerOperation, setPowerOperation] = useState<PowerOperation>(null);
  const powerTimer = useRef<number | null>(null);
  const vm = useMemo(() => state.vms.find(item => item.id === vmId), [state.vms, vmId]);

  if (!isDemoMode()) return <Navigate to="/" replace />;
  if (!vm) return <Navigate to={window.location.pathname.startsWith('/teams/') ? `/teams/${encodeURIComponent(routeTeamId ?? 'demo-team')}/vms` : '/'} replace />;
  if (routeTeamId && (vm.owner !== 'team' || vm.teamId !== routeTeamId)) {
    return <Navigate to={`/teams/${encodeURIComponent(routeTeamId)}`} replace />;
  }
  if (!routeTeamId && vm.owner === 'team' && vm.teamId) {
    return <Navigate to={`/teams/${encodeURIComponent(vm.teamId)}`} replace />;
  }
  const vmRecord = vm;

  const memberReadOnly = vmRecord.owner === 'team' && vmRecord.role === 'member';
  const teamDaysRemaining = vmRecord.owner === 'team' ? getDemoVmDaysRemaining(vmRecord.expiresAt) : undefined;
  const canExtendTeamVm = vmRecord.owner !== 'team' || canExtendDemoTeamVm(vmRecord);
  const vmRoute = vmRecord.owner === 'team' && vmRecord.teamId
    ? `/teams/${encodeURIComponent(vmRecord.teamId)}/vms/${encodeURIComponent(vmRecord.id)}`
    : `/vms/${encodeURIComponent(vmRecord.id)}`;
  const title = vmRecord.name;
  const subtitle = vmRecord.status === 'queued'
    ? '요청 대기 중 · 생성 진행은 홈에서 확인할 수 있습니다'
    : `${vmRecord.status === 'running' ? '실행 중' : '정지됨'} · ${vmRecord.os} · ${vmRecord.grn}`;
  const expiryCaption = vmRecord.owner === 'team'
    ? `${vmRecord.expiresAt} 만료 · 만료 7일 전부터 모든 팀원이 연장할 수 있습니다.`
    : `${vmRecord.expiresAt}에 만료됩니다. 지금 연장하면 14일 더 사용할 수 있습니다.`;

  function persist(update: (current: typeof state) => typeof state) {
    setState(current => {
      const next = update(current);
      saveDemoVmState(next);
      return next;
    });
  }

  function finishPowerOperation(action: Exclude<PowerOperation, null>) {
    const current = getDemoVmState();
    const currentVm = current.vms.find(item => item.id === vmRecord.id);
    if (!currentVm || currentVm.status !== 'running') {
      setState(current);
      setPowerOperation(null);
      setPowerDialog(null);
      powerTimer.current = null;
      return;
    }
    const next = { ...current, vms: current.vms.map(item => item.id === vmRecord.id
      ? action === 'restart'
        ? { ...item, status: 'running' as const, lastRestartedAt: new Date().toISOString() }
        : { ...item, status: 'stopped' as const }
      : item) };
    if (!saveDemoVmState(next)) {
      setNotice('전원 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
    } else {
      setState(next);
      setNotice(action === 'normal' ? 'VM을 정상 종료했습니다.' : action === 'force' ? 'VM을 강제로 정지했습니다.' : 'VM을 재시작했습니다.');
    }
    setPowerOperation(null);
    setPowerDialog(null);
    powerTimer.current = null;
  }

  function beginPowerOperation(action: Exclude<PowerOperation, null>) {
    if (memberReadOnly || vmRecord.status !== 'running') return;
    if (powerOperation && !(powerOperation === 'normal' && action === 'force')) return;
    if (powerTimer.current !== null) window.clearTimeout(powerTimer.current);
    setPowerOperation(action);
    setPowerDialog(action === 'normal' ? 'graceful-progress' : action === 'restart' ? 'restart-progress' : 'force-progress');
    powerTimer.current = window.setTimeout(() => finishPowerOperation(action), action === 'normal' ? 2200 : action === 'restart' ? 1800 : 650);
  }

  function startVm() {
    if (memberReadOnly || vmRecord.status === 'queued' || vmRecord.status === 'running' || powerOperation) return;
    const current = getDemoVmState();
    const next = { ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, status: 'running' as const } : item) };
    if (saveDemoVmState(next)) {
      setState(next);
      setNotice('VM을 시작했습니다.');
    } else {
      setNotice('전원 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  function extend() {
    if (vmRecord.status === 'queued' || (vmRecord.owner === 'team' && !canExtendTeamVm)) return;
    const match = vmRecord.expiresAt.match(/(\d{4})\.(\d{2})\.(\d{2})/);
    let expiresAt = vmRecord.expiresAt;
    if (match) {
      const nextDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 14));
      expiresAt = `${nextDate.getUTCFullYear()}.${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}.${String(nextDate.getUTCDate()).padStart(2, '0')} 14:00 (KST)`;
    }
    persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, expiresAt } : item) }));
    setNotice('사용 기간을 14일 연장했습니다.');
  }

  function copy(text: string, label: string) {
    void navigator.clipboard?.writeText(text).then(() => setNotice(`${label}을(를) 복사했습니다.`)).catch(() => setNotice('클립보드에 접근할 수 없습니다.'));
  }

  const sshCommand = `ssh ${vmRecord.sshUser}@ssh.gsmsv.site -p ${vmRecord.sshPort || '배정 대기'}`;

  return <DemoShell activeItem="home" scopeLabel={vm.owner === 'team' ? `${vm.teamName ?? '팀'} · 일반 팀원` : '내 Resources'} teamScopeId={vm.owner === 'team' ? vm.teamId : undefined} userName={vm.owner === 'team' ? '윤채원' : '김지민'}>
    <DemoPage>
      <Breadcrumb>{vm.owner === 'team' ? 'GSM Connect / 팀 Resources' : '워크스페이스 / 내 Resources'}</Breadcrumb>
      <Heading><div><Title>{title}</Title><StatusLine>{subtitle}</StatusLine></div><PowerActions>
        <Button variant="secondary" disabled={memberReadOnly || vm.status === 'queued' || vm.status === 'running' || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="play" />} onClick={startVm}>시작</Button>
        <Button variant="secondary" disabled={memberReadOnly || vm.status !== 'running' || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="stop" />} onClick={() => beginPowerOperation('normal')}>정상 종료</Button>
        <Button variant="secondary" disabled={memberReadOnly || vm.status !== 'running' || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="sync" />} onClick={() => beginPowerOperation('restart')}>재시작</Button>
        <Button variant="secondary" disabled={memberReadOnly || vm.status !== 'running' || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="alert" />} onClick={() => setPowerDialog('force-confirm')}>강제 정지</Button>
        {!memberReadOnly && vm.owner === 'personal' && <Button variant="primary" icon={<Octicon name="calendar" />} onClick={extend}>14일 연장</Button>}
      </PowerActions></Heading>
      <DetailTabs vmId={vm.id} active="개요" teamId={vm.teamId} networkVmGrn={vm.grn} />

      {memberReadOnly && <Banner><Octicon name="shield" size={20} /><BannerCopy><strong>일반 팀원으로 보고 있습니다</strong><span>조회, SSH 접속 정보 확인, 사용 기간 연장을 할 수 있습니다. 전원 제어와 설정 변경은 팀장(김지민) 또는 DevOps(한도윤)가 할 수 있습니다.</span></BannerCopy></Banner>}
      <Banner $tone="primary"><Octicon name="clock" size={20} /><BannerCopy><strong>{vm.status === 'queued' ? '생성 요청이 접수되었습니다' : vmRecord.owner === 'team' && teamDaysRemaining !== undefined ? `만료까지 ${teamDaysRemaining}일 남았습니다` : '만료까지 4일 남았습니다'}</strong><span>{vm.status === 'queued' ? '대기 순번과 생성 단계를 홈에서 확인할 수 있습니다. VM 생성은 목데이터로 처리됩니다.' : expiryCaption}</span></BannerCopy>{memberReadOnly && vm.status !== 'queued' && <Button disabled={!canExtendTeamVm} title={!canExtendTeamVm ? '만료 7일 전부터 만료 시각 전까지 연장할 수 있습니다.' : undefined} onClick={extend} icon={<Octicon name="calendar" />}>14일 연장</Button>}</Banner>
      <Facts>
        <MetricCard><Row><MetricLabel><Octicon name="cpu" size={16} />　CPU</MetricLabel></Row><MetricValue>{vm.cpu} vCPU</MetricValue><Hint>{vm.nodeType}</Hint></MetricCard>
        <MetricCard><MetricLabel>메모리</MetricLabel><MetricValue>{vm.memory} GB</MetricValue><Hint>할당 메모리</Hint></MetricCard>
        <MetricCard><MetricLabel><Octicon name="database" size={16} />　디스크</MetricLabel><MetricValue>{vm.disk} GB</MetricValue><Hint>{vm.os}</Hint></MetricCard>
      </Facts>
      <TwoColumn>
        <Surface><SurfaceTitle>운영 정보</SurfaceTitle><KVPairs>
          <Fact><FactLabel>사용 목적</FactLabel><FactValue>{vm.purpose}</FactValue></Fact>
          <Fact><FactLabel>자동 Snapshot</FactLabel><FactValue>{vm.autoSnapshots ? '켜짐 · 최신 1개 보관' : '꺼짐 · 다음 자정부터 저장하지 않음'}</FactValue></Fact>
          <Fact><FactLabel>Network</FactLabel><FactValue>외부 포트 3/30 · HTTPS Domain 1/2</FactValue></Fact>
        </KVPairs><Row><Button variant="ghost" icon={<Octicon name="pencil" />} onClick={() => navigate(`${vmRoute}/settings`)}>수정</Button><Button variant="ghost" icon={<Octicon name="chevron-right" />} onClick={() => navigate(`${vmRoute}/snapshots`)}>Snapshot 관리</Button><Button variant="ghost" icon={<Octicon name="chevron-right" />} onClick={() => navigate(`${vmRecord.owner === 'team' && vmRecord.teamId ? `/teams/${encodeURIComponent(vmRecord.teamId)}/vms` : '/vms'}/${encodeURIComponent(vm.grn)}/network`)}>Network 관리</Button></Row></Surface>
        <Surface><SurfaceTitle>사용 기간</SurfaceTitle><KVPairs>
          <Fact><FactLabel>생성일</FactLabel><FactValue>{vm.createdAt}</FactValue></Fact>
          <Fact><FactLabel>만료일</FactLabel><FactValue>{vm.expiresAt}</FactValue></Fact>
          <Fact><FactLabel>가동 시간</FactLabel><FactValue>{vm.status === 'running' ? '2일 19시간' : '정지 상태'}</FactValue></Fact>
        </KVPairs></Surface>
      </TwoColumn>
      <Surface>
        <SurfaceTitle>SSH 접속 정보</SurfaceTitle>
        <KVPairs>
          <Row><Fact><FactLabel>SSH 계정</FactLabel><FactValue>{vm.sshUser}</FactValue></Fact><Button variant="ghost" icon={<Octicon name="copy" />} onClick={() => copy(vm.sshUser, 'SSH 계정')}>복사</Button></Row>
          <Row><Fact><FactLabel>내부 IP</FactLabel><FactValue>{vm.internalIp}</FactValue></Fact><Button variant="ghost" icon={<Octicon name="copy" />} onClick={() => copy(vm.internalIp, '내부 IP')}>복사</Button></Row>
          <Row><Fact><FactLabel>초기 비밀번호</FactLabel><FactValue>{passwordVisible ? vm.password : '••••••••••••'}</FactValue></Fact><Button variant="ghost" icon={<Octicon name={passwordVisible ? 'eye-closed' : 'eye'} />} onClick={() => setPasswordVisible(visible => !visible)}>{passwordVisible ? '숨기기' : '표시'}</Button></Row>
        </KVPairs>
      </Surface>
      <Surface>
        <SurfaceTitle><Octicon name="terminal" size={16} />　SSH 명령어</SurfaceTitle>
        <NumberLine><span>1</span><SSHLine>{sshCommand}</SSHLine></NumberLine>
        <Row><Hint>{vm.owner === 'team' ? '팀원 누구나 볼 수 있습니다. 비밀번호를 아는 팀원은 VM 안에서 관리자(sudo) 권한을 가집니다.' : '실제 SSH 매핑: 외부 32104 → 내부 22 · 터미널에 붙여넣어 접속하세요.'}</Hint><Button variant="primary" icon={<Octicon name="copy" />} onClick={() => copy(sshCommand, '명령어')}>명령어 복사</Button></Row>
      </Surface>
      {vm.owner === 'team' && <Surface><SurfaceTitle>팀 정보</SurfaceTitle><KVPairs><Fact><FactLabel>소유</FactLabel><FactValue>팀 {vm.teamName} · 만든 사람 {vm.creator}</FactValue></Fact><Fact><FactLabel>내 역할</FactLabel><FactValue>일반 팀원 · 팀장이 DevOps 역할을 주면 전원과 설정을 관리할 수 있습니다</FactValue></Fact></KVPairs></Surface>}
      {notice && <Hint role="status">{notice}</Hint>}
      {powerOperation === 'normal' && !powerDialog && <Banner role="status"><Octicon name="clock" size={20} /><BannerCopy><strong>종료 요청 후 응답을 기다리고 있습니다</strong><span>아직 VM이 정지되지 않았습니다. 운영체제가 응답하지 않으면 강제로 정지할 수 있습니다.</span></BannerCopy><Button variant="secondary" onClick={() => setPowerDialog('force-confirm')}>강제 정지 확인</Button></Banner>}
    </DemoPage>
    {powerDialog && <ModalSurface labelledBy="vm-power-title" onDismiss={() => { if (powerOperation !== 'restart') setPowerDialog(null); }}>
      <PowerPanel>
        <PowerTitle id="vm-power-title">{powerDialog === 'graceful-progress' ? '종료 요청 후 응답을 기다리고 있습니다' : powerDialog === 'force-confirm' ? 'VM을 강제로 정지하시겠습니까?' : powerDialog === 'restart-progress' ? '이전 작업이 진행 중입니다' : 'VM을 강제로 정지하는 중입니다'}</PowerTitle>
        {powerDialog === 'graceful-progress' ? <>
          <PowerCopy>아직 VM이 정지되지 않았습니다. 운영체제가 응답하지 않으면 강제로 정지할 수 있습니다.</PowerCopy>
          <PowerCopy>· 정상 종료 요청됨 → 정지 상태 확인 중<br />· 다른 전원 작업은 이전 작업이 끝난 뒤 사용할 수 있습니다.</PowerCopy>
          <PowerActionsRow><Button variant="secondary" onClick={() => setPowerDialog(null)}>기다리기</Button><Button variant="danger" onClick={() => setPowerDialog('force-confirm')}>강제 정지 확인</Button></PowerActionsRow>
        </> : powerDialog === 'restart-progress' ? <>
          <PowerCopy>{vmRecord.name}을(를) 재시작하고 있습니다. 작업이 끝나면 다시 시도해 주세요.</PowerCopy>
          <PowerCopy>· 진행 중인 작업의 상태를 계속 확인하고 있습니다.</PowerCopy>
          <PowerActionsRow><Button variant="secondary" disabled>재시작</Button><Button variant="secondary" disabled>정상 종료</Button><Button variant="danger" disabled>강제 정지</Button></PowerActionsRow>
        </> : powerDialog === 'force-confirm' ? <>
          <PowerCopy>운영체제의 종료 절차를 기다리지 않고 {vmRecord.name}을(를) 정지합니다. 저장하지 않은 데이터가 사라질 수 있습니다.</PowerCopy>
          <PowerCopy>· VM이나 운영체제가 응답하지 않을 때 사용해 주세요.</PowerCopy>
          <PowerActionsRow><Button variant="secondary" onClick={() => setPowerDialog(powerOperation === 'normal' ? 'graceful-progress' : null)}>취소</Button><Button variant="danger" onClick={() => beginPowerOperation('force')}>강제 정지</Button></PowerActionsRow>
        </> : <>
          <PowerCopy>{vmRecord.name}의 전원 상태를 확인하고 있습니다. 다른 전원 작업은 이 작업이 끝난 뒤 사용할 수 있습니다.</PowerCopy>
          <PowerActionsRow><Button variant="secondary" disabled>정지 처리 중</Button></PowerActionsRow>
        </>}
      </PowerPanel>
    </ModalSurface>}
  </DemoShell>;
}

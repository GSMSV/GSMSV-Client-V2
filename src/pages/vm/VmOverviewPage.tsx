import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { canExtendDemoTeamVm, canManageDemoVm, canRecoverDemoVm, cancelDemoVmCreateRequest, demoTeamReferenceTime, formatDemoVmDate, getDemoVmDaysRemaining, getDemoVmExpiryTime, getDemoVmGraceEnd, getDemoVmState, isDemoVmExpired, isDemoVmInitializing, saveDemoVmState, useDemoVmResourceState } from '../../entities/vm';
import { getDemoNetworkState, restoreDefaultPortForwards } from '../../entities/network';
import { DemoVmExtensionDialog, useDemoVmExtension } from '../../features/vm-extension';
import { getDemoTeam } from '../../entities/team/demo';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { ModalSurface } from '../../shared/ui/feedback/ModalSurface';
import { Octicon } from '../../shared/ui/icons';
import { Banner, BannerCopy, Breadcrumb, DemoPage, DemoShell, DetailTabs, Fact, FactLabel, FactValue, Facts, Grid2, Hint, MetricCard, MetricLabel, MetricValue, Row, Surface, SurfaceTitle } from './VmDemoPrimitives';
import { VmUnavailablePage } from './VmUnavailablePage';
import { useVmPageLoad, VmPagePlaceholder } from './VmPageLoad';
import { describeDemoVmTeamRoles, findDeletedDemoVm, formatKoreanDemoDate } from './vmDemoHelpers';

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    gap: 16px;
  }
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

  @media (max-width: 760px) { justify-content: flex-start; }
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

const StateDialogPanel = styled.div`
  display: flex;
  width: min(480px, calc(100vw - 48px));
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const StateDialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const StateDialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const StateDialogActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

type PowerDialog = 'graceful-progress' | 'force-confirm' | 'force-progress' | 'restart-progress' | null;
type PowerActionLabel = '시작' | '정상 종료' | '재시작' | '강제 정지';
type ExtendedStoppedNotice = { expiresAt: string; recovered: boolean };
type PowerOperation = 'normal' | 'force' | 'restart' | null;

export function VmOverviewPage() {
  const { vmId, teamId: routeTeamId } = useParams<{ vmId: string; teamId?: string }>();
  const navigate = useNavigate();
  const [state, setState] = useDemoVmResourceState(vmId);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notice, setNotice] = useState('');
  const [powerDialog, setPowerDialog] = useState<PowerDialog>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [powerOperation, setPowerOperation] = useState<PowerOperation>(null);
  const [cancelDialog, setCancelDialog] = useState<'confirm' | 'started' | null>(null);
  const [networkVersion, setNetworkVersion] = useState(0);
  const powerTimer = useRef<number | null>(null);
  const [permissionAction, setPermissionAction] = useState<PowerActionLabel | null>(null);
  const [extendedStopped, setExtendedStopped] = useState<ExtendedStoppedNotice | null>(null);
  const extensionStartedExpired = useRef(false);
  const load = useVmPageLoad('vm', vmId);
  const vm = useMemo(() => state.vms.find(item => item.id === vmId), [state.vms, vmId]);
  const initializing = vm ? isDemoVmInitializing(vm) : false;
  const networkState = useMemo(() => vm && vm.status !== 'queued' ? getDemoNetworkState(vm.grn) : null, [vm?.grn, vm?.status, networkVersion]);
  useEffect(() => {
    if (!retryAt) return;
    function updateCountdown() {
      setRetrySeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    }
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const vmExtension = useDemoVmExtension({
    onStateChange: setState,
    onExtended: extended => {
      setNotice('사용 기간을 14일 연장했습니다.');
      if (extended.owner === 'team' && extended.status === 'stopped') {
        setExtendedStopped({ expiresAt: extended.expiresAt, recovered: extensionStartedExpired.current });
      }
    },
    onError: setNotice,
  });

  if (!isDemoMode()) return <Navigate to="/" replace />;
  if (routeTeamId && !getDemoTeam(routeTeamId)) return <Navigate to="/teams" replace />;
  if (!vm) {
    const deleted = findDeletedDemoVm(state, vmId, routeTeamId);
    return <VmUnavailablePage teamId={routeTeamId ?? deleted?.teamId} deleted={deleted} />;
  }
  if (routeTeamId && (vm.owner !== 'team' || vm.teamId !== routeTeamId)) {
    return <Navigate to={`/teams/${encodeURIComponent(routeTeamId)}`} replace />;
  }
  if (!routeTeamId && vm.owner === 'team' && vm.teamId) {
    return <Navigate to={`/teams/${encodeURIComponent(vm.teamId)}`} replace />;
  }
  const vmRecord = vm;

  const memberReadOnly = !canManageDemoVm(vmRecord);
  const expired = isDemoVmExpired(vmRecord);
  const graceEnd = getDemoVmGraceEnd(vmRecord);
  const referenceTime = vmRecord.requestedAtMs !== undefined
    ? Date.now()
    : vmRecord.owner === 'personal' ? Date.UTC(2026, 8, 29, 5) : undefined;
  const daysRemaining = getDemoVmDaysRemaining(vmRecord.expiresAt, referenceTime);
  const canExtendTeamVm = vmRecord.owner !== 'team' || canExtendDemoTeamVm(vmRecord);
  const teamExpiryTime = vmRecord.owner === 'team' ? getDemoVmExpiryTime(vmRecord.expiresAt) : undefined;
  const teamReferenceTime = vmRecord.requestedAtMs !== undefined ? Date.now() : demoTeamReferenceTime;
  const extensionNotOpenYet = vmRecord.owner === 'team' && vmRecord.status !== 'queued' && !expired
    && teamExpiryTime !== undefined && teamReferenceTime < teamExpiryTime - 7 * 24 * 60 * 60 * 1000;
  const teamRoles = describeDemoVmTeamRoles(vmRecord);
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

  function finishPowerOperation(action: Exclude<PowerOperation, null>) {
    const current = getDemoVmState();
    const currentVm = current.vms.find(item => item.id === vmRecord.id);
    if (!currentVm || currentVm.status !== 'running' || !canManageDemoVm(currentVm) || isDemoVmExpired(currentVm)) {
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

  function nextPowerRequestTimes(target: typeof vmRecord): number[] | null {
    const now = Date.now();
    const windowMs = 30_000;
    const recent = (target.powerRequestTimes ?? []).filter(time => time > now - windowMs);
    if (recent.length >= 3) {
      const availableAt = recent[0] + windowMs;
      setRetryAt(availableAt);
      setRetrySeconds(Math.ceil((availableAt - now) / 1000));
      setPowerDialog(null);
      return null;
    }
    return [...recent, now];
  }

  function beginPowerOperation(action: Exclude<PowerOperation, null>) {
    const escalating = powerOperation === 'normal' && action === 'force';
    if (powerOperation && !escalating) return;
    const current = getDemoVmState();
    const target = current.vms.find(item => item.id === vmRecord.id);
    if (!target || target.status !== 'running' || !canManageDemoVm(target) || isDemoVmExpired(target)) {
      setState(current);
      setPowerDialog(null);
      return;
    }
    if (!escalating) {
      const powerRequestTimes = nextPowerRequestTimes(target);
      if (!powerRequestTimes) return;
      const next = { ...current, vms: current.vms.map(item => item.id === target.id ? { ...item, powerRequestTimes } : item) };
      if (!saveDemoVmState(next)) {
        setNotice('전원 요청을 저장하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      setState(next);
    }
    if (powerTimer.current !== null) window.clearTimeout(powerTimer.current);
    setPowerOperation(action);
    setPowerDialog(action === 'normal' ? 'graceful-progress' : action === 'restart' ? 'restart-progress' : 'force-progress');
    powerTimer.current = window.setTimeout(() => finishPowerOperation(action), action === 'normal' ? 2200 : action === 'restart' ? 1800 : 650);
  }

  function startVm() {
    if (powerOperation) return;
    const current = getDemoVmState();
    const target = current.vms.find(item => item.id === vmRecord.id);
    if (!target || target.status !== 'stopped' || !canManageDemoVm(target) || isDemoVmExpired(target)) {
      setState(current);
      return;
    }
    const powerRequestTimes = nextPowerRequestTimes(target);
    if (!powerRequestTimes) return;
    const next = { ...current, vms: current.vms.map(item => item.id === target.id ? { ...item, powerRequestTimes, status: 'running' as const } : item) };
    if (saveDemoVmState(next)) {
      setState(next);
      setNotice('VM을 시작했습니다.');
    } else {
      setNotice('전원 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  function requestExtension() {
    setNotice('');
    extensionStartedExpired.current = isDemoVmExpired(vmRecord);
    void vmExtension.extend(vmRecord.id);
  }

  function cancelCreateRequest() {
    const latest = getDemoVmState();
    const latestVm = latest.vms.find(item => item.id === vmRecord.id);
    if (!latestVm) {
      setCancelDialog(null);
      navigate(vmRecord.owner === 'team' ? `/teams/${encodeURIComponent(vmRecord.teamId ?? 'demo-team')}/vms` : '/');
      return;
    }
    if (!canManageDemoVm(latestVm)) {
      setState(latest);
      setCancelDialog(null);
      return;
    }
    if (latestVm.status !== 'queued' || isDemoVmInitializing(latestVm)) {
      setState(latest);
      setCancelDialog('started');
      return;
    }
    if (!cancelDemoVmCreateRequest(vmRecord.id)) {
      setCancelDialog(null);
      setNotice('생성 요청을 취소하지 못했습니다. 상태를 새로고침한 뒤 다시 시도해 주세요.');
      return;
    }
    setCancelDialog(null);
    navigate(vmRecord.owner === 'team' ? `/teams/${encodeURIComponent(vmRecord.teamId ?? 'demo-team')}/vms` : '/');
  }

  async function restoreSshPort() {
    if (!canManageDemoVm(vmRecord)) return;
    try {
      await restoreDefaultPortForwards(vmRecord.grn);
      setNetworkVersion(version => version + 1);
      setNotice('기본 포트를 복원했습니다. 새로 배정된 SSH 외부 포트를 확인해 주세요.');
    } catch {
      setNotice('기본 포트를 복원하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  function copy(text: string, label: string) {
    if (!navigator.clipboard) {
      setNotice('클립보드에 접근할 수 없습니다.');
      return;
    }
    void navigator.clipboard.writeText(text).then(() => setNotice(`${label}을(를) 복사했습니다.`)).catch(() => setNotice('클립보드에 접근할 수 없습니다.'));
  }

  function guardPower(action: PowerActionLabel, run: () => void) {
    if (memberReadOnly) {
      setPermissionAction(action);
      return;
    }
    run();
  }

  const sshPort = networkState?.ports.find(port => port.kind === 'ssh')?.external_port;
  const sshCommand = sshPort ? `ssh ${vmRecord.sshUser}@ssh.gsmsv.site -p ${sshPort}` : null;

  return <DemoShell activeItem="home" scopeLabel={vm.owner === 'team' ? `${vm.teamName ?? '팀'} · 일반 팀원` : '내 Resources'} teamScopeId={vm.owner === 'team' ? vm.teamId : undefined} userName={vm.owner === 'team' ? '윤채원' : '김지민'}>
    <DemoPage>
      <Breadcrumb>{vm.owner === 'team' ? 'GSM Connect / 팀 Resources' : '워크스페이스 / 내 Resources'}</Breadcrumb>
      <Heading><div><Title>{title}</Title><StatusLine>{subtitle}</StatusLine></div><PowerActions>
        <Button variant="secondary" disabled={expired || vm.status === 'queued' || (!memberReadOnly && vm.status === 'running') || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="play" />} onClick={() => guardPower('시작', startVm)}>시작</Button>
        <Button variant="secondary" disabled={expired || vm.status === 'queued' || (!memberReadOnly && vm.status !== 'running') || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="stop" />} onClick={() => guardPower('정상 종료', () => beginPowerOperation('normal'))}>정상 종료</Button>
        <Button variant="secondary" disabled={expired || vm.status === 'queued' || (!memberReadOnly && vm.status !== 'running') || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="sync" />} onClick={() => guardPower('재시작', () => beginPowerOperation('restart'))}>재시작</Button>
        <Button variant="secondary" disabled={expired || vm.status === 'queued' || (!memberReadOnly && vm.status !== 'running') || Boolean(powerOperation)} title={memberReadOnly ? '팀장 또는 DevOps만 전원을 제어할 수 있습니다.' : undefined} icon={<Octicon name="alert" />} onClick={() => guardPower('강제 정지', () => setPowerDialog('force-confirm'))}>강제 정지</Button>
        {vm.status === 'queued' && !initializing && !memberReadOnly && <Button variant="danger" icon={<Octicon name="x" />} onClick={() => setCancelDialog('confirm')}>생성 취소</Button>}
        {!memberReadOnly && !expired && vm.owner === 'personal' && <Button variant="primary" disabled={vm.status === 'queued'} icon={<Octicon name="calendar" />} onClick={() => requestExtension()}>14일 연장</Button>}
      </PowerActions></Heading>
      <DetailTabs vmId={vm.id} active="개요" teamId={vm.teamId} networkVmGrn={vm.grn} />
      {load.status !== 'ready' ? <VmPagePlaceholder status={load.status} onRetry={load.retry} rows={vm.owner === 'team' ? [[150, 150, 150], [268], [218], [212]] : [[150, 150, 150], [270, 270], [270], [218]]} /> : <>
      {memberReadOnly && <Banner><Octicon name="shield" size={20} /><BannerCopy><strong>일반 팀원으로 보고 있습니다</strong><span>조회, SSH 접속 정보 확인, 사용 기간 연장을 할 수 있습니다. 전원 제어와 설정 변경은 팀장(김지민) 또는 DevOps(한도윤)가 할 수 있습니다.</span></BannerCopy></Banner>}
      {expired && graceEnd !== undefined ? <Banner $tone="warning"><Octicon name="alert" size={20} /><BannerCopy>
        <strong>만료되어 정지됐습니다</strong>
        <span>삭제 예정: {formatDemoVmDate(graceEnd)}. VM을 보관하려면 지금 연장해 주세요.</span>
        <span>· 만료 후 3일이 지나면 영구 삭제됩니다.<br />· 연장하면 삭제 예약을 취소하고 기존 만료일에 14일을 더합니다.<br />· 연장한 뒤에는 직접 VM을 시작해 주세요.</span>
      </BannerCopy><Button disabled={!canRecoverDemoVm(vmRecord)} icon={<Octicon name="calendar" />} onClick={requestExtension}>연장하고 보관</Button></Banner>
      : extensionNotOpenYet && teamExpiryTime !== undefined ? <Surface aria-live="polite">
        <SurfaceTitle><Octicon name="clock" size={24} />　아직 연장 기간이 아닙니다</SurfaceTitle>
        <Hint>{vm.name}는 {formatKoreanDemoDate(teamExpiryTime)}에 만료됩니다. 연장은 {formatKoreanDemoDate(teamExpiryTime - 7 * 24 * 60 * 60 * 1000)}부터 할 수 있습니다.</Hint>
        {daysRemaining !== undefined && <Hint>· 만료까지 {daysRemaining}일 남았습니다.</Hint>}
        <Hint>· 팀원 모두 같은 시점부터 연장할 수 있습니다.</Hint>
        <Row><span /><Button disabled icon={<Octicon name="calendar" />}>14일 연장</Button></Row>
        <Hint>만료 7일 전부터 연장할 수 있습니다.</Hint>
      </Surface>
      : <Banner $tone="primary"><Octicon name="clock"  size={20} /><BannerCopy><strong>{vm.status === 'queued' ? initializing ? '초기 설정을 진행하고 있습니다' : '생성 요청이 접수되었습니다' : daysRemaining !== undefined ? '만료까지 ' + daysRemaining + '일 남았습니다' : '사용 기간'}</strong><span>{vm.status === 'queued' ? initializing ? '접속 준비가 끝나면 SSH 접속 정보를 볼 수 있습니다.' : '대기 순번과 생성 단계를 홈에서 확인할 수 있습니다. VM 생성은 목데이터로 처리됩니다.' : expiryCaption}</span></BannerCopy>{vm.owner === 'team' && vm.status !== 'queued' && <Button disabled={!canExtendTeamVm} title={!canExtendTeamVm ? '만료 7일 전부터 만료 시각 전까지 연장할 수 있습니다.' : undefined} onClick={() => requestExtension()} icon={<Octicon name="calendar" />}>14일 연장</Button>}</Banner>}
      <Facts>
        <MetricCard><Row><MetricLabel><Octicon name="cpu" size={16} />　CPU</MetricLabel></Row><MetricValue>{vm.cpu} vCPU</MetricValue><Hint>{vm.nodeType}</Hint></MetricCard>
        <MetricCard><MetricLabel>메모리</MetricLabel><MetricValue>{vm.memory} GB</MetricValue><Hint>할당 메모리</Hint></MetricCard>
        <MetricCard><MetricLabel><Octicon name="database" size={16} />　디스크</MetricLabel><MetricValue>{vm.disk} GB</MetricValue><Hint>{vm.os}</Hint></MetricCard>
      </Facts>
      {!memberReadOnly && <Grid2>
        <Surface><SurfaceTitle>운영 정보</SurfaceTitle><KVPairs>
          <Fact><FactLabel>사용 목적</FactLabel><FactValue>{vm.purpose}</FactValue></Fact>
          <Fact><FactLabel>자동 Snapshot</FactLabel><FactValue>{vm.autoSnapshots ? '켜짐 · 최신 1개 보관' : '꺼짐 · 다음 자정부터 저장하지 않음'}</FactValue></Fact>
          <Fact><FactLabel>Network</FactLabel><FactValue>외부 포트 {networkState?.ports.length ?? 0}/30 · HTTPS Domain {networkState?.domains.length ?? 0}/2</FactValue></Fact>
        </KVPairs><Row><Button variant="ghost" icon={<Octicon name="pencil" />} onClick={() => navigate(`${vmRoute}/settings`)}>수정</Button><Button variant="ghost" icon={<Octicon name="chevron-right" />} onClick={() => navigate(`${vmRoute}/snapshots`)}>Snapshot 관리</Button><Button variant="ghost" icon={<Octicon name="chevron-right" />} onClick={() => navigate(`${vmRecord.owner === 'team' && vmRecord.teamId ? `/teams/${encodeURIComponent(vmRecord.teamId)}/vms` : '/vms'}/${encodeURIComponent(vm.grn)}/network`)}>Network 관리</Button></Row></Surface>
        <Surface><SurfaceTitle>사용 기간</SurfaceTitle><KVPairs>
          <Fact><FactLabel>생성일</FactLabel><FactValue>{vm.createdAt}</FactValue></Fact>
          <Fact><FactLabel>만료일</FactLabel><FactValue>{vm.expiresAt}</FactValue></Fact>
          <Fact><FactLabel>가동 시간</FactLabel><FactValue>{vm.status === 'running' ? '2일 19시간' : '정지 상태'}</FactValue></Fact>
        </KVPairs></Surface>
      </Grid2>}
      {vm.status !== 'queued' && <>
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
        {sshCommand ? <>
          <NumberLine><span>1</span><SSHLine>{sshCommand}</SSHLine></NumberLine>
          <Row><Hint>{vm.owner === 'team' ? '팀원 누구나 볼 수 있습니다. 비밀번호를 아는 팀원은 VM 안에서 관리자(sudo) 권한을 가집니다.' : `실제 SSH 매핑: 외부 ${sshPort} → 내부 22 · 터미널에 붙여넣어 접속하세요.`}</Hint>{vm.owner === 'personal' && <Button variant="secondary" icon={<Octicon name="book" />} onClick={() => navigate('/help')}>SSH 키 등록 Docs</Button>}<Button variant="primary" icon={<Octicon name="copy" />} onClick={() => copy(sshCommand, '명령어')}>명령어 복사</Button></Row>
        </> : <>
          <Banner $tone="warning"><Octicon name="alert" size={20} /><BannerCopy><strong>SSH 기본 포트가 없습니다</strong><span>SSH 접속 경로가 삭제되어 명령어를 표시할 수 없습니다. 기본 포트를 복원하면 새로 배정된 실제 외부 포트를 확인할 수 있습니다.<br />· SSH 명령어를 제공할 수 없습니다.<br />· 누락된 SSH 22·HTTP 80·SVC 10000 포트만 복원합니다.</span></BannerCopy></Banner>
          <Row><Button variant="secondary" onClick={() => navigate('/help')}>접속 Docs</Button><Button variant="primary" disabled={memberReadOnly} icon={<Octicon name="sync" />} onClick={() => void restoreSshPort()}>기본 포트 복원</Button></Row>
        </>}
      </Surface>
      </>}
      {vm.owner === 'team' && <Surface><SurfaceTitle>팀 정보</SurfaceTitle><KVPairs><Fact><FactLabel>소유</FactLabel><FactValue>팀 {vm.teamName} · 만든 사람 {vm.creator}</FactValue></Fact><Fact><FactLabel>내 역할</FactLabel><FactValue>일반 팀원 · 팀장이 DevOps 역할을 주면 전원과 설정을 관리할 수 있습니다</FactValue></Fact></KVPairs></Surface>}
      {notice && <Hint role="status">{notice}</Hint>}
      {powerOperation === 'normal' && !powerDialog && <Banner role="status"><Octicon name="clock" size={20} /><BannerCopy><strong>종료 요청 후 응답을 기다리고 있습니다</strong><span>아직 VM이 정지되지 않았습니다. 운영체제가 응답하지 않으면 강제로 정지할 수 있습니다.</span></BannerCopy><Button variant="secondary" onClick={() => setPowerDialog('force-confirm')}>강제 정지 확인</Button></Banner>}
      </>}
    </DemoPage>
    {retryAt > 0 && <ModalSurface labelledBy="vm-power-retry-title" onDismiss={() => setRetryAt(0)}>
      <StateDialogPanel>
        <StateDialogTitle id="vm-power-retry-title"><Octicon name="clock" size={24} /> 요청이 너무 많습니다</StateDialogTitle>
        <StateDialogCopy>{retrySeconds > 0 ? retrySeconds + '초 뒤 다시 시도해 주세요.' : '이제 전원 작업을 다시 시도할 수 있습니다.'}</StateDialogCopy>
        <StateDialogActions><Button variant="secondary" disabled={retrySeconds > 0} onClick={() => setRetryAt(0)}>
          {retrySeconds > 0 ? retrySeconds + '초 후 다시 시도' : '확인'}
        </Button></StateDialogActions>
        <Hint>목데이터의 요청 제한 시간이 지나면 다시 사용할 수 있습니다.</Hint>
      </StateDialogPanel>
    </ModalSurface>}
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
    {vmExtension.confirmation && <DemoVmExtensionDialog
      key={JSON.stringify(vmExtension.confirmation)}
      initialPurpose={vmExtension.confirmation.purpose}
      extensionCount={vmExtension.confirmation.extensionCount}
      error={vmExtension.error}
      onConfirm={vmExtension.confirm}
      onDismiss={vmExtension.dismiss}
    />}
    {permissionAction && <ModalSurface labelledBy="vm-permission-title" onDismiss={() => setPermissionAction(null)}>
      <StateDialogPanel>
        <StateDialogTitle id="vm-permission-title"><Octicon name="lock" size={24} /> 팀장 또는 DevOps만 할 수 있습니다</StateDialogTitle>
        <StateDialogCopy>{vmRecord.name}{permissionAction === '시작' ? '을(를) 시작하려면' : permissionAction === '정상 종료' ? '을(를) 정상 종료하려면' : permissionAction === '재시작' ? '를 재시작하려면' : '을(를) 강제로 정지하려면'} 팀장 또는 DevOps 역할이 필요합니다.</StateDialogCopy>
        <StateDialogCopy>· 내 역할 · 일반 팀원</StateDialogCopy>
        <StateDialogCopy>· {teamRoles.summary}</StateDialogCopy>
        <StateDialogActions><Button variant="secondary" onClick={() => setPermissionAction(null)}>닫기</Button></StateDialogActions>
      </StateDialogPanel>
    </ModalSurface>}
    {extendedStopped && <ModalSurface labelledBy="vm-extended-stopped-title" onDismiss={() => setExtendedStopped(null)}>
      <StateDialogPanel>
        <StateDialogTitle id="vm-extended-stopped-title"><Octicon name="check-circle" size={24} /> 연장했습니다 · VM은 정지 상태입니다</StateDialogTitle>
        <StateDialogCopy>만료일이 {formatKoreanDemoDate(getDemoVmExpiryTime(extendedStopped.expiresAt))}으로 바뀌었{extendedStopped.recovered ? '고 삭제 예약은 취소됐습니다.' : '습니다.'}</StateDialogCopy>
        <StateDialogCopy>· 전원은 자동으로 시작하지 않습니다.</StateDialogCopy>
        {memberReadOnly && <StateDialogCopy>· 윤채원은 일반 팀원이므로 {teamRoles.contact}에게 시작을 요청하세요.</StateDialogCopy>}
        <StateDialogActions>
          <Button variant="secondary" disabled={memberReadOnly || vmRecord.status !== 'stopped'} icon={<Octicon name="play" />} onClick={() => { setExtendedStopped(null); startVm(); }}>VM 시작</Button>
          <Button variant="primary" onClick={() => setExtendedStopped(null)}>확인</Button>
        </StateDialogActions>
        {memberReadOnly && <Hint>전원 제어는 팀장·DevOps만 할 수 있습니다.</Hint>}
      </StateDialogPanel>
    </ModalSurface>}
    {cancelDialog === 'confirm' && <ModalSurface labelledBy="vm-create-cancel-title" onDismiss={() => setCancelDialog(null)}>
      <StateDialogPanel>
        <StateDialogTitle id="vm-create-cancel-title">생성을 취소하시겠습니까?</StateDialogTitle>
        <StateDialogCopy>{vmRecord.name} 생성 요청을 취소합니다. 입력한 이름과 사용 목적은 사라지고, 할당량이 바로 돌아옵니다.</StateDialogCopy>
        <StateDialogActions>
          <Button variant="secondary" onClick={() => setCancelDialog(null)}>닫기</Button>
          <Button variant="danger" onClick={cancelCreateRequest}>생성 취소</Button>
        </StateDialogActions>
      </StateDialogPanel>
    </ModalSurface>}
    {cancelDialog === 'started' && <ModalSurface labelledBy="vm-create-started-title" onDismiss={() => setCancelDialog(null)}>
      <StateDialogPanel>
        <StateDialogTitle id="vm-create-started-title">생성이 이미 시작됐습니다</StateDialogTitle>
        <StateDialogCopy>지금은 취소할 수 없습니다. 생성이 끝난 뒤 VM을 삭제할 수 있습니다.</StateDialogCopy>
        <StateDialogActions><Button variant="primary" onClick={() => setCancelDialog(null)}>확인</Button></StateDialogActions>
      </StateDialogPanel>
    </ModalSurface>}
  </DemoShell>;
}

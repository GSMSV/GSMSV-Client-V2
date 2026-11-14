import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoVmState, saveDemoVmState } from '../../entities/vm';
import { getDemoTeam } from '../../entities/team/demo';
import { isDemoMode } from '../../shared/demo';
import { Button, SliderField } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Breadcrumb, DemoPage, DemoShell, DetailTabs, FactValue, Heading, Hint, Row, Surface, SurfaceTitle, Textarea } from './VmDemoPrimitives';

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const StatusLine = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const InstanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
`;

const WarningBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
`;

export function VmSettingsPage() {
  const { vmId, teamId: routeTeamId } = useParams<{ vmId: string; teamId?: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState(() => getDemoVmState());
  const [purpose, setPurpose] = useState('');
  const [notice, setNotice] = useState('');
  const vm = useMemo(() => state.vms.find(item => item.id === vmId), [state.vms, vmId]);

  if (!isDemoMode()) return <Navigate to="/" replace />;
  if (!vm) return <Navigate to={routeTeamId ? `/teams/${encodeURIComponent(routeTeamId)}` : '/'} replace />;
  if (routeTeamId && (vm.owner !== 'team' || vm.teamId !== routeTeamId)) {
    return <Navigate to={`/teams/${encodeURIComponent(routeTeamId)}`} replace />;
  }
  if (!routeTeamId && vm.owner === 'team' && vm.teamId) {
    return <Navigate to={`/teams/${encodeURIComponent(vm.teamId)}`} replace />;
  }
  const team = vm.owner === 'team' && vm.teamId ? getDemoTeam(vm.teamId) : undefined;
  const teamName = team?.name ?? vm.teamName ?? '팀';
  const vmRecord = vm;
  const memberReadOnly = vmRecord.owner === 'team' && vmRecord.role === 'member';
  const displayedPurpose = purpose || vmRecord.purpose;

  function updateState(update: (current: typeof state) => typeof state) {
    setState(current => {
      const next = update(current);
      saveDemoVmState(next);
      return next;
    });
  }

  function savePurpose() {
    if (!displayedPurpose.trim() || displayedPurpose.trim().length > 100) {
      setNotice('사용 목적을 100자 이내로 입력해 주세요. 공백만 입력할 수 없습니다.');
      return;
    }
    updateState(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, purpose: displayedPurpose.trim() } : item) }));
    setPurpose('');
    setNotice('사용 목적을 저장했습니다.');
  }

  function rename() {
    if (memberReadOnly) return;
    const value = window.prompt('VM 이름을 입력해 주세요.', vmRecord.name)?.trim();
    if (!value || value === vmRecord.name) return;
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(value)) {
      setNotice('VM 이름은 영문·숫자로 시작하며 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.');
      return;
    }
    if (state.vms.some(item => item.owner === vmRecord.owner && item.id !== vmRecord.id && item.name.toLowerCase() === value.toLowerCase())) {
      setNotice('같은 소유자 안에서 VM 이름을 중복해서 사용할 수 없습니다.');
      return;
    }
    updateState(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, name: value } : item) }));
    setNotice('VM 이름을 변경했습니다.');
  }

  function deleteVm() {
    if (memberReadOnly) return;
    if (!window.confirm('VM을 삭제할까요? 디스크 데이터와 Snapshot, 외부 포트, HTTPS Domain이 함께 삭제됩니다. 삭제한 VM은 복구할 수 없습니다.')) return;
    updateState(current => ({ ...current, vms: current.vms.filter(item => item.id !== vmRecord.id) }));
    navigate(vmRecord.owner === 'team' ? `/teams/${vmRecord.teamId}/vms` : '/');
  }

  return <DemoShell activeItem="home" scopeLabel={vm.owner === 'team' ? `${teamName} · 일반 팀원` : '내 Resources'} teamScopeId={routeTeamId} userName={vm.owner === 'team' ? '윤채원' : '김지민'} hasUnsavedInput={Boolean(purpose)}>
    <DemoPage>
      <Breadcrumb>{vm.owner === 'team' ? `${teamName} / 팀 Resources` : '워크스페이스 / 내 Resources'}</Breadcrumb>
      <Heading><div><Title>{vm.name}</Title><StatusLine>{vm.owner === 'team' ? '팀 VM' : '개인 VM'} · VM 설정</StatusLine></div></Heading>
      <DetailTabs vmId={vm.id} active="설정" teamId={vm.teamId} networkVmGrn={vm.grn} />
      <Surface>
        <SurfaceTitle>사용 목적</SurfaceTitle>
        <Hint>관리자가 확인하며 기준에 맞지 않으면 VM이 삭제될 수 있습니다.</Hint>
        <FactValue>어떤 용도로 사용합니까?</FactValue>
        <Textarea value={displayedPurpose} maxLength={100} disabled={memberReadOnly} onChange={event => setPurpose(event.currentTarget.value)} />
        <Row><Hint>100자 이내로 입력해 주세요. 공백만 입력할 수 없습니다.</Hint><Button variant="primary" icon={<Octicon name="check" />} disabled={memberReadOnly || !purpose} onClick={savePurpose}>사용 목적 저장</Button></Row>
      </Surface>
      <Surface>
        <SurfaceTitle>Resources</SurfaceTitle>
        <Hint>사양은 개인 할당량 안에서 늘릴 수 있습니다. 지금은 개인 할당량을 모두 사용하고 있어 늘릴 수 없습니다.</Hint>
        <SliderField label="vCPU" value={vm.cpu} min={1} max={vm.cpu} valueLabel={`${vm.cpu} vCPU`} minLabel="최소 1" maxLabel={`최대 ${vm.cpu} · 남은 할당량 0`} disabled />
        <SliderField label="RAM" value={vm.memory} min={1} max={vm.memory} valueLabel={`${vm.memory} GB`} minLabel="최소 1 GB" maxLabel={`최대 ${vm.memory} GB · 남은 할당량 0`} disabled />
        <SliderField label="SSD" value={vm.disk} min={vm.disk} max={vm.disk} valueLabel={`${vm.disk} GB`} minLabel={`현재 ${vm.disk} GB · 줄일 수 없습니다`} maxLabel={`최대 ${vm.disk} GB · 남은 할당량 0`} helper="SSD는 늘릴 수만 있습니다. 늘린 뒤에는 VM 안에서 파일 시스템을 늘려야 합니다." showHelper disabled />
        <Row><span /><Button variant="secondary" disabled icon={<Octicon name="cpu" />}>사양 적용</Button></Row>
      </Surface>
      <Surface>
        <SurfaceTitle>Instance 정보</SurfaceTitle>
        <InstanceRow><Octicon name="server" /><div><Hint>이름</Hint><FactValue>{vm.name}</FactValue></div><Button variant="ghost" icon={<Octicon name="pencil" />} disabled={memberReadOnly} onClick={rename}>변경</Button></InstanceRow>
        <InstanceRow><Octicon name="terminal" /><div><Hint>운영체제</Hint><FactValue>{vm.os}</FactValue></div></InstanceRow>
        <InstanceRow><Octicon name="cpu" /><div><Hint>Node 종류</Hint><FactValue>{vm.nodeType}</FactValue></div></InstanceRow>
      </Surface>
      <WarningBar><span>디스크 데이터와 연결된 Snapshot, 외부 접속 포트, HTTPS Domain이 함께 삭제됩니다. 삭제한 VM은 복구할 수 없습니다.</span><Button variant="danger" icon={<Octicon name="trashcan" />} disabled={memberReadOnly} onClick={deleteVm}>VM 삭제</Button></WarningBar>
      {notice && <Hint role="status">{notice}</Hint>}
    </DemoPage>
  </DemoShell>;
}

import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoVmQuota, getDemoVmState, saveDemoVmState } from '../../entities/vm';
import { clearDemoNetworkState, getDemoNetworkState, saveDemoNetworkState } from '../../entities/network';
import { getDemoTeam } from '../../entities/team/demo';
import { isDemoMode } from '../../shared/demo';
import { Button, SliderField } from '../../shared/ui/controls';
import { DeleteConfirmDialog } from '../../shared/ui/feedback';
import { ModalSurface } from '../../shared/ui/feedback/ModalSurface';
import { Octicon } from '../../shared/ui/icons';
import { Breadcrumb, DemoPage, DemoShell, DetailTabs, FactValue, Heading, Hint, Input, Row, Surface, SurfaceTitle, Textarea } from './VmDemoPrimitives';

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

const NameEdit = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
`;

const NameInput = styled(Input)`
  min-width: 0;
  flex: 1;
`;

const NameError = styled.p`
  margin: 4px 0 0 32px;
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ResizePanel = styled.div`
  display: flex;
  width: min(480px, calc(100vw - 48px));
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const ResizeTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const ResizeCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const ResizeFieldLabel = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const ResizeActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const DeleteOverlay = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(0 0 0 / 54%);
`;

const DeleteFailure = styled.div`
  display: flex;
  width: min(480px, calc(100vw - 48px));
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const FailureTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const FailureCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const FailureActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

export function VmSettingsPage() {
  const { vmId, teamId: routeTeamId } = useParams<{ vmId: string; teamId?: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState(() => getDemoVmState());
  const [purpose, setPurpose] = useState<string | null>(null);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState('');
  const [notice, setNotice] = useState('');
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [resizeOpen, setResizeOpen] = useState(false);
  const [nextDisk, setNextDisk] = useState(0);
  const [resizeError, setResizeError] = useState('');
  const vm = useMemo(() => state.vms.find(item => item.id === vmId), [state.vms, vmId]);

  if (!isDemoMode()) return <Navigate to="/" replace />;
  if (!vm) return <Navigate to={routeTeamId ? `/teams/${encodeURIComponent(routeTeamId)}` : '/'} replace />;
  if (routeTeamId && (!getDemoTeam(routeTeamId) || vm.owner !== 'team' || vm.teamId !== routeTeamId)) {
    return <Navigate to={`/teams/${encodeURIComponent(routeTeamId)}`} replace />;
  }
  if (!routeTeamId && vm.owner === 'team' && vm.teamId) {
    return <Navigate to={`/teams/${encodeURIComponent(vm.teamId)}`} replace />;
  }
  const team = vm.owner === 'team' && vm.teamId ? getDemoTeam(vm.teamId) : undefined;
  const teamName = team?.name ?? vm.teamName ?? '팀';
  const vmRecord = vm;
  const network = getDemoNetworkState(vmRecord.grn);
  const readOnly = vmRecord.status === 'queued' || (vmRecord.owner === 'team' && vmRecord.role === 'member');
  const quota = vmRecord.owner === 'team' ? getDemoVmQuota(state, vmRecord.teamId ?? 'demo-team') : state.personalQuota;
  const remainingDisk = Math.max(0, quota.diskLimit - quota.disk);
  const resizableDiskLimit = vmRecord.disk + Math.floor(remainingDisk / 10) * 10;
  const canResizeDisk = !readOnly && resizableDiskLimit > vmRecord.disk;
  const displayedPurpose = purpose ?? vmRecord.purpose;

  function persistState(next: typeof state) {
    if (!saveDemoVmState(next)) return false;
    setState(next);
    return true;
  }

  function savePurpose() {
    if (readOnly) return;
    if (!displayedPurpose.trim() || displayedPurpose.trim().length > 100) {
      setNotice('사용 목적을 100자 이내로 입력해 주세요. 공백만 입력할 수 없습니다.');
      return;
    }
    const latest = getDemoVmState();
    const next = { ...latest, vms: latest.vms.map(item => item.id === vmRecord.id ? { ...item, purpose: displayedPurpose.trim() } : item) };
    if (!persistState(next)) {
      setNotice('사용 목적을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setPurpose(null);
    setNotice('사용 목적을 저장했습니다.');
  }

  function openResizeDialog() {
    if (!canResizeDisk) return;
    setNextDisk(resizableDiskLimit);
    setResizeError('');
    setResizeOpen(true);
  }

  function resizeDisk() {
    const latest = getDemoVmState();
    const latestVm = latest.vms.find(item => item.id === vmRecord.id);
    if (!latestVm) {
      setResizeError('VM을 찾을 수 없습니다. 목록을 새로고침해 주세요.');
      return;
    }
    if (latestVm.owner === 'team' && latestVm.role === 'member') {
      setState(latest);
      setResizeOpen(false);
      return;
    }
    const latestQuota = latestVm.owner === 'team'
      ? getDemoVmQuota(latest, latestVm.teamId ?? 'demo-team')
      : latest.personalQuota;
    const latestRemaining = Math.max(0, latestQuota.diskLimit - latestQuota.disk);
    const increase = nextDisk - latestVm.disk;
    if (increase < 10 || increase % 10 !== 0 || increase > latestRemaining) {
      setResizeError('남은 할당량 안에서 10 GB 단위로 선택해 주세요.');
      return;
    }
    const next = {
      ...latest,
      vms: latest.vms.map(item => item.id === latestVm.id ? {
        ...item,
        disk: nextDisk,
        ...(item.demoQuotaDisk !== undefined ? { demoQuotaDisk: item.demoQuotaDisk + increase } : {}),
      } : item),
    };
    if (!saveDemoVmState(next)) {
      setResizeError('디스크 용량을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setState(getDemoVmState());
    setResizeOpen(false);
    setNotice(`디스크를 ${nextDisk} GB로 늘렸습니다. 완료 후 VM 안에서 파일 시스템을 늘려 주세요.`);
  }

  function cancelNameEdit() {
    if (nameSaving) return;
    setNameEditing(false);
    setNameDraft('');
    setNameError('');
  }

  function validateVmName(value: string) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(value)) {
      return '영문이나 숫자로 시작하고, 공백 없이 영문·숫자·-·_만 쓸 수 있습니다.';
    }
    const duplicate = state.vms.some(item => item.id !== vmRecord.id
      && item.owner === vmRecord.owner
      && (vmRecord.owner !== 'team' || item.teamId === vmRecord.teamId)
      && item.name.toLowerCase() === value.toLowerCase());
    if (duplicate) {
      return vmRecord.owner === 'team'
        ? `이 팀에 ${value} VM이 이미 있습니다. 다른 이름을 입력해 주세요.`
        : `내 VM에 ${value}가 이미 있습니다. 팀 VM 이름과는 겹쳐도 됩니다.`;
    }
    return '';
  }

  function startNameEdit() {
    if (readOnly) return;
    setNameDraft(vmRecord.name);
    setNameError('');
    setNameEditing(true);
  }

  function saveName() {
    if (readOnly || nameSaving) return;
    const value = nameDraft.trim();
    const validationError = validateVmName(value);
    if (validationError) {
      setNameError(validationError);
      return;
    }
    if (value === vmRecord.name) {
      cancelNameEdit();
      return;
    }

    setNameError('');
    setNameSaving(true);
    window.setTimeout(() => {
      const latest = getDemoVmState();
      const latestVm = latest.vms.find(item => item.id === vmRecord.id);
      const duplicate = latest.vms.some(item => item.id !== vmRecord.id
        && item.owner === vmRecord.owner
        && (vmRecord.owner !== 'team' || item.teamId === vmRecord.teamId)
        && item.name.toLowerCase() === value.toLowerCase());
      if (!latestVm) {
        setNameSaving(false);
        setNameError('VM을 찾을 수 없습니다. 목록을 새로고침해 주세요.');
        return;
      }
      if (duplicate) {
        setNameSaving(false);
        setNameError(vmRecord.owner === 'team'
          ? `이 팀에 ${value} VM이 이미 있습니다. 다른 이름을 입력해 주세요.`
          : `내 VM에 ${value}가 이미 있습니다. 팀 VM 이름과는 겹쳐도 됩니다.`);
        return;
      }
      const next = { ...latest, vms: latest.vms.map(item => item.id === vmRecord.id ? { ...item, name: value } : item) };
      if (!saveDemoVmState(next)) {
        setNameSaving(false);
        setNameError('이름을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setState(next);
      setNameSaving(false);
      setNameEditing(false);
      setNameDraft('');
      setNotice(`이름을 바꿨습니다. 이제 VM 목록과 검색에서 ${value}로 보입니다. VM ID와 SSH 외부 포트, HTTPS Domain은 그대로입니다.`);
    }, 350);
  }

  function resetPassword() {
    if (readOnly) return;
    const latest = getDemoVmState();
    const target = latest.vms.find(item => item.id === vmRecord.id);
    if (!target) {
      setPasswordResetError('VM을 찾을 수 없습니다.');
      return;
    }
    const password = 'gsvm-demo-' + crypto.randomUUID().slice(0, 12);
    const next = { ...latest, vms: latest.vms.map(item => item.id === target.id ? { ...item, password } : item) };
    if (!persistState(next)) {
      setPasswordResetError('비밀번호를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setPasswordResetOpen(false);
    setNotice('목데이터 비밀번호를 재설정했습니다. 개요에서 확인할 수 있습니다.');
  }

  function openDeleteDialog() {
    if (readOnly || vmRecord.status === 'queued') return;
    setDeleteName('');
    setDeleteError('');
    setDeleteOpen(true);
  }

  function deleteVm() {
    if (readOnly || deleteSaving || deleteName !== vmRecord.name) return;
    setDeleteSaving(true);
    window.setTimeout(() => {
      const latest = getDemoVmState();
      if (!latest.vms.some(item => item.id === vmRecord.id)) {
        setDeleteSaving(false);
        setDeleteOpen(false);
        navigate(vmRecord.owner === 'team' ? `/teams/${encodeURIComponent(vmRecord.teamId ?? 'demo-team')}/vms` : '/');
        return;
      }
      const networkBeforeDelete = getDemoNetworkState(vmRecord.grn);
      if (!clearDemoNetworkState(vmRecord.grn)) {
        setDeleteSaving(false);
        setDeleteOpen(false);
        setDeleteError('연결된 Network 정보를 정리하지 못했습니다. 기존 VM 상태를 유지했으니 잠시 후 다시 시도해 주세요.');
        return;
      }
      const next = { ...latest, vms: latest.vms.filter(item => item.id !== vmRecord.id) };
      if (!saveDemoVmState(next)) {
        const networkRestored = saveDemoNetworkState(vmRecord.grn, networkBeforeDelete);
        setDeleteSaving(false);
        setDeleteOpen(false);
        setDeleteError(networkRestored
          ? '로컬 미리보기에서 삭제를 반영하지 못했습니다. 기존 VM 상태를 유지했으니 잠시 후 다시 시도해 주세요.'
          : '로컬 미리보기에서 삭제와 Network 복원을 완료하지 못했습니다. 화면을 새로고침해 현재 상태를 확인해 주세요.');
        return;
      }
      setState(next);
      setDeleteSaving(false);
      setDeleteOpen(false);
      navigate(vmRecord.owner === 'team' ? `/teams/${encodeURIComponent(vmRecord.teamId ?? 'demo-team')}/vms` : '/');
    }, vmRecord.status === 'running' ? 650 : 250);
  }

  return <DemoShell activeItem="home" scopeLabel={vm.owner === 'team' ? `${teamName} · 일반 팀원` : '내 Resources'} teamScopeId={routeTeamId} userName={vm.owner === 'team' ? '윤채원' : '김지민'} hasUnsavedInput={purpose !== null || nameEditing}>
    <DemoPage>
      <Breadcrumb>{vm.owner === 'team' ? `${teamName} / 팀 Resources` : '워크스페이스 / 내 Resources'}</Breadcrumb>
      <Heading><div><Title>{vm.name}</Title><StatusLine>{vm.owner === 'team' ? '팀 VM' : '개인 VM'} · VM 설정</StatusLine></div></Heading>
      <DetailTabs vmId={vm.id} active="설정" teamId={vm.teamId} networkVmGrn={vm.grn} />
      <Surface>
        <SurfaceTitle>사용 목적</SurfaceTitle>
        <Hint>관리자가 확인하며 기준에 맞지 않으면 VM이 삭제될 수 있습니다.</Hint>
        <FactValue>어떤 용도로 사용합니까?</FactValue>
        <Textarea value={displayedPurpose} maxLength={100} disabled={readOnly} onChange={event => setPurpose(event.currentTarget.value)} />
        <Row><Hint>100자 이내로 입력해 주세요. 공백만 입력할 수 없습니다.</Hint><Button variant="primary" icon={<Octicon name="check" />} disabled={readOnly || purpose === null} onClick={savePurpose}>사용 목적 저장</Button></Row>
      </Surface>
      <Surface>
        <SurfaceTitle>Resources</SurfaceTitle>
        <Hint>{canResizeDisk ? `SSD는 ${vmRecord.owner === 'team' ? '팀' : '개인'} 할당량 안에서 10 GB 단위로 늘릴 수 있습니다. 남은 할당량 ${remainingDisk} GB입니다.` : readOnly ? '팀장 또는 DevOps만 VM 사양을 변경할 수 있습니다.' : `사양은 ${vmRecord.owner === 'team' ? '팀' : '개인'} 할당량 안에서 늘릴 수 있습니다. 현재 남은 할당량이 없어 늘릴 수 없습니다.`}</Hint>
        <SliderField label="vCPU" value={vm.cpu} min={1} max={vm.cpu} valueLabel={`${vm.cpu} vCPU`} minLabel="최소 1" maxLabel={`최대 ${vm.cpu} · 남은 할당량 0`} disabled />
        <SliderField label="RAM" value={vm.memory} min={1} max={vm.memory} valueLabel={`${vm.memory} GB`} minLabel="최소 1 GB" maxLabel={`최대 ${vm.memory} GB · 남은 할당량 0`} disabled />
        <SliderField label="SSD" value={vm.disk} min={vm.disk} max={vm.disk} valueLabel={`${vm.disk} GB`} minLabel={`현재 ${vm.disk} GB · 줄일 수 없습니다`} maxLabel={`최대 ${resizableDiskLimit} GB · 남은 할당량 ${remainingDisk} GB`} helper="SSD는 늘릴 수만 있습니다. 늘린 뒤에는 VM 안에서 파일 시스템을 늘려야 합니다." showHelper disabled />
        <Row><span /><Button variant="secondary" disabled={!canResizeDisk} icon={<Octicon name="database" />} onClick={openResizeDialog}>디스크 늘리기</Button></Row>
      </Surface>
      <Surface>
        <SurfaceTitle>Instance 정보</SurfaceTitle>
        <InstanceRow><Octicon name="server" />{nameEditing ? <NameEdit><NameInput aria-label="VM 이름" aria-invalid={Boolean(nameError || validateVmName(nameDraft.trim()))} autoFocus maxLength={40} value={nameDraft} disabled={nameSaving} onChange={event => { setNameDraft(event.currentTarget.value); setNameError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); saveName(); } else if (event.key === 'Escape') cancelNameEdit(); }} /><Button variant="secondary" disabled={nameSaving || Boolean(validateVmName(nameDraft.trim()))} onClick={saveName}>{nameSaving ? '저장 중' : nameError ? '다시 시도' : '저장'}</Button><Button variant="ghost" disabled={nameSaving} onClick={cancelNameEdit}>취소</Button></NameEdit> : <div><Hint>이름</Hint><FactValue>{vm.name}</FactValue></div>}{!nameEditing && <Button variant="ghost" icon={<Octicon name="pencil" />} disabled={readOnly} onClick={startNameEdit}>변경</Button>}</InstanceRow>
        {nameEditing && <NameError role={nameError || validateVmName(nameDraft.trim()) ? 'alert' : 'note'}>{nameError || validateVmName(nameDraft.trim()) || 'Enter를 누르면 저장하고, Esc를 누르면 취소합니다. 최대 40자 · 영문·숫자로 시작 · 영문, 숫자, -, _만 사용'}</NameError>}
        <InstanceRow><Octicon name="terminal" /><div><Hint>운영체제</Hint><FactValue>{vm.os}</FactValue></div></InstanceRow>
        <InstanceRow><Octicon name="cpu" /><div><Hint>Node 종류</Hint><FactValue>{vm.nodeType}</FactValue></div></InstanceRow>
      </Surface>
      <Surface>
        <SurfaceTitle>SSH 초기 비밀번호</SurfaceTitle>
        <Row><Hint>초기 비밀번호를 재설정한 뒤 개요에서 확인할 수 있습니다.</Hint><Button variant="secondary" disabled={readOnly} icon={<Octicon name="key" />} onClick={() => { setPasswordResetError(''); setPasswordResetOpen(true); }}>비밀번호 재설정</Button></Row>
      </Surface>
      <WarningBar><span>디스크 데이터와 연결된 Snapshot, 외부 접속 포트, HTTPS Domain이 함께 삭제됩니다. 삭제한 VM은 복구할 수 없습니다.</span><Button variant="danger" icon={<Octicon name="trashcan" />} disabled={readOnly || vmRecord.status === 'queued'} onClick={openDeleteDialog}>VM 삭제</Button></WarningBar>
      {notice && <Hint role="status">{notice}</Hint>}
    </DemoPage>
    {passwordResetOpen && <ModalSurface labelledBy="vm-reset-password-title" onDismiss={() => setPasswordResetOpen(false)}>
      <ResizePanel>
        <ResizeTitle id="vm-reset-password-title">비밀번호를 재설정하시겠습니까?</ResizeTitle>
        <ResizeCopy>새 초기 비밀번호는 VM 개요에서 확인할 수 있습니다.</ResizeCopy>
        {passwordResetError && <NameError role="alert">{passwordResetError}</NameError>}
        <ResizeActions>
          <Button variant="secondary" onClick={() => setPasswordResetOpen(false)}>취소</Button>
          <Button variant="primary" onClick={resetPassword}>비밀번호 재설정</Button>
        </ResizeActions>
      </ResizePanel>
    </ModalSurface>}
    {resizeOpen && <ModalSurface labelledBy="vm-resize-title" onDismiss={() => setResizeOpen(false)}>
      <ResizePanel>
        <ResizeTitle id="vm-resize-title">디스크 늘리기</ResizeTitle>
        <ResizeCopy>· 늘린 용량은 다시 줄일 수 없습니다.<br />· 완료 후 VM 안에서 파일 시스템을 늘려야 합니다.</ResizeCopy>
        <FactValue>현재 {vmRecord.disk} GB · {vmRecord.owner === 'team' ? '팀' : '개인'} SSD {quota.disk}/{quota.diskLimit} GB</FactValue>
        <ResizeFieldLabel htmlFor="vm-next-disk">새 용량</ResizeFieldLabel>
        <Input id="vm-next-disk" type="number" min={vmRecord.disk + 10} max={resizableDiskLimit} step={10} value={nextDisk} onChange={event => { setNextDisk(Number(event.currentTarget.value)); setResizeError(''); }} />
        <Hint>최대 {resizableDiskLimit} GB · 남은 할당량 {remainingDisk} GB</Hint>
        {resizeError && <NameError role="alert">{resizeError}</NameError>}
        <ResizeActions>
          <Button variant="secondary" onClick={() => setResizeOpen(false)}>취소</Button>
          <Button variant="primary" disabled={nextDisk <= vmRecord.disk || nextDisk > resizableDiskLimit || (nextDisk - vmRecord.disk) % 10 !== 0} onClick={resizeDisk}>늘리기</Button>
        </ResizeActions>
      </ResizePanel>
    </ModalSurface>}
    {deleteOpen && <DeleteOverlay onMouseDown={event => { if (event.target === event.currentTarget && !deleteSaving) setDeleteOpen(false); }}>
      <DeleteConfirmDialog
        open
        title={`${vmRecord.name}를 영구 삭제하시겠습니까?`}
        description="아래 자원이 모두 삭제됩니다. 삭제한 VM과 데이터는 복구할 수 없습니다."
        items={<>
          <div>· 디스크 데이터 {vmRecord.disk} GB</div>
          <div>· Snapshot {vmRecord.snapshots.length}개</div>
          <div>· 외부 접속 포트 {network.ports.length}개</div>
          <div>· HTTPS Domain {network.domains.length}개</div>
          {vmRecord.status === 'running' && <div>실행 중인 VM은 강제 정지한 뒤 삭제됩니다.</div>}
        </>}
        fieldLabel="확인을 위해 VM 이름을 입력하세요"
        confirmationName={vmRecord.name}
        value={deleteName}
        onValueChange={setDeleteName}
        onConfirm={deleteVm}
        onCancel={() => { if (!deleteSaving) setDeleteOpen(false); }}
        confirmLabel={deleteSaving ? (vmRecord.status === 'running' ? '정지 후 삭제 중' : '삭제 중') : 'VM 삭제'}
        confirmDisabled={deleteSaving}
        hint="VM 이름을 정확하게 입력해 주세요."
      />
    </DeleteOverlay>}
    {deleteError && <ModalSurface labelledBy="vm-delete-error-title" onDismiss={() => setDeleteError('')}>
      <DeleteFailure>
        <FailureTitle id="vm-delete-error-title">VM 삭제에 실패했습니다</FailureTitle>
        <FailureCopy>{deleteError}</FailureCopy>
        <FailureCopy>· {vmRecord.name} · 이전 상태 유지</FailureCopy>
        <FailureActions>
          <Button variant="secondary" onClick={() => setDeleteError('')}>닫기</Button>
          <Button variant="secondary" onClick={() => navigate('/status')}>서비스 상태 보기</Button>
          <Button variant="danger" onClick={() => { setDeleteError(''); setDeleteOpen(true); void deleteVm(); }}>다시 시도</Button>
        </FailureActions>
      </DeleteFailure>
    </ModalSurface>}
  </DemoShell>;
}

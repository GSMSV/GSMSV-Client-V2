import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoVmState, saveDemoVmState, type DemoSnapshot } from '../../entities/vm';
import { getDemoTeam } from '../../entities/team/demo';
import { isDemoMode } from '../../shared/demo';
import { Button, Switch, TextField } from '../../shared/ui/controls';
import { LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { Breadcrumb, DemoPage, DemoShell, DetailTabs, FactValue, Facts, Heading, Hint, MetricCard, MetricLabel, MetricValue, Row, Surface, SurfaceTitle, Table, TableWrap } from './VmDemoPrimitives';

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

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Overlay = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #00000099;
`;

const Dialog = styled.section`
  box-sizing: border-box;
  display: flex;
  width: min(480px, 100%);
  max-height: min(90vh, 680px);
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const DialogHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.primary};
`;

const DialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const DialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  white-space: pre-line;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
`;

const DialogForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProgressText = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

type SnapshotDialog =
  | { kind: 'create' }
  | { kind: 'restore'; snapshot: DemoSnapshot }
  | { kind: 'delete'; snapshot: DemoSnapshot }
  | { kind: 'restore-complete'; snapshot: DemoSnapshot }
  | null;

type SnapshotOperation = 'create' | 'restore' | 'delete' | null;

const snapshotNamePattern = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;

function waitForDemoOperation() {
  return new Promise<void>(resolve => window.setTimeout(resolve, 350));
}

function formatSnapshotTime() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date()).replaceAll('-', '.');
}

const IconButton = styled.button`
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:disabled { color: ${({ theme }) => theme.colors.faint}; cursor: not-allowed; }
`;

export function VmSnapshotsPage() {
  const { vmId, teamId: routeTeamId } = useParams<{ vmId: string; teamId?: string }>();
  const [state, setState] = useState(() => getDemoVmState());
  const latestState = useRef(state);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<SnapshotDialog>(null);
  const [snapshotName, setSnapshotName] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [operation, setOperation] = useState<SnapshotOperation>(null);
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);
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

  const manualCount = vmRecord.snapshots.filter(snapshot => snapshot.kind === 'manual').length;
  const automaticCount = vmRecord.snapshots.filter(snapshot => snapshot.kind === 'automatic').length;
  const totalCount = vmRecord.snapshots.length;

  function persist(update: (current: typeof state) => typeof state) {
    const next = update(latestState.current);
    if (!saveDemoVmState(next)) return false;
    latestState.current = next;
    setState(next);
    return true;
  }

  function openCreateSnapshot() {
    if (memberReadOnly) return;
    setSnapshotName('');
    setDialogError('');
    setDialog({ kind: 'create' });
  }

  async function createSnapshot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (memberReadOnly) return;
    const name = snapshotName.trim();
    if (totalCount >= 3 || manualCount >= 2) {
      setDialogError('저장 가능한 Snapshot 개수를 모두 사용했습니다.');
      return;
    }
    if (!snapshotNamePattern.test(name)) {
      setDialogError('영문으로 시작하며 영문, 숫자, 밑줄, 하이픈을 사용해 1~40자로 입력해 주세요.');
      return;
    }
    if (vmRecord.snapshots.some(snapshot => snapshot.name.toLowerCase() === name.toLowerCase())) {
      setDialogError('같은 이름의 Snapshot이 이미 있습니다.');
      return;
    }
    setDialogError('');
    setOperation('create');
    await waitForDemoOperation();
    const snapshot: DemoSnapshot = { id: `snapshot-${Date.now()}`, name, kind: 'manual', createdAt: formatSnapshotTime() };
    const saved = persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, snapshots: [snapshot, ...item.snapshots] } : item) }));
    setOperation(null);
    if (!saved) {
      setDialogError('Snapshot을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setDialog(null);
    setNotice(`${name} Snapshot을 만들었습니다.`);
  }

  function openDeleteSnapshot(snapshot: DemoSnapshot) {
    if (memberReadOnly) return;
    setDialogError('');
    setDialog({ kind: 'delete', snapshot });
  }

  async function deleteSnapshot(snapshot: DemoSnapshot) {
    if (memberReadOnly) return;
    setDialog(null);
    setDeletingSnapshotId(snapshot.id);
    setOperation('delete');
    await waitForDemoOperation();
    const saved = persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, snapshots: item.snapshots.filter(value => value.id !== snapshot.id) } : item) }));
    setDeletingSnapshotId(null);
    setOperation(null);
    if (!saved) {
      setNotice('Snapshot을 삭제하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setNotice('Snapshot을 삭제했습니다.');
  }

  function openRestoreSnapshot(snapshot: DemoSnapshot) {
    if (memberReadOnly) return;
    setDialogError('');
    setDialog({ kind: 'restore', snapshot });
  }

  async function restoreSnapshot(snapshot: DemoSnapshot) {
    if (memberReadOnly) return;
    setDialogError('');
    setOperation('restore');
    await waitForDemoOperation();
    const saved = persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, status: 'stopped' } : item) }));
    setOperation(null);
    if (!saved) {
      setDialogError('Snapshot을 복원하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setDialog({ kind: 'restore-complete', snapshot });
    setNotice(`${snapshot.name} 시점으로 디스크를 복원했습니다. VM은 현재 정지 상태입니다.`);
  }

  function startVmAfterRestore() {
    if (memberReadOnly) return;
    const saved = persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, status: 'running' } : item) }));
    if (!saved) {
      setDialogError('VM을 시작하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setDialog(null);
    setDialogError('');
    setNotice('VM을 시작했습니다.');
  }

  function setAutomatic(enabled: boolean) {
    if (memberReadOnly) return;
    const saved = persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, autoSnapshots: enabled } : item) }));
    setNotice(saved
      ? enabled ? '자동 Snapshot을 켰습니다. 다음 자정부터 최신 1개를 보관합니다.' : '자동 Snapshot을 껐습니다.'
      : '자동 Snapshot 설정을 저장하지 못했습니다.');
  }

  return <DemoShell activeItem="home" scopeLabel={vm.owner === 'team' ? `${teamName} · 일반 팀원` : '내 Resources'} teamScopeId={routeTeamId} userName={vm.owner === 'team' ? '윤채원' : '김지민'}>
    <DemoPage>
      <Breadcrumb>{vm.owner === 'team' ? `${teamName} / 팀 Resources` : '워크스페이스 / 내 Resources'}</Breadcrumb>
      <Heading><div><Title>{vm.name}</Title><StatusLine>{vm.status === 'running' ? '실행 중' : vm.status === 'stopped' ? '정지됨' : '생성 대기 중'} · 디스크의 특정 시점을 보관하고 복원합니다</StatusLine></div><Button variant="primary" icon={<Octicon name="plus" />} disabled={memberReadOnly || totalCount >= 3 || manualCount >= 2 || operation !== null} onClick={openCreateSnapshot}>Snapshot 만들기</Button></Heading>
      <DetailTabs vmId={vm.id} active="Snapshot" teamId={vm.teamId} networkVmGrn={vm.grn} />
      <Facts>
        <MetricCard><MetricLabel><Octicon name="database" />　전체 Snapshot</MetricLabel><MetricValue>{totalCount} / 3</MetricValue><Hint>현재 수동 {manualCount}개 + 자동 {automaticCount}개 · 최대 3개</Hint></MetricCard>
        <MetricCard><MetricLabel><Octicon name="history" />　수동 Snapshot</MetricLabel><MetricValue>{manualCount} / 2</MetricValue><Hint>{Math.max(0, 2 - manualCount)}개 더 만들 수 있습니다</Hint></MetricCard>
        <MetricCard><MetricLabel><Octicon name="clock" />　자동 Snapshot</MetricLabel><MetricValue>{automaticCount} / 1</MetricValue><Hint>최신 1개 보관</Hint></MetricCard>
      </Facts>
      <Surface>
        <SurfaceTitle>매일 자동으로 백업하기</SurfaceTitle>
        <FactValue>매일 00:00(KST)에 이전 자동 Snapshot을 삭제하고, 00:01에 새 Snapshot을 만듭니다. 교체 중 약 1분간 자동 Snapshot이 없을 수 있습니다.</FactValue>
        <Row><div><FactValue>자동 Snapshot</FactValue><Hint>켜도 바로 만들지 않습니다. 다음 자정부터 최신 1개만 보관합니다.</Hint></div><Switch label="" checked={vm.autoSnapshots} disabled={memberReadOnly} onChange={setAutomatic} /></Row>
      </Surface>
      <Surface>
        <SurfaceTitle>저장된 Snapshot</SurfaceTitle>
        <TableWrap><Table>
          <thead><tr><th>이름</th><th>종류</th><th>생성 시각 (KST)</th><th>관리</th></tr></thead>
          <tbody>{vm.snapshots.length === 0 ? <tr><td colSpan={4}>저장된 Snapshot이 없습니다.</td></tr> : vm.snapshots.map(snapshot => <tr key={snapshot.id}>
            <td>{snapshot.name}</td><td>{snapshot.kind === 'automatic' ? '자동' : '수동'}</td><td>{snapshot.createdAt}</td>
            <td>{deletingSnapshotId === snapshot.id
              ? <ProgressText role="status" aria-live="polite">삭제 중</ProgressText>
              : <RowActions>
                <IconButton type="button" aria-label={`${snapshot.name} 복원`} title="복원" disabled={memberReadOnly || operation !== null} onClick={() => openRestoreSnapshot(snapshot)}><Octicon name="history" /></IconButton>
                <IconButton type="button" aria-label={`${snapshot.name} 삭제`} title="삭제" disabled={memberReadOnly || operation !== null} onClick={() => openDeleteSnapshot(snapshot)}><Octicon name="trashcan" /></IconButton>
              </RowActions>}
            </td>
          </tr>)}</tbody>
        </Table></TableWrap>
      </Surface>
      <Surface>
        <Row><Octicon name="info" size={20} /><div><FactValue>Snapshot은 디스크 데이터만 저장합니다</FactValue><Hint>메모리 상태와 실행 중인 작업은 저장되지 않습니다. 복원하면 해당 시점 이후 디스크 변경 사항이 사라지고, VM은 정지 상태가 됩니다.</Hint></div></Row>
      </Surface>
      {notice && <Hint role="status">{notice}</Hint>}
    </DemoPage>
    {dialog && <Overlay onMouseDown={event => {
      if (event.currentTarget === event.target && operation === null) {
        setDialog(null);
        setDialogError('');
      }
    }}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="snapshot-dialog-title">
        {dialog.kind === 'create' && <>
          <DialogHeader><Octicon name="database" size={20} /><DialogTitle id="snapshot-dialog-title">{operation === 'create' ? 'Snapshot을 만들고 있어요' : '수동 Snapshot 만들기'}</DialogTitle></DialogHeader>
          {operation === 'create' ? <>
            <DialogCopy>현재 디스크 상태를 저장하고 있습니다.</DialogCopy>
            <LoadingCard height={72} />
          </> : <>
            <DialogCopy>현재 디스크 상태를 저장합니다. 수동 Snapshot은 2개까지 만들 수 있습니다.</DialogCopy>
            <DialogCopy>· 수동 {manualCount}/2개 사용 중{'\n'}· 메모리 상태는 포함되지 않습니다.</DialogCopy>
            <DialogForm onSubmit={event => void createSnapshot(event)}>
              <TextField
                label="Snapshot 이름"
                value={snapshotName}
                maxLength={40}
                pattern="[A-Za-z][A-Za-z0-9_-]{0,39}"
                placeholder="before-update"
                hint="영문으로 시작 · 1–40자 · 영문, 숫자, 밑줄, 하이픈"
                error={dialogError}
                disabled={memberReadOnly}
                onChange={event => { setSnapshotName(event.currentTarget.value); setDialogError(''); }}
                autoFocus
              />
              <DialogActions>
                <Button variant="secondary" type="button" onClick={() => { setDialog(null); setDialogError(''); }}>취소</Button>
                <Button variant="primary" type="submit" disabled={memberReadOnly || operation !== null}>저장</Button>
              </DialogActions>
            </DialogForm>
          </>}
        </>}
        {dialog.kind === 'restore' && <>
          <DialogHeader><Octicon name="history" size={20} /><DialogTitle id="snapshot-dialog-title">{operation === 'restore' ? 'Snapshot을 복원하고 있어요' : '이 Snapshot으로 복원하시겠습니까?'}</DialogTitle></DialogHeader>
          {operation === 'restore' ? <>
            <DialogCopy>실행 중인 {vmRecord.name}을 정지한 뒤 디스크를 복원하고 있습니다.</DialogCopy>
            <LoadingCard height={72} />
          </> : <>
            <DialogCopy>Snapshot을 만든 이후 디스크의 모든 변경 사항이 사라집니다. 이 작업은 되돌릴 수 없습니다.</DialogCopy>
            <DialogCopy>· 복원 지점: {dialog.snapshot.name}{'\n'}· 생성 시각: {dialog.snapshot.createdAt} (KST){'\n'}· 실행 중인 {vmRecord.name}을 먼저 정지합니다.{'\n'}· 복원 후 VM은 정지 상태로 유지됩니다.</DialogCopy>
            {dialogError && <DialogCopy role="alert">{dialogError}</DialogCopy>}
            <DialogActions>
              <Button variant="secondary" type="button" onClick={() => { setDialog(null); setDialogError(''); }}>취소</Button>
              <Button variant="primary" type="button" disabled={memberReadOnly || operation !== null} onClick={() => void restoreSnapshot(dialog.snapshot)}>정지하고 복원</Button>
            </DialogActions>
          </>}
        </>}
        {dialog.kind === 'delete' && <>
          <DialogHeader><Octicon name="trashcan" size={20} /><DialogTitle id="snapshot-dialog-title">{dialog.snapshot.kind === 'automatic' ? '자동 Snapshot을 삭제하시겠습니까?' : 'Snapshot을 삭제하시겠습니까?'}</DialogTitle></DialogHeader>
          <DialogCopy>{dialog.snapshot.name}을 삭제하면 이 시점으로 복원할 수 없습니다.</DialogCopy>
          {dialog.snapshot.kind === 'automatic' && vmRecord.autoSnapshots && <DialogCopy>· 자동 Snapshot이 켜져 있어 다음 자정에 다시 만들어집니다.</DialogCopy>}
          <DialogCopy>· 삭제 요청 후 완료될 때까지 목록에 ‘삭제 중’으로 표시됩니다.</DialogCopy>
          {dialogError && <DialogCopy role="alert">{dialogError}</DialogCopy>}
          <DialogActions>
            <Button variant="secondary" type="button" onClick={() => { setDialog(null); setDialogError(''); }}>취소</Button>
            <Button variant="danger" type="button" disabled={memberReadOnly || operation !== null} onClick={() => void deleteSnapshot(dialog.snapshot)}>Snapshot 삭제</Button>
          </DialogActions>
        </>}
        {dialog.kind === 'restore-complete' && <>
          <DialogHeader><Octicon name="check-circle" size={20} /><DialogTitle id="snapshot-dialog-title">복원을 완료했습니다</DialogTitle></DialogHeader>
          <DialogCopy>{dialog.snapshot.name} 시점으로 디스크를 복원했습니다. VM은 현재 정지 상태입니다.</DialogCopy>
          <DialogCopy>· 다시 사용하려면 VM을 시작해 주세요.</DialogCopy>
          {dialogError && <DialogCopy role="alert">{dialogError}</DialogCopy>}
          <DialogActions>
            <Button variant="secondary" type="button" onClick={() => { setDialog(null); setDialogError(''); }}>닫기</Button>
            <Button variant="primary" type="button" disabled={memberReadOnly} onClick={startVmAfterRestore}>VM 시작</Button>
          </DialogActions>
        </>}
      </Dialog>
    </Overlay>}
  </DemoShell>;
}

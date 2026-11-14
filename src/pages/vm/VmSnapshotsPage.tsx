import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoVmState, saveDemoVmState, type DemoSnapshot } from '../../entities/vm';
import { isDemoMode } from '../../shared/demo';
import { Button, Switch } from '../../shared/ui/controls';
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
`;

export function VmSnapshotsPage() {
  const { vmId } = useParams<{ vmId: string }>();
  const [state, setState] = useState(() => getDemoVmState());
  const [notice, setNotice] = useState('');
  const vm = useMemo(() => state.vms.find(item => item.id === vmId), [state.vms, vmId]);
  if (!isDemoMode()) return <Navigate to="/" replace />;
  if (!vm) return <Navigate to="/" replace />;
  const vmRecord = vm;

  const manualCount = vmRecord.snapshots.filter(snapshot => snapshot.kind === 'manual').length;
  const automaticCount = vmRecord.snapshots.filter(snapshot => snapshot.kind === 'automatic').length;
  const totalCount = vmRecord.snapshots.length;

  function persist(update: (current: typeof state) => typeof state) {
    setState(current => {
      const next = update(current);
      saveDemoVmState(next);
      return next;
    });
  }

  function createSnapshot() {
    if (totalCount >= 3 || manualCount >= 2) {
      setNotice('저장 가능한 Snapshot 개수를 모두 사용했습니다.');
      return;
    }
    const name = window.prompt('Snapshot 이름을 입력해 주세요.', 'before-deploy')?.trim();
    if (!name) return;
    if (vmRecord.snapshots.some(snapshot => snapshot.name === name)) {
      setNotice('같은 이름의 Snapshot이 이미 있습니다.');
      return;
    }
    const snapshot: DemoSnapshot = { id: `snapshot-${Date.now()}`, name, kind: 'manual', createdAt: '2026.09.30 10:42' };
    persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, snapshots: [snapshot, ...item.snapshots] } : item) }));
    setNotice(`${name} Snapshot을 만들었습니다.`);
  }

  function deleteSnapshot(snapshotId: string) {
    const snapshot = vmRecord.snapshots.find(item => item.id === snapshotId);
    if (!snapshot || !window.confirm(`${snapshot.name} Snapshot을 삭제할까요?`)) return;
    persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, snapshots: item.snapshots.filter(value => value.id !== snapshotId) } : item) }));
    setNotice('Snapshot을 삭제했습니다.');
  }

  function restoreSnapshot(snapshot: DemoSnapshot) {
    if (!window.confirm(`${snapshot.name} 시점으로 복원할까요? 이후 디스크 변경 사항이 사라지고 VM이 정지 상태가 됩니다.`)) return;
    persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, status: 'stopped' } : item) }));
    setNotice(`${snapshot.name} 시점으로 복원했습니다. VM은 정지 상태입니다.`);
  }

  function setAutomatic(enabled: boolean) {
    persist(current => ({ ...current, vms: current.vms.map(item => item.id === vmRecord.id ? { ...item, autoSnapshots: enabled } : item) }));
    setNotice(enabled ? '자동 Snapshot을 켰습니다. 다음 자정부터 최신 1개를 보관합니다.' : '자동 Snapshot을 껐습니다.');
  }

  return <DemoShell activeItem="home" scopeLabel={vm.owner === 'team' ? 'GSM Connect · 일반 팀원' : '내 Resources'} userName={vm.owner === 'team' ? '윤채원' : '김지민'}>
    <DemoPage>
      <Breadcrumb>워크스페이스 / 내 Resources</Breadcrumb>
      <Heading><div><Title>{vm.name}</Title><StatusLine>{vm.status === 'running' ? '실행 중' : vm.status === 'stopped' ? '정지됨' : '생성 대기 중'} · 디스크의 특정 시점을 보관하고 복원합니다</StatusLine></div><Button variant="primary" icon={<Octicon name="plus" />} disabled={totalCount >= 3 || manualCount >= 2} onClick={createSnapshot}>Snapshot 만들기</Button></Heading>
      <DetailTabs vmId={vm.id} active="Snapshot" teamId={vm.teamId} networkVmGrn={vm.grn} />
      <Facts>
        <MetricCard><MetricLabel><Octicon name="database" />　전체 Snapshot</MetricLabel><MetricValue>{totalCount} / 3</MetricValue><Hint>현재 수동 {manualCount}개 + 자동 {automaticCount}개 · 최대 3개</Hint></MetricCard>
        <MetricCard><MetricLabel><Octicon name="history" />　수동 Snapshot</MetricLabel><MetricValue>{manualCount} / 2</MetricValue><Hint>{Math.max(0, 2 - manualCount)}개 더 만들 수 있습니다</Hint></MetricCard>
        <MetricCard><MetricLabel><Octicon name="clock" />　자동 Snapshot</MetricLabel><MetricValue>{automaticCount} / 1</MetricValue><Hint>최신 1개 보관</Hint></MetricCard>
      </Facts>
      <Surface>
        <SurfaceTitle>매일 자동으로 백업하기</SurfaceTitle>
        <FactValue>매일 00:00(KST)에 이전 자동 Snapshot을 삭제하고, 00:01에 새 Snapshot을 만듭니다. 교체 중 약 1분간 자동 Snapshot이 없을 수 있습니다.</FactValue>
        <Row><div><FactValue>자동 Snapshot</FactValue><Hint>켜도 바로 만들지 않습니다. 다음 자정부터 최신 1개만 보관합니다.</Hint></div><Switch label="" checked={vm.autoSnapshots} onChange={setAutomatic} /></Row>
      </Surface>
      <Surface>
        <SurfaceTitle>저장된 Snapshot</SurfaceTitle>
        <TableWrap><Table>
          <thead><tr><th>이름</th><th>종류</th><th>생성 시각 (KST)</th><th>관리</th></tr></thead>
          <tbody>{vm.snapshots.length === 0 ? <tr><td colSpan={4}>저장된 Snapshot이 없습니다.</td></tr> : vm.snapshots.map(snapshot => <tr key={snapshot.id}>
            <td>{snapshot.name}</td><td>{snapshot.kind === 'automatic' ? '자동' : '수동'}</td><td>{snapshot.createdAt}</td>
            <td><RowActions><IconButton type="button" aria-label={`${snapshot.name} 복원`} title="복원" onClick={() => restoreSnapshot(snapshot)}><Octicon name="history" /></IconButton><IconButton type="button" aria-label={`${snapshot.name} 삭제`} title="삭제" onClick={() => deleteSnapshot(snapshot.id)}><Octicon name="trashcan" /></IconButton></RowActions></td>
          </tr>)}</tbody>
        </Table></TableWrap>
      </Surface>
      <Surface>
        <Row><Octicon name="info" size={20} /><div><FactValue>Snapshot은 디스크 데이터만 저장합니다</FactValue><Hint>메모리 상태와 실행 중인 작업은 저장되지 않습니다. 복원하면 해당 시점 이후 디스크 변경 사항이 사라지고, VM은 정지 상태가 됩니다.</Hint></div></Row>
      </Surface>
      {notice && <Hint role="status">{notice}</Hint>}
    </DemoPage>
  </DemoShell>;
}

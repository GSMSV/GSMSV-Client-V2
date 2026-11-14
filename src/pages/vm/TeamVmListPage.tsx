import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoVmState } from '../../entities/vm';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Breadcrumb, DemoPage, DemoShell, FactValue, Heading, Hint, Row, StatusText, Surface, SurfaceTitle, Table, TableWrap } from './VmDemoPrimitives';

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

const TableAction = styled.button`
  border: 0;
  padding: 0;
  background: none;
  color: ${({ theme }) => theme.colors.primary};
  font: inherit;
  cursor: pointer;
`;

export function TeamVmListPage() {
  const { teamId = 'gsm-connect' } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => getDemoVmState(), [refresh]);
  const vms = state.vms.filter(vm => vm.owner === 'team' && vm.teamId === teamId);
  if (!isDemoMode()) return <Navigate to="/" replace />;

  return <DemoShell activeItem="home" scopeLabel="GSM Connect · 팀장" userName="김지민">
    <DemoPage>
      <Breadcrumb>GSM Connect / 팀 Resources</Breadcrumb>
      <Heading><div><Title>팀 VM</Title><StatusLine>팀에서 사용하는 가상 머신을 확인하고 관리합니다.</StatusLine></div><Button variant="primary" icon={<Octicon name="plus" />} onClick={() => navigate(`/teams/${teamId}/vms/new`)}>팀 VM 만들기</Button></Heading>
      <Surface>
        <Row><SurfaceTitle>VM 목록</SurfaceTitle><Button variant="secondary" icon={<Octicon name="sync" />} onClick={() => setRefresh(value => value + 1)}>새로고침</Button></Row>
        <TableWrap><Table>
          <thead><tr><th>이름</th><th>상태</th><th>사양</th><th>생성한 사람</th><th>만료일</th><th>관리</th></tr></thead>
          <tbody>{vms.length === 0 ? <tr><td colSpan={6}>팀 VM이 없습니다.</td></tr> : vms.map(vm => <tr key={vm.id}>
            <td><TableAction onClick={() => navigate(`/teams/${teamId}/vms/${vm.id}`)}>{vm.name}</TableAction></td>
            <td><StatusText $status={vm.status}>{vm.status === 'running' ? '실행 중' : vm.status === 'queued' ? '생성 대기 중' : '정지됨'}</StatusText></td>
            <td>{vm.cpu} vCPU · RAM {vm.memory} GB · SSD {vm.disk} GB</td><td>{vm.creator}</td><td>{vm.expiresAt}</td>
            <td><Button variant="ghost" onClick={() => navigate(`/teams/${teamId}/vms/${vm.id}`)}>열기</Button></td>
          </tr>)}</tbody>
        </Table></TableWrap>
        <Hint>팀 VM은 팀 할당량으로 계산되며 개인 할당량에 포함되지 않습니다.</Hint>
      </Surface>
      <Surface><SurfaceTitle>팀 할당량 · 소형</SurfaceTitle><FactValue>현재 {state.teamQuota.cpu}/{state.teamQuota.cpuLimit} vCPU · RAM {state.teamQuota.memory}/{state.teamQuota.memoryLimit} GB · SSD {state.teamQuota.disk}/{state.teamQuota.diskLimit} GB 사용 중</FactValue></Surface>
    </DemoPage>
  </DemoShell>;
}

import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoVmState } from '../../entities/vm';
import { getDemoTeam } from '../../entities/team/demo';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Banner, BannerCopy, Breadcrumb, DemoPage, DemoShell, DetailTabs, Fact, FactLabel, FactValue, Grid2, Heading, Hint, MetricCard, StatusText } from './VmDemoPrimitives';

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

const RangeButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chart = styled.svg`
  display: block;
  width: 100%;
  height: 140px;
  overflow: visible;
`;

const ValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 20px 0 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Value = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Percent = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const MetricCardWide = styled(MetricCard)`
  min-height: 338px;
`;

const MetricHeading = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const GraphLine = styled.polyline`
  fill: none;
  stroke: ${({ theme }) => theme.colors.primary};
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
`;

const GraphGrid = styled.line`
  stroke: ${({ theme }) => theme.colors.border};
  stroke-width: 1;
`;

const DataGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 16px;
`;

export function VmMonitoringPage() {
  const { vmId, teamId: routeTeamId } = useParams<{ vmId: string; teamId?: string }>();
  const [range, setRange] = useState<'1시간' | '6시간' | '24시간'>('1시간');
  const [refresh, setRefresh] = useState(0);
  const state = useMemo(() => getDemoVmState(), [refresh]);
  const vm = state.vms.find(item => item.id === vmId);

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

  return <DemoShell activeItem="home" scopeLabel={vm.owner === 'team' ? `${teamName} · 일반 팀원` : '내 Resources'} teamScopeId={routeTeamId} userName={vm.owner === 'team' ? '윤채원' : '김지민'}>
    <DemoPage>
      <Breadcrumb>{vm.owner === 'team' ? `${teamName} / 팀 Resources` : '워크스페이스 / 내 Resources'}</Breadcrumb>
      <Heading><div><Title>{vm.name}</Title><StatusLine><StatusText $status={vm.status}>{vm.status === 'running' ? '실행 중' : vm.status === 'queued' ? '생성 대기 중' : '정지됨'}</StatusText> · Resource 사용 기록</StatusLine></div><RangeButtons>
        {(['6시간', '24시간', '1시간'] as const).map(value => <Button key={value} variant={range === value ? 'primary' : 'secondary'} icon={range === value ? <Octicon name="clock" /> : undefined} onClick={() => setRange(value)}>{value}</Button>)}
        <Button variant="secondary" icon={<Octicon name="sync" />} onClick={() => setRefresh(value => value + 1)}>새로고침</Button>
      </RangeButtons></Heading>
      <DetailTabs vmId={vm.id} active="Monitoring" teamId={vm.teamId} networkVmGrn={vm.grn} />
      <BannerWarning />
      <Grid2>
        <MetricCardWide><MetricHeading>CPU 사용률</MetricHeading><ValueRow><Value>{24 + (refresh % 3)}</Value><Percent>%</Percent></ValueRow><ChartGraph variant="cpu" /><DataGrid><Hint>08:30–09:30 · 최대 92% · 할당 {vm.cpu} vCPU</Hint></DataGrid></MetricCardWide>
        <MetricCardWide><MetricHeading>메모리 사용률</MetricHeading><ValueRow><Value>38</Value><Percent>%</Percent></ValueRow><ChartGraph variant="memory" /><DataGrid><Hint>현재 1.52 GB / {vm.memory} GB · 최대 46%</Hint></DataGrid></MetricCardWide>
        <MetricCardWide><MetricHeading>Network</MetricHeading><ValueRow><Value>2.4</Value><Percent>MB/s</Percent></ValueRow><ChartGraph variant="network" /><DataGrid><Hint>수신 2.4 MB/s · 송신 0.8 MB/s · Network 전송량</Hint></DataGrid></MetricCardWide>
        <MetricCardWide><MetricHeading>디스크 I/O</MetricHeading><ValueRow><Value>1.2</Value><Percent>MB/s</Percent></ValueRow><ChartGraph variant="disk" /><DataGrid><Hint>읽기 1.2 MB/s · 쓰기 0.4 MB/s · 디스크 처리량</Hint></DataGrid></MetricCardWide>
      </Grid2>
      <Fact><FactLabel>기록 확인</FactLabel><FactValue>시간은 KST 기준입니다. VM을 정지해도 이전 사용 기록을 확인할 수 있습니다.</FactValue></Fact>
    </DemoPage>
  </DemoShell>;
}

function BannerWarning() {
  return <Banner $tone="warning"><Octicon name="alert" size={20} /><BannerCopy><strong>09:18에 CPU 사용률이 92%에 도달했습니다</strong><span>사용량 추이를 확인하고 필요한 경우 실행 중인 작업을 점검해 주세요.</span></BannerCopy></Banner>;
}

function ChartGraph({ variant }: { variant: 'cpu' | 'memory' | 'network' | 'disk' }) {
  const points: Record<typeof variant, string> = {
    cpu: '0,106 44,110 88,102 132,95 176,99 220,90 264,68 308,16 352,45 396,76 440,94 484,98 512,94',
    memory: '0,92 44,90 88,92 132,84 176,83 220,79 264,66 308,58 352,65 396,68 440,74 484,72 512,70',
    network: '0,112 44,106 88,110 132,102 176,97 220,101 264,56 308,9 352,52 396,82 440,76 484,80 512,84',
    disk: '0,110 44,108 88,108 132,90 176,98 220,82 264,88 308,40 352,58 396,80 440,86 484,86 512,86',
  };
  return <Chart viewBox="0 0 512 140" preserveAspectRatio="none" role="img" aria-label={`${variant} 사용 기록 차트`}>
    {[0, 46, 92, 138].map(y => <GraphGrid key={y} x1="0" x2="512" y1={y} y2={y} />)}
    <GraphLine points={points[variant]} />
  </Chart>;
}

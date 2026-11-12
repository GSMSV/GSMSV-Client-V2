import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { listAdminResources, listInfraNodes, listNodeVms, type AdminResource, type InfraNode, type NodeVm } from '../../entities/infra-node';
import { listNotifications } from '../../entities/notification';
import { ApiRequestError } from '../../shared/api';
import { Button } from '../../shared/ui/controls';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon, type OcticonName } from '../../shared/ui/icons';
import { NotificationPanel } from '../../widgets/notification-panel';

const Layout = styled.div`
  display: flex;
  min-width: 1200px;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  display: flex;
  width: 216px;
  height: 100vh;
  min-height: 100vh;
  flex: 0 0 216px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 28px ${({ theme }) => theme.space[16]}px ${({ theme }) => theme.space[16]}px;
  background: ${({ theme }) => theme.colors.sidebar};
`;

const Brand = styled.div`
  display: flex;
  width: 184px;
  min-height: 34px;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 12px;
`;

const Logo = styled.img`
  display: block;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`;

const BrandText = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.h2.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.h2.size}px;
  font-weight: ${({ theme }) => theme.typography.h2.weight};
  line-height: ${({ theme }) => theme.typography.h2.lineHeight}px;
`;

const WorkspaceLabel = styled.p`
  margin: 0;
  padding: 0 12px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const NavigationItem = styled.button<{ $active?: boolean }>`
  display: flex;
  width: 184px;
  min-height: 42px;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  text-align: left;
  cursor: ${({ $active }) => $active ? 'default' : 'not-allowed'};

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  &:disabled { opacity: .72; }
`;

const Divider = styled.div`
  width: 184px;
  height: 1px;
  margin: ${({ theme }) => theme.space[8]}px 0;
  background: ${({ theme }) => theme.colors.border};
`;

const SidebarFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  margin-top: auto;
`;

const Header = styled.header`
  display: flex;
  width: 100%;
  min-height: 74px;
  flex: 0 0 74px;
  align-items: center;
  padding: ${({ theme }) => theme.space[16]}px 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderContent = styled.div`
  display: flex;
  width: 100%;
  max-width: 1144px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
  margin: 0 auto;
`;

const HeaderStart = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const ConsoleLabel = styled.span`
  display: inline-flex;
  width: 220px;
  flex: 0 0 220px;
  align-items: center;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const SearchAction = styled(Button)`
  width: 520px;
  min-width: 180px;
  justify-content: flex-start;
  color: ${({ theme }) => theme.colors.text};
`;

const HeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const MainColumn = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
`;

const Main = styled.main`
  min-width: 0;
  flex: 1 1 auto;
`;

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
`;

const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Summary = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
`;

const SummaryCard = styled.article`
  display: flex;
  min-width: 0;
  min-height: 156px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const SummaryLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const SummaryValue = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const SummaryCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Section = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const NodeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
`;

const NodeCard = styled.article`
  display: flex;
  min-width: 0;
  min-height: 246px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const NodeCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const IconBox = styled.span`
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
`;

const NodeState = styled.span<{ $online: boolean }>`
  color: ${({ theme, $online }) => $online ? theme.colors.faint : theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const NodeName = styled.h3`
  overflow: hidden;
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NodeMeta = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const NodeVmListArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const NodeVmRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
`;

const Panel = styled.section`
  display: flex;
  min-width: 0;
  min-height: 248px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const GapMessage = styled.div`
  display: flex;
  min-height: 98px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: center;
`;

const PanelRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PanelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const PanelValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
`;

const StateArea = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`;

type LoadState =
  | { kind: 'loading'; nodes: InfraNode[]; resources: AdminResource[]; checkedAt: Date | null }
  | { kind: 'ready'; nodes: InfraNode[]; resources: AdminResource[]; checkedAt: Date }
  | { kind: 'error'; nodes: InfraNode[]; resources: AdminResource[]; checkedAt: Date | null; status: number | null };

const initialState: LoadState = { kind: 'loading', nodes: [], resources: [], checkedAt: null };

type NodeVmState = { loading: boolean; error: boolean; unavailable: boolean; items: NodeVm[] };

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value)}%`;
}

function formatUptime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '가동 시간 확인 불가';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days > 0 ? `가동 시간 ${days}일 ${hours}시간` : `가동 시간 ${hours}시간`;
}

function formatGb(value: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value);
}

function icon(name: OcticonName) {
  return <Octicon name={name} size={16} aria-hidden="true" />;
}

function summarizeMemory(node: InfraNode) {
  const total = node.usage.memory_total_gb;
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(node.usage.memory_used_gb)) return '—';
  return formatPercent((node.usage.memory_used_gb / total) * 100);
}

export default function AdminInfrastructurePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>(initialState);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nodeVmStates, setNodeVmStates] = useState<Record<string, NodeVmState>>({});
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
    window.requestAnimationFrame(() => document.getElementById('admin-notifications-trigger')?.focus());
  }, []);

  const load = useCallback(async (signal: AbortSignal) => {
    setState(current => ({ kind: 'loading', nodes: current.nodes, resources: current.resources, checkedAt: current.checkedAt }));
    try {
      const [nodes, resources] = await Promise.all([listInfraNodes(signal), listAdminResources(signal)]);
      if (!signal.aborted) {
        const initialVmStates = Object.fromEntries(nodes.map(node => [node.node, node.online
          ? { loading: true, error: false, unavailable: false, items: [] }
          : { loading: false, error: false, unavailable: true, items: [] }])) as Record<string, NodeVmState>;
        setNodeVmStates(initialVmStates);
        setExpandedNode(null);
        setState({ kind: 'ready', nodes, resources, checkedAt: new Date() });
        void Promise.all(nodes.map(async node => {
          if (!node.online) {
            return { node: node.node, state: { loading: false, error: false, unavailable: true, items: [] } as NodeVmState };
          }
          try {
            return { node: node.node, state: { loading: false, error: false, unavailable: false, items: await listNodeVms(node.node, signal) } as NodeVmState };
          } catch {
            return { node: node.node, state: { loading: false, error: true, unavailable: false, items: [] } as NodeVmState };
          }
        })).then(results => {
          if (!signal.aborted) setNodeVmStates(Object.fromEntries(results.map(result => [result.node, result.state])));
        });
      }
    } catch (error) {
      if (signal.aborted) return;
      const status = error instanceof ApiRequestError ? error.status : null;
      setState(current => status === 401 || status === 403
        ? { kind: 'error', nodes: [], resources: [], checkedAt: null, status }
        : { kind: 'error', nodes: current.nodes, resources: current.resources, checkedAt: current.checkedAt, status });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    void listNotifications(controller.signal)
      .then(result => { if (!controller.signal.aborted) setUnreadCount(result.unread_count); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const nodes = state.nodes;
  const onlineCount = nodes.filter(node => node.online).length;
  const offlineNodes = nodes.filter(node => !node.online);
  const cloneQueue = nodes.reduce((total, node) => total + Math.max(0, node.clone_queue_length), 0);
  const allocatedVcpu = nodes.reduce((total, node) => total + node.allocation.vcpu.allocated, 0);
  const availableVcpu = nodes.reduce((total, node) => total + node.allocation.vcpu.allocatable, 0);
  const vmResources = state.resources.filter(resource => resource.type === 'vm');
  const loadNodeVms = async (node: string) => {
    setExpandedNode(current => current === node ? null : node);
    if (nodeVmStates[node]?.loading) return;
    if (nodeVmStates[node] && !nodeVmStates[node].error) return;
    setNodeVmStates(current => ({ ...current, [node]: { loading: true, error: false, unavailable: false, items: current[node]?.items ?? [] } }));
    try {
      const items = await listNodeVms(node);
      setNodeVmStates(current => ({ ...current, [node]: { loading: false, error: false, unavailable: false, items } }));
    } catch {
      setNodeVmStates(current => ({ ...current, [node]: { loading: false, error: true, unavailable: false, items: [] } }));
    }
  };

  const navItems: Array<{ label: string; icon: OcticonName }> = [
    { label: '인프라 현황', icon: 'pulse' },
    { label: '승인', icon: 'checklist' },
    { label: '전체 VM', icon: 'server' },
    { label: '문의 답변', icon: 'comment-discussion' },
    { label: '관리자 점검', icon: 'shield' },
  ];

  const stateContent = () => {
    if (state.kind === 'loading' && state.nodes.length === 0) {
      return <StateArea aria-label="노드 정보를 불러오는 중"><LoadingCard height={360} /></StateArea>;
    }
    if (state.kind === 'error' && state.nodes.length === 0) {
      if (state.status === 401) {
        return <Banner tone="warning" icon={icon('lock')} title="로그인이 필요합니다" description="관리자 계정으로 로그인한 뒤 다시 시도해 주세요." action={<Button variant="secondary" onClick={() => navigate('/login')}>로그인</Button>} />;
      }
      if (state.status === 403) {
        return <Banner tone="danger" icon={icon('shield')} title="관리자 권한이 필요합니다" description="이 화면은 관리자만 볼 수 있습니다. 계정 권한은 서버에서 확인합니다." />;
      }
      return <ErrorCard onRetry={() => setRefreshKey(value => value + 1)} />;
    }
    if (state.kind === 'loading') return <StateArea aria-label="노드 정보를 새로고침하는 중"><LoadingCard height={360} /></StateArea>;
    return null;
  };

  const hasVisibleData = state.kind === 'ready' || state.nodes.length > 0;

  return (
    <Layout>
      <Sidebar aria-label="관리자 메뉴">
        <Brand><Logo src="/assets/gsmsv-logo.svg" alt="" /><BrandText>GSM SV</BrandText></Brand>
        <WorkspaceLabel>관리자 워크스페이스</WorkspaceLabel>
        <Navigation aria-label="관리자 메뉴">
          {navItems.map((item, index) => <NavigationItem key={item.label} type="button" $active={index === 0} disabled={index !== 0} aria-current={index === 0 ? 'page' : undefined} title={index === 0 ? undefined : '해당 화면은 아직 연결되지 않았습니다'}>{icon(item.icon)}{item.label}</NavigationItem>)}
          <Divider aria-hidden="true" />
          <NavigationItem type="button" disabled>{icon('book')}Docs</NavigationItem>
          <NavigationItem type="button" disabled>{icon('comment-discussion')}문의</NavigationItem>
          <NavigationItem type="button" disabled>{icon('gear')}설정</NavigationItem>
        </Navigation>
        <SidebarFooter>
          <NavigationItem type="button" onClick={() => navigate('/status')}>{icon('pulse')}서비스 상태</NavigationItem>
        </SidebarFooter>
      </Sidebar>

      <MainColumn>
        <Header>
          <HeaderContent>
            <HeaderStart>
              <ConsoleLabel>관리자 콘솔</ConsoleLabel>
              <SearchAction variant="secondary" icon={icon('search')} disabled>이름 또는 GRN으로 검색</SearchAction>
            </HeaderStart>
            <HeaderActions>
              <Button id="admin-notifications-trigger" variant="ghost" icon={icon('bell')} aria-expanded={notificationsOpen} aria-controls="notification-panel" onClick={() => setNotificationsOpen(value => !value)}>알림{unreadCount > 0 ? ` ${unreadCount}` : ''}</Button>
              <Button variant="ghost" icon={icon('person')} disabled>관리자</Button>
            </HeaderActions>
          </HeaderContent>
        </Header>

        <Main>
          <Page>
            <Breadcrumb>관리자 / 인프라 현황</Breadcrumb>
            <Heading>
              <TitleGroup>
                <Title>인프라 현황</Title>
                <Subtitle>Node 상태와 자원 사용량을 한곳에서 확인하세요.</Subtitle>
              </TitleGroup>
              <Button variant="secondary" icon={icon('sync')} onClick={() => setRefreshKey(value => value + 1)} disabled={state.kind === 'loading'}>새로고침</Button>
            </Heading>

            {hasVisibleData ? (
              <>
                {state.kind === 'loading' && state.nodes.length > 0 && (
                  <Banner tone="neutral" icon={icon('sync')} title="Node 정보를 새로고침하는 중입니다" description="이전 조회 결과를 계속 표시합니다." />
                )}
                {state.kind === 'error' && state.nodes.length > 0 && (
                  <Banner tone="warning" icon={icon('alert')} title="최신 Node 정보를 불러오지 못했습니다" description="이전 조회 결과를 표시하고 있습니다." action={<Button variant="secondary" onClick={() => setRefreshKey(value => value + 1)}>다시 시도</Button>} />
                )}
                <Summary aria-label="인프라 요약">
                  <SummaryCard>
                    <SummaryLabel>{icon('server')}온라인 Node</SummaryLabel>
                    <SummaryValue>{onlineCount} / {nodes.length}</SummaryValue>
                    <SummaryCaption>{offlineNodes.length > 0 ? `Node ${offlineNodes.length}개 확인 필요` : '모든 Node가 온라인입니다'}</SummaryCaption>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{icon('server')}전체 VM</SummaryLabel>
                    <SummaryValue>{vmResources.length}</SummaryValue>
                    <SummaryCaption>DB 기준으로 관리 중인 VM</SummaryCaption>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{icon('cpu')}할당 vCPU</SummaryLabel>
                    <SummaryValue>{formatGb(allocatedVcpu)} / {formatGb(availableVcpu)}</SummaryValue>
                    <SummaryCaption>각 노드의 할당 / 할당 가능 vCPU</SummaryCaption>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{icon('clock')}Node 복제 대기</SummaryLabel>
                    <SummaryValue>{cloneQueue}</SummaryValue>
                    <SummaryCaption>노드별 clone queue 합계</SummaryCaption>
                  </SummaryCard>
                </Summary>

                {offlineNodes.length > 0 && (
                  <Banner
                    tone="warning"
                    icon={icon('alert')}
                    title={`${offlineNodes.length}개 Node의 상태를 확인할 수 없습니다`}
                    description="오프라인 Node의 CPU·메모리·가동 시간은 API 값 그대로 비워 두었습니다. 온라인 Node 조회와 관리는 계속할 수 있습니다."
                    action={<Button variant="secondary" icon={icon('sync')} onClick={() => setRefreshKey(value => value + 1)} disabled={state.kind === 'loading'}>다시 확인</Button>}
                  />
                )}

                <Section>
                  <SectionTitle>Node</SectionTitle>
                  {state.kind === 'ready' && nodes.length === 0 ? <GapMessage>조회된 Node가 없습니다.</GapMessage> : (
                    <NodeGrid>
                      {nodes.map(node => (
                        <NodeCard key={node.node}>
                          <NodeCardTop>
                            <IconBox>{icon('server')}</IconBox>
                            <NodeState $online={node.online}>{node.online ? '온라인' : '오프라인 · 조회 실패'}</NodeState>
                          </NodeCardTop>
                          <NodeName>{node.node}</NodeName>
                          <NodeMeta>
                            {nodeVmStates[node.node]?.unavailable ? 'VM 목록 확인 불가'
                              : nodeVmStates[node.node]?.loading ? 'VM 목록을 확인하는 중입니다.'
                                : nodeVmStates[node.node]?.error ? 'VM 수를 확인할 수 없습니다.'
                                  : `VM ${nodeVmStates[node.node]?.items.length ?? 0}개`}
                          </NodeMeta>
                          {node.online ? (
                            <>
                              <NodeMeta>CPU {formatPercent(node.usage.cpu_percent)} · 메모리 {summarizeMemory(node)}</NodeMeta>
                              <NodeMeta>{formatUptime(node.usage.uptime_sec)}</NodeMeta>
                              <CardFooter>
                                <span>vCPU {formatGb(node.allocation.vcpu.allocated)} / {formatGb(node.allocation.vcpu.allocatable)}</span>
                                <Button variant="ghost" onClick={() => void loadNodeVms(node.node)} aria-expanded={expandedNode === node.node}>VM 목록 보기</Button>
                              </CardFooter>
                            </>
                          ) : (
                            <>
                              <NodeMeta>CPU — · 메모리 —</NodeMeta>
                              <NodeMeta>가동 시간 확인 불가</NodeMeta>
                              <CardFooter><span>VM 목록은 노드가 복구된 뒤 확인할 수 있습니다.</span></CardFooter>
                            </>
                          )}
                          {expandedNode === node.node && (
                            <NodeVmListArea aria-live="polite">
                              {nodeVmStates[node.node]?.loading ? <NodeMeta>VM 목록을 불러오는 중입니다.</NodeMeta>
                                : nodeVmStates[node.node]?.error ? <NodeMeta>VM 목록을 불러오지 못했습니다. <Button variant="ghost" onClick={() => void loadNodeVms(node.node)}>다시 시도</Button></NodeMeta>
                                  : nodeVmStates[node.node]?.items.length ? nodeVmStates[node.node].items.map(vm => (
                                    <NodeVmRow key={vm.vmid}><span>{vm.proxmox_name} · VMID {vm.vmid}</span><span>{vm.classification === 'managed' ? '관리 중' : vm.classification === 'orphan' ? '고아 VM' : '미관리'}</span></NodeVmRow>
                                  )) : <NodeMeta>해당 노드의 VM이 없습니다.</NodeMeta>}
                            </NodeVmListArea>
                          )}
                          <CardFooter><span>복제 대기 {node.clone_queue_length}건</span></CardFooter>
                        </NodeCard>
                      ))}
                    </NodeGrid>
                  )}
                </Section>

                <TwoColumns>
                  <Panel>
                    <SectionTitle>최근 생성 실패</SectionTitle>
                    <GapMessage>실패 이력 조회 API가 없어 최근 생성 실패 정보를 표시할 수 없습니다.</GapMessage>
                  </Panel>
                  <Panel>
                    <SectionTitle>오늘의 만료 요약</SectionTitle>
                    <PanelRows>
                      <PanelRow><span>오늘 만료</span><PanelValue>—</PanelValue></PanelRow>
                      <PanelRow><span>3일 이내 만료</span><PanelValue>—</PanelValue></PanelRow>
                      <PanelRow><span>삭제 유예 중</span><PanelValue>—</PanelValue></PanelRow>
                    </PanelRows>
                    <GapMessage>자원 만료 집계 API가 없어 수량을 표시할 수 없습니다.</GapMessage>
                  </Panel>
                </TwoColumns>
                <Breadcrumb aria-live="polite">최근 조회 {state.checkedAt ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(state.checkedAt) : '—'}</Breadcrumb>
              </>
            ) : stateContent()}
          </Page>
        </Main>
      </MainColumn>
      <NotificationPanel
        open={notificationsOpen}
        onClose={closeNotifications}
        onUnreadCountChange={setUnreadCount}
        onOpenResource={path => navigate(path)}
      />
    </Layout>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { matchPath, Navigate, useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';
import { listAdminResources, listInfraNodes, listNodeVms, type AdminResource, type InfraNode, type NodeVm } from '../../entities/infra-node';
import type { DemoInfraSnapshot } from '../../entities/infra-node/demo';
import { listNotifications } from '../../entities/notification';
import { getSessionUser } from '../../entities/session';
import { AdminAllVmsContent } from './AdminAllVmsContent';
import { ApiRequestError } from '../../shared/api';
import { isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { DemoPagePlaceholder } from '../demo-workflows/ui/DemoPageState';
import { Button } from '../../shared/ui/controls';
import { mobileNavigationMedia, useResponsiveNavigation } from '../../shared/ui/controls/useResponsiveNavigation';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon, type OcticonName } from '../../shared/ui/icons';
import { NotificationPanel } from '../../widgets/notification-panel';

const Layout = styled.div`
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
`;

const Sidebar = styled.aside<{ $open: boolean }>`
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

  @media ${mobileNavigationMedia} {
    position: fixed;
    z-index: 80;
    inset: 0 auto 0 0;
    width: min(280px, calc(100vw - 48px));
    height: 100dvh;
    min-height: 0;
    max-height: 100dvh;
    overflow-y: auto;
    box-shadow: 0 16px 40px rgb(0 0 0 / 35%);
    transform: translateX(${({ $open }) => $open ? '0' : '-105%'});
    visibility: ${({ $open }) => $open ? 'visible' : 'hidden'};
    transition: transform 180ms ease, visibility 180ms;
  }

  @media (prefers-reduced-motion: reduce) { transition: none; }
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

// Figma 관리자 Sidebar(89:6997): 워크스페이스 아래 16px Space 뒤에 메뉴가 시작한다(y=120).
const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  margin-top: ${({ theme }) => theme.space[16]}px;
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
  cursor: ${({ $active, disabled }) => $active ? 'default' : disabled ? 'not-allowed' : 'pointer'};

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  &:disabled { opacity: .72; }
`;

const Divider = styled.div`
  width: 184px;
  height: 1px;
  margin: 0;
  background: ${({ theme }) => theme.colors.border};
`;

const SidebarFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  margin-top: auto;
`;

// Figma Global topbar: 알림 수는 초록색, "관리자"는 배경 없는 글자 표시다.
const UnreadCount = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

const Identity = styled.span`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  white-space: nowrap;
  @media (max-width: 480px) { padding: 0 8px; }
`;

const Header = styled.header`
  display: flex;
  width: 100%;
  min-height: 74px;
  flex: 0 0 74px;
  align-items: center;
  padding: ${({ theme }) => theme.space[16]}px 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 1200px) { padding-inline: 24px; }
  @media ${mobileNavigationMedia} {
    display: grid;
    grid-template-areas: 'menu label identity' 'search search search';
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px;
    min-height: 0;
    flex-basis: auto;
    padding: 12px 16px;
  }
  @media (max-width: 480px) { padding-inline: 12px; }
`;

const HeaderContent = styled.div`
  display: flex;
  width: 100%;
  max-width: 1144px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
  margin: 0 auto;

  /* 좁은 화면에서는 Header의 grid 영역(메뉴·라벨·계정 / 검색)에 바로 놓이게 한다. 390px 가로 넘침 방지. */
  @media ${mobileNavigationMedia} { display: contents; }
`;

const HeaderStart = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;

  @media ${mobileNavigationMedia} { display: contents; }
`;

const ConsoleLabel = styled.span`
  display: inline-flex;
  width: 220px;
  flex: 0 0 220px;
  align-items: center;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;

  @media ${mobileNavigationMedia} { grid-area: label; width: auto; flex: 0 1 auto; }
`;

const SearchAction = styled(Button)`
  width: 520px;
  min-width: 180px;
  justify-content: flex-start;
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: 1200px) { width: auto; min-width: 0; flex: 1 1 240px; }
  @media ${mobileNavigationMedia} { grid-area: search; width: 100%; min-height: 40px; }
`;

const HeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;

  @media ${mobileNavigationMedia} { grid-area: identity; gap: 8px; }
`;

const MenuToggle = styled.button`
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  @media ${mobileNavigationMedia} { display: inline-flex; grid-area: menu; }
`;

const MenuGlyph = styled.span`
  display: flex;
  width: 18px;
  flex-direction: column;
  gap: 4px;
  i { display: block; width: 100%; height: 2px; border-radius: 2px; background: currentColor; }
`;

const NavigationOverlay = styled.button`
  display: none;
  @media ${mobileNavigationMedia} {
    position: fixed;
    z-index: 70;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: rgb(0 0 0 / 55%);
  }
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

  @media (max-width: 1200px) { padding: 32px; }
  @media (max-width: 720px) { padding: 24px 16px; }
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

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 152px), 1fr));
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

const SummaryEmphasis = styled.span`
  color: ${({ theme }) => theme.colors.primary};
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

  @media (max-width: 720px) {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 224px), 1fr));
  }
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

// Figma 26 Node 카드: 아이콘 아래에 상태 문구가 왼쪽 정렬로 놓인다.
const NodeCardTop = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
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

const NodeState = styled.span`
  color: ${({ theme }) => theme.colors.faint};
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
  overflow-wrap: anywhere;
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  align-items: start;
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
  gap: 16px;
`;

// Figma 26 오늘의 만료 요약: 이름(캡션) 아래에 수량을 쌓는다.
const PanelRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const PanelValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const FailureList = styled.div`
  display: flex;
  flex-direction: column;
`;

// Figma 26 최근 생성 실패: 아이콘은 세로 가운데, 이동 버튼은 내용 아래 오른쪽, 마지막 항목 뒤에도 구분선.
const FailureItem = styled.article`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 0 0 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  & + & { padding-top: 16px; }
`;

const FailureActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const FailureIcon = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.warning};
`;

const FailureCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

const FailureName = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: 500 14px/20px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const FailureDetail = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const FailureMeta = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
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

function icon(name: OcticonName) {
  return <Octicon name={name} size={16} aria-hidden="true" />;
}

function summarizeMemory(node: InfraNode) {
  const total = node.usage.memory_total_gb;
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(node.usage.memory_used_gb)) return '—';
  return formatPercent((node.usage.memory_used_gb / total) * 100);
}

export default function AdminInfrastructurePage() {
  const demoMode = isDemoMode();
  if (demoMode && getSessionUser()?.role !== 'admin') return <Navigate to="/" replace />;
  return <AdminInfrastructure demoMode={demoMode} />;
}

function AdminInfrastructure({ demoMode }: { demoMode: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = useResponsiveNavigation();
  const isAllVmsView = Boolean(matchPath('/admin/vms', location.pathname));
  const [state, setState] = useState<LoadState>(initialState);
  const [demoSnapshot, setDemoSnapshot] = useState<DemoInfraSnapshot | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nodeVmStates, setNodeVmStates] = useState<Record<string, NodeVmState>>({});
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [demoPowerError, setDemoPowerError] = useState(false);
  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
    window.requestAnimationFrame(() => document.getElementById('admin-notifications-trigger')?.focus());
  }, []);

  const load = useCallback(async (signal: AbortSignal) => {
    setState(current => ({ kind: 'loading', nodes: current.nodes, resources: current.resources, checkedAt: current.checkedAt }));
    try {
      if (demoMode) {
        const { getDemoInfraSnapshot } = await import('../../entities/infra-node/demo');
        await simulateDemoRequest('admin-infra', signal);
        if (signal.aborted) return;
        const snapshot = getDemoInfraSnapshot();
        const checkedAt = new Date();
        setDemoSnapshot(snapshot);
        setNodeVmStates(Object.fromEntries(snapshot.nodes.map(node => [node.node, {
          loading: false,
          error: false,
          unavailable: !node.online,
          items: snapshot.nodeVms[node.node] ?? [],
        }])));
        setExpandedNode(null);
        setState({ kind: 'ready', nodes: snapshot.nodes, resources: snapshot.resources, checkedAt });
        return;
      }
      setDemoSnapshot(null);
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
  }, [demoMode]);

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
  const vmResources = state.resources.filter(resource => resource.type === 'vm');
  const runningVmCount = vmResources.filter(resource => resource.power_state === 'running').length;
  const stoppedVmCount = vmResources.filter(resource => resource.power_state === 'stopped').length;
  const unknownPowerStateCount = vmResources.length - runningVmCount - stoppedVmCount;
  const refresh = () => setRefreshKey(value => value + 1);

  const loadNodeVms = async (node: string) => {
    if (demoMode) return;
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

  const toggleNodeVms = (node: string) => {
    if (expandedNode === node) {
      setExpandedNode(null);
      return;
    }
    setExpandedNode(node);
    void loadNodeVms(node);
  };

  const navItems: Array<{ label: string; icon: OcticonName }> = [
    { label: '인프라 현황', icon: 'pulse' },
    { label: '승인', icon: 'checklist' },
    { label: '전체 VM', icon: 'server' },
    { label: '문의 답변', icon: 'comment-discussion' },
    { label: '관리자 점검', icon: 'shield' },
  ];

  // Figma 26-01/02, 28-03/04: 본문 카드 자리마다 로딩 막대나 오류 카드를 채운다.
  const demoPlaceholderRows = isAllVmsView ? [236, 232, [192, 166]] : [[92, 92, 92, 92], { title: 'Node' }, [216, 216, 216], [224, 205]];
  const stateContent = () => {
    if (demoMode && state.nodes.length === 0 && (state.kind === 'loading' || (state.kind === 'error' && state.status !== 401 && state.status !== 403))) {
      return <DemoPagePlaceholder status={state.kind === 'loading' ? 'loading' : 'error'} onRetry={refresh} rows={demoPlaceholderRows} label={isAllVmsView ? 'VM 정보를 불러오는 중' : '노드 정보를 불러오는 중'} />;
    }
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
      return <ErrorCard onRetry={refresh} />;
    }
    if (state.kind === 'loading') return <StateArea aria-label="노드 정보를 새로고침하는 중"><LoadingCard height={360} /></StateArea>;
    return null;
  };

  const hasVisibleData = state.kind === 'ready' || state.nodes.length > 0;
  const hasVmSnapshot = state.kind === 'ready' || state.checkedAt !== null;

  return (
    <Layout>
      <Sidebar id="admin-navigation" ref={navigation.sidebarRef} $open={navigation.open} onKeyDown={navigation.onKeyDown} aria-label="관리자 메뉴">
        <Brand><Logo src="/assets/gsmsv-logo.svg" alt="" /><BrandText>GSM SV</BrandText></Brand>
        <WorkspaceLabel>관리자 워크스페이스</WorkspaceLabel>
        <Navigation aria-label="관리자 메뉴">
          {navItems.map((item, index) => {
            const href = index === 0 ? '/admin/infra'
              : index === 1 ? (demoMode ? '/admin/team-approvals' : undefined)
                : index === 2 ? '/admin/vms'
                  : index === 3 ? (demoMode ? '/admin/inquiries' : undefined)
                    : index === 4 ? (demoMode ? '/admin/accounts' : undefined)
                      : undefined;
            const active = index === 2
              ? Boolean(matchPath('/admin/vms', location.pathname) || matchPath('/admin/vms/:vmId', location.pathname))
              : href ? Boolean(matchPath(href, location.pathname)) : false;
            return (
              <NavigationItem
                key={item.label}
                type="button"
                $active={active}
                disabled={!href}
                aria-current={active ? 'page' : undefined}
                title={!href ? '해당 화면은 아직 연결되지 않았습니다' : undefined}
                onClick={href ? () => { navigation.close(); void navigate(href); } : undefined}
              >{icon(item.icon)}{item.label}</NavigationItem>
            );
          })}
          <Divider aria-hidden="true" />
          {([['book', 'Docs', '/help'], ['comment-discussion', '문의', '/support/inquiries'], ['gear', '설정', '/settings']] as const).map(([iconName, label, href]) => (
            <NavigationItem key={label} type="button" disabled={!demoMode} onClick={demoMode ? () => { navigation.close(); void navigate(href); } : undefined}>{icon(iconName)}{label}</NavigationItem>
          ))}
        </Navigation>
        <SidebarFooter>
          <NavigationItem type="button" onClick={() => { navigation.close(); void navigate('/status'); }}>{icon('pulse')}서비스 상태</NavigationItem>
        </SidebarFooter>
      </Sidebar>
      {navigation.open && <NavigationOverlay type="button" tabIndex={-1} aria-label="메뉴 닫기" onClick={navigation.close} />}

      <MainColumn inert={navigation.open}>
        <Header>
          <HeaderContent>
            <MenuToggle
              ref={navigation.triggerRef}
              type="button"
              aria-label={navigation.open ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={navigation.open}
              aria-controls="admin-navigation"
              onClick={navigation.toggle}
            ><MenuGlyph aria-hidden="true"><i /><i /><i /></MenuGlyph></MenuToggle>
            <HeaderStart>
              <ConsoleLabel>관리자 콘솔</ConsoleLabel>
              <SearchAction variant="secondary" icon={icon('search')} disabled>이름 또는 GRN으로 검색</SearchAction>
            </HeaderStart>
            <HeaderActions>
              <Button id="admin-notifications-trigger" variant="ghost" icon={icon('bell')} aria-expanded={notificationsOpen} aria-controls="notification-panel" onClick={() => setNotificationsOpen(value => !value)}><span>알림{unreadCount > 0 && <> <UnreadCount>{unreadCount}</UnreadCount></>}</span></Button>
              <Identity>{icon('person')}관리자</Identity>
            </HeaderActions>
          </HeaderContent>
        </Header>

        <Main>
          <Page>
            {isAllVmsView ? (
              <>
                <Breadcrumb>관리자 / 전체 VM</Breadcrumb>
                <Heading>
                  <TitleGroup>
                    <Title>전체 VM</Title>
                    <Subtitle>소유자, Node, 상태와 사용 목적을 확인하고 필요한 조치를 진행하세요.</Subtitle>
                  </TitleGroup>
                </Heading>
                {hasVmSnapshot ? (
                  <>
                    {state.kind === 'loading' && hasVmSnapshot && (
                      <Banner tone="neutral" icon={icon('sync')} title="VM 정보를 새로고침하는 중입니다" description="이전 조회 결과를 계속 표시합니다." />
                    )}
                    {state.kind === 'error' && hasVmSnapshot && (
                      <Banner tone="warning" icon={icon('alert')} title="최신 VM 정보를 불러오지 못했습니다" description="이전 조회 결과를 표시하고 있습니다." action={<Button variant="secondary" onClick={refresh}>다시 시도</Button>} />
                    )}
                    {demoPowerError && <Banner tone="danger" title="VM 상태를 저장하지 못했습니다" description="잠시 뒤 다시 시도해 주세요." />}
                    <AdminAllVmsContent
                      resources={vmResources}
                      nodes={nodes}
                      nodeVmStates={nodeVmStates}
                      expiringGrns={demoSnapshot?.expiringGrns}
                      demoVmDetails={demoSnapshot?.vmDetails}
                      onDemoPowerAction={demoSnapshot ? async (grn, powerState) => {
                        const { getDemoInfraSnapshot, setDemoAdminVmPower } = await import('../../entities/infra-node/demo');
                        const snapshot = getDemoInfraSnapshot();
                        if (!snapshot.resources.some(resource => resource.grn === grn)) {
                          setDemoPowerError(true);
                          return;
                        }
                        if (!setDemoAdminVmPower(grn, powerState)) {
                          setDemoPowerError(true);
                          return;
                        }
                        const nextSnapshot = getDemoInfraSnapshot();
                        setDemoPowerError(false);
                        setDemoSnapshot(nextSnapshot);
                        setState(current => current.kind === 'ready' ? { ...current, resources: nextSnapshot.resources } : current);
                      } : undefined}
                      onOpenDetails={demoSnapshot ? grn => navigate(`/admin/vms/${encodeURIComponent(grn)}`) : undefined}
                      onRefresh={refresh}
                      refreshDisabled={state.kind === 'loading'}
                    />
                  </>
                ) : stateContent()}
                {/* Figma 26·28에는 조회 시각 문구가 없다. 실제 API 모드에서만 남긴다. */}{!demoSnapshot && <Breadcrumb aria-live="polite">최근 조회 {state.checkedAt ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(state.checkedAt) : '—'}</Breadcrumb>}
              </>
            ) : (
              <>
            <Breadcrumb>관리자 / 인프라 현황</Breadcrumb>
            <Heading>
              <TitleGroup>
                <Title>인프라 현황</Title>
                <Subtitle>Node 상태와 생성 대기열을 한곳에서 확인하세요.</Subtitle>
              </TitleGroup>
              <Button variant="secondary" icon={icon('sync')} onClick={refresh} disabled={state.kind === 'loading'}>새로고침</Button>
            </Heading>

            {hasVisibleData ? (
              <>
                {state.kind === 'loading' && state.nodes.length > 0 && (
                  <Banner tone="neutral" icon={icon('sync')} title="Node 정보를 새로고침하는 중입니다" description="이전 조회 결과를 계속 표시합니다." />
                )}
                {state.kind === 'error' && state.nodes.length > 0 && (
                  <Banner tone="warning" icon={icon('alert')} title="최신 Node 정보를 불러오지 못했습니다" description="이전 조회 결과를 표시하고 있습니다." action={<Button variant="secondary" onClick={refresh}>다시 시도</Button>} />
                )}
                <Summary aria-label="인프라 요약">
                  <SummaryCard>
                    <SummaryLabel>{icon('server')}온라인 Node</SummaryLabel>
                    <SummaryValue>{onlineCount} / {nodes.length}</SummaryValue>
                    <SummaryCaption>{offlineNodes.length > 0 ? `Node ${offlineNodes.length}개 확인 필요` : '모든 Node가 온라인입니다'}</SummaryCaption>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{icon('cpu')}전체 VM</SummaryLabel>
                    <SummaryValue>{vmResources.length}</SummaryValue>
                    <SummaryCaption>
                      {unknownPowerStateCount === 0
                        ? <>실행 중 <SummaryEmphasis>{runningVmCount}</SummaryEmphasis> · 정지 <SummaryEmphasis>{stoppedVmCount}</SummaryEmphasis></>
                        : `전원 상태 확인 불가 ${unknownPowerStateCount}개`}
                    </SummaryCaption>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{icon('clock')}생성 대기</SummaryLabel>
                    <SummaryValue>{cloneQueue}</SummaryValue>
                    <SummaryCaption>{demoSnapshot ? `현재 ${demoSnapshot.creationInProgress}건 생성 중` : 'Node별 clone queue 합계'}</SummaryCaption>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{icon('calendar')}만료 임박</SummaryLabel>
                    <SummaryValue title={demoSnapshot ? undefined : '만료 집계 API가 제공되지 않습니다'}>{demoSnapshot?.expiringWithinThreeDays ?? '—'}</SummaryValue>
                    <SummaryCaption>3일 이내 만료 예정</SummaryCaption>
                  </SummaryCard>
                </Summary>

                {offlineNodes.length > 0 && (
                  <Banner
                    tone="warning"
                    icon={icon('alert')}
                    title={demoSnapshot ? `${offlineNodes[0]?.node ?? '오프라인 Node'}의 상태를 확인할 수 없습니다` : `${offlineNodes.length}개 Node의 상태를 확인할 수 없습니다`}
                    description={demoSnapshot ? '이 Node의 지표만 표시되지 않습니다. 다른 Node의 조회와 관리는 계속할 수 있습니다.' : '오프라인 Node의 CPU·메모리·가동 시간은 API 값 그대로 비워 두었습니다. 온라인 Node 조회와 관리는 계속할 수 있습니다.'}
                    action={<Button variant="secondary" icon={icon('sync')} onClick={refresh} disabled={state.kind === 'loading'}>다시 확인</Button>}
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
                            <NodeState>{node.online ? `온라인${demoSnapshot?.nodeKinds[node.node] ? ` · ${demoSnapshot.nodeKinds[node.node]}` : ''}` : '오프라인 · 조회 실패'}</NodeState>
                          </NodeCardTop>
                          <NodeName>{node.node}</NodeName>
                          {node.online ? (
                            <>
                              <NodeMeta>CPU {formatPercent(node.usage.cpu_percent)} · 메모리 {summarizeMemory(node)}</NodeMeta>
                              <NodeMeta>{formatUptime(node.usage.uptime_sec)}</NodeMeta>
                              <NodeMeta>VM <SummaryEmphasis>{nodeVmStates[node.node]?.items.length ?? 0}개</SummaryEmphasis></NodeMeta>
                              <CardFooter>
                                <span />
                                <Button variant="secondary" icon={icon('arrow-right')} onClick={() => toggleNodeVms(node.node)} aria-expanded={expandedNode === node.node}>{demoSnapshot ? `VM ${nodeVmStates[node.node]?.items.length ?? 0}개 보기` : 'VM 목록 보기'}</Button>
                              </CardFooter>
                            </>
                          ) : (
                            <>
                              <NodeMeta>CPU — · 메모리 —</NodeMeta>
                              <NodeMeta>가동 시간 확인 불가</NodeMeta>
                              <NodeMeta>마지막 조회 실패</NodeMeta>
                              <CardFooter>
                                <span />
                                <Button variant="secondary" icon={icon('sync')} onClick={refresh} disabled={state.kind === 'loading'}>다시 확인</Button>
                              </CardFooter>
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
                        </NodeCard>
                      ))}
                    </NodeGrid>
                  )}
                </Section>

                <TwoColumns>
                  <Panel>
                    <SectionTitle>최근 생성 실패</SectionTitle>
                    {demoSnapshot ? <FailureList>{demoSnapshot.recentFailures.map((failure, index) => (
                      <FailureItem key={`${failure.name}-${failure.occurredAt}`}>
                        <FailureIcon>{icon('alert')}</FailureIcon>
                        <FailureCopy>
                          <FailureName>{failure.name}</FailureName><FailureDetail>{failure.reason}</FailureDetail><FailureMeta>{failure.occurredAt}</FailureMeta>
                          {index === 0 && <FailureActions><Button variant="secondary" icon={icon('arrow-right')} onClick={() => navigate('/admin/vms')}>전체 VM 보기</Button></FailureActions>}
                        </FailureCopy>
                      </FailureItem>
                    ))}</FailureList> : <GapMessage>실패 이력 조회 API가 없어 최근 생성 실패 정보를 표시할 수 없습니다.</GapMessage>}
                  </Panel>
                  <Panel>
                    <SectionTitle>오늘의 만료 요약</SectionTitle>
                    <PanelRows>
                      <PanelRow><span>오늘 만료</span><PanelValue>{demoSnapshot?.expiringToday ?? '—'}개</PanelValue></PanelRow>
                      <PanelRow><span>3일 이내 만료</span><PanelValue>{demoSnapshot?.expiringWithinThreeDays ?? '—'}개</PanelValue></PanelRow>
                      <PanelRow><span>삭제 유예 중</span><PanelValue>{demoSnapshot?.deletionGrace ?? '—'}개</PanelValue></PanelRow>
                    </PanelRows>
                    {demoSnapshot ? <CardFooter><span /><Button variant="secondary" icon={icon('calendar')} onClick={() => navigate('/admin/vms?expires=soon')}>만료 임박 VM 보기</Button></CardFooter> : <GapMessage>자원 만료 집계 API가 없어 수량을 표시할 수 없습니다.</GapMessage>}
                  </Panel>
                </TwoColumns>
                {/* Figma 26·28에는 조회 시각 문구가 없다. 실제 API 모드에서만 남긴다. */}{!demoSnapshot && <Breadcrumb aria-live="polite">최근 조회 {state.checkedAt ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(state.checkedAt) : '—'}</Breadcrumb>}
              </>
            ) : stateContent()}
              </>
            )}
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

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import styled from 'styled-components';
import { isDemoMode } from '../../../shared/demo';
import type { StudentNavigationKey } from '../../../widgets/student-shell';
import { StudentShell } from '../../../widgets/student-shell';
import { mobileNavigationMedia, useResponsiveNavigation } from '../../../shared/ui/controls/useResponsiveNavigation';
import { Octicon } from '../../../shared/ui/icons';
import { getSessionUser } from '../../../entities/session';
import { listDemoTeams } from '../../../entities/team/demo';
import { listNotifications } from '../../../entities/notification';
import { Button } from '../../../shared/ui/controls';
import { NotificationPanel } from '../../../widgets/notification-panel';

const AdminLayout = styled.div`
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
`;
const AdminSidebar = styled.aside<{ $open: boolean }>`
  position: sticky;
  top: 0;
  display: flex;
  width: 216px;
  height: 100vh;
  flex: 0 0 216px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 28px 16px 16px;
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
// Figma 관리자 Sidebar(89:6997): Brand 34px → 8 → 워크스페이스 → 8 + 16 + 8 → 메뉴(y=120), 메뉴 사이 8px.
const Brand = styled.div`
  display: flex;
  min-height: 34px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;
const BrandMark = styled.img`
  display: block;
  width: 24px;
  height: 24px;
`;
const Workspace = styled.span`
  margin: 0 12px 16px;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const AdminNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const AdminNavButton = styled.button<{ $active: boolean }>`
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  text-align: left;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;
const AdminDivider = styled.div`
  height: 1px;
  margin: 0;
  background: ${({ theme }) => theme.colors.border};
`;
const AdminMain = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
`;
const AdminHeader = styled.header`
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 1200px) { padding-inline: 24px; }
  @media ${mobileNavigationMedia} {
    display: grid;
    grid-template-areas: 'menu label identity' 'search search search';
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px;
    min-height: 0;
    padding: 12px 16px;
  }
  @media (max-width: 480px) { padding-inline: 12px; }
`;
const AdminHeaderLabel = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: 500 12px/18px ${({ theme }) => theme.typography.label.family}, sans-serif;
  @media ${mobileNavigationMedia} { grid-area: label; }
`;
const AdminSearch = styled.div`
  display: flex;
  width: min(520px, 52vw);
  min-height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
  @media ${mobileNavigationMedia} { grid-area: search; width: 100%; min-width: 0; }
`;
const AdminMenuToggle = styled.button`
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
const AdminNavigationOverlay = styled.button`
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
const AdminHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
  @media ${mobileNavigationMedia} { grid-area: identity; gap: 4px; }
  @media (max-width: 480px) { gap: 0; }
`;
// Figma Global topbar: 알림 수는 초록색, "관리자"는 배경 없는 글자 표시다.
const AdminUnread = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;
const AdminIdentity = styled.span`
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
const AdminContent = styled.main`
  width: 100%;
  max-width: 1300px;
  flex: 1;
  padding: 40px;
  @media (max-width: 1200px) { padding: 32px; }
  @media (max-width: 720px) { padding: 24px 16px; }
`;

const StudentContent = styled.div`
  width: 100%;
  max-width: 1224px;
  padding: 40px;

  @media (max-width: 760px) { padding: 24px 16px 40px; }
`;

export const PageStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
export const Breadcrumb = styled.p`
  margin: 0 0 24px;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
export const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
`;
export const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;
export const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: 700 32px/42px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
export const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 16px/24px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
export const Card = styled.section`
  width: 100%;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;
export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
`;
export const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: 500 20px/28px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
export const Muted = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
export const Hint = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: 500 12px/18px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;
export const Input = styled.input`
  width: 100%;
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: 1px solid transparent;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
  &:focus { outline-color: ${({ theme }) => theme.colors.primary}; }
`;
export const Select = styled.select`
  width: 100%;
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
export const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: 1px solid transparent;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
  resize: vertical;
  &:focus { outline-color: ${({ theme }) => theme.colors.primary}; }
`;
export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;
export const Tabs = styled.div`
  display: flex;
  gap: 8px;
`;
export const Tab = styled.button<{ $active: boolean }>`
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: 500 14px/20px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: pointer;
`;
export const TableWrap = styled.div`
  overflow-x: auto;
`;
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  th { padding: 12px; background: ${({ theme }) => theme.colors.raised}; color: ${({ theme }) => theme.colors.muted}; text-align: left; font-size: 12px; font-weight: 400; white-space: nowrap; }
  td { padding: 12px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; }
  tr[aria-selected='true'] td { background: ${({ theme }) => theme.colors.primarySoft}; color: ${({ theme }) => theme.colors.text}; }
`;
export const RowButton = styled.tr`
  cursor: pointer;
  &:hover td { background: ${({ theme }) => theme.colors.overlayHover}; }
`;
export const Badge = styled.span<{ $tone?: 'warning' | 'success' | 'danger' }>`
  color: ${({ theme, $tone }) => $tone === 'success' ? theme.colors.primary : $tone === 'danger' ? theme.colors.danger : theme.colors.warning};
`;
export const Alert = styled.div<{ $tone?: 'warning' | 'success' }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $tone }) => $tone === 'success' ? theme.colors.primarySoft : theme.colors.warningSoft};
  color: ${({ theme, $tone }) => $tone === 'success' ? theme.colors.primary : theme.colors.warning};
`;
export const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const Stat = styled.div`
  min-height: 120px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  strong { display: block; margin: 12px 0 4px; color: ${({ theme }) => theme.colors.text}; font-size: 24px; }
`;

export function WorkflowLayout({ children, admin = false, activeAdminItem = '승인', activeStudentItem = 'none', scopeLabel = '내 Resources', teamScopeId }: { children: ReactNode; admin?: boolean; activeAdminItem?: string; activeStudentItem?: StudentNavigationKey; scopeLabel?: string; teamScopeId?: string }) {
  const navigate = useNavigate();
  const navigation = useResponsiveNavigation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
    window.requestAnimationFrame(() => document.getElementById('workflow-admin-notifications-trigger')?.focus());
  }, []);

  useEffect(() => {
    if (!admin) return;
    const controller = new AbortController();
    void listNotifications(controller.signal)
      .then(result => { if (!controller.signal.aborted) setUnreadCount(result.unread_count); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [admin]);

  if (admin) {
    // Figma 26~31의 관리자 사이드바와 같은 목적지: 승인은 팀 승인(27), 전체 VM은 목록(28)이다.
    const primary = [
      ['인프라 현황', 'pulse', '/admin/infra'],
      ['승인', 'checklist', '/admin/team-approvals'],
      ['전체 VM', 'server', '/admin/vms'],
      ['문의 답변', 'comment-discussion', '/admin/inquiries'],
      ['관리자 점검', 'shield', '/admin/accounts'],
    ] as const;
    const secondary = [
      ['Docs', 'book', '/help'],
      ['문의', 'comment-discussion', '/support/inquiries'],
      ['설정', 'gear', '/settings'],
    ] as const;
    return (
      <AdminLayout>
        <AdminSidebar id="workflow-admin-navigation" ref={navigation.sidebarRef} $open={navigation.open} onKeyDown={navigation.onKeyDown} aria-label="관리자 메뉴">
          <Brand><BrandMark src="/assets/gsmsv-logo.svg" alt="" /> GSM SV</Brand>
          <Workspace>관리자 워크스페이스</Workspace>
          <AdminNav>
            {primary.map(([label, icon, href]) => <AdminNavButton key={href} type="button" $active={label === activeAdminItem} aria-current={label === activeAdminItem ? 'page' : undefined} onClick={() => { navigation.close(); void navigate(href); }}><Octicon name={icon} size={16} />{label}</AdminNavButton>)}
            <AdminDivider />
            {secondary.map(([label, icon, href]) => <AdminNavButton key={href} type="button" $active={false} onClick={() => { navigation.close(); void navigate(href); }}><Octicon name={icon} size={16} />{label}</AdminNavButton>)}
          </AdminNav>
          <AdminNavButton type="button" $active={false} style={{ marginTop: 'auto' }} onClick={() => { navigation.close(); void navigate('/status'); }}><Octicon name="pulse" size={16} />서비스 상태</AdminNavButton>
        </AdminSidebar>
        {navigation.open && <AdminNavigationOverlay type="button" tabIndex={-1} aria-label="메뉴 닫기" onClick={navigation.close} />}
        <AdminMain inert={navigation.open}>
          <AdminHeader>
            <AdminMenuToggle
              ref={navigation.triggerRef}
              type="button"
              aria-label={navigation.open ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={navigation.open}
              aria-controls="workflow-admin-navigation"
              onClick={navigation.toggle}
            ><MenuGlyph aria-hidden="true"><i /><i /><i /></MenuGlyph></AdminMenuToggle>
            <AdminHeaderLabel>관리자 콘솔</AdminHeaderLabel>
            <AdminSearch><Octicon name="search" size={16} />이름 또는 GRN으로 검색</AdminSearch>
            <AdminHeaderActions>
              <Button id="workflow-admin-notifications-trigger" variant="ghost" icon={<Octicon name="bell" size={16} />} aria-expanded={notificationsOpen} aria-controls="notification-panel" onClick={() => setNotificationsOpen(value => !value)}><span>알림{unreadCount > 0 && <> <AdminUnread>{unreadCount}</AdminUnread></>}</span></Button>
              <AdminIdentity><Octicon name="person" size={16} />관리자</AdminIdentity>
            </AdminHeaderActions>
          </AdminHeader>
          <AdminContent>{children}</AdminContent>
        </AdminMain>
        <NotificationPanel
          open={notificationsOpen}
          onClose={closeNotifications}
          onUnreadCountChange={setUnreadCount}
          onOpenResource={path => navigate(path)}
        />
      </AdminLayout>
    );
  }

  const onNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const teamPath = teamScopeId ? `/teams/${encodeURIComponent(teamScopeId)}` : undefined;
    const paths: Record<Exclude<StudentNavigationKey, 'none'>, string> = {
      home: teamPath ?? '/',
      'vm-create': teamPath ? `${teamPath}/vms/new` : '/vms/new',
      serverless: '/serverless',
      database: teamScopeId ? `/databases?owner=${encodeURIComponent(teamScopeId)}` : '/databases',
      apps: teamPath ? `${teamPath}/apps` : '/apps',
      team: teamPath ?? '/teams',
      docs: '/help',
      support: '/support/inquiries',
      settings: '/settings',
    };
    void navigate(paths[item]);

    return true;
  };
  const scopeOptions = [
    { id: 'personal', label: '내 Resources', selected: !teamScopeId, onSelect: () => void navigate('/') },
    ...listDemoTeams().map(team => ({
      id: team.id,
      label: `${team.name} · ${team.my_role === 'leader' ? '팀장' : team.my_role === 'devops' ? 'DevOps' : '멤버'}`,
      selected: team.id === teamScopeId,
      onSelect: () => void navigate(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ];
  return <StudentShell activeItem={activeStudentItem} scopeLabel={scopeLabel} scopeOptions={scopeOptions} userName="김지민" onNavigate={onNavigate} onCreateTeam={() => navigate('/teams/new')} onOpenStatus={() => navigate('/status')} onSelectScope={() => undefined} onSearch={() => undefined} onOpenNotifications={() => undefined}><StudentContent>{children}</StudentContent></StudentShell>;
}

export function DemoOnlyGate({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  if (!isDemoMode()) return <WorkflowLayout admin={admin}><PageStack><Heading><TitleGroup><Title>로컬 미리보기 전용 화면</Title><Subtitle>?demo=1 모드에서만 목데이터를 확인할 수 있습니다.</Subtitle></TitleGroup></Heading></PageStack></WorkflowLayout>;
  if (admin && getSessionUser()?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

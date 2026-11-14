import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Navigate } from 'react-router';
import styled from 'styled-components';
import { isDemoMode } from '../../../shared/demo';
import type { StudentNavigationKey } from '../../../widgets/student-shell';
import { StudentShell } from '../../../widgets/student-shell';
import { Octicon } from '../../../shared/ui/icons';
import { getSessionUser } from '../../../entities/session';

const AdminLayout = styled.div`
  display: flex;
  min-width: 1200px;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
`;
const AdminSidebar = styled.aside`
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
`;
const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  color: ${({ theme }) => theme.colors.text};
  font: 700 22px/28px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;
const BrandMark = styled.img`
  display: block;
  width: 24px;
  height: 24px;
`;
const Workspace = styled.span`
  margin: 0 8px 12px;
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
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: 500 14px/20px ${({ theme }) => theme.typography.body.family}, sans-serif;
  text-align: left;
  cursor: pointer;
`;
const AdminDivider = styled.div`
  height: 1px;
  margin: 4px 0;
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
`;
const AdminHeaderLabel = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: 500 12px/18px ${({ theme }) => theme.typography.label.family}, sans-serif;
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
`;
const AdminIdentity = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const AdminContent = styled.main`
  width: 100%;
  max-width: 1300px;
  flex: 1;
  padding: 40px;
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
`;
export const Stat = styled.div`
  min-height: 120px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  strong { display: block; margin: 12px 0 4px; color: ${({ theme }) => theme.colors.text}; font-size: 24px; }
`;

export function WorkflowLayout({ children, admin = false, activeAdminItem = '승인', activeStudentItem = 'none', scopeLabel = '내 Resources' }: { children: ReactNode; admin?: boolean; activeAdminItem?: string; activeStudentItem?: StudentNavigationKey; scopeLabel?: string }) {
  const navigate = useNavigate();
  if (admin) {
    const primary = [
      ['인프라 현황', 'pulse', '/admin/infra'],
      ['승인', 'checklist', '/admin/database-approvals'],
      ['전체 VM', 'server', '/admin/vms/demo-vm-1'],
      ['문의 답변', 'comment-discussion', '/admin/inquiries'],
      ['관리자 점검', 'shield', '/admin/accounts'],
    ] as const;
    const secondary = [
      ['Docs', 'book', '/help'],
      ['문의', 'comment-discussion', '/support/inquiries'],
      ['설정', 'gear', '/settings'],
    ] as const;
    return <AdminLayout><AdminSidebar><Brand><BrandMark src="/assets/gsmsv-logo.svg" alt="" /> GSM SV</Brand><Workspace>관리자 워크스페이스</Workspace><AdminNav>{primary.map(([label, icon, href]) => <AdminNavButton key={href} type="button" $active={label === activeAdminItem} onClick={() => navigate(href)}><Octicon name={icon} size={16} />{label}</AdminNavButton>)}<AdminDivider />{secondary.map(([label, icon, href]) => <AdminNavButton key={href} type="button" $active={false} onClick={() => navigate(href)}><Octicon name={icon} size={16} />{label}</AdminNavButton>)}</AdminNav><div style={{ marginTop: 'auto', color: '#a8a2af', fontSize: 12 }}><Octicon name="pulse" size={16} /> 서비스 상태</div></AdminSidebar><AdminMain><AdminHeader><AdminHeaderLabel>관리자 콘솔</AdminHeaderLabel><AdminSearch><Octicon name="search" size={16} />이름 또는 GRN으로 검색</AdminSearch><AdminIdentity>♙ 관리자</AdminIdentity></AdminHeader><AdminContent>{children}</AdminContent></AdminMain></AdminLayout>;
  }

  const onNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const paths: Record<Exclude<StudentNavigationKey, 'none'>, string> = {
      home: '/', 'vm-create': '/vms/new', serverless: '/serverless', database: '/databases', apps: '/apps', team: '/teams', docs: '/help', support: '/support/inquiries', settings: '/settings',
    };
    void navigate(paths[item]);
  };
  return <StudentShell activeItem={activeStudentItem} scopeLabel={scopeLabel} userName="김지민" onNavigate={onNavigate} onCreateTeam={() => navigate('/teams/new')} onOpenStatus={() => navigate('/status')} onSelectScope={() => undefined} onSearch={() => undefined} onOpenNotifications={() => undefined}>{children}</StudentShell>;
}

export function DemoOnlyGate({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  if (!isDemoMode()) return <WorkflowLayout admin={admin}><PageStack><Heading><TitleGroup><Title>로컬 미리보기 전용 화면</Title><Subtitle>?demo=1 모드에서만 목데이터를 확인할 수 있습니다.</Subtitle></TitleGroup></Heading></PageStack></WorkflowLayout>;
  if (admin && getSessionUser()?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

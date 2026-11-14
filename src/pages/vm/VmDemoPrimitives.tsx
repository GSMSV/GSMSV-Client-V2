import type { ComponentProps, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button } from '../../shared/ui/controls';
import { Octicon, type OcticonName } from '../../shared/ui/icons';
import { isDemoMode } from '../../shared/demo';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

export const DemoPage = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

export const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

export const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

export const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

export const Subtitle = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.primary};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

export const Tabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Tab = styled(Link)<{ $active?: boolean }>`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.base}px ${({ theme }) => theme.radii.base}px 0 0;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  text-decoration: none;
`;

export const Surface = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

export const SurfaceTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

export const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

export const Stack = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

export const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline-color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

export const Textarea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline-color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  resize: vertical;
`;

export const Banner = styled.div<{ $tone?: 'primary' | 'warning' | 'muted' }>`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warningSoft : $tone === 'primary' ? theme.colors.primarySoft : theme.colors.surface};
  color: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warning : theme.colors.text};
`;

export const BannerCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

export const Facts = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 3 }) => $columns}, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

export const MetricCard = styled.article`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

export const MetricLabel = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

export const MetricValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

export const Fact = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`;

export const FactLabel = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

export const FactValue = styled.span`
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

export const Grid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`;

export const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  th, td { padding: 14px 12px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; text-align: left; }
  th { color: ${({ theme }) => theme.colors.faint}; font-weight: 500; }
`;

const Segmented = styled.div`
  display: flex;
  width: 100%;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const Segment = styled.button<{ $active: boolean }>`
  flex: 1;
  min-height: 34px;
  border: 0;
  border-radius: 6px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: pointer;
`;

export function OsSelector({ value, onChange }: { value: string; onChange: (value: 'Linux Ubuntu 22.04 LTS' | 'Ubuntu Server') => void }) {
  return <Segmented aria-label="운영체제">
    {(['Linux Ubuntu 22.04 LTS', 'Ubuntu Server'] as const).map(option => <Segment key={option} type="button" $active={value === option} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</Segment>)}
  </Segmented>;
}

export function DetailTabs({ vmId, active, teamId, networkVmGrn }: { vmId: string; active: string; teamId?: string; networkVmGrn?: string }) {
  const prefix = teamId ? `/teams/${teamId}/vms/${vmId}` : `/vms/${vmId}`;
  const tabs = [
    ['개요', prefix],
    ['Monitoring', `${prefix}/monitoring`],
    ['Network', teamId ? `/teams/${teamId}/vms/${networkVmGrn ?? vmId}/network` : `/vms/${networkVmGrn ?? vmId}/network`],
    ['Snapshot', `${prefix}/snapshots`],
    ['설정', `${prefix}/settings`],
  ];
  return <Tabs aria-label="VM 메뉴">{tabs.map(([label, to]) => <Tab key={label} to={to} $active={active === label}>{label}</Tab>)}</Tabs>;
}

export function DemoShell({ children, activeItem = 'home', scopeLabel = '내 Resources', userName = '김지민', teamScopeId, hasUnsavedInput = false }: {
  children: ReactNode;
  activeItem?: StudentNavigationKey;
  scopeLabel?: string;
  userName?: string;
  teamScopeId?: string;
  hasUnsavedInput?: boolean;
}) {
  const activeDemo = isDemoMode();
  const routeTo = useNavigate();
  const navigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const paths: Record<Exclude<StudentNavigationKey, 'none'>, string> = {
      home: '/', 'vm-create': '/vms/new', serverless: '/serverless', database: '/databases', apps: '/apps', team: '/teams', docs: '/docs', support: '/support/inquiries', settings: '/settings',
    };
    routeTo(paths[item]);
  };
  return <StudentShell
    activeItem={activeItem}
    scopeLabel={scopeLabel}
    teamScopeId={teamScopeId}
    userName={userName}
    notificationCount={2}
    onNavigate={navigate}
    onCreateTeam={() => window.location.assign('/teams/new')}
    onOpenStatus={() => window.location.assign('/status')}
    onSelectScope={() => {}}
    onSearch={() => {}}
    onOpenNotifications={() => {}}
    hasUnsavedInput={hasUnsavedInput}
    disabledNavigationItems={activeDemo ? [] : ['vm-create']}
  >{children}</StudentShell>;
}

export function InlineFact({ label, value, icon = 'server' }: { label: string; value: ReactNode; icon?: OcticonName }) {
  return <FactRow><Octicon name={icon} size={16} /><Fact><FactLabel>{label}</FactLabel><FactValue>{value}</FactValue></Fact></FactRow>;
}

const FactRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

export const StatusText = styled.span<{ $status: 'running' | 'queued' | 'stopped' }>`
  color: ${({ theme, $status }) => $status === 'running' ? theme.colors.primary : $status === 'queued' ? theme.colors.warning : theme.colors.faint};
`;

export const PrimaryButton = (props: ComponentProps<typeof Button>) => <Button variant="primary" {...props} />;

export const ScreenGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ProgressBar = styled.div<{ $percent: number }>`
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  &::before { display: block; width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%; height: 100%; border-radius: inherit; background: ${({ theme }) => theme.colors.primary}; content: ''; }
`;

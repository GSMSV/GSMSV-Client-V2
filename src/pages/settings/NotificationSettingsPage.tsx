import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import styled from 'styled-components';
import { clearSessionUser, getSessionUser } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { NotificationSettingsPanel } from '../../features/settings/notification-settings';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';
import { UnsavedChangesDialog } from '../../shared/ui/feedback';
import { logout } from '../../features/auth/logout/api/logout';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

const navigationPaths: Partial<Record<StudentNavigationKey, string>> = {
  home: '/',
  database: '/databases',
  apps: '/apps',
  team: '/teams',
  settings: '/settings',
};

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV && isDemoMode()) {
      let cancelled = false;
      void import('../../entities/team/demo').then(({ listDemoTeams }) => {
        if (!cancelled) setTeams(listDemoTeams());
      });
      return () => { cancelled = true; };
    }
    const controller = new AbortController();
    void listMyTeams(controller.signal).then(value => {
      if (!controller.signal.aborted) setTeams(value);
    }).catch(() => {
      if (!controller.signal.aborted) setTeams([]);
    });
    return () => controller.abort();
  }, []);

  const navigateWithUnsavedCheck = useCallback((path: string) => {
    void navigate(path);
  }, [navigate]);

  const blocker = useBlocker(useCallback(({ currentLocation, historyAction, nextLocation }) => {
    if (logoutPending && historyAction === 'REPLACE' && nextLocation.pathname === '/login') return false;
    return logoutPending || (hasChanges && currentLocation.pathname !== nextLocation.pathname);
  }, [hasChanges, logoutPending]));

  useEffect(() => {
    if (!hasChanges && !logoutPending) return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [hasChanges, logoutPending]);

  const scopeOptions = useMemo(() => [
    { id: 'personal', label: '내 Resources', selected: true, onSelect: () => navigateWithUnsavedCheck('/') },
    ...teams.map(team => ({
      id: team.id,
      label: `${team.name} · ${roleLabels[team.my_role]}`,
      selected: false,
      onSelect: () => navigateWithUnsavedCheck(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ], [navigateWithUnsavedCheck, teams]);

  const onNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const path = navigationPaths[item];
    if (path) navigateWithUnsavedCheck(path);
  };

  const performLogout = async () => {
    if (logoutPending) return;
    setLogoutPending(true);
    setLogoutError(false);
    try {
      if (!(import.meta.env.DEV && isDemoMode())) await logout();
      clearSessionUser();
      void navigate('/login', { replace: true });
    } catch {
      setLogoutError(true);
      setLogoutPending(false);
    }
  };

  const requestLogout = () => {
    if (logoutPending) return;
    if (hasChanges) setLogoutConfirmationOpen(true);
    else void performLogout();
  };

  return (
    <StudentShell
      activeItem="settings"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={onNavigate}
      onCreateTeam={() => navigateWithUnsavedCheck('/teams/new')}
      onOpenStatus={() => navigateWithUnsavedCheck('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={false}
      onLogoutRequest={requestLogout}
    >
      <Page>
        <Breadcrumb>설정 / 알림 설정</Breadcrumb>
        <TitleBlock>
          <Title>알림 설정</Title>
          <Description>계약된 알림 그룹의 이메일 및 Discord 수신 여부를 관리합니다.</Description>
        </TitleBlock>
        <NotificationSettingsPanel showChannelBanner disabled={logoutPending} onUnsavedInputChange={setHasChanges} />
        {logoutError && <Description role="alert">로그아웃하지 못했습니다. 다시 시도해 주세요.</Description>}
        {blocker.state === 'blocked' && <UnsavedChangesDialog onLeave={blocker.proceed} onStay={blocker.reset} />}
        {logoutConfirmationOpen && <UnsavedChangesDialog onLeave={() => {
          setLogoutConfirmationOpen(false);
          void performLogout();
        }} onStay={() => setLogoutConfirmationOpen(false)} />}
      </Page>
    </StudentShell>
  );
}

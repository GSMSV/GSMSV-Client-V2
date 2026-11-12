import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';
import { clearSessionUser, getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { logout } from '../../features/auth/logout/api/logout';
import { NotificationSettingsPanel } from '../../features/settings/notification-settings';
import { Button } from '../../shared/ui/controls';
import { Banner } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Content = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[24]}px;
  margin: 0 auto;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme: { typography: { caption } } }) => `${caption.weight} ${caption.size}px/${caption.lineHeight}px ${caption.family}`}, sans-serif;
`;

const PageHeading = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const Title = styled.h1`
  margin: 0;
  font: ${({ theme: { typography: { h1 } } }) => `${h1.weight} ${h1.size}px/${h1.lineHeight}px ${h1.family}`}, sans-serif;
`;

const Intro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const Panel = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const PanelTitle = styled.h2`
  margin: 0;
  font: ${({ theme: { typography: { title } } }) => `${title.weight} ${title.size}px/${title.lineHeight}px ${title.family}`}, sans-serif;
`;

const Profile = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;

  > svg { flex: 0 0 auto; }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[16]}px;
`;

const Fields = styled.dl`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  margin: 0;
  overflow-wrap: anywhere;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

const FieldLabel = styled.dt`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme: { typography: { label } } }) => `${label.weight} ${label.size}px/${label.lineHeight}px ${label.family}`}, sans-serif;
`;

const FieldValue = styled.dd`
  margin: 0;
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;

const UserId = styled.code`
  font: ${({ theme: { typography: { code } } }) => `${code.weight} ${code.size}px/${code.lineHeight}px '${code.family}'`}, monospace;
`;

const TeamList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const FeatureIcon = styled.span`
  display: grid;
  width: ${({ theme }) => theme.size.control}px;
  height: ${({ theme }) => theme.size.control}px;
  place-items: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const FeatureTitle = styled(PanelTitle)`
  font: ${({ theme: { typography: { h2 } } }) => `${h2.weight} ${h2.size}px/${h2.lineHeight}px ${h2.family}`}, sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;

const ErrorMessage = styled(Description)`
  color: ${({ theme }) => theme.colors.danger};
`;

const ActionRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const FeatureActions = styled(ActionRow)`
  align-items: flex-end;
`;

const teamRoleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

const navigationPaths: Partial<Record<StudentNavigationKey, string>> = {
  home: '/',
  database: '/databases',
  apps: '/apps',
  team: '/teams',
  settings: '/settings',
};

type TeamsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; teams: TeamSummary[] };

function TeamMemberships({ state }: { state: TeamsState }) {
  if (state.status === 'loading') return '소속 팀을 불러오는 중입니다.';
  if (state.status === 'error') return '소속 팀을 불러오지 못했습니다.';
  if (state.teams.length === 0) return '소속된 팀이 없습니다.';
  return (
    <TeamList role="list">
      {state.teams.map(team => <li key={team.id}>{team.name} · {teamRoleLabels[team.my_role]}</li>)}
    </TeamList>
  );
}

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getSessionUser();
  const [teamsState, setTeamsState] = useState<TeamsState>({ status: 'loading' });
  const [logoutState, setLogoutState] = useState<'idle' | 'pending' | 'error'>('idle');
  const [notificationUnsaved, setNotificationUnsaved] = useState(false);
  const userName = user?.name ?? '사용자';
  const roleLabel = user ? (user.role === 'admin' ? '관리자' : '일반 사용자') : '역할 확인 불가';

  useEffect(() => {
    const controller = new AbortController();
    void listMyTeams(controller.signal).then(teams => {
      if (!controller.signal.aborted) setTeamsState({ status: 'ready', teams });
    }).catch(() => {
      if (!controller.signal.aborted) setTeamsState({ status: 'error' });
    });
    return () => controller.abort();
  }, []);

  const confirmUnsavedNavigation = useCallback((path: string) => (
    pathname === path || !notificationUnsaved || window.confirm('저장하지 않은 알림 설정이 있습니다. 저장하지 않고 이동할까요?')
  ), [notificationUnsaved, pathname]);

  const navigateWithUnsavedCheck = useCallback((path: string) => {
    if (!confirmUnsavedNavigation(path)) return;
    void navigate(path);
  }, [confirmUnsavedNavigation, navigate]);

  const blocker = useBlocker(useCallback(({ historyAction, nextLocation }) => {
    if (nextLocation.pathname === '/login') return false;
    return logoutState === 'pending' || (historyAction === 'POP' && notificationUnsaved);
  }, [logoutState, notificationUnsaved]));

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (logoutState === 'pending') {
      blocker.reset();
      return;
    }
    if (window.confirm('저장하지 않은 알림 설정이 있습니다. 저장하지 않고 이동할까요?')) blocker.proceed();
    else blocker.reset();
  }, [blocker, logoutState]);

  useEffect(() => {
    if (!notificationUnsaved && logoutState !== 'pending') return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [logoutState, notificationUnsaved]);

  const scopeOptions = useMemo(() => [
    { id: 'personal', label: '내 Resources', selected: true, onSelect: () => navigateWithUnsavedCheck('/') },
    ...(teamsState.status === 'ready' ? teamsState.teams : []).map(team => ({
      id: team.id,
      label: `${team.name} · ${teamRoleLabels[team.my_role]}`,
      selected: false,
      onSelect: () => navigateWithUnsavedCheck(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ], [navigateWithUnsavedCheck, teamsState]);

  const handleLogout = async () => {
    if (logoutState === 'pending') return;
    if (!confirmUnsavedNavigation('/login')) return;
    setLogoutState('pending');
    try {
      await logout();
      clearSessionUser();
      void navigate('/login', { replace: true });
    } catch {
      setLogoutState('error');
    }
  };

  return (
    <StudentShell
      activeItem="settings"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      userName={userName}
      onNavigate={item => {
        const path = navigationPaths[item];
        if (path) navigateWithUnsavedCheck(path);
      }}
      onCreateTeam={() => navigateWithUnsavedCheck('/teams/new')}
      onOpenStatus={() => navigateWithUnsavedCheck('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={notificationUnsaved}
      onLogoutPendingChange={pending => setLogoutState(pending ? 'pending' : 'idle')}
    >
      <Content>
        <Page>
          <Breadcrumb>설정</Breadcrumb>
          <PageHeading>
            <Title>계정 설정</Title>
            <Intro>DataGSM 계정 정보를 확인하세요.</Intro>
          </PageHeading>

          <Panel aria-labelledby="profile-photo-title">
            <PanelTitle id="profile-photo-title">프로필 사진</PanelTitle>
            <Profile>
              <Octicon name="person" size={16} aria-hidden="true" />
              <Fields>
                <Field>
                  <FieldLabel>{userName}</FieldLabel>
                  <FieldValue>{roleLabel}</FieldValue>
                </Field>
              </Fields>
            </Profile>
          </Panel>

          <Columns>
            <Panel aria-labelledby="student-info-title">
              <PanelTitle id="student-info-title">학생 정보</PanelTitle>
              <Fields>
                <Field>
                  <FieldLabel>이름</FieldLabel>
                  <FieldValue>{user?.name ?? '확인할 수 없음'}</FieldValue>
                </Field>
              </Fields>
            </Panel>
            <Panel aria-labelledby="account-info-title">
              <PanelTitle id="account-info-title">계정 정보</PanelTitle>
              <Fields>
                <Field>
                  <FieldLabel>사용자 ID</FieldLabel>
                  <FieldValue>{user ? <UserId>{user.id}</UserId> : '확인할 수 없음'}</FieldValue>
                </Field>
                <Field>
                  <FieldLabel>현재 역할</FieldLabel>
                  <FieldValue>{roleLabel}</FieldValue>
                </Field>
                <Field>
                  <FieldLabel>소속 팀</FieldLabel>
                  <FieldValue aria-live="polite"><TeamMemberships state={teamsState} /></FieldValue>
                </Field>
              </Fields>
            </Panel>
          </Columns>

          <Banner
            title="계정 정보는 DataGSM에서 수정됩니다"
            description="변경한 학생 정보는 다음 로그인 때 반영됩니다."
            tone="neutral"
            icon={<Octicon name="info" size={20} />}
          />

          <Panel aria-labelledby="team-feature-title">
            <FeatureIcon aria-hidden="true"><Octicon name="organization" size={20} /></FeatureIcon>
            <FeatureTitle id="team-feature-title">팀으로 함께 관리하기</FeatureTitle>
            <FeatureActions>
              <Description>
                팀을 만들고 친구를 초대하면 팀 VM을 함께 관리할 수 있습니다. 팀 VM은 팀 할당량을 사용합니다.
                <br />
                팀은 관리자 승인 후 VM을 만들 수 있습니다.
              </Description>
              <Button icon={<Octicon name="arrow-right" />} onClick={() => navigateWithUnsavedCheck('/teams/new')}>팀 만들기</Button>
            </FeatureActions>
          </Panel>

        <NotificationSettingsPanel disabled={logoutState === 'pending'} onUnsavedInputChange={setNotificationUnsaved} />

          <Panel aria-labelledby="account-session-title">
            <ActionRow>
              <PanelTitle id="account-session-title">현재 세션</PanelTitle>
              <Button
                variant="danger"
                icon={<Octicon name="sign-out" />}
                onClick={() => void handleLogout()}
                disabled={logoutState === 'pending'}
              >
                {logoutState === 'pending' ? '로그아웃 중…' : '로그아웃'}
              </Button>
            </ActionRow>
            {logoutState === 'error' && <ErrorMessage role="alert">로그아웃하지 못했습니다. 다시 시도해 주세요.</ErrorMessage>}
          </Panel>
        </Page>
      </Content>
    </StudentShell>
  );
}

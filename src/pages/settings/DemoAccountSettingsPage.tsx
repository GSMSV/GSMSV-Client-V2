import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoProfile, updateDemoProfile, type DemoProfile } from '../../entities/profile';
import { clearSessionUser, getSessionUser } from '../../entities/session';
import { listDemoTeams } from '../../entities/team/demo';
import type { TeamRole } from '../../entities/team';
import { AccountDialog, DemoAccountConnections, DemoAccountPhoto, DemoAccountWithdrawal } from '../../features/settings/demo-account';
import { Button } from '../../shared/ui/controls';
import { Banner } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { NotificationSettingsPanel } from '../../features/settings/notification-settings';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Content = styled.div`border-top: 1px solid ${({ theme }) => theme.colors.border};`;
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
const PageHeading = styled.header`display: flex; flex-direction: column; gap: ${({ theme }) => theme.space[8]}px;`;
const Title = styled.h1`
  margin: 0;
  font: ${({ theme: { typography: { h1 } } }) => `${h1.weight} ${h1.size}px/${h1.lineHeight}px ${h1.family}`}, sans-serif;
`;
const Intro = styled.p`margin: 0; color: ${({ theme }) => theme.colors.muted};`;
const Panel = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;
const DangerPanel = styled(Panel)`border: 1px solid ${({ theme }) => theme.colors.danger};`;
const PanelTitle = styled.h2`
  margin: 0;
  font: ${({ theme: { typography: { title } } }) => `${title.weight} ${title.size}px/${title.lineHeight}px ${title.family}`}, sans-serif;
`;
const ProfileRow = styled.div`display: flex; min-height: 44px; align-items: center; gap: ${({ theme }) => theme.space[16]}px;`;
const Avatar = styled.div`
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.raised};
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const ProfileName = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const Guide = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;
const Columns = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: ${({ theme }) => theme.space[16]}px;`;
const Fields = styled.dl`display: flex; min-width: 0; flex-direction: column; gap: ${({ theme }) => theme.space[16]}px; margin: 0; overflow-wrap: anywhere;`;
const Field = styled.div`display: flex; flex-direction: column; gap: ${({ theme }) => theme.space[4]}px;`;
const FieldLabel = styled.dt`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme: { typography: { label } } }) => `${label.weight} ${label.size}px/${label.lineHeight}px ${label.family}`}, sans-serif;
`;
const FieldValue = styled.dd`
  margin: 0;
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;
const UserId = styled.code`font: ${({ theme: { typography: { code } } }) => `${code.weight} ${code.size}px/${code.lineHeight}px '${code.family}'`}, monospace;`;
const FeatureIcon = styled.span`
  display: grid;
  width: ${({ theme }) => theme.size.control}px;
  height: ${({ theme }) => theme.size.control}px;
  place-items: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;
const FeatureTitle = styled(PanelTitle)`font: ${({ theme: { typography: { h2 } } }) => `${h2.weight} ${h2.size}px/${h2.lineHeight}px ${h2.family}`}, sans-serif;`;
const ActionRow = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: ${({ theme }) => theme.space[16]}px;`;
const Description = styled.p`
  max-width: 600px;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;
const MutedText = styled.p`margin: 0; color: ${({ theme }) => theme.colors.muted};`;

const navigationPaths: Partial<Record<StudentNavigationKey, string>> = {
  home: '/', 'vm-create': '/vms/new', database: '/databases', apps: '/apps', team: '/teams', support: '/support/inquiries', settings: '/settings',
};

const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

export default function DemoAccountSettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getDemoProfile);
  const [teams] = useState(listDemoTeams);
  const [notificationUnsaved, setNotificationUnsaved] = useState(false);
  const [photoUnsaved, setPhotoUnsaved] = useState(false);
  const unsaved = notificationUnsaved || photoUnsaved;
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    unsaved && nextLocation.pathname !== '/login' && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!unsaved) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [unsaved]);

  const save = useCallback((changes: Partial<DemoProfile>) => {
    const next = updateDemoProfile(changes);
    if (!next) return false;
    setProfile(next);
    return true;
  }, []);

  const scopeOptions = useMemo(() => [
    { id: 'personal', label: '내 Resources', selected: true, onSelect: () => navigate('/') },
    ...teams.map(team => ({
      id: team.id,
      label: `${team.name} · ${roleLabels[team.my_role]}`,
      selected: false,
      onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ], [navigate, teams]);

  function goToLogin() {
    clearSessionUser();
    void navigate('/login', { replace: true });
  }

  if (!profile) return null;
  const role = getSessionUser()?.role === 'admin' ? '관리자' : '일반 사용자';

  return <StudentShell
    activeItem="settings"
    scopeLabel="내 Resources"
    scopeOptions={scopeOptions}
    userName={profile.name}
    profilePhotoUrl={profile.photoDataUrl}
    onNavigate={item => { const path = navigationPaths[item]; if (path) navigate(path); }}
    onCreateTeam={() => navigate('/teams/new')}
    onOpenStatus={() => navigate('/status')}
    onSelectScope={() => undefined}
    onSearch={() => undefined}
    onOpenNotifications={() => undefined}
  >
    <Content>
      <Page>
        <Breadcrumb>설정</Breadcrumb>
        <PageHeading><Title>계정 설정</Title><Intro>DataGSM 계정 정보와 프로필 사진을 확인하세요.</Intro></PageHeading>
        <Panel aria-labelledby="profile-photo-title">
          <PanelTitle id="profile-photo-title">프로필 사진</PanelTitle>
          <ProfileRow>
            <Avatar>{profile.photoDataUrl ? <img src={profile.photoDataUrl} alt={`${profile.name} 프로필 사진`} /> : <Octicon name="person" size={16} aria-hidden="true" />}</Avatar>
            <ProfileName><FieldValue>{profile.name}</FieldValue><FieldValue>{role} · {profile.major}</FieldValue></ProfileName>
            <DemoAccountPhoto photoUrl={profile.photoDataUrl} onSave={photoDataUrl => save({ photoDataUrl })} onDraftChange={setPhotoUnsaved} />
          </ProfileRow>
        </Panel>
        <Guide role="note"><strong>업로드 안내</strong><span>JPG, PNG, WebP 파일을 2MB까지 업로드할 수 있습니다. 사진을 선택한 뒤 원하는 영역으로 잘라 저장하세요.</span></Guide>
        <Columns>
          <Panel aria-labelledby="student-info-title">
            <PanelTitle id="student-info-title">학생 정보</PanelTitle>
            <Fields>
              <Field><FieldLabel>이름</FieldLabel><FieldValue>{profile.name}</FieldValue></Field>
              <Field><FieldLabel>학년 · 반 · 번호</FieldLabel><FieldValue>{profile.grade}학년 · {profile.classNumber}반 · {profile.studentNumber}번</FieldValue></Field>
              <Field><FieldLabel>전공</FieldLabel><FieldValue>{profile.major}</FieldValue></Field>
              <Field><FieldLabel>학교 이메일</FieldLabel><FieldValue>{profile.email}</FieldValue></Field>
            </Fields>
          </Panel>
          <Panel aria-labelledby="account-info-title">
            <PanelTitle id="account-info-title">계정 정보</PanelTitle>
            <Fields>
              <Field><FieldLabel>사용자 ID</FieldLabel><FieldValue><UserId>{profile.userId}</UserId></FieldValue></Field>
              <Field><FieldLabel>현재 역할</FieldLabel><FieldValue>{role}</FieldValue></Field>
              <Field><FieldLabel>소속 팀</FieldLabel><FieldValue>{teams.map(team => `${team.name} · ${roleLabels[team.my_role]}`).join(', ') || '—'}</FieldValue></Field>
              <Field><FieldLabel>가입일</FieldLabel><FieldValue>{profile.joinedAt}</FieldValue></Field>
            </Fields>
          </Panel>
        </Columns>
        <Banner title="계정 정보는 DataGSM에서 수정됩니다" description="변경한 학생 정보는 다음 로그인 때 반영됩니다. 이 화면에서는 프로필 사진을 관리할 수 있습니다." tone="neutral" icon={<Octicon name="info" size={20} />} />
        <Panel aria-labelledby="team-feature-title">
          <FeatureIcon aria-hidden="true"><Octicon name="organization" size={20} /></FeatureIcon>
          <FeatureTitle id="team-feature-title">팀으로 함께 관리하기</FeatureTitle>
          <ActionRow><Description>팀을 만들고 친구를 초대하면 팀 VM을 함께 관리할 수 있습니다. 팀 VM은 팀 할당량을 사용합니다.<br />팀은 관리자 승인 후 VM을 만들 수 있습니다.</Description><Button icon={<Octicon name="arrow-right" />} onClick={() => navigate('/teams/new')}>팀 만들기</Button></ActionRow>
        </Panel>
        <NotificationSettingsPanel onUnsavedInputChange={setNotificationUnsaved} demoDiscordConnected={profile.discordConnected} />
        <Panel aria-labelledby="linked-accounts-title">
          <PanelTitle id="linked-accounts-title">연결된 계정·기기</PanelTitle>
          <DemoAccountConnections profile={profile} onSave={save} onLogout={goToLogin} />
        </Panel>
        <DangerPanel aria-labelledby="account-danger-title">
          <ActionRow>
            <div><PanelTitle id="account-danger-title">위험 구역 · 계정 탈퇴</PanelTitle><MutedText>탈퇴하면 내 VM·Database·함수·앱이 모두 삭제되며 되돌릴 수 없습니다. 팀 자원은 팀에 남습니다.</MutedText></div>
            <DemoAccountWithdrawal email={profile.email} deleted={profile.accountDeleted} onWithdraw={() => {
              clearSessionUser();
              setProfile(getDemoProfile());
            }} onLogin={goToLogin} />
          </ActionRow>
        </DangerPanel>
        {blocker.state === 'blocked' && (
          <AccountDialog title="저장하지 않은 내용이 있습니다" icon="alert" description="저장하지 않고 이동할까요?"
            onDismiss={blocker.reset} actions={<>
              <Button variant="secondary" onClick={blocker.reset}>취소</Button>
              <Button onClick={blocker.proceed}>이동</Button>
            </>} />
        )}
      </Page>
    </Content>
  </StudentShell>;
}

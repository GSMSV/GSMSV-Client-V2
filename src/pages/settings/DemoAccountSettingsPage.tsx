import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoProfile, saveDemoProfile, type DemoProfile } from '../../entities/profile';
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
const Actions = styled.div`display: flex; gap: ${({ theme }) => theme.space[8]}px; margin-left: auto;`;
const FileInput = styled.input`display: none;`;
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
const ConnectionRow = styled.div`
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-of-type { border-bottom: 0; }
`;
const ConnectionCopy = styled.div`display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px;`;
const DeviceList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  margin: 0;
  padding: 0;
  list-style: none;
  li { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
`;
const MutedText = styled.p`margin: 0; color: ${({ theme }) => theme.colors.muted};`;

const navigationPaths: Partial<Record<StudentNavigationKey, string>> = {
  home: '/', database: '/databases', apps: '/apps', team: '/teams', settings: '/settings',
};

export default function DemoAccountSettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DemoProfile | null>(() => getDemoProfile());
  const [photoMessage, setPhotoMessage] = useState('');
  const [showDevices, setShowDevices] = useState(false);
  const [devicesMessage, setDevicesMessage] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  const scopeOptions = useMemo(() => [
    { id: 'personal', label: '내 Resources', selected: true, onSelect: () => navigate('/') },
    { id: 'demo-team', label: `${profile?.teamName ?? 'GSM Connect'} · 팀장`, selected: false, onSelect: () => navigate('/teams/demo-team') },
  ], [navigate, profile?.teamName]);
  if (!profile) return null;

  const update = (next: DemoProfile, message?: string) => {
    if (!saveDemoProfile(next)) return;
    setProfile(next);
    if (message) setPhotoMessage(message);
  };

  const changePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setPhotoMessage('JPG, PNG, WebP 파일을 2MB까지 업로드할 수 있습니다.');
      event.currentTarget.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') update({ ...profile, photoDataUrl: reader.result }, '프로필 사진을 저장했습니다.');
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = '';
  };

  return <StudentShell
    activeItem="settings"
    scopeLabel="내 Resources"
    scopeOptions={scopeOptions}
    userName={profile.name}
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
            <ProfileName><FieldValue>{profile.name}</FieldValue><FieldValue>일반 사용자 · {profile.major}</FieldValue></ProfileName>
            <FileInput ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} aria-label="프로필 사진 파일 선택" />
            <Actions>
              {profile.photoDataUrl && <Button variant="secondary" onClick={() => update({ ...profile, photoDataUrl: null }, '프로필 사진을 삭제했습니다.')}>사진 삭제</Button>}
              <Button variant="secondary" onClick={() => photoInput.current?.click()}>사진 변경</Button>
            </Actions>
          </ProfileRow>
        </Panel>
        <Guide role="note"><strong>업로드 안내</strong><span>JPG, PNG, WebP 파일을 2MB까지 업로드할 수 있습니다. 사진을 선택한 뒤 원하는 영역으로 잘라 저장하세요.</span>{photoMessage && <span role="status">{photoMessage}</span>}</Guide>
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
              <Field><FieldLabel>현재 역할</FieldLabel><FieldValue>일반 사용자</FieldValue></Field>
              <Field><FieldLabel>소속 팀</FieldLabel><FieldValue>{profile.teamName} · {profile.teamRole}</FieldValue></Field>
              <Field><FieldLabel>가입일</FieldLabel><FieldValue>{profile.joinedAt}</FieldValue></Field>
            </Fields>
          </Panel>
        </Columns>
        <Banner title="계정 정보는 DataGSM에서 수정돼요" description="이름·학년·반·번호·전공·학교 이메일은 DataGSM에서 변경할 수 있습니다." tone="neutral" icon={<Octicon name="info" size={20} />} />
        <Panel aria-labelledby="team-feature-title">
          <FeatureIcon aria-hidden="true"><Octicon name="organization" size={20} /></FeatureIcon>
          <FeatureTitle id="team-feature-title">팀으로 함께 관리하기</FeatureTitle>
          <ActionRow><Description>팀을 만들고 친구를 초대하면 팀 VM을 함께 관리할 수 있습니다. 팀 VM은 팀 할당량을 사용합니다.<br />팀은 관리자 승인 후 VM을 만들 수 있습니다.</Description><Button icon={<Octicon name="arrow-right" />} onClick={() => navigate('/teams/new')}>팀 만들기</Button></ActionRow>
        </Panel>
        <NotificationSettingsPanel showChannelBanner />
        <Panel aria-labelledby="linked-accounts-title">
          <PanelTitle id="linked-accounts-title">연결된 계정·기기</PanelTitle>
          <ConnectionRow><Octicon name="link" size={16} aria-hidden="true" /><ConnectionCopy><FieldLabel>GitHub</FieldLabel><FieldValue>{profile.github ? `${profile.github} · 연결됨` : '연결되지 않음'}</FieldValue></ConnectionCopy><Button variant="secondary" onClick={() => update({ ...profile, github: profile.github ? null : '@gsm-jimin' })}>{profile.github ? '해제' : '연결'}</Button></ConnectionRow>
          <ConnectionRow><Octicon name="link" size={16} aria-hidden="true" /><ConnectionCopy><FieldLabel>Discord</FieldLabel><FieldValue>{profile.discordConnected ? '연결됨' : '연결되지 않음 · 현재는 이메일로 알림을 받습니다.'}</FieldValue></ConnectionCopy><Button variant="secondary" onClick={() => update({ ...profile, discordConnected: !profile.discordConnected })}>{profile.discordConnected ? '해제' : '연결'}</Button></ConnectionRow>
          <ConnectionRow><Octicon name="terminal" size={16} aria-hidden="true" /><ConnectionCopy><FieldLabel>CLI 기기</FieldLabel><FieldValue>{profile.cliDevices.map(device => device.name).join(' · ') || '연결된 기기 없음'} · {profile.cliDevices.length}대 연결됨 · 마지막 사용 2시간 전</FieldValue></ConnectionCopy><Button variant="secondary" onClick={() => setShowDevices(value => !value)}>{showDevices ? '닫기' : '관리'}</Button></ConnectionRow>
          {showDevices && <DeviceList aria-label="연결된 CLI 기기">{profile.cliDevices.map(device => <li key={device.id}><span>{device.name} · {device.lastUsed}</span><Button variant="ghost" onClick={() => { update({ ...profile, cliDevices: profile.cliDevices.filter(item => item.id !== device.id) }); setDevicesMessage(`${device.name} 연결을 해제했습니다.`); }}>연결 해제</Button></li>)}</DeviceList>}
          {devicesMessage && <MutedText role="status">{devicesMessage}</MutedText>}
          <ActionRow><span /><Button variant="secondary" onClick={() => { update({ ...profile, cliDevices: [] }); setDevicesMessage('모든 CLI 기기에서 로그아웃했습니다.'); }}>모든 기기에서 로그아웃</Button></ActionRow>
        </Panel>
        <DangerPanel aria-labelledby="account-danger-title"><ActionRow><div><PanelTitle id="account-danger-title">위험 구역 · 계정 탈퇴</PanelTitle><MutedText>데모 계정에만 기록되며 실제 계정에는 영향을 주지 않습니다.</MutedText></div><Button variant="danger" disabled={profile.accountDeleted} onClick={() => { if (window.confirm('데모 계정 탈퇴 요청을 기록할까요?')) update({ ...profile, accountDeleted: true }); }}>{profile.accountDeleted ? '탈퇴 요청됨' : '계정 탈퇴'}</Button></ActionRow></DangerPanel>
      </Page>
    </Content>
  </StudentShell>;
}

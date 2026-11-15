import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoInquiries, saveDemoInquiries, type Inquiry } from '../../entities/demo-workflows';
import { getDemoProfile } from '../../entities/profile';
import { getSessionUser } from '../../entities/session';
import { getDemoVmDaysRemaining, getDemoVmState, type DemoVm } from '../../entities/vm';
import { startDataGsmLogin } from '../../features/auth/start-login/model/startDataGsmLogin';
import { DemoVmExtensionDialog, useDemoVmExtension } from '../../features/vm-extension';
import { isDemoMode, readDemoState, writeDemoState } from '../../shared/demo';
import { Button, TextField, TextareaField } from '../../shared/ui/controls';
import { ModalSurface } from '../../shared/ui/feedback';
import { Octicon, type OcticonName } from '../../shared/ui/icons';

const Screen = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
`;
const Header = styled.header`
  display: flex; height: 74px; align-items: center; justify-content: space-between; gap: 24px;
  padding: 16px 40px; border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 700px) {
    height: auto;
    flex-wrap: wrap;
    padding: 16px;
  }
`;
const HeaderLeft = styled.div`
  display: flex; align-items: center; gap: 32px;
  @media (max-width: 700px) { width: 100%; flex-wrap: wrap; gap: 12px; }
`;
const Brand = styled.a`
  display: inline-flex; align-items: center; gap: 12px; color: ${({ theme }) => theme.colors.text}; text-decoration: none;
`;
const BrandLogo = styled.img`display: block; width: 24px; height: 24px;`;
const BrandName = styled.span`
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
const HeaderNav = styled.nav`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;
const HeaderLink = styled.a<{ $active?: boolean }>`
  display: inline-flex; height: 42px; align-items: center; justify-content: center; padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme, $active }) => $active ? theme.colors.raised : 'transparent'};
  color: ${({ theme }) => theme.colors.text}; font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  text-decoration: none; &:hover { background: ${({ theme }) => theme.colors.raised}; }
`;
const Layout = styled.div`
  display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: calc(100vh - 74px);

  @media (max-width: 960px) { grid-template-columns: minmax(0, 1fr); }
`;
const Sidebar = styled.aside`
  padding: 24px; background: ${({ theme }) => theme.colors.sidebar};

  @media (max-width: 700px) {
    padding: 16px;
    max-height: 40vh;
    overflow-y: auto;
  }
`;
const SearchLabel = styled.label`
  display: block; margin-bottom: 8px; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;
const SearchInput = styled.input`
  width: 100%; height: 42px; padding: 0 12px; border: 0; border-radius: ${({ theme }) => theme.radii.base}px;
  outline-color: ${({ theme }) => theme.colors.primary}; background: ${({ theme }) => theme.colors.field}; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  &::placeholder { color: ${({ theme }) => theme.colors.faint}; }
`;
const NavGroups = styled.nav`display: flex; flex-direction: column; gap: 20px; margin-top: 16px;`;
const NavGroup = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const GroupLabel = styled.p`
  margin: 0 0 2px; color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;
const NavItem = styled.a<{ $active?: boolean }>`
  display: flex; min-height: 42px; align-items: center; gap: 8px; padding: 0 12px; border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  text-decoration: none; &:hover { background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : theme.colors.overlayHover}; }
  svg { flex: 0 0 16px; }
`;
const StaticNavItem = styled(NavItem)`
  cursor: default;
  &:hover { background: transparent; }
`;
const Main = styled.main`
  padding: 40px 48px 64px;
  @media (max-width: 700px) { padding: 24px 16px 40px; }
`;
const MainGrid = styled.div`
  display: grid; grid-template-columns: 760px 208px; justify-content: start; align-items: start; gap: 48px;
  max-width: 100%; margin: 0;
  @media (max-width: 1391px) {
    grid-template-columns: minmax(0, 760px);
    gap: 24px;
  }
  @media (max-width: 1150px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const Article = styled.article`display: flex; min-width: 0; flex-direction: column; gap: 24px;`;
const MobileArticle = styled(Article)`
  @media (max-width: 1391px) { grid-row: 2; }
`;
const Breadcrumb = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.faint}; font-size: 12px; line-height: 18px;
`;
const PageHeading = styled.header`display: flex; flex-direction: column; gap: 8px;`;
const Title = styled.h1`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
const Intro = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const LoginNotice = styled.section`
  display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.muted};
  @media (max-width: 600px) { flex-wrap: wrap; }
`;
const NoticeCopy = styled.div`flex: 1; min-width: 0; p { margin: 4px 0 0; font-size: 12px; line-height: 18px; }`;
const NoticeTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const Card = styled.section`
  display: flex; flex-direction: column; gap: 16px; padding: 24px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.surface};
  scroll-margin-top: 20px;
`;
const CardTitle = styled.h2`
  margin: 0; color: ${({ theme }) => theme.colors.text}; font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
const TableWrap = styled.div`overflow-x: auto;`;
const Table = styled.table`
  width: 100%; min-width: 650px; border-collapse: collapse; font-size: 14px; line-height: 22px;
  th, td { padding: 12px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; text-align: left; }
  th { background: ${({ theme }) => theme.colors.raised}; color: ${({ theme }) => theme.colors.faint}; font-size: 12px; line-height: 18px; font-weight: 500; }
  td { color: ${({ theme }) => theme.colors.muted}; }
  td:first-child { color: ${({ theme }) => theme.colors.text}; }
`;
const TimelineItem = styled.div`
  display: flex; align-items: flex-start; gap: 16px; padding: 4px 0 16px; border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { padding-bottom: 0; border: 0; }
`;
const TimelineIcon = styled.span`display: inline-flex; flex: 0 0 20px; color: ${({ theme }) => theme.colors.muted}; padding-top: 1px;`;
const TimelineCopy = styled.div`
  display: flex; flex-direction: column; gap: 4px; color: ${({ theme }) => theme.colors.muted}; font-size: 14px; line-height: 22px;
  strong { color: ${({ theme }) => theme.colors.text}; font-weight: 500; line-height: 20px; }
`;
const FeedbackHead = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 16px;`;
const FeedbackButtons = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;
const FeedbackHint = styled.p`margin: 0; color: ${({ theme }) => theme.colors.muted}; font-size: 12px; line-height: 18px;`;
const FeedbackDialog = styled(Card)`
  width: min(480px, calc(100vw - 32px));
  max-width: 100%;
  p { margin: 0; }
  ${FeedbackButtons} { justify-content: flex-end; }
`;
const Toc = styled.nav`
  position: sticky; top: 24px; display: flex; flex-direction: column; gap: 12px;
  @media (max-width: 1391px) {
    position: static;
    grid-row: 1;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
`;
const TocLabel = styled.p`margin: 0 0 0; color: ${({ theme }) => theme.colors.faint}; font-size: 12px; line-height: 18px;`;
const TocLink = styled.a<{ $active?: boolean }>`
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted}; font-size: 14px; line-height: 22px; text-decoration: none;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

type DocsArticle = 'policy' | 'ssh';
type NavEntry = { label: string; icon: OcticonName; article?: DocsArticle };
const groups: { label: string; items: NavEntry[] }[] = [
  { label: '시작하기', items: [{ label: 'VM 만들기', icon: 'server' }, { label: 'SSH로 접속하기', icon: 'terminal', article: 'ssh' }] },
  { label: '정책', items: [{ label: '사용 기간과 연장', icon: 'calendar', article: 'policy' }, { label: '할당량', icon: 'cpu' }, { label: '팀으로 사용하기', icon: 'people' }] },
  { label: 'Serverless', items: [{ label: '함수 만들기', icon: 'zap' }, { label: '호출 주소 인증하기', icon: 'shield' }, { label: '실행 사이 상태 저장', icon: 'history' }] },
  { label: 'Database', items: [{ label: '이름에 따옴표 쓰기', icon: 'database' }, { label: 'SSH 터널로 접속하기', icon: 'database' }, { label: '용량 줄이기', icon: 'database' }] },
  { label: 'Apps', items: [{ label: '파일 저장과 볼륨', icon: 'upload' }] },
  { label: '도움', items: [{ label: '자주 묻는 질문', icon: 'question' }, { label: '문의하기', icon: 'comment-discussion' }] },
];

const sshSections = [
  { id: 'ssh-steps', label: '접속 순서' },
  { id: 'ssh-faq', label: '연결이 되지 않으면' },
];

const sections = [
  { id: 'overview', label: '사용 기간 한눈에 보기' },
  { id: 'expiration', label: '만료되면 어떻게 됩니까?' },
  { id: 'feedback', label: '도움이 됐습니까?' },
];

const articleTitle = 'VM 사용 기간과 연장';
const articleUrl = '/docs#expiration';
const inquiryDraftKey = 'docs.inquiryDraft';

function personalVm() {
  return getDemoVmState().vms.find(vm => vm.owner === 'personal' && vm.status !== 'queued');
}

export default function PublicDocsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const demoMode = isDemoMode();
  const session = demoMode ? getSessionUser() : null;
  const profile = demoMode ? getDemoProfile() : null;
  const signedIn = Boolean(session && !profile?.signedOut);
  const resumeInquiry = demoMode && new URLSearchParams(location.search).get('inquiry') === '1';
  const [vm, setVm] = useState<DemoVm | undefined>(() => signedIn ? personalVm() : undefined);
  const [extensionMessage, setExtensionMessage] = useState('');
  const [inquiryOpen, setInquiryOpen] = useState(resumeInquiry);
  const [inquiryDraft, setInquiryDraft] = useState(() => resumeInquiry ? readDemoState(inquiryDraftKey, '') : '');
  const [inquiryError, setInquiryError] = useState('');
  const daysRemaining = vm ? getDemoVmDaysRemaining(vm.expiresAt) : undefined;
  const canExtend = daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining >= -3;
  const vmExtension = useDemoVmExtension({
    onStateChange: state => setVm(state.vms.find(item => item.id === vm?.id)),
    onExtended: item => setExtensionMessage(`${item.name} 사용 기간을 14일 연장했습니다.`),
    onError: setExtensionMessage,
  });
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [activeSection, setActiveSection] = useState(() => window.location.hash.slice(1) || 'overview');
  const [article, setArticle] = useState<DocsArticle>(() => sshSections.some(section => section.id === window.location.hash.slice(1)) ? 'ssh' : 'policy');
  const tocSections = article === 'ssh' ? sshSections : sections;
  const query = search.trim().toLocaleLowerCase();
  useEffect(() => {
    const initialHash = window.location.hash.slice(1);
    if (sections.some(section => section.id === initialHash)) {
      requestAnimationFrame(() => document.getElementById(initialHash)?.scrollIntoView({ block: 'start' }));
    }
    const updateSection = () => setActiveSection(window.location.hash.slice(1) || 'overview');
    window.addEventListener('hashchange', updateSection);
    return () => window.removeEventListener('hashchange', updateSection);
  }, []);
  const visibleGroups = useMemo(() => groups.map(group => ({
    ...group,
    items: group.items.filter(item => !query || (item.article && `${group.label} ${item.label}`.toLocaleLowerCase().includes(query))),
  })).filter(group => group.items.length > 0), [query]);

  function signIn(returnTo = `/docs${location.hash}`) {
    if (!demoMode) { startDataGsmLogin(); return; }
    void navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  function dismissInquiry() {
    setInquiryOpen(false);
    setInquiryError('');
    if (resumeInquiry) void navigate('/docs#feedback', { replace: true });
  }

  function submitInquiry() {
    const message = inquiryDraft.trim();
    if (!message || message.length > 500) {
      setInquiryError('문의 내용은 1~500자로 입력해 주세요.');
      return;
    }
    if (!signedIn || !session) {
      if (writeDemoState(inquiryDraftKey, message)) signIn('/docs?inquiry=1#feedback');
      else setInquiryError('문의 초안을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    const item: Inquiry = {
      id: `inquiry-${crypto.randomUUID()}`,
      title: message.length > 48 ? `${message.slice(0, 48)}…` : message,
      author: profile?.name ?? session.name,
      studentId: profile ? `${profile.grade}${profile.classNumber}${String(profile.studentNumber).padStart(2, '0')}` : '—',
      createdAt: new Date().toISOString().slice(0, 16).replaceAll('-', '.').replace('T', ' '),
      vmName: '',
      content: message,
      source: { title: articleTitle, url: articleUrl },
      reply: '',
      status: '대기 중',
      isMine: true,
    };
    if (!saveDemoInquiries([item, ...getDemoInquiries()])) {
      setInquiryError('문의를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    writeDemoState(inquiryDraftKey, '');
    void navigate('/support/inquiries', { replace: true });
  }

  return (
    <Screen>
      <Header>
        <HeaderLeft>
          <Brand href="/" aria-label="GSM SV 홈"><BrandLogo src="/assets/gsmsv-logo.svg" alt="" /><BrandName>GSM SV</BrandName></Brand>
          <HeaderNav aria-label="공개 페이지">
            <HeaderLink href="/docs" $active aria-current="page">Docs</HeaderLink>
            <HeaderLink href="/status">서비스 상태</HeaderLink>
          </HeaderNav>
        </HeaderLeft>
        <Button variant="primary" onClick={() => signedIn ? navigate('/') : signIn()} icon={<Octicon name={signedIn ? 'arrow-right' : 'sign-in'} size={16} />}>{signedIn ? 'GSM SV 열기' : 'DataGSM으로 로그인'}</Button>
      </Header>
      <Layout>
        <Sidebar>
          <SearchLabel htmlFor="docs-search">Docs 검색</SearchLabel>
          <SearchInput id="docs-search" type="search" placeholder="검색어를 입력하세요" value={search} onChange={event => setSearch(event.target.value)} />
          <NavGroups aria-label="Docs 탐색">
            {visibleGroups.length === 0 && <GroupLabel role="status">검색 결과가 없습니다.</GroupLabel>}
            {visibleGroups.map(group => <NavGroup key={group.label}>
              <GroupLabel>{group.label}</GroupLabel>
              {group.items.map(item => item.article
                ? <NavItem
                    href={item.article === 'ssh' ? '#ssh-steps' : '#overview'}
                    key={item.label}
                    $active={item.article === article}
                    aria-current={item.article === article ? 'page' : undefined}
                    onClick={() => {
                      setSearch('');
                      setArticle(item.article ?? 'policy');
                      setActiveSection(item.article === 'ssh' ? 'ssh-steps' : 'overview');
                    }}
                  >
                    <Octicon name={item.icon} size={16} aria-hidden="true" />{item.label}
                  </NavItem>
                : <StaticNavItem as="span" key={item.label} aria-disabled="true">
                    <Octicon name={item.icon} size={16} aria-hidden="true" />{item.label}
                  </StaticNavItem>)}
            </NavGroup>)}
          </NavGroups>
        </Sidebar>
        <Main>
          <MainGrid>
            {article === 'ssh' ? <MobileArticle>
              <Breadcrumb>Docs / 시작하기</Breadcrumb>
              <PageHeading>
                <Title>SSH로 접속하기</Title>
                <Intro>Instance 개요에서 내 접속 명령을 복사하면 빠르게 시작할 수 있습니다. 먼저 VM이 실행 중인지 확인하세요.</Intro>
              </PageHeading>
              <Card id="ssh-steps">
                <CardTitle>접속 순서</CardTitle>
                <TimelineItem><TimelineIcon><Octicon name="clock" size={20} /></TimelineIcon><TimelineCopy><strong>1. 초기 설정이 끝날 때까지 기다리세요</strong><span>설정 중 배지가 사라지면 SSH 계정을 사용할 수 있습니다. 보통 약 3분이 걸립니다.</span></TimelineCopy></TimelineItem>
                <TimelineItem><TimelineIcon><Octicon name="copy" size={20} /></TimelineIcon><TimelineCopy><strong>2. 개요의 SSH 명령을 복사하세요</strong><span>외부 SSH 포트는 VM마다 다릅니다. 개요에 표시되는 현재 포트로 접속하세요.</span></TimelineCopy></TimelineItem>
                <TimelineItem><TimelineIcon><Octicon name="terminal" size={20} /></TimelineIcon><TimelineCopy><strong>3. 터미널에서 실행하고 인증하세요</strong><span>비밀번호 또는 등록한 SSH 키를 사용해 접속하세요.</span></TimelineCopy></TimelineItem>
              </Card>
              <Card id="ssh-faq">
                <CardTitle>연결이 되지 않으면</CardTitle>
                <TimelineItem><TimelineIcon><Octicon name="question" size={20} /></TimelineIcon><TimelineCopy><strong>SSH 연결이 되지 않습니다</strong><span>VM 상태와 SSH 기본 포트가 있는지 확인하세요. 포트가 없다면 Network에서 기본 포트를 복원하세요.</span></TimelineCopy></TimelineItem>
                <TimelineItem><TimelineIcon><Octicon name="question" size={20} /></TimelineIcon><TimelineCopy><strong>기간을 연장하면 VM이 자동으로 시작됩니까?</strong><span>만료 후 연장한 VM은 시작 버튼을 눌러 다시 실행해야 합니다.</span></TimelineCopy></TimelineItem>
              </Card>
            </MobileArticle> : <MobileArticle>
              <Breadcrumb>Docs / 정책</Breadcrumb>
              <PageHeading>
                <Title>VM 사용 기간과 연장</Title>
                <Intro>개인 VM과 팀 VM의 첫 사용 기간, 연장 방법, 만료 후 처리를 설명합니다. 2026.09.30 수정</Intro>
              </PageHeading>
              {signedIn ? <LoginNotice>
                <Octicon name="person" size={16} aria-hidden="true" />
                <NoticeCopy>
                  <NoticeTitle>내 VM 사용 기간</NoticeTitle>
                  <p>{vm ? `· ${vm.name} · 만료 ${vm.expiresAt}` : '사용 기간을 확인할 개인 VM이 없습니다.'}</p>
                  {canExtend && <p>· 지금 14일 연장할 수 있습니다</p>}
                  {extensionMessage && <p role="status">{extensionMessage}</p>}
                </NoticeCopy>
                {vm && <FeedbackButtons>
                  <Button variant="secondary" onClick={() => navigate(`/vms/${encodeURIComponent(vm.id)}`)}>VM 열기</Button>
                  <Button disabled={!canExtend} onClick={() => void vmExtension.extend(vm.id)}>연장하기</Button>
                </FeedbackButtons>}
              </LoginNotice> : <LoginNotice>
                <Octicon name="person" size={16} aria-hidden="true" />
                <NoticeCopy><NoticeTitle>로그인하면 내 VM의 만료일을 여기서 바로 볼 수 있습니다</NoticeTitle><p>이 문서는 로그인 없이 볼 수 있습니다. 로그인하면 이 자리에 내 VM의 만료일과 연장 버튼이 나옵니다.</p></NoticeCopy>
                <Button variant="primary" onClick={() => signIn()} icon={<Octicon name="sign-in" size={16} />}>DataGSM으로 로그인</Button>
              </LoginNotice>}
              <Card id="overview">
                <CardTitle>사용 기간 한눈에 보기</CardTitle>
                <TableWrap><Table><thead><tr><th>항목</th><th>개인 VM</th><th>팀 VM</th></tr></thead>
                  <tbody>
                    <tr><td>첫 사용 기간</td><td>생성 완료부터 7일</td><td>생성 완료부터 30일</td></tr>
                    <tr><td>연장 가능 시점</td><td>만료 7일 전부터</td><td>만료 7일 전부터</td></tr>
                    <tr><td>한 번 연장하면</td><td>기존 만료일 + 14일</td><td>기존 만료일 + 14일</td></tr>
                    <tr><td>연장할 수 있는 사람</td><td>VM 소유자</td><td>팀장 · DevOps · 일반 팀원</td></tr>
                    <tr><td>연장할 때</td><td>사용 목적을 다시 확인합니다</td><td>사용 목적을 다시 확인합니다</td></tr>
                  </tbody></Table></TableWrap>
              </Card>
              <Card id="expiration">
                <CardTitle>만료되면 어떻게 됩니까?</CardTitle>
                <TimelineItem><TimelineIcon><Octicon name="bell" size={20} /></TimelineIcon><TimelineCopy><strong>만료 3일 전부터</strong><span>매일 09:00에 알림을 보내고 VM 화면에 경고 배너를 띄웁니다.</span></TimelineCopy></TimelineItem>
                <TimelineItem><TimelineIcon><Octicon name="stop" size={20} /></TimelineIcon><TimelineCopy><strong>만료 시각</strong><span>VM을 정상 종료합니다. 2분 안에 꺼지지 않으면 강제로 정지합니다.</span></TimelineCopy></TimelineItem>
                <TimelineItem><TimelineIcon><Octicon name="clock" size={20} /></TimelineIcon><TimelineCopy><strong>정지 후 3일</strong><span>이 기간에 연장하면 삭제 예약이 취소됩니다. 연장한 뒤 「시작」으로 다시 켭니다.</span></TimelineCopy></TimelineItem>
                <TimelineItem><TimelineIcon><Octicon name="trashcan" size={20} /></TimelineIcon><TimelineCopy><strong>만료 3일 후</strong><span>VM, Snapshot, 외부 접속 포트, HTTPS Domain이 함께 삭제됩니다. 삭제 예고와 자동 삭제는 이메일과 Discord로도 알립니다.</span></TimelineCopy></TimelineItem>
              </Card>
              <Card id="feedback">
                <FeedbackHead><CardTitle>도움이 됐습니까?</CardTitle><FeedbackButtons>
                  <Button variant="secondary" aria-pressed={feedback === 'yes'} onClick={() => setFeedback('yes')} icon={<Octicon name="check" size={16} />}>예</Button>
                  <Button variant="secondary" aria-pressed={feedback === 'no'} onClick={() => {
                    setFeedback('no');
                    if (demoMode) setInquiryOpen(true);
                  }} icon={<Octicon name="x" size={16} />}>아니요</Button>
                </FeedbackButtons></FeedbackHead>
                <FeedbackHint aria-live="polite">{feedback === 'yes' ? '도움이 되었다는 응답을 이 화면에 표시했습니다.' : demoMode ? '「아니요」를 누르면 이 문서 링크가 첨부된 문의를 작성할 수 있습니다. 문의는 로그인한 뒤 보낼 수 있습니다.' : feedback === 'no' ? '문의 작성 기능은 아직 제공되지 않습니다. 이 응답은 이 화면에서만 표시되며 전송되지 않았습니다.' : '「아니요」를 눌러 의견을 표시할 수 있습니다. 문의 작성 기능은 아직 제공되지 않습니다.'}</FeedbackHint>
              </Card>
            </MobileArticle>}
            <Toc aria-label="이 문서에서"><TocLabel>이 문서에서</TocLabel>{tocSections.map(section => <TocLink key={section.id} href={`#${section.id}`} $active={activeSection === section.id} onClick={() => setActiveSection(section.id)}>{section.label}</TocLink>)}</Toc>
          </MainGrid>
        </Main>
      </Layout>
      {demoMode && inquiryOpen && <ModalSurface labelledBy="docs-inquiry-title" onDismiss={dismissInquiry}>
        <FeedbackDialog>
          <CardTitle id="docs-inquiry-title">문서가 도움이 되지 않았습니까?</CardTitle>
          <p>보던 문서 링크를 함께 보냅니다. 어떤 점이 헷갈렸는지 알려주세요.</p>
          <TextField label="첨부된 문서" readOnly value={articleTitle} />
          <TextareaField label="문의 내용" maxLength={500} value={inquiryDraft} error={inquiryError} onChange={event => {
            setInquiryDraft(event.currentTarget.value);
            setInquiryError('');
          }} placeholder="연장 가능 시점이 헷갈립니다." />
          <FeedbackButtons>
            <Button variant="secondary" onClick={dismissInquiry}>취소</Button>
            <Button onClick={submitInquiry}>문의 보내기</Button>
          </FeedbackButtons>
        </FeedbackDialog>
      </ModalSurface>}
      {demoMode && vmExtension.confirmation && <DemoVmExtensionDialog
        key={vmExtension.confirmation.extensionCount}
        initialPurpose={vmExtension.confirmation.purpose}
        extensionCount={vmExtension.confirmation.extensionCount}
        error={vmExtension.error}
        onConfirm={vmExtension.confirm}
        onDismiss={vmExtension.dismiss}
      />}
    </Screen>
  );
}

import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { startDataGsmLogin } from '../../features/auth/start-login/model/startDataGsmLogin';
import { Button } from '../../shared/ui/controls';
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

type NavEntry = { label: string; icon: OcticonName; active?: boolean };
const groups: { label: string; items: NavEntry[] }[] = [
  { label: '시작하기', items: [{ label: 'VM 만들기', icon: 'server' }, { label: 'SSH로 접속하기', icon: 'terminal' }] },
  { label: '정책', items: [{ label: '사용 기간과 연장', icon: 'calendar', active: true }, { label: '할당량', icon: 'cpu' }, { label: '팀으로 사용하기', icon: 'people' }] },
  { label: 'Serverless', items: [{ label: '함수 만들기', icon: 'zap' }, { label: '호출 주소 인증하기', icon: 'shield' }, { label: '실행 사이 상태 저장', icon: 'history' }] },
  { label: 'Database', items: [{ label: '이름에 따옴표 쓰기', icon: 'database' }, { label: 'SSH 터널로 접속하기', icon: 'database' }, { label: '용량 줄이기', icon: 'database' }] },
  { label: 'Apps', items: [{ label: '파일 저장과 볼륨', icon: 'upload' }] },
  { label: '도움', items: [{ label: '자주 묻는 질문', icon: 'question' }, { label: '문의하기', icon: 'comment-discussion' }] },
];

const sections = [
  { id: 'overview', label: '사용 기간 한눈에 보기' },
  { id: 'expiration', label: '만료되면 어떻게 됩니까?' },
  { id: 'feedback', label: '도움이 됐습니까?' },
];

export default function PublicDocsPage() {
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [activeSection, setActiveSection] = useState(() => window.location.hash.slice(1) || 'overview');
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
    items: group.items.filter(item => !query || (item.active && `${group.label} ${item.label}`.toLocaleLowerCase().includes(query))),
  })).filter(group => group.items.length > 0), [query]);

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
        <Button variant="primary" onClick={startDataGsmLogin} icon={<Octicon name="sign-in" size={16} />}>DataGSM으로 로그인</Button>
      </Header>
      <Layout>
        <Sidebar>
          <SearchLabel htmlFor="docs-search">Docs 검색</SearchLabel>
          <SearchInput id="docs-search" type="search" placeholder="검색어를 입력하세요" value={search} onChange={event => setSearch(event.target.value)} />
          <NavGroups aria-label="Docs 탐색">
            {visibleGroups.length === 0 && <GroupLabel role="status">검색 결과가 없습니다.</GroupLabel>}
            {visibleGroups.map(group => <NavGroup key={group.label}>
              <GroupLabel>{group.label}</GroupLabel>
              {group.items.map(item => item.active
                ? <NavItem href="#overview" key={item.label} $active aria-current="page" onClick={() => setSearch('')}>
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
            <MobileArticle>
              <Breadcrumb>Docs / 정책</Breadcrumb>
              <PageHeading>
                <Title>VM 사용 기간과 연장</Title>
                <Intro>개인 VM과 팀 VM의 첫 사용 기간, 연장 방법, 만료 후 처리를 설명합니다. 2026.09.30 수정</Intro>
              </PageHeading>
              <LoginNotice>
                <Octicon name="person" size={16} aria-hidden="true" />
                <NoticeCopy><NoticeTitle>로그인 후 리소스 화면으로 이동합니다</NoticeTitle><p>이 문서는 로그인 없이 VM 사용 기간과 연장 정책을 확인할 수 있습니다.</p></NoticeCopy>
                <Button variant="primary" onClick={startDataGsmLogin} icon={<Octicon name="sign-in" size={16} />}>DataGSM으로 로그인</Button>
              </LoginNotice>
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
                  <Button variant="secondary" aria-pressed={feedback === 'no'} onClick={() => setFeedback('no')} icon={<Octicon name="x" size={16} />}>아니요</Button>
                </FeedbackButtons></FeedbackHead>
                <FeedbackHint aria-live="polite">{feedback === 'yes' ? '도움이 되었다는 응답을 이 화면에 표시했습니다.' : feedback === 'no' ? '문의 작성 기능은 아직 제공되지 않습니다. 이 응답은 이 화면에서만 표시되며 전송되지 않았습니다.' : '「아니요」를 눌러 의견을 표시할 수 있습니다. 문의 작성 기능은 아직 제공되지 않습니다.'}</FeedbackHint>
              </Card>
            </MobileArticle>
            <Toc aria-label="이 문서에서"><TocLabel>이 문서에서</TocLabel>{sections.map(section => <TocLink key={section.id} href={`#${section.id}`} $active={activeSection === section.id} onClick={() => setActiveSection(section.id)}>{section.label}</TocLink>)}</Toc>
          </MainGrid>
        </Main>
      </Layout>
    </Screen>
  );
}

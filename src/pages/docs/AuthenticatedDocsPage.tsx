import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { ApiRequestError } from '../../shared/api';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon, type OcticonName } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 700px) {
    padding: 24px 16px 40px;
  }
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

const Intro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const TopicBar = styled.nav`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Topic = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  border: 0;
  cursor: pointer;
  min-height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  text-decoration: none;
  &:hover { background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : theme.colors.overlayHover}; }
`;

const TopicAction = styled.div`
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  margin-left: auto;
  padding-left: 8px;
`;

const InfoBanner = styled.section`
  display: flex;
  min-height: 82px;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.primarySoft};
`;

const BannerIcon = styled.span`
  display: inline-flex;
  flex: 0 0 16px;
  color: ${({ theme }) => theme.colors.primary};
`;

const BannerCopy = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`;

const BannerTitle = styled.strong`
  color: ${({ theme }) => theme.colors.primary};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const BannerDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  scroll-margin-top: 24px;
`;

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Steps = styled.ol`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Step = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:first-child { padding-top: 0; }
  &:last-child { padding-bottom: 16px; }
`;

const StepIcon = styled.span`
  display: inline-flex;
  flex: 0 0 20px;
  justify-content: center;
  padding-top: 1px;
  color: ${({ theme }) => theme.colors.muted};
`;

const StepCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  strong { color: ${({ theme }) => theme.colors.text}; font-weight: 500; }
`;

const FaqList = styled.div`
  display: flex;
  flex-direction: column;
`;

const FaqItem = styled.details`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: 0; }
`;

const FaqQuestion = styled.summary`
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  cursor: pointer;
  list-style: none;
  &::-webkit-details-marker { display: none; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: -2px; }
  svg { flex: 0 0 16px; transition: transform 120ms ease; }
  details[open] & svg { transform: rotate(180deg); }
`;

const FaqAnswer = styled.p`
  margin: 0 32px 10px 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const FeedbackHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const FeedbackBody = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  svg { flex: 0 0 16px; }
`;

const FeedbackActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

const FeedbackMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };
type DocsStep = { icon: OcticonName; title: string; description: string };
type DocsTopic = { id: string; label: string; icon: OcticonName; title: string; description: string; stepsTitle: string; steps: DocsStep[] };

const docsTopics: DocsTopic[] = [
  {
    id: 'start', label: '시작하기', icon: 'home', title: 'GSM SV 시작하기', stepsTitle: '시작 순서',
    description: '학교 계정으로 로그인하면 개인 VM과 Serverless 함수를 바로 만들 수 있습니다.',
    steps: [
      { icon: 'sign-in', title: '1. DataGSM으로 로그인하세요', description: '재학생은 첫 로그인 시 일반 계정이 자동으로 만들어집니다.' },
      { icon: 'plus', title: '2. 첫 VM이나 함수를 만드세요', description: '홈의 VM 만들기 또는 함수 만들기에서 시작할 수 있습니다.' },
      { icon: 'calendar', title: '3. 사용 기간을 확인하세요', description: '일반 사용자 VM은 생성 7일 뒤 만료되며, 만료 7일 전부터 14일씩 연장할 수 있습니다.' },
    ],
  },
  {
    id: 'instance', label: 'Instance', icon: 'server', title: 'VM 관리하기', stepsTitle: '관리 순서',
    description: 'VM 개요에서 상태와 접속 정보, 남은 사용 기간을 확인하고 전원을 관리합니다.',
    steps: [
      { icon: 'pulse', title: '1. 개요에서 상태를 확인하세요', description: '실행 중·중지됨·설정 중 상태와 남은 사용 기간이 표시됩니다.' },
      { icon: 'play', title: '2. 전원을 관리하세요', description: '시작·재시작·종료는 이전 작업이 끝난 뒤에 할 수 있습니다.' },
      { icon: 'calendar', title: '3. 만료 전에 연장하세요', description: '만료 7일 전부터 사용 목적을 다시 확인하고 14일씩 연장할 수 있습니다.' },
    ],
  },
  {
    id: 'connection', label: '접속방법', icon: 'terminal', title: 'VM에 SSH로 접속하기', stepsTitle: '접속 순서',
    description: 'Instance 개요에서 내 접속 명령을 복사하면 빠르게 시작할 수 있습니다. 먼저 VM이 실행 중인지 확인하세요.',
    steps: [
      { icon: 'clock', title: '1. 초기 설정이 끝날 때까지 기다리세요', description: '설정 중 배지가 사라지면 SSH 계정을 사용할 수 있습니다. 보통 약 3분이 걸립니다.' },
      { icon: 'copy', title: '2. 개요의 SSH 명령을 복사하세요', description: '외부 SSH 포트는 VM마다 다릅니다. 개요에 표시되는 현재 포트로 접속하세요.' },
      { icon: 'terminal', title: '3. 터미널에서 실행하고 인증하세요', description: '비밀번호 또는 등록한 SSH 키를 사용해 접속하세요.' },
    ],
  },
  {
    id: 'ssh-key', label: 'SSH Key 등록', icon: 'key', title: 'SSH 키 등록', stepsTitle: '등록 순서',
    description: '키를 등록해 VM에 편리하게 접속하세요.',
    steps: [
      { icon: 'terminal', title: '1. 터미널에서 키를 만드세요', description: 'ssh-keygen -t ed25519 명령으로 공개 키와 개인 키를 만듭니다.' },
      { icon: 'copy', title: '2. 공개 키를 VM에 추가하세요', description: 'VM에 접속한 뒤 ~/.ssh/authorized_keys에 공개 키를 붙여 넣습니다.' },
      { icon: 'key', title: '3. 키로 접속하세요', description: '개요의 SSH 명령에 -i 옵션으로 개인 키 파일을 지정합니다.' },
    ],
  },
  {
    id: 'network', label: 'Public IP / GPU', icon: 'globe', title: 'Public IP와 GPU', stepsTitle: '외부 공개 순서',
    description: 'VM은 학교 Network 안에서 실행됩니다. 외부 접속은 VM Network의 포트와 HTTPS Domain으로 엽니다.',
    steps: [
      { icon: 'link', title: '1. 외부 접속 포트를 여세요', description: 'VM Network에서 포트를 추가하면 외부 포트가 배정됩니다.' },
      { icon: 'globe', title: '2. HTTPS Domain을 연결하세요', description: '웹 서비스는 Domain을 연결해 HTTPS로 공개할 수 있습니다.' },
      { icon: 'cpu', title: '3. GPU가 필요하면 문의하세요', description: 'GPU VM은 기본으로 제공하지 않습니다. 사용 목적과 함께 문의를 남겨주세요.' },
    ],
  },
  {
    id: 'docker', label: 'Docker', icon: 'file-code', title: 'VM에서 Docker 쓰기', stepsTitle: '실행 순서',
    description: 'Ubuntu VM에 Docker를 설치하면 컨테이너로 서비스를 실행할 수 있습니다.',
    steps: [
      { icon: 'download', title: '1. Docker를 설치하세요', description: '공식 apt 저장소를 추가하고 Docker Engine을 설치합니다.' },
      { icon: 'play', title: '2. 컨테이너를 실행하세요', description: 'docker run -p 옵션으로 컨테이너 포트를 VM 포트에 연결합니다.' },
      { icon: 'link', title: '3. 포트를 외부에 여세요', description: 'VM Network에 같은 포트를 추가해야 외부에서 접속할 수 있습니다.' },
    ],
  },
  {
    id: 'database', label: 'Database', icon: 'database', title: 'Database 발급과 접속', stepsTitle: '사용 순서',
    description: 'VM에 설치하지 않고 바로 쓰는 MySQL입니다.',
    steps: [
      { icon: 'plus', title: '1. Database를 발급하세요', description: 'Database 화면에서 이름을 정하고 발급합니다.' },
      { icon: 'key', title: '2. 접속 정보를 확인하세요', description: '상세 화면에서 호스트, 포트, 사용자와 비밀번호를 확인합니다.' },
      { icon: 'graph', title: '3. 용량을 관리하세요', description: '용량을 80% 넘게 쓰면 알림을 보내고, 가득 차면 쓰기가 막힙니다.' },
    ],
  },
  {
    id: 'serverless', label: 'Serverless', icon: 'zap', title: 'Serverless 함수', stepsTitle: '사용 순서',
    description: 'HTTP 요청이나 정해진 시간에 JavaScript·TypeScript 함수를 실행하세요.',
    steps: [
      { icon: 'code', title: '1. 함수를 만드세요', description: '런타임을 고르고 코드를 작성합니다.' },
      { icon: 'link', title: '2. 트리거를 연결하세요', description: 'HTTP 호출 주소나 실행 일정을 연결합니다.' },
      { icon: 'history', title: '3. 실행 Log를 확인하세요', description: '테스트 실행 결과와 실행 Log에서 오류를 확인합니다.' },
    ],
  },
  {
    id: 'apps', label: 'Apps', icon: 'upload', title: 'Apps 배포', stepsTitle: '배포 순서',
    description: 'GitHub 저장소를 연결하면 빌드해서 띄워 줍니다.',
    steps: [
      { icon: 'link', title: '1. 저장소를 연결하세요', description: '앱 만들기에서 GitHub 저장소와 브랜치를 고릅니다.' },
      { icon: 'gear', title: '2. 서비스를 설정하세요', description: '웹 서비스와 환경 변수를 설정합니다.' },
      { icon: 'sync', title: '3. push하면 다시 배포됩니다', description: 'GitHub에 push하면 자동으로 다시 배포됩니다.' },
    ],
  },
  {
    id: 'team', label: '팀', icon: 'people', title: '팀으로 사용하기', stepsTitle: '사용 순서',
    description: '팀을 만들면 팀 VM과 공유 Resource를 함께 관리할 수 있습니다.',
    steps: [
      { icon: 'people', title: '1. 팀을 만드세요', description: '팀 만들기에서 신청하면 관리자가 확인한 뒤 승인합니다.' },
      { icon: 'person', title: '2. 팀원을 초대하세요', description: '팀 설정에서 이메일로 초대하고 역할을 정합니다.' },
      { icon: 'shield', title: '3. 역할을 확인하세요', description: '팀장과 DevOps 엔지니어는 팀 VM을 만들고 관리할 수 있습니다.' },
    ],
  },
];
const navigationPaths: Partial<Record<StudentNavigationKey, string>> = {
  home: '/',
  database: '/databases',
  apps: '/apps',
  team: '/teams',
  settings: '/settings',
};

export default function AuthenticatedDocsPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const demoMode = isDemoMode();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [topicId, setTopicId] = useState(() => {
    const hash = window.location.hash.slice(1);
    return docsTopics.some(topic => topic.id === hash) ? hash : 'connection';
  });
  const topic = docsTopics.find(item => item.id === topicId) ?? docsTopics[2];

  useEffect(() => {
    const controller = new AbortController();
    if (demoMode) {
      void import('../../entities/team/demo').then(({ listDemoTeams }) => {
        if (!controller.signal.aborted) setTeams(listDemoTeams());
      }).catch(() => {
        if (!controller.signal.aborted) setTeams([]);
      });
      return () => controller.abort();
    }
    void listMyTeams(controller.signal).then(result => {
      if (!controller.signal.aborted) setTeams(result);
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiRequestError && error.status === 401) {
        void navigate('/login', { replace: true });
        return;
      }
      setTeams([]);
    });
    return () => controller.abort();
  }, [demoMode, navigate]);

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (sectionId === 'faq' || docsTopics.some(item => item.id === sectionId)) {
      requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ block: 'start' }));
    }
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

  const onNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const path = navigationPaths[item];
    if (path) void navigate(path);

    return Boolean(path);
  };

  return (
    <StudentShell
      activeItem="docs"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      disabledNavigationItems={demoMode ? [] : ['vm-create', 'serverless', 'support']}
      sidebarActionsAtBottom={false}
      showTopbarDivider
      userName={user?.name ?? '사용자'}
      onNavigate={onNavigate}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <Page>
        <Breadcrumb>Docs</Breadcrumb>
        <TitleBlock>
          <Title>Docs</Title>
          <Intro>처음 만드는 VM부터 SSH 접속까지, 필요한 내용을 찾아보세요.</Intro>
        </TitleBlock>
        <TopicBar aria-label="Docs 주제">
          {docsTopics.map(item => <Topic
            key={item.id}
            type="button"
            $active={item.id === topic.id}
            aria-current={item.id === topic.id ? 'page' : undefined}
            onClick={() => {
              setTopicId(item.id);
              window.history.replaceState(window.history.state, '', `#${item.id}`);
            }}
          >{item.label}</Topic>)}
          <Topic as="a" href="#faq">FAQ</Topic>
          <TopicAction>
            <Button variant="secondary" disabled={!demoMode} title={!demoMode ? '문의 기능은 로컬 미리보기에서 확인할 수 있습니다.' : undefined} onClick={() => navigate('/support/inquiries')} icon={<Octicon name="comment-discussion" size={16} />}>문의하기</Button>
          </TopicAction>
        </TopicBar>

        <InfoBanner id={topic.id}>
          <BannerIcon><Octicon name={topic.icon} size={16} aria-hidden="true" /></BannerIcon>
          <BannerCopy>
            <BannerTitle>{topic.title}</BannerTitle>
            <BannerDescription>{topic.description}</BannerDescription>
          </BannerCopy>
          <Button variant="secondary" onClick={() => navigate('/')} icon={<Octicon name="server" size={16} />}>내 Resources 보기</Button>
        </InfoBanner>

        <Card aria-labelledby="topic-steps-title">
          <CardTitle id="topic-steps-title">{topic.stepsTitle}</CardTitle>
          <Steps>
            {topic.steps.map(step => <Step key={step.title}>
              <StepIcon><Octicon name={step.icon} size={20} aria-hidden="true" /></StepIcon>
              <StepCopy><strong>{step.title}</strong><span>{step.description}</span></StepCopy>
            </Step>)}
          </Steps>
        </Card>

        <Card id="faq" aria-labelledby="faq-title">
          <CardTitle id="faq-title">자주 묻는 질문</CardTitle>
          <FaqList>
            <FaqItem open>
              <FaqQuestion>SSH 연결이 되지 않습니다<Octicon name="chevron-down" size={16} aria-hidden="true" /></FaqQuestion>
              <FaqAnswer>VM 상태와 SSH 기본 포트가 있는지 확인하세요. 포트가 없다면 Network에서 기본 포트를 복원하세요.</FaqAnswer>
            </FaqItem>
            <FaqItem open>
              <FaqQuestion>기간을 연장하면 VM이 자동으로 시작됩니까?<Octicon name="chevron-down" size={16} aria-hidden="true" /></FaqQuestion>
              <FaqAnswer>만료 후 연장한 VM은 시작 버튼을 눌러 다시 실행해야 합니다.</FaqAnswer>
            </FaqItem>
          </FaqList>
        </Card>

        <Card aria-labelledby="feedback-title">
          <FeedbackHeader>
            <CardTitle id="feedback-title">문제가 해결됐습니까?</CardTitle>
            <Button variant="ghost" disabled={!demoMode} title={!demoMode ? '문의 기능은 로컬 미리보기에서 확인할 수 있습니다.' : undefined} onClick={() => navigate('/support/inquiries')} icon={<Octicon name="comment-discussion" size={16} />}>문의하기</Button>
          </FeedbackHeader>
          <FeedbackBody>
            <Octicon name="question" size={16} aria-hidden="true" />
            <span>Docs를 확인해도 해결되지 않는 문제가 있다면 문의를 남겨주세요.<br />답변이 등록되면 알림으로 알려드립니다.</span>
          </FeedbackBody>
          <FeedbackActions>
            <Button variant="secondary" aria-pressed={feedback === 'yes'} onClick={() => setFeedback('yes')} icon={<Octicon name="check" size={16} />}>도움이 됐습니다</Button>
            <Button variant="secondary" aria-pressed={feedback === 'no'} onClick={() => setFeedback('no')} icon={<Octicon name="question" size={16} />}>아직 어렵습니다</Button>
          </FeedbackActions>
          {feedback && <FeedbackMessage role="status" aria-live="polite">이 응답은 화면에만 표시되며 전송되지 않습니다.</FeedbackMessage>}
        </Card>
      </Page>
    </StudentShell>
  );
}

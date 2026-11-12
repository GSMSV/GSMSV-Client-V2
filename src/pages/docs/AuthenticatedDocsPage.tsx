import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { ApiRequestError } from '../../shared/api';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

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

const Topic = styled.a<{ $active?: boolean }>`
  display: inline-flex;
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

const UnavailableTopic = styled.span`
  display: inline-flex;
  min-height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  opacity: 0.72;
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
const unsupportedTopics = ['시작하기', 'Instance', 'SSH Key 등록', 'Public IP / GPU', 'Docker', 'Database', 'Serverless', 'Apps', '팀'];
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
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    const controller = new AbortController();
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
  }, [navigate]);

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (sectionId === 'connection' || sectionId === 'faq') {
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
  };

  return (
    <StudentShell
      activeItem="docs"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      disabledNavigationItems={['vm-create', 'serverless', 'support']}
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
          {unsupportedTopics.slice(0, 2).map(topic => <UnavailableTopic key={topic} aria-disabled="true" title="이 문서는 아직 제공되지 않습니다">{topic}</UnavailableTopic>)}
          <Topic href="#connection" $active aria-current="page">접속방법</Topic>
          {unsupportedTopics.slice(2).map(topic => <UnavailableTopic key={topic} aria-disabled="true" title="이 문서는 아직 제공되지 않습니다">{topic}</UnavailableTopic>)}
          <Topic href="#faq">FAQ</Topic>
          <TopicAction>
            <Button variant="secondary" disabled title="문의 기능은 아직 제공되지 않습니다" icon={<Octicon name="comment-discussion" size={16} />}>문의하기</Button>
          </TopicAction>
        </TopicBar>

        <InfoBanner id="connection">
          <BannerIcon><Octicon name="terminal" size={16} aria-hidden="true" /></BannerIcon>
          <BannerCopy>
            <BannerTitle>VM에 SSH로 접속하기</BannerTitle>
            <BannerDescription>SSH 접속 전에 VM이 실행 중이고 Network에 SSH 기본 포트가 등록되어 있는지 확인하세요.</BannerDescription>
          </BannerCopy>
          <Button variant="secondary" onClick={() => navigate('/')} icon={<Octicon name="server" size={16} />}>내 Resources 보기</Button>
        </InfoBanner>

        <Card aria-labelledby="connection-steps-title">
          <CardTitle id="connection-steps-title">접속 순서</CardTitle>
          <Steps>
            <Step>
              <StepIcon><Octicon name="clock" size={20} aria-hidden="true" /></StepIcon>
              <StepCopy><strong>1. 초기 설정이 끝날 때까지 기다리세요</strong><span>설정 중 배지가 사라지면 SSH 계정을 사용할 수 있습니다. 보통 약 3분이 걸립니다.</span></StepCopy>
            </Step>
            <Step>
              <StepIcon><Octicon name="copy" size={20} aria-hidden="true" /></StepIcon>
              <StepCopy><strong>2. Network에서 SSH 포트를 확인하세요</strong><span>외부 SSH 포트는 VM마다 다릅니다. 연결하려는 VM의 Network에서 현재 SSH 포트를 확인하세요.</span></StepCopy>
            </Step>
            <Step>
              <StepIcon><Octicon name="terminal" size={20} aria-hidden="true" /></StepIcon>
              <StepCopy><strong>3. 터미널에서 실행하고 인증하세요</strong><span>비밀번호 또는 등록한 SSH 키를 사용해 접속하세요.</span></StepCopy>
            </Step>
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
            <Button variant="ghost" disabled title="문의 기능은 아직 제공되지 않습니다" icon={<Octicon name="comment-discussion" size={16} />}>문의하기</Button>
          </FeedbackHeader>
          <FeedbackBody>
            <Octicon name="question" size={16} aria-hidden="true" />
            <span>문의 기능은 아직 제공되지 않습니다.<br />이 문서와 FAQ에서 접속 방법을 확인할 수 있습니다.</span>
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

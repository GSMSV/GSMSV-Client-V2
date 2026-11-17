import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoDbRequests, saveDemoDbRequests, type DedicatedDatabaseRequest } from '../../entities/demo-workflows';
import { getSessionUser } from '../../entities/session';
import { getDemoTeam } from '../../entities/team/demo';
import { getDemoTeamDedicatedDatabaseQuota } from '../../entities/database/demo';
import { isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Breadcrumb, Card, CardHeader, Field, Heading, Hint, Input, Muted, PageStack, SectionTitle, Select, Subtitle, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.muted};
`;
const PageBreadcrumb = styled(Breadcrumb)`
  margin: 0;
`;
const FieldHint = styled(Hint)`
  margin: 0;
`;
const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
`;
const EngineChoices = styled.div`
  display: flex;
  height: ${({ theme }) => theme.size.control}px;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
`;
const EngineButton = styled.button<{ $selected: boolean }>`
  min-width: 0;
  flex: 1 1 0;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: pointer;
  &:hover:not([aria-pressed='true']) { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 1px; }
`;
const SelectWrap = styled.span`
  position: relative;
  display: block;
  color: ${({ theme }) => theme.colors.muted};
  > svg { position: absolute; top: 50%; right: 16px; transform: translateY(-50%); pointer-events: none; }
`;
const ReasonSelect = styled(Select)`
  appearance: none;
  padding-right: 44px;
`;
const FixedSpec = styled(Input)`
  &:disabled { color: ${({ theme }) => theme.colors.faint}; opacity: 1; -webkit-text-fill-color: ${({ theme }) => theme.colors.faint}; }
`;
const PeriodCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  color: ${({ theme }) => theme.colors.muted};
`;
const PeriodTitle = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
`;
const InfoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.text};
  strong { font: 500 14px/20px ${({ theme }) => theme.typography.body.family}, sans-serif; }
  span { color: ${({ theme }) => theme.colors.muted}; font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif; }
`;

export default function DedicatedDatabaseRequestPage() {
  const navigate = useNavigate();
  const { teamId: routeTeamId } = useParams<{ teamId: string }>();
  const team = getDemoTeam(routeTeamId ?? 'demo-team');
  const teamScopeId = team?.id ?? routeTeamId ?? 'demo-team';
  const teamName = team?.name ?? 'GSM Connect';
  const canRequestDedicatedDatabase = team?.my_role === 'leader' || team?.my_role === 'devops';
  const [engine, setEngine] = useState<'MySQL' | 'PostgreSQL'>('MySQL');
  const [reason, setReason] = useState('다른 학생의 부하와 성능을 떼어 놓아야 합니다');
  const [description, setDescription] = useState('실시간 매칭 기능 때문에 쿼리가 많습니다. 공유 서버의 다른 학생 Database에 영향을 주지 않도록 따로 쓰고 싶습니다.');
  const [notice, setNotice] = useState('');
  const [requests, setRequests] = useState<DedicatedDatabaseRequest[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');
    simulateDemoRequest('database-dedicated', controller.signal).then(() => {
      if (controller.signal.aborted) return;
      setRequests(getDemoDbRequests());
      setLoadState('ready');
    }).catch(() => {
      if (!controller.signal.aborted) setLoadState('error');
    });
    return () => controller.abort();
  }, [retryKey]);
  const isTeamRequest = (request: DedicatedDatabaseRequest) => request.teamId
    ? request.teamId === teamScopeId
    : request.team === teamName;
  const teamRequests = requests.filter(isTeamRequest);
  const latestRequest = teamRequests.at(-1);
  const pending = [...teamRequests].reverse().find((request) => request.status === '대기 중' || request.status === '검토 중');

  function submitRequest() {
    if (!isDemoMode() || !canRequestDedicatedDatabase) return;
    const latestRequests = getDemoDbRequests();
    if (latestRequests.some(request => isTeamRequest(request) && (request.status === '대기 중' || request.status === '검토 중'))) {
      setRequests(latestRequests);
      setNotice('신청을 검토 중입니다. 결과가 나오기 전에는 다시 신청할 수 없습니다.');
      return;
    }
    if (getDemoTeamDedicatedDatabaseQuota(teamScopeId).available === 0) {
      setNotice(`${teamName} 팀은 전용 Database를 이미 사용 중이라 추가 신청할 수 없습니다.`);
      return;
    }
    if (!description.trim()) { setNotice('설명을 입력해 주세요.'); return; }
    const requester = team?.members.find(member => member.member_id === getSessionUser()?.id);
    const applicationDate = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
    const request: DedicatedDatabaseRequest = {
      id: `db-request-${crypto.randomUUID()}`, team: teamName, teamId: teamScopeId,
      applicant: `${requester?.name ?? getSessionUser()?.name ?? '김지민'} · ${team?.my_role === 'devops' ? 'DevOps' : '팀장'}`,
      members: team?.members.length ?? 0,
      engine, reason, description: description.trim(), requestedAt: applicationDate, status: '대기 중', rejectReason: '',
    };
    const nextRequests = [...latestRequests, request];
    if (!saveDemoDbRequests(nextRequests)) {
      setNotice('신청을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setRequests(nextRequests);
    setNotice('');
  }

  if (isDemoMode() && !canRequestDedicatedDatabase) {
    return <Navigate to={`/teams/${encodeURIComponent(teamScopeId)}`} replace />;
  }

  const roleLabel = team?.my_role === 'devops' ? 'DevOps' : team?.my_role === 'leader' ? '팀장' : '팀';
  return <DemoOnlyGate><WorkflowLayout activeStudentItem="database" scopeLabel={`${teamName} · ${roleLabel}`} teamScopeId={teamScopeId}><PageStack>
    <PageBreadcrumb>{teamName} / Database / 전용형 신청</PageBreadcrumb>
    <Heading><TitleGroup><Title>전용형 Database 신청</Title><Subtitle>DB 서버 하나를 팀 전용으로 받습니다. 관리자가 승인하면 만들어집니다.</Subtitle></TitleGroup></Heading>
    {loadState === 'loading' ? <><LoadingCard height={574} /><Columns><LoadingCard height={338} /><LoadingCard height={338} /></Columns></>
      : loadState === 'error' ? <><ErrorCard onRetry={() => setRetryKey(value => value + 1)} /><Columns><ErrorCard onRetry={() => setRetryKey(value => value + 1)} /><ErrorCard onRetry={() => setRetryKey(value => value + 1)} /></Columns></>
      : <>
    {notice && <Alert $tone="warning" role="status"><Octicon name="info" size={16} /><span>{notice}</span></Alert>}
    {!pending && latestRequest?.status === '거절' && <Banner tone="danger" icon={<Octicon name="x" size={20} />} title="전용형 신청이 거절됐습니다" description={`사유: ${latestRequest.rejectReason || '관리자가 사유를 남기지 않았습니다.'} 고쳐서 다시 신청해 주세요.`} action={<Button variant="secondary" icon={<Octicon name="pencil" size={16} />} onClick={() => { descriptionRef.current?.focus(); descriptionRef.current?.scrollIntoView({ block: 'center' }); }}>고쳐서 다시 신청</Button>} />}
    {pending && <Banner tone="primary" icon={<Octicon name="clock" size={20} />} title="전용형 신청을 보냈습니다" description="관리자가 확인하면 알림으로 알려 드립니다. 결과가 나오기 전에는 다시 신청할 수 없습니다." />}
    <Card>
      <CardHeader><SectionTitle>신청 정보</SectionTitle><Button disabled={latestRequest?.status === '승인 완료'} icon={<Octicon name="people" size={16} />} onClick={submitRequest}>{latestRequest?.status === '거절' ? '고쳐서 다시 신청' : '신청'}</Button></CardHeader>
      <Muted>팀당 1개까지이고, 팀 Database 4개 안에 들어갑니다. 팀장과 DevOps만 신청할 수 있습니다.</Muted>
      <FormFields>
        <Field as="div" role="group" aria-label="엔진">엔진<EngineChoices>{(['MySQL', 'PostgreSQL'] as const).map((item) => <EngineButton key={item} type="button" $selected={engine === item} aria-pressed={engine === item} onClick={() => setEngine(item)}>{item}</EngineButton>)}</EngineChoices></Field>
        <Field>이유<SelectWrap><ReasonSelect value={reason} onChange={(event) => setReason(event.target.value)}><option>다른 학생의 부하와 성능을 떼어 놓아야 합니다</option><option>팀 서비스의 DB 관리자 권한이 필요합니다</option><option>운영 중인 서비스에 전용 서버가 필요합니다</option></ReasonSelect><Octicon name="chevron-down" size={16} aria-hidden="true" /></SelectWrap></Field>
        <Field>설명<Textarea ref={descriptionRef} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} /><FieldHint>꼭 적어야 합니다. 관리자가 승인할 때 참고합니다.</FieldHint></Field>
        <Field>사양<FixedSpec value="vCPU 2 · RAM 4 GB · SSD 20 GB" disabled /><FieldHint>팀이 고를 수 없는 고정 사양입니다.</FieldHint></Field>
      </FormFields>
    </Card>
    <Columns>
      <Card><CardHeader><SectionTitle>공유형과 다른 점</SectionTitle></CardHeader>
        <InfoRow><Octicon name="database" size={16} /><InfoText><strong>DB 서버를 팀만 씁니다</strong><span>다른 학생의 부하에 영향을 받지 않습니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="shield" size={16} /><InfoText><strong>DB 관리자 권한</strong><span>계정과 database를 팀이 직접 만들 수 있습니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="cpu" size={16} /><InfoText><strong>고정 사양</strong><span>사양은 한 가지로 정해져 있고 바꿀 수 없습니다.</span></InfoText></InfoRow>
      </Card>
      <Card><CardHeader><SectionTitle>신청 뒤 순서</SectionTitle></CardHeader>
        <InfoRow><Octicon name="checklist" size={16} /><InfoText><strong>1. 관리자 승인</strong><span>거절되면 사유를 보고 고쳐서 다시 신청할 수 있습니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="database" size={16} /><InfoText><strong>2. 전용 DB 서버 만들기</strong><span>승인되면 바로 만들어집니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="key" size={16} /><InfoText><strong>3. 접속 정보 확인</strong><span>팀장과 DevOps에게 접속 정보를 보여 드립니다. 쿼리 콘솔은 없습니다.</span></InfoText></InfoRow>
      </Card>
    </Columns>
    <PeriodCard><Octicon name="calendar" size={16} /><div><PeriodTitle>전용형 Database의 사용 기간</PeriodTitle><Muted style={{ marginTop: 4 }}>첫 31일 뒤 만료되고, 이후 2주마다 팀원 누구나 연장할 수 있습니다.</Muted></div></PeriodCard>
    {latestRequest?.status === '승인 완료' && <Card>
      <CardHeader><SectionTitle>신청 결과</SectionTitle><Badge $tone="success">{latestRequest.status}</Badge></CardHeader>
      <Muted>{latestRequest.engine} · {latestRequest.requestedAt}</Muted>
      {latestRequest.databaseGrn && <>
        <Muted>{latestRequest.databaseName ?? '전용 Database'}가 생성되었습니다. 상세 화면에서 접속 정보를 확인할 수 있습니다.</Muted>
        <Button variant="secondary" icon={<Octicon name="database" size={16} />} onClick={() => navigate(`/databases/${encodeURIComponent(latestRequest.databaseGrn!)}`)}>접속 정보 확인</Button>
      </>}
    </Card>}
    </>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}

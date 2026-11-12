import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { listDatabases } from '../../entities/database';
import { getTeam, listMyTeams, type TeamDetail, type TeamRole, type TeamSummary, type TeamQuotaUsage } from '../../entities/team';
import { getSessionUser } from '../../entities/session';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
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
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

const TitleBlock = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const MemberCount = styled.strong`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`;

const TeamWarning = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
`;

const QuotaPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const QuotaRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuotaRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px 16px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const QuotaValue = styled.span<{ $tone?: 'warning' | 'danger' }>`
  color: ${({ theme, $tone }) => $tone === 'danger' ? theme.colors.danger : $tone === 'warning' ? theme.colors.warning : theme.colors.muted};
`;

const MeterTrack = styled.div`
  grid-column: 1 / -1;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.raised};
`;

const MeterFill = styled.div<{ $value: number; $tone: 'primary' | 'warning' | 'danger' }>`
  width: ${({ $value }) => `${Math.max(0, Math.min($value, 100))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ theme, $tone }) => $tone === 'danger' ? theme.colors.danger : $tone === 'warning' ? theme.colors.warning : theme.colors.primary};
`;

const QuotaFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const VmPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const VmTable = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.75fr 1.35fr 1fr 1fr 56px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const VmNotice = styled.div`
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: center;
`;

const ServiceSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const ServiceCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
`;

const DatabaseUsageCard = styled(UsageCard)`
  width: 100%;
`;

const ServiceCard = styled.article`
  display: flex;
  min-height: 130px;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const ServiceCardLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ServiceCount = styled.strong`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const MutedCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: start;
  gap: 16px;
  width: 100%;
`;

const MemberPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const MemberList = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Member = styled.li`
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};

  &:last-child { border-bottom: 0; }
`;

const MemberIcon = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const MemberCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
`;

const MemberName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const MemberRole = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const EmptyState = styled.section`
  display: flex;
  width: min(100%, 512px);
  flex-direction: column;
  gap: 12px;
  margin: 0 auto;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const EmptyTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const EmptyCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const DotList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  list-style: none;
`;

const EmptyActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`;

const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const SkeletonServices = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
`;

interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

const roleLabel: Record<TeamRole, string> = {
  leader: '팀장',
  devops: 'DevOps 엔지니어',
  member: '일반 팀원',
};

function quotaState(quota: TeamQuotaUsage | undefined) {
  if (!quota) return { value: '—', percent: 0, tone: 'primary' as const, unavailable: true };
  const percent = quota.limit > 0 ? quota.used / quota.limit * 100 : quota.used > 0 ? 100 : 0;
  const tone = percent >= 100 ? 'danger' as const : percent >= 80 ? 'warning' as const : 'primary' as const;
  return { value: `${quota.used} / ${quota.limit}`, percent, tone, unavailable: false };
}

function QuotaLine({ label, usage, suffix = '' }: { label: string; usage: TeamQuotaUsage | undefined; suffix?: string }) {
  const state = quotaState(usage);
  return (
    <QuotaRow>
      <span>{label}</span>
      <QuotaValue $tone={state.tone === 'danger' ? 'danger' : state.tone === 'warning' ? 'warning' : undefined}>
        {state.unavailable ? '—' : `${state.value}${suffix}`}
      </QuotaValue>
      <MeterTrack aria-label={`${label} 사용량`}>
        {usage && <MeterFill $value={state.percent} $tone={state.tone} />}
      </MeterTrack>
    </QuotaRow>
  );
}

interface TeamDatabaseUsage {
  count: number;
  storageGb: number;
  dedicatedCount: number;
}

const databaseStorageFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

function TeamDatabaseCard({ teamId }: { teamId: string }) {
  const [usage, setUsage] = useState<TeamDatabaseUsage | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void listDatabases({ owner: teamId, signal: controller.signal }).then(databases => {
      if (controller.signal.aborted) return;
      setUsage({
        count: databases.length,
        storageGb: databases.reduce((total, database) => total + database.storage.used_gb, 0),
        dedicatedCount: databases.filter(database => database.isolation === 'dedicated').length,
      });
    }).catch(() => {
      if (!controller.signal.aborted) setUsage(null);
    });
    return () => controller.abort();
  }, [teamId]);

  return (
    <DatabaseUsageCard
      label="Database"
      icon={<Octicon name="database" size={16} />}
      value={`${usage?.count ?? '—'} / —`}
      caption={usage ? `용량 ${databaseStorageFormat.format(usage.storageGb)} / — GB · 전용형 ${usage.dedicatedCount}개` : '사용량 정보 없음'}
    />
  );
}

function getStatusMessage(team: TeamDetail) {
  if (team.status === 'pending') return { tone: 'warning' as const, title: '팀 승인 대기 중입니다', description: '팀 승인이 완료되면 팀 Resources를 사용할 수 있습니다.' };
  if (team.status === 'rejected') return { tone: 'danger' as const, title: '팀 승인이 거절되었습니다', description: team.rejection_reason || '팀 설정에서 거절 사유를 확인해 주세요.' };
  return null;
}

export interface TeamsHomePageProps {
  /** Optional active team selected by the app shell or a team route. */
  teamId?: string;
}

export default function TeamsHomePage({ teamId }: TeamsHomePageProps) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [teams, setTeams] = useState<Loadable<TeamSummary[]>>(initialLoadable);
  const [detail, setDetail] = useState<Loadable<TeamDetail>>(initialLoadable);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teamId ?? null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setSelectedTeamId(teamId ?? null);
  }, [teamId]);

  useEffect(() => {
    const controller = new AbortController();
    setTeams(current => ({ ...current, loading: true, error: false }));
    void listMyTeams(controller.signal).then(value => {
      if (controller.signal.aborted) return;
      setTeams({ value, loading: false, error: false });
      if (!teamId && !selectedTeamId && value.length > 0) setSelectedTeamId(value[0].id);
    }).catch(() => {
      if (!controller.signal.aborted) setTeams({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [retryKey, teamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      setDetail({ value: null, loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    setDetail(current => ({ ...current, loading: true, error: false }));
    void getTeam(selectedTeamId, controller.signal).then(value => {
      if (!controller.signal.aborted) setDetail({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setDetail({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [selectedTeamId, retryKey]);

  const selectedSummary = useMemo(
    () => teams.value?.find(team => team.id === selectedTeamId),
    [selectedTeamId, teams.value],
  );
  const currentTeam = detail.value;
  const scopeLabel = currentTeam
    ? `${currentTeam.name} · ${currentTeam.my_role ? roleLabel[currentTeam.my_role] : '관리자'}`
    : selectedSummary ? `${selectedSummary.name} · ${roleLabel[selectedSummary.my_role]}` : '내 Resources';
  const scopeOptions = useMemo(() => [
    {
      id: 'personal',
      label: '내 Resources',
      selected: !selectedTeamId,
      onSelect: () => navigate('/'),
    },
    ...(teams.value ?? []).map(team => ({
      id: team.id,
      label: `${team.name} · ${currentTeam && currentTeam.id === team.id && currentTeam.my_role === null ? '관리자' : roleLabel[team.my_role]}`,
      selected: team.id === selectedTeamId,
      onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ], [currentTeam, navigate, selectedTeamId, teams.value]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home' || item === 'team') navigate(selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}` : '/teams');
    else if (item === 'database') navigate(selectedTeamId ? `/databases?owner=${encodeURIComponent(selectedTeamId)}` : '/databases');
    else if (item === 'apps') navigate(selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}/apps` : '/apps');
  };

  const retry = useCallback(() => setRetryKey(value => value + 1), []);

  const empty = !teamId && !teams.loading && !teams.error && teams.value?.length === 0;
  const loading = teams.loading || (!selectedTeamId && !empty && !teams.error) || detail.loading;
  const role = currentTeam
    ? currentTeam.my_role ? roleLabel[currentTeam.my_role] : '관리자'
    : selectedSummary ? roleLabel[selectedSummary.my_role] : '';
  const quota = currentTeam?.quota?.vm;
  const vcpu = quotaState(quota?.vcpu);
  const statusMessage = currentTeam ? getStatusMessage(currentTeam) : null;
  const canCreateTeamVm = Boolean(currentTeam?.status === 'approved' && (currentTeam.my_role === null || currentTeam.my_role === 'leader' || currentTeam.my_role === 'devops'));

  let content;
  if (empty) {
    content = (
      <Page>
        <EmptyState>
          <EmptyTitle><Octicon name="people" size={20} />아직 속한 팀이 없습니다</EmptyTitle>
          <EmptyCopy>팀을 만들거나 팀장에게 초대를 받으면 팀 VM을 함께 관리할 수 있습니다.</EmptyCopy>
          <DotList>
            <li>· 초대 메일의 링크를 누르면 바로 합류합니다.</li>
            <li>· 개인 Resource는 지금처럼 사용할 수 있습니다.</li>
          </DotList>
          <EmptyActions>
            <Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => navigate('/docs')}>팀 사용법</Button>
            <Button variant="primary" icon={<Octicon name="people" size={16} />} onClick={() => navigate('/teams/new')}>팀 만들기</Button>
          </EmptyActions>
        </EmptyState>
      </Page>
    );
  } else if (teams.error && !teamId) {
    content = <Page><Breadcrumb>팀 Resources</Breadcrumb><ErrorCard onRetry={retry} /></Page>;
  } else if (loading) {
    content = (
      <Page>
        <Breadcrumb>{scopeLabel} / 팀 Resources</Breadcrumb>
        <Heading>
          <TitleBlock><Title>{selectedSummary?.name ?? '팀'}</Title><Subtitle>팀 Resources · 팀원 정보를 불러오는 중입니다</Subtitle></TitleBlock>
        </Heading>
        <SkeletonStack aria-label="팀 정보를 불러오는 중입니다" aria-busy="true">
          <LoadingCard height={205} />
          <LoadingCard height={210} />
          <section><SectionTitle>팀 서비스</SectionTitle><SkeletonServices><LoadingCard height={130} /><LoadingCard height={130} /><LoadingCard height={130} /></SkeletonServices></section>
          <LoadingCard height={220} />
        </SkeletonStack>
      </Page>
    );
  } else if (detail.error || !currentTeam) {
    content = (
      <Page>
        <Breadcrumb>{scopeLabel} / 팀 Resources</Breadcrumb>
        <Heading><TitleBlock><Title>{selectedSummary?.name ?? '팀'}</Title><Subtitle>팀 정보를 확인할 수 없습니다.</Subtitle></TitleBlock></Heading>
        <ErrorCard onRetry={retry} />
        <Button variant="secondary" onClick={() => navigate('/teams')}>팀 목록</Button>
      </Page>
    );
  } else {
    const warningText = vcpu.unavailable
      ? undefined
      : quota!.vcpu.used >= quota!.vcpu.limit
        ? `팀 vCPU ${quota!.vcpu.used}/${quota!.vcpu.limit} 사용 중 · 팀 설정에서 할당량 늘리기를 요청하세요.`
        : undefined;
    content = (
      <Page>
        <Breadcrumb>{currentTeam.name} / 팀 Resources</Breadcrumb>
        <Heading>
          <TitleBlock>
            <Title>{currentTeam.name}</Title>
            <Subtitle>팀 Resources · 내 역할 {role || '확인 중'} · 팀원 <MemberCount>{currentTeam.members.length}명</MemberCount></Subtitle>
            {warningText && <TeamWarning>{warningText}</TeamWarning>}
          </TitleBlock>
          <Actions>
            <Button variant="secondary" icon={<Octicon name="gear" size={16} />} onClick={() => navigate(`/teams/${encodeURIComponent(currentTeam.id)}/settings`)}>팀 설정</Button>
            {canCreateTeamVm && <Button variant="secondary" icon={<Octicon name="plus" size={16} />} onClick={() => navigate(`/teams/${encodeURIComponent(currentTeam.id)}/vms/new`)}>팀 VM 만들기</Button>}
          </Actions>
        </Heading>

        {statusMessage && <Banner title={statusMessage.title} description={statusMessage.description} tone={statusMessage.tone} icon={<Octicon name="alert" size={20} />} />}

        <QuotaPanel aria-label="팀 할당량">
          <SectionTitle>팀 할당량</SectionTitle>
          <QuotaRows>
            <QuotaLine label="vCPU" usage={quota?.vcpu} />
            <QuotaLine label="RAM" usage={quota?.ram_gb} suffix=" GB" />
            <QuotaLine label="SSD" usage={quota?.ssd_gb} suffix=" GB" />
          </QuotaRows>
          <QuotaFoot>
            <span>{quota ? (quota.vcpu.used >= quota.vcpu.limit ? 'vCPU를 모두 쓰고 있습니다. 더 필요하면 팀 설정에서 할당량 늘리기를 요청하세요.' : 'VM 할당량 사용량') : '승인된 팀의 VM 할당량이 표시됩니다.'}</span>
            {currentTeam.status === 'approved' && currentTeam.my_role === 'leader' && (
              <Button variant="secondary" icon={<Octicon name="graph" size={16} />} onClick={() => navigate(`/teams/${encodeURIComponent(currentTeam.id)}/settings?tab=quota`)}>할당량 늘리기 요청</Button>
            )}
          </QuotaFoot>
        </QuotaPanel>

        <VmPanel>
          <SectionHeading><SectionTitle>팀 VM</SectionTitle></SectionHeading>
          <VmTable aria-hidden="true"><span>VM</span><span>상태</span><span>Resources</span><span>만든 사람</span><span>만료</span><span>관리</span></VmTable>
          <VmNotice>팀 VM 목록 정보가 제공되지 않습니다.</VmNotice>
        </VmPanel>

        <ServiceSection>
          <SectionTitle>팀 서비스</SectionTitle>
          <ServiceCards>
            <TeamDatabaseCard key={currentTeam.id} teamId={currentTeam.id} />
            <ServiceCard><ServiceCardLabel><Octicon name="zap" size={16} />Serverless</ServiceCardLabel><ServiceCount>— / —</ServiceCount><MutedCaption>사용량 정보 없음</MutedCaption></ServiceCard>
            <ServiceCard><ServiceCardLabel><Octicon name="code" size={16} />Apps</ServiceCardLabel><ServiceCount>— / —</ServiceCount><MutedCaption>사용량 정보 없음</MutedCaption></ServiceCard>
          </ServiceCards>
        </ServiceSection>

        <BottomGrid>
          <MemberPanel>
            <SectionTitle>팀원 · <MemberCount>{currentTeam.members.length}명</MemberCount></SectionTitle>
            <MemberList>
              {currentTeam.members.map(member => (
                <Member key={member.member_id}>
                  <MemberIcon aria-hidden="true"><Octicon name="person" size={18} /></MemberIcon>
                  <MemberCopy><MemberName>{member.name}{member.role === currentTeam.my_role ? ' (나)' : ''}</MemberName><MemberRole>{roleLabel[member.role]}</MemberRole></MemberCopy>
                </Member>
              ))}
            </MemberList>
          </MemberPanel>
          <Banner
            title="팀 VM 사용 기간"
            description="첫 달은 VM 생성 시각부터 31일입니다. 이후 만료 7일 전부터 팀원 누구나 14일씩 연장할 수 있고, 알림은 팀원 전원에게 갑니다."
            tone="neutral"
            icon={<Octicon name="calendar" size={20} />}
          />
        </BottomGrid>
      </Page>
    );
  }

  return (
    <StudentShell
      activeItem="home"
      scopeLabel={scopeLabel}
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      onOpenProfile={() => undefined}
    >
      {content}
    </StudentShell>
  );
}

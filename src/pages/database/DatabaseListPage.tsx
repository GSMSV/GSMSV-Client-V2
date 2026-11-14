import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { listDatabases, type DatabaseStatus, type DatabaseSummary } from '../../entities/database';
import { getMyDatabaseQuota, type DatabaseQuota } from '../../entities/quota';
import { getSessionUser } from '../../entities/session';
import { getTeam, listMyTeams, type TeamDetail, type TeamRole, type TeamSummary } from '../../entities/team';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1224px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const HeadingGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
`;

const TitleBlock = styled.div`
  display: flex;
  min-width: 0;
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
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const SummaryRow = styled.section`
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: 100%;
`;

const FlexibleUsageCard = styled(UsageCard)`
  width: auto;
  min-width: 0;
  flex: 1 1 0;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const CardsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

const DatabaseCard = styled.article`
  display: flex;
  width: calc((100% - 32px) / 3);
  min-width: 300px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 42px;
`;

const DatabaseIcon = styled.span`
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
`;

const DatabaseName = styled.h3`
  overflow: hidden;
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DatabaseDescription = styled.p`
  min-height: 22px;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Metadata = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 22px;
`;

const Expiry = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusText = styled.span<{ $tone: 'primary' | 'warning' | 'danger' | 'neutral' }>`
  flex: 0 0 auto;
  color: ${({ theme, $tone }) =>
    $tone === 'primary' ? theme.colors.primary :
    $tone === 'warning' ? theme.colors.warning :
    $tone === 'danger' ? theme.colors.danger : theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const SummaryLoading = styled(LoadingCard)`
  min-width: 0;
  flex: 1 1 0;
`;

const DatabaseListError = styled(ErrorCard)`
  width: 371px;
`;

const InlineRetry = styled.button`
  margin-left: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const QuietValue = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

const ConnectionCaption = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

const ScopeError = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const BannerDescription = styled.span`
  display: block;
`;

interface Loadable<T> {
  value: T | null;
  loading: boolean;
  error: boolean;
}

const databasePresentationMock = import.meta.env.DEV
  ? {
    welcomeDatabaseDescription: 'welcome-api 함수가 연결해 쓰는 Database입니다.',
    concurrentConnections: 10,
  }
  : null;

const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value);
}

function formatExpiry(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
  }).format(date).split('-');
  return `만료 ${year}. ${month}. ${day}.`;
}

function getStatus(status: DatabaseStatus, writeLocked: boolean) {
  if (writeLocked && status === 'active') return { label: '쓰기 잠김', tone: 'warning' as const };
  switch (status) {
    case 'active': return { label: '사용 중', tone: 'primary' as const };
    case 'creating': return { label: '생성 중', tone: 'warning' as const };
    case 'suspended': return { label: '중지됨', tone: 'danger' as const };
    case 'deleting': return { label: '삭제 중', tone: 'warning' as const };
    case 'failed': return { label: '실패', tone: 'danger' as const };
  }
}

function DatabaseResourceCard({ database, onOpen }: { database: DatabaseSummary; onOpen: () => void }) {
  const status = getStatus(database.status, database.write_locked);
  const description = database.name === 'welcome-db' ? databasePresentationMock?.welcomeDatabaseDescription : undefined;
  return (
    <DatabaseCard>
      <CardActions>
        <DatabaseIcon aria-hidden="true"><Octicon name="database" size={20} /></DatabaseIcon>
        <Button variant="secondary" icon={<Octicon name="arrow-right" size={16} />} onClick={onOpen}>열기</Button>
      </CardActions>
      <DatabaseName title={database.name}>{database.name}</DatabaseName>
      <DatabaseDescription aria-label={description ? undefined : 'Database 설명을 제공하는 API 필드가 없습니다.'}>{description}</DatabaseDescription>
      <Metadata>{database.engine === 'mysql' ? 'MySQL' : 'PostgreSQL'} · {database.isolation === 'shared' ? '공유형' : '전용형'} · {formatNumber(database.storage.used_gb)} GB</Metadata>
      <CardFooter>
        <Expiry>{formatExpiry(database.expires_at)}</Expiry>
        <StatusText $tone={status.tone}>{status.label}</StatusText>
      </CardFooter>
    </DatabaseCard>
  );
}

export default function DatabaseListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const owner = searchParams.get('owner') ?? 'me';
  const isTeamScope = owner !== 'me';
  const teamId = (owner.startsWith('team-') || owner === 'demo-team') ? owner : undefined;
  const user = getSessionUser();
  const demoMode = isDemoMode();
  const [databases, setDatabases] = useState<Loadable<DatabaseSummary[]>>(initialLoadable);
  const [quota, setQuota] = useState<Loadable<DatabaseQuota>>(initialLoadable);
  const [retryKey, setRetryKey] = useState(0);
  const [quotaRetryKey, setQuotaRetryKey] = useState(0);
  const [teams, setTeams] = useState<Loadable<TeamSummary[]>>(initialLoadable);
  const [currentTeam, setCurrentTeam] = useState<Loadable<TeamDetail>>(initialLoadable);
  const [scopeRetryKey, setScopeRetryKey] = useState(0);

  const openDatabase = (database: DatabaseSummary) => navigate(`/databases/${encodeURIComponent(database.grn)}`);

  const loadList = useCallback(async (signal: AbortSignal) => {
    setDatabases(current => ({ ...current, loading: true, error: false }));
    try {
      if (import.meta.env.DEV && demoMode) {
        const { listDemoDatabases } = await import('../../entities/database/demo');
        const items = listDemoDatabases(owner);
        if (!signal.aborted) setDatabases({ value: items, loading: false, error: false });
        return;
      }
      const items = await listDatabases({ owner, signal });
      if (!signal.aborted) setDatabases({ value: items, loading: false, error: false });
    } catch {
      if (!signal.aborted) setDatabases({ value: null, loading: false, error: true });
    }
  }, [demoMode, owner]);

  const loadQuota = useCallback(async (signal: AbortSignal) => {
    setQuota(current => ({ ...current, loading: true, error: false }));
    try {
      if (import.meta.env.DEV && demoMode) {
        const { getDemoDatabaseQuota } = await import('../../entities/database/demo');
        if (!signal.aborted) setQuota({ value: getDemoDatabaseQuota(), loading: false, error: false });
        return;
      }
      const value = await getMyDatabaseQuota(signal);
      if (!signal.aborted) setQuota({ value, loading: false, error: false });
    } catch {
      if (!signal.aborted) setQuota({ value: null, loading: false, error: true });
    }
  }, [demoMode]);

  useEffect(() => {
    const controller = new AbortController();
    void loadList(controller.signal);
    return () => controller.abort();
  }, [loadList, retryKey]);

  useEffect(() => {
    if (owner !== 'me') {
      setQuota({ value: null, loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    void loadQuota(controller.signal);
    return () => controller.abort();
  }, [loadQuota, quotaRetryKey, owner]);

  useEffect(() => {
    if (import.meta.env.DEV && demoMode) {
      let cancelled = false;
      void import('../../entities/home').then(({ demoHomeTeams }) => {
        if (!cancelled) setTeams({ value: demoHomeTeams, loading: false, error: false });
      });
      return () => { cancelled = true; };
    }
    const controller = new AbortController();
    setTeams(current => ({ ...current, loading: true, error: false }));
    void listMyTeams(controller.signal).then(value => {
      if (!controller.signal.aborted) setTeams({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setTeams({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [demoMode, scopeRetryKey]);

  useEffect(() => {
    if (import.meta.env.DEV && demoMode && teamId) {
      let cancelled = false;
      void import('../../entities/home').then(({ demoHomeTeams }) => {
        if (cancelled) return;
        const summary = demoHomeTeams.find(team => team.id === teamId);
        const value: TeamDetail | null = summary ? {
          ...summary,
          rejection_reason: null,
          members: [],
          quota: { vm: { vcpu: { used: 2, limit: 4 }, ram_gb: { used: 4, limit: 8 }, ssd_gb: { used: 20, limit: 60 } } },
          permissions: { invite_member: true, remove_member: true, grant_devops: true, transfer_leader: true, disband_team: true, leave_team: true, resubmit_team: false },
        } : null;
        setCurrentTeam(value ? { value, loading: false, error: false } : { value: null, loading: false, error: true });
      });
      return () => { cancelled = true; };
    }
    if (!teamId) {
      setCurrentTeam({ value: null, loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    setCurrentTeam(current => ({ ...current, loading: true, error: false }));
    void getTeam(teamId, controller.signal).then(value => {
      if (!controller.signal.aborted) setCurrentTeam({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setCurrentTeam({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [demoMode, teamId]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'database') navigate('/databases');
  };

  const availableTeams = teams.value ?? [];
  const scopeOptions = useMemo(() => {
    const listedTeams = availableTeams.map(team => ({
      id: team.id,
      label: `${team.name} · ${roleLabels[team.my_role]}`,
      selected: team.id === teamId,
      onSelect: () => navigate(`/databases?owner=${encodeURIComponent(team.id)}`),
    }));
    if (currentTeam.value && !listedTeams.some(team => team.id === currentTeam.value?.id)) {
      listedTeams.push({
        id: currentTeam.value.id,
        label: `${currentTeam.value.name} · ${currentTeam.value.my_role ? roleLabels[currentTeam.value.my_role] : '관리자'}`,
        selected: true,
        onSelect: () => navigate(`/databases?owner=${encodeURIComponent(currentTeam.value!.id)}`),
      });
    }
    return [
      { id: 'personal', label: '내 Resources', selected: !isTeamScope, onSelect: () => navigate('/databases') },
      ...listedTeams,
    ];
  }, [availableTeams, currentTeam.value, isTeamScope, navigate, teamId]);
  const currentTeamName = currentTeam.value?.name ?? availableTeams.find(team => team.id === teamId)?.name;
  const scopeLabel = currentTeam.value
    ? `${currentTeam.value.name} · ${currentTeam.value.my_role ? roleLabels[currentTeam.value.my_role] : '관리자'}`
    : isTeamScope ? '팀 Resources' : '내 Resources';

  const count = isTeamScope ? undefined : quota.value?.db.count;
  const storage = isTeamScope ? undefined : quota.value?.db.shared_storage_gb;
  const countOver = Boolean(count && count.used > count.limit);
  const countPercent = count && count.limit > 0 ? Math.min(100, count.used / count.limit * 100) : 0;
  const storageOver = Boolean(storage && storage.used > storage.limit);
  const storagePercent = storage && storage.limit > 0 ? Math.min(100, storage.used / storage.limit * 100) : 0;

  return (
    <StudentShell
      activeItem="database"
      scopeLabel={scopeLabel}
      scopeOptions={scopeOptions}
      teamScopeId={teamId}
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <Page>
        <Breadcrumb>Database</Breadcrumb>
        <HeadingGroup>
          <HeadingRow>
            <TitleBlock>
              <Title>Database</Title>
              <Description>VM에 설치하지 않고 발급받아 쓰는 데이터베이스입니다.</Description>
            </TitleBlock>
            {isTeamScope ? (
              <Button
                variant="primary"
                icon={<Octicon name="plus" size={16} />}
                disabled={!teamId}
                title={!teamId ? '팀 범위를 확인할 수 없습니다.' : undefined}
                onClick={() => {
                  if (!teamId) return;
                  void navigate(`/databases/new?owner=${encodeURIComponent(teamId)}`);
                }}
              >새 Database</Button>
            ) : <Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={() => navigate('/databases/new')}>새 Database</Button>}
          </HeadingRow>
        </HeadingGroup>

        {!isTeamScope && <SummaryRow aria-label="Database 사용량">
          {quota.loading ? (
            <><SummaryLoading height={174} /><SummaryLoading height={174} /><SummaryLoading height={174} /></>
          ) : (
            <>
              <FlexibleUsageCard
                label="내 Database"
                icon={<Octicon name="database" size={16} />}
                value={count ? `${formatNumber(count.used)} / ${formatNumber(count.limit)}` : <QuietValue>— / —</QuietValue>}
                meter={count ? { value: countPercent, tone: countOver ? 'danger' : 'primary', label: 'Database 개수 사용량' } : undefined}
                caption={count ? `Database ${formatNumber(Math.max(0, count.limit - count.used))}개를 더 발급할 수 있습니다` : quota.error ? <>사용량을 불러오지 못했습니다<InlineRetry type="button" onClick={() => setQuotaRetryKey(value => value + 1)}>다시 시도</InlineRetry></> : '사용량 정보 없음'}
              />
              <FlexibleUsageCard
                label="사용 용량"
                icon={<Octicon name="graph" size={16} />}
                value={storage ? `${formatNumber(storage.used)} / ${formatNumber(storage.limit)} GB` : <QuietValue>— / — GB</QuietValue>}
                meter={storage ? { value: storagePercent, tone: storageOver ? 'danger' : 'primary', label: 'Database 용량 사용량' } : undefined}
                caption={storage ? '내 Database 크기를 모두 합해 세요' : quota.error ? <>사용량을 불러오지 못했습니다<InlineRetry type="button" onClick={() => setQuotaRetryKey(value => value + 1)}>다시 시도</InlineRetry></> : '사용량 정보 없음'}
              />
              <FlexibleUsageCard
                label="동시 연결"
                icon={<Octicon name="link" size={16} />}
                value={databasePresentationMock ? `계정당 ${databasePresentationMock.concurrentConnections}개` : <QuietValue>—</QuietValue>}
                caption={<ConnectionCaption>{databasePresentationMock ? '넘는 연결은 거절됩니다' : '연결 한도 정보 없음'}</ConnectionCaption>}
              />
            </>
          )}
        </SummaryRow>}

        <Section>
          <SectionTitle>{isTeamScope ? `${currentTeamName ?? '팀'} Database` : '내 Database'}</SectionTitle>
          {teams.error && <ScopeError role="alert">팀 범위를 불러오지 못했습니다.<Button variant="ghost" onClick={() => setScopeRetryKey(value => value + 1)}>다시 시도</Button></ScopeError>}
          {currentTeam.error && <ScopeError role="alert">팀 정보를 불러오지 못했습니다. 팀 접근 권한을 확인해 주세요.</ScopeError>}
          {databases.loading ? (
            <CardsRow><LoadingCard width="calc((100% - 32px) / 3)" height={254} /></CardsRow>
          ) : databases.error ? (
            <DatabaseListError onRetry={() => setRetryKey(value => value + 1)} />
          ) : (
            <CardsRow>
              {databases.value?.map(database => (
                <DatabaseResourceCard key={database.grn} database={database} onOpen={() => openDatabase(database)} />
              ))}
            </CardsRow>
          )}
        </Section>

        <Banner
          title="인터넷에서는 바로 접속할 수 없습니다"
          description={<BannerDescription>VM에서 Database에 연결하세요. PC의 DB 도구는 VM을 거치는 SSH 터널로 연결할 수 있습니다.</BannerDescription>}
          tone="neutral"
          icon={<Octicon name="info" size={20} />}
          action={<Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => navigate('/docs')}>접속 방법 Docs</Button>}
        />
      </Page>
    </StudentShell>
  );
}

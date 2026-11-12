import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { listPersonalApps, type AppSummary } from '../../entities/app';
import { listDatabases, type DatabaseSummary } from '../../entities/database';
import { getMyQuota, type MyQuota, type QuotaAmount, type VmQuotaAmount } from '../../entities/quota';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { Button } from '../../shared/ui/controls';
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

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Notice = styled.section`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
`;

const Card = styled.article`
  display: flex;
  min-width: 0;
  min-height: 196px;
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
`;

const IconBox = styled.span`
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

const CardName = styled.h3`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const State = styled.span<{ $tone?: 'primary' | 'warning' | 'danger' }>`
  flex: 0 0 auto;
  color: ${({ theme, $tone }) => $tone === 'primary' ? theme.colors.primary : $tone === 'warning' ? theme.colors.warning : $tone === 'danger' ? theme.colors.danger : theme.colors.faint};
`;

const EmptyCard = styled(Card)`
  justify-content: center;
`;

const QuotaPanel = styled(Card)`
  min-height: 0;
`;

const QuotaMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
`;

const QuotaMetric = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
`;

const QuotaLabel = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const QuotaValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const ResourceTable = styled.div`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
`;

const ResourceTableHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 2fr) repeat(3, minmax(100px, 1fr));
  gap: 16px;
  padding: 14px 20px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ResourceTableEmpty = styled.div`
  padding: 24px 20px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

interface Loadable<T> {
  value: T | null;
  loading: boolean;
  error: boolean;
}

const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

const teamRoleLabel: Record<TeamRole, string> = {
  leader: '팀장',
  devops: 'DevOps 엔지니어',
  member: '일반 팀원',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' }).format(date);
}

function formatQuota(value: QuotaAmount | VmQuotaAmount) {
  return `${value.used} / ${value.limit === null ? '개인 한도 없음' : value.limit}`;
}

function formatRemaining(value: VmQuotaAmount) {
  return value.limit === null ? '제한 없음' : String(Math.max(0, value.limit - value.used));
}

function appStatus(status: string) {
  return status === 'deleting'
    ? { label: '삭제 중', tone: 'warning' as const }
    : { label: '상태 확인 중', tone: undefined };
}

function databaseStatus(database: DatabaseSummary) {
  if (database.write_locked && database.status === 'active') return { label: '쓰기 잠김', tone: 'warning' as const };
  switch (database.status) {
    case 'active': return { label: '사용 중', tone: 'primary' as const };
    case 'creating': return { label: '생성 중', tone: 'warning' as const };
    case 'suspended': return { label: '중지됨', tone: 'danger' as const };
    case 'deleting': return { label: '삭제 중', tone: 'warning' as const };
    case 'failed': return { label: '실패', tone: 'danger' as const };
  }
}

export default function PersonalResourcesPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [apps, setApps] = useState<Loadable<AppSummary[]>>(initialLoadable);
  const [databases, setDatabases] = useState<Loadable<DatabaseSummary[]>>(initialLoadable);
  const [quota, setQuota] = useState<Loadable<MyQuota>>(initialLoadable);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState(false);
  const [teamsRetryKey, setTeamsRetryKey] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    const jobs = [
      listPersonalApps({ signal }).then(value => { if (!signal.aborted) setApps({ value, loading: false, error: false }); }).catch(() => { if (!signal.aborted) setApps({ value: null, loading: false, error: true }); }),
      listDatabases({ owner: 'me', signal }).then(value => { if (!signal.aborted) setDatabases({ value, loading: false, error: false }); }).catch(() => { if (!signal.aborted) setDatabases({ value: null, loading: false, error: true }); }),
      getMyQuota(signal).then(value => { if (!signal.aborted) setQuota({ value, loading: false, error: false }); }).catch(() => { if (!signal.aborted) setQuota({ value: null, loading: false, error: true }); }),
    ];
    setApps(current => ({ ...current, loading: true, error: false }));
    setDatabases(current => ({ ...current, loading: true, error: false }));
    setQuota(current => ({ ...current, loading: true, error: false }));
    await Promise.all(jobs);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, retryKey]);

  useEffect(() => {
    const controller = new AbortController();
    setTeamsLoading(true);
    void listMyTeams(controller.signal)
      .then(value => {
        if (controller.signal.aborted) return;
        setTeams(value);
        setTeamsError(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setTeams([]);
        setTeamsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setTeamsLoading(false);
      });
    return () => controller.abort();
  }, [teamsRetryKey]);

  const scopeOptions = useMemo(() => [
    {
      id: 'personal',
      label: '내 Resources',
      selected: true,
      onSelect: () => navigate('/'),
    },
    ...teams.map(team => ({
      id: team.id,
      label: `${team.name} · ${teamRoleLabel[team.my_role]}`,
      selected: false,
      onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ], [navigate, teams]);

  const onNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home') navigate('/');
    else if (item === 'database') navigate('/databases');
    else if (item === 'apps') navigate('/apps');
    else if (item === 'team') navigate('/teams');
    else if (item === 'settings') navigate('/settings');
  };

  return (
    <StudentShell
      activeItem="home"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={onNavigate}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <Page>
        <Breadcrumb>워크스페이스 / 내 Resources</Breadcrumb>
        <Heading>
          <Title>내 Resources</Title>
          <Button variant="secondary" icon={<Octicon name="plus" size={16} />} disabled title="VM API 계약이 확인된 뒤 사용할 수 있습니다">VM 만들기</Button>
        </Heading>

        <Notice role="note">
          <Octicon name="info" size={16} aria-hidden="true" />
          <span>VM과 Serverless의 개인 자원 목록 API가 없어 실제 자원 카드는 표시되지 않습니다. 할당량은 계약된 API에서 불러오며 Database와 Apps 목록도 실제 데이터를 사용합니다.</span>
          <Button variant="ghost" onClick={() => setRetryKey(value => value + 1)}>새로고침</Button>
        </Notice>
        {teamsError && <div role="alert">
          <Banner
            title="팀 목록을 불러오지 못했습니다"
            description="팀이 없는 상태와 구분할 수 있도록 팀 범위는 표시하지 않습니다. 개인 Resources는 계속 이용할 수 있습니다."
            tone="danger"
            icon={<Octicon name="alert" size={20} />}
            action={<Button variant="secondary" disabled={teamsLoading} onClick={() => setTeamsRetryKey(value => value + 1)}>{teamsLoading ? '불러오는 중…' : '팀 다시 불러오기'}</Button>}
          />
        </div>}

        <Sections>
          <Section>
            <SectionTitle>VM</SectionTitle>
            <QuotaPanel>
              <CardActions>
                <CardName>개인 할당량</CardName>
                <Button variant="primary" disabled title="VM 생성 API 계약이 아직 없습니다">VM 만들기</Button>
              </CardActions>
              {quota.value ? <QuotaMetrics>
                <QuotaMetric><QuotaLabel>vCPU</QuotaLabel><QuotaValue>{formatQuota(quota.value.vm.vcpu)}</QuotaValue><CardDescription>최대 생성 {quota.value.vm.max_creatable.vcpu ?? '—'} vCPU · 잔여 {formatRemaining(quota.value.vm.vcpu)}</CardDescription></QuotaMetric>
                <QuotaMetric><QuotaLabel>RAM</QuotaLabel><QuotaValue>{formatQuota(quota.value.vm.ram_gb)} GB</QuotaValue><CardDescription>최대 생성 {quota.value.vm.max_creatable.ram_gb ?? '—'} GB · 잔여 {formatRemaining(quota.value.vm.ram_gb)} GB</CardDescription></QuotaMetric>
                <QuotaMetric><QuotaLabel>SSD</QuotaLabel><QuotaValue>{formatQuota(quota.value.vm.ssd_gb)} GB</QuotaValue><CardDescription>최대 생성 {quota.value.vm.max_creatable.ssd_gb ?? '—'} GB · 잔여 {formatRemaining(quota.value.vm.ssd_gb)} GB</CardDescription></QuotaMetric>
              </QuotaMetrics> : quota.loading ? <LoadingCard height={96} /> : <CardDescription>개인 할당량을 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요.</CardDescription>}
            </QuotaPanel>
            <ResourceTable aria-label="내 VM 목록">
              <ResourceTableHeader><span>이름</span><span>상태</span><span>자원</span><span>만료일</span></ResourceTableHeader>
              <ResourceTableEmpty>VM 목록 계약이 공개되면 실제 상태와 만료일을 표시합니다. 현재 확인 가능한 VM 목록 API는 없습니다.</ResourceTableEmpty>
            </ResourceTable>
          </Section>

          <Section>
            <SectionTitle>
              {quota.value
                ? `Serverless · 함수 ${formatQuota(quota.value.fn.count)} · 오늘 실행 ${formatQuota(quota.value.fn.daily_executions)}`
                : quota.error ? 'Serverless · 할당량을 불러오지 못했습니다' : 'Serverless · 할당량 불러오는 중'}
            </SectionTitle>
            <Cards>
              <EmptyCard>
                <CardActions><IconBox><Octicon name="code" size={20} /></IconBox><Button variant="secondary" disabled title="Serverless 함수 목록 API가 아직 없습니다">함수 관리</Button></CardActions>
                <CardName>함수 목록을 표시할 수 없습니다</CardName>
                <CardDescription>Serverless 함수 목록 API 계약이 공개되면 실제 함수를 연결합니다.</CardDescription>
              </EmptyCard>
              <EmptyCard>
                <CardActions><IconBox><Octicon name="plus" size={20} /></IconBox><Button variant="primary" disabled title="Serverless 함수 생성 API가 아직 없습니다">함수 만들기</Button></CardActions>
                <CardName>새 함수를 추가하세요</CardName>
                <CardDescription>함수 생성 API 계약이 공개되면 이곳에서 함수를 만들 수 있습니다.</CardDescription>
                {quota.value && <CardFooter><span>남은 함수 {Math.max(0, quota.value.fn.count.limit - quota.value.fn.count.used)}개</span><span>오늘 실행 {formatQuota(quota.value.fn.daily_executions)}</span></CardFooter>}
              </EmptyCard>
            </Cards>
          </Section>

          <Section>
            <SectionTitle>Database{quota.value ? ` · ${formatQuota(quota.value.db.count)} · ${formatQuota(quota.value.db.shared_storage_gb)} GB` : ''}</SectionTitle>
            {databases.loading ? <Cards><LoadingCard height={196} /><LoadingCard height={196} /></Cards> : databases.error ? <ErrorCard onRetry={() => setRetryKey(value => value + 1)} /> : (
              <Cards>
                {databases.value?.map(database => {
                  const status = databaseStatus(database);
                  return <Card key={database.grn}>
                    <CardActions><IconBox><Octicon name="database" size={20} /></IconBox><Button variant="secondary" icon={<Octicon name="arrow-right" size={16} />} onClick={() => navigate(`/databases/${encodeURIComponent(database.grn)}`)}>Database 관리</Button></CardActions>
                    <CardName>{database.name}</CardName>
                    <CardDescription>{database.engine === 'mysql' ? 'MySQL' : 'PostgreSQL'} · {database.isolation === 'shared' ? '공유형' : '전용형'} · {database.storage.used_gb} GB 사용</CardDescription>
                    <CardFooter><span>만료 {formatDate(database.expires_at)}</span><State $tone={status.tone}>{status.label}</State></CardFooter>
                  </Card>;
                })}
                <EmptyCard>
                  <CardActions><IconBox><Octicon name="plus" size={20} /></IconBox><Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={() => navigate('/databases/new')}>Database 발급</Button></CardActions>
                  <CardName>새 Database를 발급하세요</CardName>
                  <CardDescription>발급 가능한 수량은 Database quota에서 확인할 수 있습니다.</CardDescription>
                  {quota.loading ? <LoadingCard height={18} /> : quota.error ? <CardFooter><span>사용량을 불러오지 못했습니다.</span><Button variant="ghost" onClick={() => setRetryKey(value => value + 1)}>다시 시도</Button></CardFooter> : quota.value ? <CardFooter><span>남은 Database {Math.max(0, quota.value.db.count.limit - quota.value.db.count.used)}개</span><span>{quota.value.db.shared_storage_gb.used} / {quota.value.db.shared_storage_gb.limit} GB</span></CardFooter> : null}
                </EmptyCard>
              </Cards>
            )}
          </Section>

          <Section>
            <SectionTitle>
              Apps{quota.value
                ? ` · 앱 ${formatQuota(quota.value.app.count)} · 메모리 ${(quota.value.app.memory_mb.used / 1024).toLocaleString('ko-KR')} / ${(quota.value.app.memory_mb.limit / 1024).toLocaleString('ko-KR')} GB`
                : apps.value ? ` · ${apps.value.length}개` : ''}
            </SectionTitle>
            {apps.loading ? <Cards><LoadingCard height={196} /><LoadingCard height={196} /></Cards> : apps.error ? <ErrorCard onRetry={() => setRetryKey(value => value + 1)} /> : (
              <Cards>
                {apps.value?.map(app => {
                  const status = appStatus(app.status);
                  return <Card key={app.grn}>
                    <CardActions><IconBox><Octicon name="upload" size={20} /></IconBox><Button variant="secondary" icon={<Octicon name="arrow-right" size={16} />} onClick={() => navigate(`/apps/${encodeURIComponent(app.grn)}`)}>앱 관리</Button></CardActions>
                    <CardName>{app.name}</CardName>
                    <CardDescription>앱 서비스 상세 정보는 별도 API 계약을 확인할 수 없습니다.</CardDescription>
                    <CardFooter><span>만료 {formatDate(app.expires_at)}</span><State $tone={status.tone}>{status.label}</State></CardFooter>
                  </Card>;
                })}
                <EmptyCard>
                  <CardActions><IconBox><Octicon name="plus" size={20} /></IconBox><Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={() => navigate('/apps/new')}>앱 만들기</Button></CardActions>
                  <CardName>새 앱을 배포하세요</CardName>
                  <CardDescription>앱 생성 API에서 지원하는 이름만 전송할 수 있습니다.</CardDescription>
                  {quota.value && <CardFooter><span>남은 앱 {Math.max(0, quota.value.app.count.limit - quota.value.app.count.used)}개</span><span>상시 실행 {formatQuota(quota.value.app.always_on)}</span></CardFooter>}
                </EmptyCard>
              </Cards>
            )}
          </Section>
        </Sections>
      </Page>
    </StudentShell>
  );
}

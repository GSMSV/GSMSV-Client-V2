import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { AppResourceCard, listPersonalApps, type AppSummary } from '../../entities/app';
import { getMyQuota, type MyQuota, type QuotaAmount } from '../../entities/quota';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
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

const HeadingGroup = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
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
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
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

const SummaryLoading = styled(LoadingCard)`
  min-width: 0;
  flex: 1 1 0;
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

const CardsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

const EmptySurface = styled.div`
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
`;

const EmptyTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const QuotaCaption = styled.span`
  display: inline-block;
  margin-top: 2px;
`;

const DialogBackdrop = styled.div`
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #00000099;
`;

const QuotaDialog = styled.section`
  display: flex;
  width: min(480px, 100%);
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 48px #00000066;
`;

const DialogTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DialogTitle = styled.h2`
  flex: 1;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const DialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DialogActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

interface LoadableApps {
  value: AppSummary[] | null;
  loading: boolean;
  error: boolean;
}

interface LoadableQuota {
  value: MyQuota | null;
  loading: boolean;
  error: boolean;
}

interface LoadableTeams {
  value: TeamSummary[] | null;
  loading: boolean;
}

const initialQuota: LoadableQuota = { value: null, loading: true, error: false };
const initialTeams: LoadableTeams = { value: null, loading: true };
const roleLabel: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

function formatQuota(amount: QuotaAmount) {
  return `${amount.used} / ${amount.limit}`;
}

function formatMemoryQuota(amount: QuotaAmount) {
  const format = (value: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value / 1024);
  return `${format(amount.used)} / ${format(amount.limit)} GB`;
}

function quotaPercentage(amount: QuotaAmount) {
  return amount.limit > 0 ? Math.min(100, (amount.used / amount.limit) * 100) : amount.used > 0 ? 100 : 0;
}

export default function AppsListPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [apps, setApps] = useState<LoadableApps>({ value: null, loading: true, error: false });
  const [quota, setQuota] = useState<LoadableQuota>(initialQuota);
  const [teams, setTeams] = useState<LoadableTeams>(initialTeams);
  const [retryKey, setRetryKey] = useState(0);
  const [quotaOpen, setQuotaOpen] = useState(false);

  const loadApps = useCallback(async (signal: AbortSignal) => {
    setApps(current => ({ ...current, loading: true, error: false }));
    try {
      const value = await listPersonalApps({ signal });
      if (!signal.aborted) setApps({ value, loading: false, error: false });
    } catch {
      if (!signal.aborted) setApps({ value: null, loading: false, error: true });
    }
  }, []);

  const loadQuota = useCallback(async (signal: AbortSignal) => {
    setQuota(current => ({ ...current, loading: true, error: false }));
    try {
      const value = await getMyQuota(signal);
      if (!signal.aborted) setQuota({ value, loading: false, error: false });
    } catch {
      if (!signal.aborted) setQuota({ value: null, loading: false, error: true });
    }
  }, []);

  const loadTeams = useCallback(async (signal: AbortSignal) => {
    setTeams(current => ({ ...current, loading: true }));
    try {
      const value = await listMyTeams(signal);
      if (!signal.aborted) setTeams({ value, loading: false });
    } catch {
      if (!signal.aborted) setTeams({ value: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadApps(controller.signal);
    void loadQuota(controller.signal);
    void loadTeams(controller.signal);
    return () => controller.abort();
  }, [loadApps, loadQuota, loadTeams, retryKey]);

  useEffect(() => {
    if (!quotaOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuotaOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quotaOpen]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'apps') navigate('/apps');
    if (item === 'database') navigate('/databases');
  };

  const scopeOptions = useMemo(() => [
    { id: 'personal', label: '내 Resources', selected: true, onSelect: () => navigate('/') },
    ...(teams.value ?? []).map(team => ({
      id: team.id,
      label: `${team.name} · ${roleLabel[team.my_role]}`,
      selected: false,
      onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}/apps`),
    })),
  ], [navigate, teams.value]);

  const appCount = apps.value?.length ?? 0;
  const appQuota = quota.value?.app.count;
  const hasReachedAppLimit = appQuota ? appQuota.used >= appQuota.limit : false;
  const openCreateApp = () => {
    if (hasReachedAppLimit) setQuotaOpen(true);
    else navigate('/apps/new');
  };

  const openApp = (app: AppSummary) => navigate(`/apps/${encodeURIComponent(app.grn)}`);

  return (
    <StudentShell
      activeItem="apps"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        <HeadingGroup>
          <HeadingRow>
            <TitleBlock>
              <Title>Apps</Title>
              <Description>GitHub 저장소를 연결하면 빌드해서 띄워 주는 웹 앱입니다.</Description>
            </TitleBlock>
            <Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={openCreateApp}>새 앱</Button>
          </HeadingRow>
        </HeadingGroup>

        <SummaryRow aria-label="Apps 사용량">
          {quota.loading ? (
            <><SummaryLoading height={174} /><SummaryLoading height={174} /><SummaryLoading height={174} /></>
          ) : (
            <>
              <FlexibleUsageCard
                label="내 앱"
                icon={<Octicon name="upload" size={16} />}
                value={quota.error || !quota.value ? '— / —' : formatQuota(quota.value.app.count)}
                meter={quota.value ? { value: quotaPercentage(quota.value.app.count), tone: 'primary', label: '개인 앱 개수 사용량' } : undefined}
                caption={quota.value ? `앱 ${Math.max(0, quota.value.app.count.limit - quota.value.app.count.used)}개를 더 만들 수 있습니다` : '개인 할당량을 불러오지 못했습니다'}
              />
              <FlexibleUsageCard
                label="메모리 할당량"
                icon={<Octicon name="cpu" size={16} />}
                value={quota.value ? formatMemoryQuota(quota.value.app.memory_mb) : '— / — GB'}
                caption={quota.value ? '개인 앱 메모리 사용량' : <QuotaCaption>할당량을 확인할 수 없습니다</QuotaCaption>}
              />
              <FlexibleUsageCard
                label="상시 실행"
                icon={<Octicon name="pulse" size={16} />}
                value={quota.value ? formatQuota(quota.value.app.always_on) : '— / —'}
                caption={quota.value ? '상시 실행 앱 사용량' : <QuotaCaption>할당량을 확인할 수 없습니다</QuotaCaption>}
              />
            </>
          )}
        </SummaryRow>
        {quota.error && <ErrorCard onRetry={() => setRetryKey(value => value + 1)} />}

        <Section>
          <SectionTitle>내 앱</SectionTitle>
          {apps.loading ? (
            <CardsRow><LoadingCard width="calc((100% - 32px) / 3)" height={180} /></CardsRow>
          ) : apps.error ? (
            <ErrorCard onRetry={() => setRetryKey(value => value + 1)} />
          ) : apps.value?.length ? (
            <CardsRow>
              {apps.value.map(app => <AppResourceCard key={app.grn} app={app} onOpen={() => openApp(app)} />)}
            </CardsRow>
          ) : (
            <EmptySurface>
              <EmptyTitle>아직 앱이 없습니다</EmptyTitle>
              <Description>GitHub 저장소를 연결해 첫 앱을 만들어 보세요.</Description>
              <Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={openCreateApp}>새 앱</Button>
            </EmptySurface>
          )}
        </Section>

        <Banner
          title="요청이 없으면 10분 뒤 잠듭니다"
          description="첫 요청이 오면 깨어나서 응답합니다. 컨테이너 안 파일은 재시작하면 사라지니, 남길 데이터는 Database에 저장하세요."
          tone="neutral"
          icon={<Octicon name="info" size={20} />}
          action={<Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => navigate('/docs')}>배포 방법 Docs</Button>}
        />
      </Page>

      {quotaOpen && (
        <DialogBackdrop onClick={() => setQuotaOpen(false)}>
          <QuotaDialog role="dialog" aria-modal="true" aria-labelledby="app-quota-title" onClick={event => event.stopPropagation()}>
            <DialogTitleRow>
              <Octicon name="upload" size={24} aria-hidden="true" />
              <DialogTitle id="app-quota-title">앱을 더 만들 수 없습니다</DialogTitle>
            </DialogTitleRow>
            <DialogCopy>· 개인 앱 {appQuota?.used ?? appCount}개를 사용 중이며 한도는 {appQuota?.limit ?? '—'}개입니다.</DialogCopy>
            <DialogCopy>· 쓰지 않는 앱을 지우면 다시 만들 수 있습니다.</DialogCopy>
            <DialogCopy>· 더 필요하면 팀을 만들어 팀 앱을 쓰세요.</DialogCopy>
            <DialogActions>
              <Button variant="secondary" icon={<Octicon name="upload" size={16} />} onClick={() => setQuotaOpen(false)}>Apps 목록</Button>
              <Button variant="primary" icon={<Octicon name="people" size={16} />} onClick={() => navigate('/teams/new')}>팀 만들기</Button>
            </DialogActions>
          </QuotaDialog>
        </DialogBackdrop>
      )}
    </StudentShell>
  );
}

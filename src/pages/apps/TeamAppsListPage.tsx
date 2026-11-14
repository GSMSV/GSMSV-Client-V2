import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { AppResourceCard, listTeamApps, type AppSummary } from '../../entities/app';
import { getSessionUser } from '../../entities/session';
import { getTeam, listMyTeams, type TeamDetail, type TeamRole, type TeamSummary } from '../../entities/team';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';
import { isDemoMode } from '../../shared/demo';

const TEAM_APP_LIMIT = 4;

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

const HeadingRow = styled.section`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
`;

const HeadingCopy = styled.div`
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

const CreateNote = styled.p`
  margin: -12px 0 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const SummaryRow = styled.section`
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: 100%;
`;

const TeamUsageCard = styled(UsageCard)`
  width: auto;
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

const EmptyCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const ScopeError = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

interface Loadable<T> {
  value: T | null;
  loading: boolean;
  error: boolean;
}

const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

const roleLabel: Record<TeamRole, string> = {
  leader: '팀장',
  devops: 'DevOps',
  member: '팀원',
};

export default function TeamAppsListPage({ teamId }: { teamId: string }) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const demoMode = import.meta.env.DEV && isDemoMode();
  const [team, setTeam] = useState<Loadable<TeamDetail>>(initialLoadable);
  const [apps, setApps] = useState<Loadable<AppSummary[]>>(initialLoadable);
  const [teams, setTeams] = useState<Loadable<TeamSummary[]>>(initialLoadable);
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setTeam(current => ({ ...current, loading: true, error: false }));
    setApps(current => ({ ...current, loading: true, error: false }));
    setTeams(current => ({ ...current, loading: true, error: false }));

    if (import.meta.env.DEV && demoMode) {
      void Promise.all([
        import('../../entities/team/demo'),
        import('../../entities/app/demo'),
      ]).then(([teamRepository, app]) => {
        if (signal.aborted) return;
        const demoTeam = teamRepository.getDemoTeam(teamId) ?? null;
        const teamApps = app.getDemoAppSummaries({ type: 'team', id: teamId, name: demoTeam?.name ?? 'GSM Connect' });
        const teams = teamRepository.listDemoTeams();
        setTeam(demoTeam ? { value: demoTeam, loading: false, error: false } : { value: null, loading: false, error: true });
        setApps({ value: teamApps, loading: false, error: false });
        setTeams({ value: teams, loading: false, error: false });
      }).catch(() => {
        if (signal.aborted) return;
        setTeam({ value: null, loading: false, error: true });
        setApps({ value: null, loading: false, error: true });
        setTeams({ value: null, loading: false, error: true });
      });
      return;
    }

    const [teamResult, appResult, teamsResult] = await Promise.allSettled([
      getTeam(teamId, signal),
      listTeamApps({ teamId, signal }),
      listMyTeams(signal),
    ]);
    if (signal.aborted) return;

    setTeam(teamResult.status === 'fulfilled'
      ? { value: teamResult.value, loading: false, error: false }
      : { value: null, loading: false, error: true });
    setApps(appResult.status === 'fulfilled'
      ? { value: appResult.value, loading: false, error: false }
      : { value: null, loading: false, error: true });
    setTeams(teamsResult.status === 'fulfilled'
      ? { value: teamsResult.value, loading: false, error: false }
      : { value: null, loading: false, error: true });
  }, [demoMode, teamId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, retryKey]);

  const scopeOptions = useMemo(() => {
    const availableTeams = (teams.value ?? []).map(option => ({
      id: option.id,
      label: `${option.name} · ${option.id === team.value?.id && team.value.my_role === null ? '관리자' : roleLabel[option.my_role]}`,
    }));
    if (team.value && !availableTeams.some(option => option.id === team.value?.id)) {
      availableTeams.push({
        id: team.value.id,
        label: `${team.value.name} · ${team.value.my_role ? roleLabel[team.value.my_role] : '관리자'}`,
      });
    }

    return [
      { id: 'personal', label: '내 Resources', selected: false, onSelect: () => navigate('/apps') },
      ...availableTeams.map(option => ({
        id: option.id,
        label: option.label,
        selected: option.id === teamId,
        onSelect: () => navigate(`/teams/${encodeURIComponent(option.id)}/apps`),
      })),
    ];
  }, [navigate, team.value, teamId, teams.value]);

  const teamScope = team.value;
  const scopeLabel = teamScope
    ? `${teamScope.name} · ${teamScope.my_role ? roleLabel[teamScope.my_role] : '관리자'}`
    : '팀 Resources';
  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home' || item === 'team') navigate(`/teams/${encodeURIComponent(teamId)}`);
    if (item === 'apps') navigate(`/teams/${encodeURIComponent(teamId)}/apps`);
    if (item === 'database') navigate(`/databases?owner=${encodeURIComponent(teamId)}`);
  };
  const retry = () => setRetryKey(value => value + 1);
  const appCount = apps.value?.length ?? 0;

  return (
    <StudentShell
      activeItem="apps"
      scopeLabel={scopeLabel}
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
        <Breadcrumb>{teamScope?.name ?? '팀'} / Apps</Breadcrumb>
        <HeadingRow>
          <HeadingCopy>
            <Title>Apps</Title>
            <Description>{teamScope ? `${teamScope.name} 팀에서 관리하는 Apps입니다.` : '팀 Apps를 불러오고 있습니다.'}</Description>
          </HeadingCopy>
          <Button variant="primary" icon={<Octicon name="plus" size={16} />} disabled={!team.value || (team.value.status !== 'approved' && !(demoMode && team.value.status === 'pending')) || (demoMode && team.value.my_role === 'member') || apps.loading || apps.error || !apps.value || appCount >= TEAM_APP_LIMIT} onClick={() => navigate(`/teams/${encodeURIComponent(teamId)}/apps/new`)} title={team.value && team.value.status !== 'approved' ? '팀이 승인되면 앱을 만들 수 있어요' : appCount >= TEAM_APP_LIMIT ? '팀 Apps 생성 한도에 도달했습니다.' : undefined}>새 앱</Button>
        </HeadingRow>
        {team.value && team.value.status !== 'approved' && <CreateNote role="note">팀이 승인되면 앱을 만들 수 있어요</CreateNote>}
        {appCount >= TEAM_APP_LIMIT && <CreateNote role="note">팀 Apps는 최대 {TEAM_APP_LIMIT}개까지 만들 수 있습니다.</CreateNote>}

        {teams.error && (
          <ScopeError role="alert">
            팀 범위 목록을 불러오지 못했습니다.
            <Button variant="ghost" onClick={retry}>다시 시도</Button>
          </ScopeError>
        )}

        <SummaryRow aria-label="팀 Apps 사용량">
          {apps.loading && !apps.value ? <LoadingCard width="371px" height={174} /> : apps.error || !apps.value ? (
            <TeamUsageCard label="팀 Apps" value="— / 4" caption="팀 Apps 사용량을 확인할 수 없습니다." icon={<Octicon name="code" size={16} />} />
          ) : (
            <TeamUsageCard
              label="팀 Apps"
              value={`${appCount} / ${TEAM_APP_LIMIT}`}
              caption="팀 Apps 최대 4개 · 목록 응답 기준"
              icon={<Octicon name="code" size={16} />}
              meter={{ value: Math.min(100, (appCount / TEAM_APP_LIMIT) * 100), tone: appCount >= TEAM_APP_LIMIT ? 'warning' : 'primary', label: '팀 Apps 사용량' }}
            />
          )}
        </SummaryRow>

        {team.loading && !team.value ? <LoadingCard width="100%" height={416} /> : team.error || !team.value ? (
          <ErrorCard onRetry={retry} />
        ) : (
          <Section>
            <SectionTitle>{team.value.name} Apps</SectionTitle>
            {apps.loading && !apps.value ? (
              <CardsRow><LoadingCard width="calc((100% - 32px) / 3)" height={180} /></CardsRow>
            ) : apps.error || !apps.value ? (
              <ErrorCard onRetry={retry} />
            ) : apps.value.length ? (
              <CardsRow>
                {apps.value.map(app => (
                  <AppResourceCard key={app.grn} app={app} onOpen={() => navigate(demoMode
                    ? `/apps/${encodeURIComponent(app.id)}/demo`
                    : `/apps/${encodeURIComponent(app.grn)}`)} />
                ))}
              </CardsRow>
            ) : (
              <EmptySurface>
                <EmptyTitle>아직 팀 Apps가 없습니다</EmptyTitle>
                <EmptyCopy>팀에서 사용할 Apps가 이곳에 표시됩니다.</EmptyCopy>
              </EmptySurface>
            )}
          </Section>
        )}
      </Page>
    </StudentShell>
  );
}

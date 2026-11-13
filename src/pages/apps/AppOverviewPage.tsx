import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getAppStatusDisplay } from '../../entities/app';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { ApiRequestError } from '../../shared/api';
import { Button } from '../../shared/ui/controls';
import { SegmentedControl } from '../../shared/ui/controls/SelectionControls';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';
import { extendApp } from '../../features/app/view-app/api/extendApp';
import { getApp, type AppDetail, type AppEnvironment } from '../../features/app/view-app/api/getApp';

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
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Heading = styled.section`
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
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const HeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
`;

const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryRow = styled.section`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const SummaryCard = styled.article`
  display: flex;
  min-width: 0;
  min-height: 130px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const SummaryLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const SummaryValue = styled.strong`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SummaryCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
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

const EnvironmentCard = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const EnvironmentHelp = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ServiceGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1040px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const ServiceCard = styled.article`
  display: flex;
  min-width: 0;
  min-height: 180px;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const ServiceCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ServiceIcon = styled.span`
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
`;

const ServiceName = styled.h3`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ServiceId = styled.code`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyPanel = styled.div`
  display: flex;
  min-height: 132px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: center;
`;

const NotFoundCard = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const NotFoundTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const NotFoundCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const InlineStatus = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const AppStatus = styled.span<{ $tone: 'primary' | 'warning' | 'danger' | 'neutral' }>`
  flex: 0 0 auto;
  color: ${({ theme, $tone }) => $tone === 'primary' ? theme.colors.primary : $tone === 'warning' ? theme.colors.warning : $tone === 'danger' ? theme.colors.danger : theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const SubsectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

interface LoadableApp { value: AppDetail | null; loading: boolean; error: boolean; notFound: boolean; }

const initialLoadable = (): LoadableApp => ({ value: null, loading: true, error: false, notFound: false });
const roleLabel: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Seoul',
  }).format(date);
}

function getExpiryDays(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return Math.ceil((timestamp - Date.now()) / 86_400_000);
}

function getAppStatus(status: string) {
  return getAppStatusDisplay(status);
}

function canExtendNow(app: AppDetail) {
  const days = getExpiryDays(app.expires_at);
  return app.permissions.extend && days !== null && days <= 7 && days >= -3 && app.status !== 'deleting';
}

function getExpiryMessage(app: AppDetail) {
  const days = getExpiryDays(app.expires_at);
  if (days === null || days > 7 || days < -3 || app.status === 'deleting') return null;
  if (days < 0) {
    const graceEndsAt = new Date(Date.parse(app.expires_at) + 3 * 86_400_000).toISOString();
    return {
      tone: 'danger' as const,
      title: '사용 기간이 끝났습니다',
      description: `${formatDateTime(graceEndsAt)} 전에 연장하면 앱을 다시 사용할 수 있습니다.`,
    };
  }
  return {
    tone: days <= 3 ? 'warning' as const : 'primary' as const,
    title: `만료까지 ${days}일 남았습니다`,
    description: `사용 종료 예정: ${formatDateTime(app.expires_at)}. 만료 전에 연장하면 연결된 Database보다 먼저 끝나지 않게 함께 연장됩니다.`,
  };
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <ErrorCard onRetry={onRetry} />;
}

export default function AppOverviewPage() {
  const navigate = useNavigate();
  const { appGrn } = useParams<{ appGrn: string }>();
  const user = getSessionUser();
  const [app, setApp] = useState<LoadableApp>(initialLoadable);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>();
  const [extending, setExtending] = useState(false);
  const [extensionMessage, setExtensionMessage] = useState('');
  const scopeLabel = app.value?.owner.type === 'team' ? `${app.value.owner.name} · 팀` : '내 Resources';

  const loadApp = useCallback(async (signal: AbortSignal) => {
    if (!appGrn) {
      setApp({ value: null, loading: false, error: false, notFound: true });
      return;
    }
    setApp(current => ({ ...current, loading: true, error: false, notFound: false }));
    try {
      const value = await getApp(appGrn, signal);
      if (!signal.aborted) setApp({ value, loading: false, error: false, notFound: false });
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof ApiRequestError && error.status === 404) {
        setApp({ value: null, loading: false, error: false, notFound: true });
      } else {
        setApp({ value: null, loading: false, error: true, notFound: false });
      }
    }
  }, [appGrn]);

  useEffect(() => {
    const controller = new AbortController();
    void loadApp(controller.signal);
    return () => controller.abort();
  }, [loadApp, retryKey]);

  useEffect(() => {
    const controller = new AbortController();
    void listMyTeams(controller.signal)
      .then(value => { if (!controller.signal.aborted) setTeams(value); })
      .catch(() => { if (!controller.signal.aborted) setTeams([]); });
    return () => controller.abort();
  }, []);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const owner = app.value?.owner;
    const teamId = owner?.type === 'team' ? owner.id : undefined;
    if (item === 'home') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}` : '/');
    if (item === 'team') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}` : '/teams');
    if (item === 'apps') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}/apps` : '/apps');
    if (item === 'database') navigate(teamId ? `/databases?owner=${encodeURIComponent(teamId)}` : '/databases');
  };

  const scopeOptions = useMemo(() => {
    const owner = app.value?.owner;
    const options = [
      { id: 'personal', label: '내 Resources', selected: owner?.type !== 'team', onSelect: () => navigate('/apps') },
      ...teams.map(team => ({
        id: team.id,
        label: `${team.name} · ${roleLabel[team.my_role]}`,
        selected: owner?.type === 'team' && owner.id === team.id,
        onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}/apps`),
      })),
    ];
    if (owner?.type === 'team' && !teams.some(team => team.id === owner.id)) {
      options.push({
        id: owner.id,
        label: `${owner.name} · 팀`,
        selected: true,
        onSelect: () => navigate(`/teams/${encodeURIComponent(owner.id)}/apps`),
      });
    }
    return options;
  }, [app.value?.owner, navigate, teams]);

  const handleExtend = async () => {
    if (!app.value || !appGrn || extending || !canExtendNow(app.value)) return;
    setExtending(true);
    setExtensionMessage('');
    try {
      const updated = await extendApp(appGrn);
      setApp({ value: updated, loading: false, error: false, notFound: false });
      setExtensionMessage(`사용 기간이 ${formatDateTime(updated.expires_at)}까지 연장되었습니다.`);
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'EXTENSION_NOT_YET_AVAILABLE') {
        setExtensionMessage('아직 연장할 수 있는 기간이 아닙니다. 사용 종료 7일 전부터 다시 시도해 주세요.');
      } else {
        setExtensionMessage('사용 기간을 연장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setExtending(false);
    }
  };

  const shell = (children: React.ReactNode) => (
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
      {children}
    </StudentShell>
  );

  if (app.loading) {
    return shell(
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        <Heading><TitleBlock><LoadingCard width={280} height={42} /><LoadingCard width={340} height={22} /></TitleBlock></Heading>
        <LoadingCard height={42} />
        <LoadingCard height={82} />
        <EnvironmentCard><LoadingCard height={42} /></EnvironmentCard>
        <SummaryRow><LoadingCard height={130} /><LoadingCard height={130} /><LoadingCard height={130} /></SummaryRow>
        <Section><SectionTitle>서비스</SectionTitle><ServiceGrid><LoadingCard height={180} /><LoadingCard height={180} /></ServiceGrid></Section>
      </Page>,
    );
  }

  if (app.notFound) {
    return shell(
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        <NotFoundCard>
          <NotFoundTitle>앱을 찾을 수 없습니다</NotFoundTitle>
          <NotFoundCopy>· 주소가 바뀌었거나 지워진 앱입니다.</NotFoundCopy>
          <NotFoundCopy>· 볼 수 있는 권한이 없는 앱도 이렇게 보입니다.</NotFoundCopy>
          <Button variant="secondary" onClick={() => navigate('/apps')}>Apps 목록</Button>
        </NotFoundCard>
      </Page>,
    );
  }

  if (app.error || !app.value) {
    return shell(<Page><Breadcrumb>Apps</Breadcrumb><ErrorState onRetry={() => setRetryKey(value => value + 1)} /></Page>);
  }

  const value = app.value;
  const status = getAppStatus(value.status);
  const expiryMessage = getExpiryMessage(value);
  const environments = value.envs;
  const activeEnvironment: AppEnvironment | undefined = environments.find(environment => environment.id === selectedEnvironmentId) ?? environments[0];

  return shell(
    <Page>
      <Breadcrumb>Apps</Breadcrumb>
      <Heading>
        <TitleBlock>
          <Title title={value.name}>{value.name}</Title>
          <Subtitle>{value.owner.name} · {value.owner.type === 'team' ? '팀 앱' : '개인 앱'} · {value.created_by}</Subtitle>
        </TitleBlock>
        <HeaderActions>
          <Button variant="secondary" icon={<Octicon name="plus" size={16} />} disabled title="서비스 추가는 아직 사용할 수 없습니다.">서비스 추가</Button>
        </HeaderActions>
      </Heading>

      <Tabs aria-label="앱 화면">
        <Button variant="primary" aria-current="page">개요</Button>
        <Button variant="ghost" onClick={() => navigate(`/apps/${encodeURIComponent(value.grn)}/settings`)}>설정</Button>
      </Tabs>

      {expiryMessage && <Banner
        title={expiryMessage.title}
        description={expiryMessage.description}
        tone={expiryMessage.tone}
        icon={<Octicon name="clock" size={20} />}
        action={value.permissions.extend ? <Button variant="secondary" icon={<Octicon name="calendar" size={16} />} onClick={() => void handleExtend()} disabled={extending || !canExtendNow(value)}>{extending ? '연장 중…' : '사용 기간 연장'}</Button> : undefined}
      />}
      {value.status === 'deleting' && <Banner title="앱을 삭제하고 있습니다" description="삭제 요청이 접수되어 앱을 정리 중입니다." tone="danger" icon={<Octicon name="alert" size={20} />} />}
      {extensionMessage && <InlineStatus role="status">{extensionMessage}</InlineStatus>}

      <EnvironmentCard>
        <SectionTitle>환경</SectionTitle>
        {environments.length > 0 ? (
          <SegmentedControl
            label="앱 환경"
            value={activeEnvironment?.id}
            options={environments.map(environment => ({ value: environment.id, label: environment.name }))}
            onChange={setSelectedEnvironmentId}
          />
        ) : <EmptyPanel>환경 정보를 불러올 수 없습니다.</EmptyPanel>}
        <EnvironmentHelp>
          {activeEnvironment ? `선택된 환경: ${activeEnvironment.name} · 환경별 서비스 연결 정보가 없어 아래에는 앱 전체 서비스가 표시됩니다.` : '환경 정보를 불러올 수 없습니다.'}
        </EnvironmentHelp>
      </EnvironmentCard>

      <SummaryRow aria-label="앱 사용량">
        <SummaryCard>
          <SummaryLabel><Octicon name="server" size={16} />서비스</SummaryLabel>
          <SummaryValue>{value.services.length}개</SummaryValue>
          <SummaryCaption>서비스별 이름과 종류 정보는 제공되지 않습니다.</SummaryCaption>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel><Octicon name="cpu" size={16} />메모리 할당량</SummaryLabel>
          <SummaryValue>— / —</SummaryValue>
          <SummaryCaption>메모리 사용량 정보가 없습니다.</SummaryCaption>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel><Octicon name="sync" size={16} />최근 배포</SummaryLabel>
          <SummaryValue>{value.deployments.length ? `${value.deployments.length}개` : '—'}</SummaryValue>
          <SummaryCaption>배포 기록의 상세 시각과 상태 정보가 없습니다.</SummaryCaption>
        </SummaryCard>
      </SummaryRow>

      <Section>
        <SectionTitle>앱 전체 서비스</SectionTitle>
        {value.services.length ? (
          <ServiceGrid>
            {value.services.map((serviceId, index) => (
              <ServiceCard key={serviceId}>
                <ServiceCardHeader>
                  <ServiceIcon aria-hidden="true"><Octicon name="globe" size={16} /></ServiceIcon>
                  <Button variant="secondary" icon={<Octicon name="arrow-right" size={16} />} disabled title="서비스 상세 화면을 준비 중입니다.">열기</Button>
                </ServiceCardHeader>
                <ServiceName>서비스 {index + 1}</ServiceName>
                <ServiceId title={serviceId}>{serviceId}</ServiceId>
                <SubsectionDivider />
                <SummaryCaption>서비스 상세 정보를 확인할 수 없습니다.</SummaryCaption>
              </ServiceCard>
            ))}
          </ServiceGrid>
        ) : (
          <EmptyPanel>이 앱에 연결된 서비스가 없습니다.</EmptyPanel>
        )}
      </Section>

      <SummaryCaption>도메인 {value.domains.length}개 · 생성 {formatDateTime(value.created_at)} · 상태 <AppStatus $tone={status.tone}>{status.label}</AppStatus></SummaryCaption>
    </Page>,
  );
}

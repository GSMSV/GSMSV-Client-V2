import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import { getApiHealth, type ApiHealth } from '../../features/status/get-api-health';
import { ApiRequestError } from '../../shared/api';
import { isDemoMode } from '../../shared/demo/model/demoMode';
import { Button } from '../../shared/ui/controls';
import { Banner } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';

const AUTO_REFRESH_INTERVAL_MS = 60_000;

const Screen = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.canvas};
`;

const Header = styled.header`
  display: flex;
  width: 100%;
  min-height: 74px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 560px) {
    flex-wrap: wrap;
    row-gap: 8px;
    padding: 12px 16px;
  }
`;

const Brand = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
`;

const BrandLogo = styled.img`
  display: block;
  width: 24px;
  height: 24px;
`;

const BrandLabel = styled.span`
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const HeaderActions = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Content = styled.main`
  display: flex;
  width: 100%;
  max-width: 1440px;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  margin: 0 auto;
  padding: 48px 40px 80px;
`;

const CenterColumn = styled.div`
  display: flex;
  width: min(960px, 100%);
  flex-direction: column;
  gap: 24px;
  align-self: center;
`;

const Heading = styled.header`
  display: flex;
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

const Panel = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const PanelHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/42px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const StatusBadge = styled.span<{ $state: 'up' | 'down' | 'unknown' }>`
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $state }) => $state === 'up' ? theme.colors.primarySoft : $state === 'down' ? theme.colors.dangerSoft : theme.colors.raised};
  color: ${({ theme, $state }) => $state === 'up' ? theme.colors.primary : $state === 'down' ? theme.colors.danger : theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const UptimeBadge = styled.span<{ $state: 'normal' | 'slow' | 'unknown' }>`
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $state }) => $state === 'slow' ? theme.colors.warningSoft : $state === 'normal' ? theme.colors.primarySoft : theme.colors.raised};
  color: ${({ theme, $state }) => $state === 'slow' ? theme.colors.warning : $state === 'normal' ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Notice = styled.div<{ $tone: 'warning' | 'surface' }>`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warningSoft : theme.colors.surface};
`;

const NoticeIcon = styled.span<{ $tone: 'warning' | 'surface' }>`
  display: inline-flex;
  color: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warning : theme.colors.muted};
`;

const NoticeCopy = styled.div`display: flex; min-width: 0; flex-direction: column; gap: 8px;`;
const NoticeTitle = styled.strong<{ $tone: 'warning' | 'surface' }>`
  color: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warning : theme.colors.text};
  font: 500 14px/20px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const NoticeBody = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const ComponentRows = styled.div`display: flex; flex-direction: column; gap: 32px; width: 100%;`;
const ComponentRow = styled.div`display: flex; flex-direction: column; gap: 8px; width: 100%;`;
const ComponentHeader = styled.div`display: flex; min-height: 26px; align-items: center; justify-content: space-between; gap: 16px;`;
const ComponentName = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const UptimeTrack = styled.div`
  display: flex;
  width: 100%;
  height: 28px;
  gap: 2px;
`;
const UptimeSegment = styled.span<{ $state: 'normal' | 'slow' | 'incident' | 'maintenance' | 'unknown' }>`
  min-width: 0;
  flex: 1 1 0;
  height: 28px;
  border-radius: 2px;
  background: ${({ theme, $state }) => $state === 'normal' ? theme.colors.primary
    : $state === 'slow' ? theme.colors.warning
      : $state === 'incident' ? theme.colors.danger : $state === 'maintenance' ? theme.colors.faint : theme.colors.raised};
`;
const UptimeScale = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const UptimePercent = styled.span`color: ${({ theme }) => theme.colors.muted};`;
const HistoryDivider = styled.div`width: 100%; height: 1px; background: ${({ theme }) => theme.colors.border};`;
const Legend = styled.div`display: flex; flex-wrap: wrap; gap: 16px;`;
const LegendItem = styled.span`display: inline-flex; align-items: center; gap: 8px; color: ${({ theme }) => theme.colors.muted}; font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;`;
const LegendSwatch = styled.span<{ $state: 'normal' | 'slow' | 'incident' | 'maintenance' }>`
  width: 8px; height: 8px; flex: 0 0 8px; border-radius: 2px;
  background: ${({ theme, $state }) => $state === 'normal' ? theme.colors.primary
    : $state === 'slow' ? theme.colors.warning
      : $state === 'incident' ? theme.colors.danger : theme.colors.faint};
`;
const HistoryNote = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const IncidentList = styled.div`display: flex; flex-direction: column; width: 100%;`;
const IncidentRow = styled.div`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 0 0 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { padding-bottom: 16px; }
`;
const IncidentIcon = styled.span<{ $ongoing?: boolean }>`
  display: inline-flex;
  align-self: center;
  color: ${({ theme, $ongoing }) => $ongoing ? theme.colors.warning : theme.colors.muted};
`;
const IncidentCopy = styled.div`display: flex; min-width: 0; flex-direction: column; gap: 8px;`;
const IncidentTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: 500 14px/20px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const IncidentDescription = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const IncidentDate = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Footer = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

interface HealthState {
  value: ApiHealth | null;
  checkedAt: Date | null;
  loading: boolean;
  error: boolean;
}

type HistorySegmentState = 'normal' | 'slow' | 'incident' | 'maintenance' | 'unknown';
interface ComponentHistory { name: string; status: 'normal' | 'slow'; uptime: string; exceptions: Record<number, HistorySegmentState>; }
interface Incident { title: string; description: string; date: string; icon: 'alert' | 'check-circle' | 'calendar'; ongoing?: boolean; }
interface StatusNotice { title: string; description: string; icon: 'alert' | 'calendar'; tone: 'warning' | 'surface'; }
interface StatusDemoData {
  componentHistory: readonly ComponentHistory[];
  incidents: readonly Incident[];
  notices: readonly StatusNotice[];
  historyDescription: string;
  statusScenarios: typeof import('./statusDemoData').statusScenarios;
}

const componentNames = ['로그인', 'VM 생성', 'VM Network·접속', 'Serverless'];

function initialState(): HealthState {
  return { value: null, checkedAt: null, loading: true, error: false };
}

function formatCheckedAt(value: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Seoul',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}.${part('month')}.${part('day')} ${part('hour')}:${part('minute')}`;
}

function isUnhealthyError(error: unknown) {
  return error instanceof ApiRequestError && error.status === 503;
}

export default function PublicStatusPage() {
  const demoMode = isDemoMode();
  const [searchParams] = useSearchParams();
  const requestedScenario = searchParams.get('status');
  const scenario = requestedScenario === 'network-outage' || requestedScenario === 'maintenance' || requestedScenario === 'normal'
    ? requestedScenario
    : undefined;
  const [health, setHealth] = useState<HealthState>(initialState);
  const [demoData, setDemoData] = useState<StatusDemoData | null>(null);

  useEffect(() => {
    if (!demoMode) return;
    let active = true;
    void import('./statusDemoData').then(data => {
      if (active) setDemoData(data);
    });
    return () => { active = false; };
  }, [demoMode]);

  const refresh = useCallback(async (signal: AbortSignal) => {
    setHealth(current => ({ ...current, loading: true, error: false }));
    try {
      const value = await getApiHealth(signal);
      if (!signal.aborted) setHealth({ value, checkedAt: new Date(), loading: false, error: false });
    } catch (error) {
      if (signal.aborted) return;
      if (isUnhealthyError(error)) {
        setHealth({ value: { status: 'DOWN' }, checkedAt: new Date(), loading: false, error: false });
        return;
      }
      setHealth({ value: null, checkedAt: null, loading: false, error: true });
    }
  }, []);

  useEffect(() => {
    if (demoMode) return;
    const controller = new AbortController();
    let requestInFlight = false;
    const refreshIfIdle = async () => {
      if (requestInFlight || controller.signal.aborted) return;
      requestInFlight = true;
      try {
        await refresh(controller.signal);
      } finally {
        requestInFlight = false;
      }
    };

    void refreshIfIdle();
    const interval = window.setInterval(() => { void refreshIfIdle(); }, AUTO_REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      controller.abort();
    };
  }, [demoMode, refresh]);

  const state = demoMode && demoData ? 'up' : health.loading ? 'unknown' : health.value?.status === 'UP' ? 'up' : health.value?.status === 'DOWN' ? 'down' : 'unknown';
  const stateLabel = state === 'up' ? '정상' : state === 'down' ? '응답하지 않음' : health.error ? '확인 실패' : '확인 중';
  const demoScenario = demoMode && scenario ? demoData?.statusScenarios[scenario] : undefined;
  const components = demoMode && demoData
    ? demoData.componentHistory
    : componentNames.map(name => ({ name, status: 'unknown' as const, uptime: '', exceptions: {} }));
  return (
    <Screen>
      <Header>
        <Brand href="/" aria-label="GSM SV 홈">
          <BrandLogo src="/assets/gsmsv-logo.svg" alt="" />
          <BrandLabel>GSM SV 상태</BrandLabel>
        </Brand>
        <HeaderActions aria-label="페이지 이동">
          <Button variant="ghost" onClick={() => window.location.assign('/docs')} icon={<Octicon name="book" size={16} />}>Docs</Button>
          <Button variant="secondary" onClick={() => window.location.assign('/')} icon={<Octicon name="arrow-right" size={16} />}>GSM SV 열기</Button>
        </HeaderActions>
      </Header>

      <Content>
        <CenterColumn>
          <Heading>
            <Title>GSM SV 서비스 상태</Title>
            <Subtitle>
              {demoMode ? '2026.09.30 14:32 기준 · 운영 상태 예시' : health.checkedAt ? `${formatCheckedAt(health.checkedAt)} 기준 · 1분마다 갱신됩니다` : 'API 상태를 확인합니다. · 1분마다 갱신됩니다'}
            </Subtitle>
          </Heading>

          {demoScenario ? <Banner
            title={demoScenario.title}
            description={<>{demoScenario.description}{demoScenario.details.map(detail => <div key={detail}>{detail}</div>)}</>}
            tone={demoScenario.tone}
            icon={<Octicon name={demoScenario.icon} size={20} />}
          /> : demoMode && demoData ? demoData.notices.map(notice => <Notice key={notice.title} $tone={notice.tone}>
            <NoticeIcon $tone={notice.tone} aria-hidden="true"><Octicon name={notice.icon} size={20} /></NoticeIcon>
            <NoticeCopy><NoticeTitle $tone={notice.tone}>{notice.title}</NoticeTitle><NoticeBody>{notice.description}</NoticeBody></NoticeCopy>
          </Notice>) : <Notice $tone="surface">
            <NoticeIcon $tone="surface" aria-hidden="true"><Octicon name="info" size={20} /></NoticeIcon>
            <NoticeCopy><NoticeTitle $tone="surface">일부 서비스 상태를 확인할 수 없습니다</NoticeTitle><NoticeBody>현재 API 상태만 제공됩니다. 구성요소별 상태와 점검 정보는 확인 가능한 데이터가 없습니다.</NoticeBody></NoticeCopy>
          </Notice>}

          <Panel aria-labelledby="components-title">
            <PanelHeading><PanelTitle id="components-title">구성요소 · 지난 90일</PanelTitle></PanelHeading>
            <ComponentRows>
              {components.map(component => {
                const componentStatus = demoScenario && scenario === 'normal' ? 'normal' : component.status;
                const currentLabel = componentStatus === 'slow' ? '성능 저하' : componentStatus === 'normal' ? '정상' : '확인 불가';
                const uptime = component.status === 'unknown' ? '확인 불가' : component.uptime;
                return <ComponentRow key={component.name}>
                  <ComponentHeader>
                    <ComponentName>{component.name}</ComponentName>
                    {component.name === '로그인'
                      ? <StatusBadge $state={state}>{stateLabel}</StatusBadge>
                      : demoScenario && scenario === 'network-outage' && component.name === 'VM Network·접속'
                        ? <StatusBadge $state="down">장애</StatusBadge>
                        : <UptimeBadge $state={componentStatus}>{demoScenario && scenario === 'maintenance' && component.name === 'VM 생성' ? '계획 점검' : currentLabel}</UptimeBadge>}
                  </ComponentHeader>
                  <UptimeTrack role="img" aria-label={`${component.name}, 지난 90일 가용률 ${uptime}`}>
                    {Array.from({ length: 90 }, (_, day) => {
                      const segmentState = component.status === 'unknown' ? 'unknown' : component.exceptions[day] ?? 'normal';
                      const labels: Record<HistorySegmentState, string> = { normal: '정상', slow: '성능 저하', incident: '장애', maintenance: '계획 점검', unknown: '확인 불가' };
                      return <UptimeSegment key={day} $state={segmentState} title={segmentState === 'unknown' ? '가용률 데이터 확인 불가' : `${90 - day}일 전 · ${labels[segmentState]}`} aria-hidden="true" />;
                    })}
                  </UptimeTrack>
                  <UptimeScale><span>90일 전</span><UptimePercent>가용률 {uptime}</UptimePercent><span>오늘</span></UptimeScale>
                </ComponentRow>;
              })}
            </ComponentRows>
            <HistoryDivider />
            <Legend aria-label="이력 범례">
              {([['normal', '정상'], ['slow', '성능 저하'], ['incident', '장애'], ['maintenance', '계획 점검']] as const).map(([kind, label]) => <LegendItem key={kind}><LegendSwatch $state={kind} />{label}</LegendItem>)}
            </Legend>
            <HistoryNote>{demoMode && demoData ? demoData.historyDescription : '구성요소별 상태와 지난 90일 가용률 데이터는 아직 제공되지 않습니다.'}</HistoryNote>
          </Panel>

          <Panel aria-labelledby="history-title">
            <PanelTitle id="history-title">지난 90일 이력</PanelTitle>
            <IncidentList>
              {demoMode && demoData ? demoData.incidents.map(incident => <IncidentRow key={incident.title}>
                <IncidentIcon $ongoing={incident.ongoing} aria-hidden="true"><Octicon name={incident.icon} size={20} /></IncidentIcon>
                <IncidentCopy><IncidentTitle>{incident.title}</IncidentTitle><IncidentDescription>{incident.description}</IncidentDescription><IncidentDate>{incident.date}</IncidentDate></IncidentCopy>
              </IncidentRow>) : <IncidentRow>
                <IncidentCopy><IncidentTitle>이력 데이터를 확인할 수 없습니다</IncidentTitle><IncidentDescription>장애·점검 이력 API가 아직 연결되지 않았습니다.</IncidentDescription></IncidentCopy>
              </IncidentRow>}
            </IncidentList>
          </Panel>

          <Footer>이 페이지는 GSM SV와 분리된 서버에서 운영됩니다. 장애 소식은 GSM SV Discord 공지 채널에서도 알립니다.</Footer>
        </CenterColumn>
      </Content>
    </Screen>
  );
}

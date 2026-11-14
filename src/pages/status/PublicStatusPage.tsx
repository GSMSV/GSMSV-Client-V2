import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { getApiHealth, type ApiHealth } from '../../features/status/get-api-health';
import { ApiRequestError } from '../../shared/api';
import { Button } from '../../shared/ui/controls';
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

const UptimeBadge = styled.span<{ $state: 'normal' | 'slow' }>`
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $state }) => $state === 'slow' ? theme.colors.warningSoft : theme.colors.primarySoft};
  color: ${({ theme, $state }) => $state === 'slow' ? theme.colors.warning : theme.colors.primary};
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
const UptimeSegment = styled.span<{ $state: 'normal' | 'slow' | 'incident' | 'maintenance' }>`
  min-width: 0;
  flex: 1 1 0;
  height: 28px;
  border-radius: 2px;
  background: ${({ theme, $state }) => $state === 'normal' ? theme.colors.primary
    : $state === 'slow' ? theme.colors.warning
      : $state === 'incident' ? theme.colors.danger : theme.colors.faint};
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

type HistorySegmentState = 'normal' | 'slow' | 'incident' | 'maintenance';
interface ComponentHistory { name: string; status: 'normal' | 'slow'; uptime: string; exceptions: Record<number, HistorySegmentState>; }

const componentHistory: ComponentHistory[] = [
  { name: '로그인', status: 'normal', uptime: '100%', exceptions: {} },
  { name: 'VM 생성', status: 'normal', uptime: '99.98%', exceptions: { 79: 'slow' } },
  { name: 'VM Network·접속', status: 'normal', uptime: '100%', exceptions: { 72: 'maintenance' } },
  { name: 'Serverless', status: 'slow', uptime: '99.96%', exceptions: { 63: 'incident', 88: 'slow' } },
];

const incidents = [
  { title: 'Serverless 응답 지연 · 진행 중', description: '14:25 · 원인을 확인하고 있습니다. 함수 실행이 평소보다 2초 이상 걸릴 수 있습니다.', date: '2026.09.30 14:10 시작 · Serverless', icon: 'alert' as const, ongoing: true },
  { title: 'VM 생성 지연 · 해결됨', description: '생성 대기열 처리가 늦어져 새 VM 생성이 최대 32분 지연됐습니다.', date: '2026.09.21 10:05–10:37 · VM 생성', icon: 'check-circle' as const },
  { title: '계획 점검 · Network 장비 교체 · 완료', description: '외부 접속 포트와 HTTPS Domain이 잠시 끊겼습니다. 가용률 계산에서 뺐습니다.', date: '2026.09.13 02:00–04:00 · VM Network·접속', icon: 'calendar' as const },
  { title: 'Serverless 장애 · 해결됨', description: '함수 실행 Node가 응답하지 않아 호출이 실패했습니다. Node를 교체했습니다.', date: '2026.09.05 21:40–22:15 · Serverless', icon: 'check-circle' as const },
];

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
  const [health, setHealth] = useState<HealthState>(initialState);

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
  }, [refresh]);

  const state = health.loading ? 'unknown' : health.value?.status === 'UP' ? 'up' : health.value?.status === 'DOWN' ? 'down' : 'unknown';
  const stateLabel = state === 'up' ? '정상' : state === 'down' ? '응답하지 않음' : health.error ? '확인 실패' : '확인 중';
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
              {health.checkedAt ? `${formatCheckedAt(health.checkedAt)} 기준 · 1분마다 갱신됩니다` : 'API 상태를 확인합니다. · 1분마다 갱신됩니다'}
            </Subtitle>
          </Heading>

          <Notice $tone="warning">
            <NoticeIcon $tone="warning" aria-hidden="true"><Octicon name="alert" size={20} /></NoticeIcon>
            <NoticeCopy><NoticeTitle $tone="warning">Serverless 응답이 느립니다 · 성능 저하</NoticeTitle><NoticeBody>14:10부터 함수 실행 응답이 평소보다 느립니다. 원인을 확인하고 있습니다. 로그인, VM 생성, VM 접속은 정상입니다.</NoticeBody></NoticeCopy>
          </Notice>

          <Notice $tone="surface">
            <NoticeIcon $tone="surface" aria-hidden="true"><Octicon name="calendar" size={20} /></NoticeIcon>
            <NoticeCopy><NoticeTitle $tone="surface">예정된 점검 · 10월 4일(일) 02:00–04:00 · VM 생성</NoticeTitle><NoticeBody>점검 중에는 새 VM을 만들 수 없습니다. 실행 중인 VM과 접속에는 영향이 없습니다. 점검 시간은 가용률에서 뺍니다.</NoticeBody></NoticeCopy>
          </Notice>

          <Panel aria-labelledby="components-title">
            <PanelHeading><PanelTitle id="components-title">구성요소 · 지난 90일</PanelTitle></PanelHeading>
            <ComponentRows>
              {componentHistory.map(component => {
                const currentLoginState = component.name === '로그인' ? state : component.status === 'slow' ? 'down' : 'up';
                const currentLoginLabel = component.name === '로그인' ? stateLabel : component.status === 'slow' ? '성능 저하' : '정상';
                return <ComponentRow key={component.name}>
                  <ComponentHeader>
                    <ComponentName>{component.name}</ComponentName>
                    {component.name === '로그인'
                      ? <StatusBadge $state={currentLoginState}>{currentLoginLabel}</StatusBadge>
                      : <UptimeBadge $state={component.status}>{currentLoginLabel}</UptimeBadge>}
                  </ComponentHeader>
                  <UptimeTrack role="img" aria-label={`${component.name}, 지난 90일 가용률 ${component.uptime}`}>
                    {Array.from({ length: 90 }, (_, day) => {
                      const segmentState = component.exceptions[day] ?? 'normal';
                      const labels: Record<HistorySegmentState, string> = { normal: '정상', slow: '성능 저하', incident: '장애', maintenance: '계획 점검' };
                      return <UptimeSegment key={day} $state={segmentState} title={`${90 - day}일 전 · ${labels[segmentState]}`} aria-hidden="true" />;
                    })}
                  </UptimeTrack>
                  <UptimeScale><span>90일 전</span><UptimePercent>가용률 {component.uptime}</UptimePercent><span>오늘</span></UptimeScale>
                </ComponentRow>;
              })}
            </ComponentRows>
            <HistoryDivider />
            <Legend aria-label="이력 범례">
              {([['normal', '정상'], ['slow', '성능 저하'], ['incident', '장애'], ['maintenance', '계획 점검']] as const).map(([kind, label]) => <LegendItem key={kind}><LegendSwatch $state={kind} />{label}</LegendItem>)}
            </Legend>
            <HistoryNote>외부 감시 서버가 1분마다 확인합니다. 3회 연속 실패하면 장애, 응답 시간 95번째 백분위가 2초를 넘는 상태가 5분 이어지면 성능 저하로 표시합니다. 가용률은 정상인 분 ÷ 전체 분이며, 계획 점검 시간은 뺍니다.</HistoryNote>
          </Panel>

          <Panel aria-labelledby="history-title">
            <PanelTitle id="history-title">지난 90일 이력</PanelTitle>
            <IncidentList>
              {incidents.map(incident => <IncidentRow key={incident.title}>
                <IncidentIcon $ongoing={incident.ongoing} aria-hidden="true"><Octicon name={incident.icon} size={20} /></IncidentIcon>
                <IncidentCopy><IncidentTitle>{incident.title}</IncidentTitle><IncidentDescription>{incident.description}</IncidentDescription><IncidentDate>{incident.date}</IncidentDate></IncidentCopy>
              </IncidentRow>)}
            </IncidentList>
          </Panel>

          <Footer>이 페이지는 GSM SV와 분리된 서버에서 운영됩니다. 장애 소식은 GSM SV Discord 공지 채널에서도 알립니다.</Footer>
        </CenterColumn>
      </Content>
    </Screen>
  );
}

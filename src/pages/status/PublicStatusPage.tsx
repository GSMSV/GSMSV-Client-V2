import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { getApiHealth, type ApiHealth } from '../../features/status/get-api-health';
import { ApiRequestError } from '../../shared/api';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';

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
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const StatusCard = styled.div<{ $state: 'up' | 'down' | 'unknown' }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $state }) => $state === 'down' ? theme.colors.dangerSoft : $state === 'up' ? theme.colors.primarySoft : theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
`;

const StatusIcon = styled.span<{ $state: 'up' | 'down' | 'unknown' }>`
  display: inline-flex;
  flex: 0 0 20px;
  color: ${({ theme, $state }) => $state === 'down' ? theme.colors.danger : $state === 'up' ? theme.colors.primary : theme.colors.muted};
`;

const StatusCopy = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`;

const StatusTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const StatusDescription = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const StatusBadge = styled.span<{ $state: 'up' | 'down' | 'unknown' }>`
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $state }) => $state === 'up' ? theme.colors.primarySoft : $state === 'down' ? theme.colors.dangerSoft : theme.colors.raised};
  color: ${({ theme, $state }) => $state === 'up' ? theme.colors.primary : $state === 'down' ? theme.colors.danger : theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const GapDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const HistoryEmpty = styled.div`
  display: flex;
  min-height: 104px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: center;
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

function initialState(): HealthState {
  return { value: null, checkedAt: null, loading: true, error: false };
}

function formatCheckedAt(value: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(value);
}

function isUnhealthyError(error: unknown) {
  return error instanceof ApiRequestError && error.status === 503;
}

export default function PublicStatusPage() {
  const [health, setHealth] = useState<HealthState>(initialState);
  const [refreshKey, setRefreshKey] = useState(0);

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
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh, refreshKey]);

  const state = health.loading ? 'unknown' : health.value?.status === 'UP' ? 'up' : health.value?.status === 'DOWN' ? 'down' : 'unknown';
  const stateLabel = state === 'up' ? '정상' : state === 'down' ? '응답하지 않음' : health.error ? '확인 실패' : '확인 중';
  const description = state === 'up'
    ? 'API 서버 상태 확인 요청이 정상적으로 응답했습니다.'
    : state === 'down'
      ? 'API 서버 상태 확인 요청이 비정상 응답을 받았습니다. 다른 구성요소 상태는 이 응답에 포함되지 않습니다.'
      : health.error
        ? 'API 서버 상태를 불러오지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.'
        : '공개 API에서 현재 확인 가능한 API 서버 상태를 불러오고 있습니다.';

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
              {health.checkedAt ? `API 상태를 ${formatCheckedAt(health.checkedAt)}에 확인했습니다.` : 'API 상태를 확인합니다.'}
            </Subtitle>
          </Heading>

          <StatusCard role="status" aria-live="polite" $state={state}>
            <StatusIcon $state={state} aria-hidden="true">
              <Octicon name={state === 'down' ? 'alert' : state === 'up' ? 'check-circle' : 'pulse'} size={20} />
            </StatusIcon>
            <StatusCopy>
              <StatusTitle>API 서버 · {stateLabel}</StatusTitle>
              <StatusDescription>{description}</StatusDescription>
            </StatusCopy>
            <StatusBadge $state={state}>{stateLabel}</StatusBadge>
          </StatusCard>

          <Panel aria-labelledby="components-title">
            <PanelHeading>
              <PanelTitle id="components-title">구성요소 · 현재 확인 가능</PanelTitle>
              <Button variant="ghost" onClick={() => setRefreshKey(value => value + 1)} disabled={health.loading} icon={<Octicon name="sync" size={16} />}>
                {health.loading ? '확인 중' : '새로고침'}
              </Button>
            </PanelHeading>
            <StatusCard $state={state}>
              <StatusCopy>
                <StatusTitle>API 서버</StatusTitle>
                <StatusDescription>{description}</StatusDescription>
              </StatusCopy>
              <StatusBadge $state={state}>{stateLabel}</StatusBadge>
            </StatusCard>
            <GapDescription>이 결과는 `/actuator/health`의 API 서버 응답만 나타냅니다. 로그인, VM, Network, Database, Apps, Serverless 상태를 대표하지 않습니다.</GapDescription>
          </Panel>

          <Panel aria-labelledby="history-title">
            <PanelTitle id="history-title">지난 90일 이력</PanelTitle>
            <HistoryEmpty>
              90일 가용률, 구성요소별 이력, 장애 및 점검 내역을 제공하는 공개 상태 API가 없습니다.
            </HistoryEmpty>
          </Panel>

          <Footer>서비스 상태 대시보드는 별도 상태 API 계약이 공개되면 이력과 점검 정보를 표시할 수 있습니다. 현재 페이지는 API 서버의 단일 상태 조회만 제공합니다.</Footer>
        </CenterColumn>
      </Content>
    </Screen>
  );
}

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { simulateDemoRequest } from '../../shared/demo';
import { ErrorCard, LoadingCard } from '../../shared/ui/feedback';

export type DemoAppRequestStatus = 'loading' | 'error' | 'ready';

/**
 * 목데이터 Apps 화면의 요청 한 번을 흉내 낸다.
 * 짧은 지연 동안 로딩 카드를 보여 주고, `?demoError=<scope>`면 첫 요청만 실패한다.
 * key가 바뀌면(탭 이동 등) 다시 불러온다.
 */
export function useDemoAppRequest(scope: string, key: string) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${scope}|${key}|${attempt}`;
  const [result, setResult] = useState<{ key: string; status: DemoAppRequestStatus }>({ key: '', status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    simulateDemoRequest(scope, controller.signal).then(
      () => { if (!controller.signal.aborted) setResult({ key: requestKey, status: 'ready' }); },
      () => { if (!controller.signal.aborted) setResult({ key: requestKey, status: 'error' }); },
    );
    return () => controller.abort();
  }, [requestKey, scope]);

  return {
    status: result.key === requestKey ? result.status : 'loading' as DemoAppRequestStatus,
    retry: () => setAttempt(value => value + 1),
  };
}

const SizedError = styled(ErrorCard)<{ $height: number }>`
  height: ${({ $height }) => $height}px;
  min-width: 0;
`;

/** 개요의 요약 카드·서비스 카드 줄과 같은 반응형 격자. */
const Row = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) { grid-template-columns: repeat(${({ $columns }) => Math.min(2, $columns)}, minmax(0, 1fr)); }
  @media (max-width: 600px) { grid-template-columns: minmax(0, 1fr); }
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface StateCardProps {
  error: boolean;
  onRetry: () => void;
  height: number;
  compact?: boolean;
}

function StateCard({ error, onRetry, height, compact }: StateCardProps) {
  if (error) return <SizedError $height={height} size={compact ? 'compact' : 'default'} onRetry={onRetry} />;
  return <LoadingCard width="100%" height={height} />;
}

export const demoServiceStateHeights = {
  deployments: [450, 282],
  logs: [348],
  metrics: [338, 338],
  variables: [270, 314, 200, 216],
  settings: [530, 328, 146],
  domains: [200, 254],
  shell: [326],
} as const;

export type DemoServiceStateTab = keyof typeof demoServiceStateHeights;

type DemoAppStateCardsProps = { status: Exclude<DemoAppRequestStatus, 'ready'>; onRetry: () => void } & (
  | { page: 'overview'; environment: string }
  | { page: 'app-settings' }
  | { page: 'service'; tab: string }
);

/** Figma 로딩·오류 프레임처럼 본문 카드 자리를 로딩 카드나 오류 카드로 채운다. */
export function DemoAppStateCards(props: DemoAppStateCardsProps) {
  const error = props.status === 'error';
  const card = (height: number, extra: Partial<StateCardProps> = {}) => ({ error, onRetry: props.onRetry, height, ...extra });

  if (props.page === 'overview') {
    return (
      <>
        <StateCard {...card(182)} />
        <Row $columns={3}>
          <StateCard {...card(150, { compact: true })} />
          <StateCard {...card(174)} />
          <StateCard {...card(174)} />
        </Row>
        <Section>
          <SectionTitle>서비스 · {props.environment}</SectionTitle>
          <Row $columns={3}>
            <StateCard {...card(254)} />
            <StateCard {...card(254)} />
          </Row>
        </Section>
      </>
    );
  }

  if (props.page === 'app-settings') {
    return [316, 320, 172, 172].map((height, index) => <StateCard key={index} {...card(height)} />);
  }

  const tab = Object.hasOwn(demoServiceStateHeights, props.tab) ? props.tab as DemoServiceStateTab : 'deployments';
  const cards = demoServiceStateHeights[tab].map((height, index) => (
    <StateCard key={index} {...card(height)} />
  ));
  return tab === 'metrics' ? <Row $columns={2}>{cards}</Row> : cards;
}

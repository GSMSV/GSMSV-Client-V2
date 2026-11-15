import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { isDemoMode, simulateDemoRequest } from '../../../shared/demo';
import { ErrorCard, LoadingCard } from '../../../shared/ui/feedback';

export type DemoPageStatus = 'loading' | 'error' | 'ready';

/**
 * 목데이터 화면의 첫 조회를 흉내 낸다. 목데이터 모드에서는 짧게 로딩을 보여 주고,
 * `?demoError=<scope>`이면 첫 조회만 실패시켜 Figma의 로딩·오류 프레임을 볼 수 있게 한다.
 * 목데이터 모드가 아니면 곧바로 ready다.
 */
export function useDemoPageLoad(scope: string) {
  const [status, setStatus] = useState<DemoPageStatus>(() => isDemoMode() ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isDemoMode()) return;
    const controller = new AbortController();
    simulateDemoRequest(scope, controller.signal).then(
      () => { if (!controller.signal.aborted) setStatus('ready'); },
      () => { if (!controller.signal.aborted) setStatus('error'); },
    );
    return () => controller.abort();
  }, [scope, attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt(value => value + 1);
  }, []);

  return { status, retry };
}

/** 한 줄의 카드 높이 목록. 숫자 하나면 전체 폭 카드 하나다. */
export type DemoPlaceholderRow = number | number[] | { title: string };

const Stack = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`;

const Row = styled.div<{ $columns: number }>`
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  align-items: start;
  gap: 16px;

  @media (max-width: 720px) { grid-template-columns: minmax(0, 1fr); }
`;

const RowTitle = styled.h2`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.text};
  font: 500 20px/28px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const SizedError = styled(ErrorCard)<{ $height: number }>`
  height: ${({ $height }) => $height}px;
`;

/** Figma 로딩·오류 프레임처럼 본문 카드 자리에 로딩 막대나 "불러오지 못했습니다"를 채운다. */
export function DemoPagePlaceholder({ status, onRetry, rows, label }: {
  status: Exclude<DemoPageStatus, 'ready'>;
  onRetry: () => void;
  rows: DemoPlaceholderRow[];
  label?: string;
}) {
  return (
    <Stack aria-busy={status === 'loading'} aria-label={status === 'loading' ? (label ?? '불러오는 중') : undefined}>
      {rows.map((row, index) => {
        if (typeof row === 'object' && !Array.isArray(row)) return <RowTitle key={index}>{row.title}</RowTitle>;
        const heights = Array.isArray(row) ? row : [row];
        return (
          <Row key={index} $columns={heights.length}>
            {heights.map((height, cell) => status === 'loading'
              ? <LoadingCard key={cell} height={height} />
              : <SizedError key={cell} $height={height} size={height <= 110 ? 'compact' : 'default'} onRetry={onRetry} />)}
          </Row>
        );
      })}
    </Stack>
  );
}

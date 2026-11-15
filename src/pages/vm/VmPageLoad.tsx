import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { ErrorCard, LoadingCard } from '../../shared/ui/feedback';

export type VmPageLoadStatus = 'loading' | 'error' | 'ready';

/**
 * 목데이터 VM 화면의 본문 로딩을 흉내 낸다.
 * 짧은 지연 동안 Figma의 `로딩` 프레임을, `?demoError=<scope>`이면 첫 요청에서 `오류` 프레임을 보여준다.
 * `key`가 바뀌면(다른 VM, 다른 단계) 다시 불러온다.
 */
export function useVmPageLoad(scope: string, key?: string) {
  const [status, setStatus] = useState<VmPageLoadStatus>(() => isDemoMode() ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isDemoMode()) {
      setStatus('ready');
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    simulateDemoRequest(scope, controller.signal).then(
      () => { if (!controller.signal.aborted) setStatus('ready'); },
      () => { if (!controller.signal.aborted) setStatus('error'); },
    );
    return () => controller.abort();
  }, [scope, key, attempt]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { status, retry };
}

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PlaceholderRow = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const SizedError = styled(ErrorCard)<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
`;

/** 화면 본문 자리에 같은 크기의 로딩·오류 카드를 놓는다. 각 숫자는 카드 높이(px)이며 한 줄 배열이 한 행이다. */
export function VmPagePlaceholder({ status, rows, onRetry }: { status: Exclude<VmPageLoadStatus, 'ready'>; rows: number[][]; onRetry: () => void }) {
  return <Rows aria-busy={status === 'loading'}>
    {rows.map((row, rowIndex) => <PlaceholderRow key={rowIndex} $columns={row.length}>
      {row.map((height, index) => status === 'loading'
        ? <LoadingCard key={index} height={height} />
        : <SizedError key={index} $height={height} size={height <= 150 ? 'compact' : 'default'} onRetry={onRetry} />)}
    </PlaceholderRow>)}
  </Rows>;
}

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button, NavigationItem } from '../../shared/ui/controls';
import { ModalSurface } from '../../shared/ui/feedback/ModalSurface';
import { Octicon } from '../../shared/ui/icons';

export type ServerlessTestTab = 'code' | 'versions' | 'triggers' | 'environment' | 'test' | 'logs';

export interface ServerlessTestResult {
  responseJson: string;
  statusLabel: string;
  statusMessage?: string;
  pathLabel: string;
  pathCaption?: string;
  durationLabel: string;
  durationCaption?: string;
  logs: string;
  timestampLabel?: string;
  dailyExecutionsUsed?: number;
}

export interface ServerlessTestPageProps {
  functionName: string;
  requestPayload?: string;
  result?: ServerlessTestResult | null;
  enabledTabs?: readonly ServerlessTestTab[];
  onExecute?: (requestPayload: string) => void | Promise<void>;
  active?: boolean;
  dailyExecutions?: { used: number; limit: number };
  executionError?: 'inactive' | 'quota' | 'missing' | 'storage' | null;
  onDismissExecutionError: () => void;
  onActivate: () => void;
  onCopyResponse?: (responseJson: string) => void;
  onViewLogs?: () => void;
  onSelectTab?: (tab: ServerlessTestTab) => void;
}

const tabs: { id: ServerlessTestTab; label: string }[] = [
  { id: 'code', label: '코드' },
  { id: 'versions', label: '버전' },
  { id: 'triggers', label: 'Trigger' },
  { id: 'environment', label: '환경변수' },
  { id: 'test', label: '테스트' },
  { id: 'logs', label: 'Logs' },
];

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 960px) { padding: 24px; }
  @media (max-width: 600px) { padding: 20px 16px; }
  @media (max-width: 380px) { padding: 16px 12px; }
`;

const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Heading = styled.header`
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const TabsRow = styled.div`
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 760px) { flex-wrap: wrap; }
`;

const Tabs = styled.nav`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;

  @media (max-width: 760px) {
    width: 100%;
    flex: 1 1 100%;
    overflow-x: auto;
    scrollbar-width: thin;
  }
`;

const TabButton = styled(NavigationItem)<{ $selected?: boolean }>`
  width: auto;
  padding: 0 12px;
  ${({ $selected, theme }) => $selected ? `color: ${theme.colors.primary}; background: ${theme.colors.primarySoft};` : ''}
`;

const TwoColumns = styled.section`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) { grid-template-columns: minmax(0, 1fr); }
`;

const Panel = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 600px) { padding: 16px; }
`;

const PanelHeader = styled.header`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;

  svg { color: ${({ theme }) => theme.colors.primary}; }
`;

const CodeFrame = styled.div`
  display: grid;
  min-height: 98px;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;

  > textarea { min-width: 0; }
`;

const LineNumbers = styled.div`
  color: ${({ theme }) => theme.colors.faint};
  text-align: left;
  user-select: none;
  white-space: pre;
`;

const Editor = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 66px;
  resize: vertical;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  tab-size: 2;
  white-space: pre;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 4px; }
`;

const Output = styled.pre`
  box-sizing: border-box;
  overflow: auto;
  min-height: 66px;
  margin: 0;
  padding: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
  white-space: pre;
`;

const Caption = styled.p`
  min-height: 18px;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const SummaryRow = styled.section`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) { grid-template-columns: minmax(0, 1fr); }
`;

const SummaryCard = styled.article`
  display: flex;
  min-width: 0;
  min-height: 150px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const SummaryLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const SummaryValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const LogsPanel = styled(Panel)`
  width: 100%;
`;

const LogLine = styled.div`
  display: grid;
  min-height: 54px;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;

const EmptyLog = styled.div`
  min-height: 54px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
`;

const ExecutionDialog = styled.div`
  box-sizing: border-box;
  display: flex;
  width: min(480px, calc(100vw - 48px));
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const ExecutionDialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const ExecutionDialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const ExecutionDialogActions = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Placeholder = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

export function ServerlessTestPage({
  functionName,
  requestPayload: initialPayload = '{\n  "name": "지민"\n}',
  result = null,
  enabledTabs = ['test'],
  active = true,
  dailyExecutions,
  executionError = null,
  onDismissExecutionError,
  onActivate,
  onExecute,
  onCopyResponse,
  onViewLogs,
  onSelectTab,
}: ServerlessTestPageProps) {
  const [requestPayload, setRequestPayload] = useState(initialPayload);
  const [isExecuting, setIsExecuting] = useState(false);
  const [jsonErrorOpen, setJsonErrorOpen] = useState(false);
  const lineCount = useMemo(() => requestPayload.split('\n').length, [requestPayload]);
  const payloadError = useMemo(() => {
    try {
      JSON.parse(requestPayload);
      return undefined;
    } catch {
      return '올바른 JSON 형식으로 입력하세요.';
    }
  }, [requestPayload]);
  const responseLineCount = Math.max(1, result?.responseJson.split('\n').length ?? 1);
  const outputLines = result?.logs ? result.logs.split('\n') : [];
  const jsonErrorLine = useMemo(() => {
    const trailingCommas = [...requestPayload.matchAll(/,(\s*[}\]])/g)];
    if (!trailingCommas.length) return undefined;
    const normalizedPayload = requestPayload.replace(/,(\s*[}\]])/g, '$1');
    try {
      JSON.parse(normalizedPayload);
      const index = trailingCommas[0].index;
      return index === undefined ? undefined : requestPayload.slice(0, index).split('\n').length;
    } catch {
      return undefined;
    }
  }, [requestPayload]);
  const execute = async () => {
    if (!onExecute || isExecuting) return;
    if (payloadError) {
      setJsonErrorOpen(true);
      return;
    }
    setIsExecuting(true);
    try {
      await onExecute(requestPayload);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Page data-node-id="53:2031">
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <TitleGroup>
          <Title title={functionName}>{functionName}</Title>
          <Subtitle>입력값을 넣어 함수를 직접 실행해 보세요.</Subtitle>
        </TitleGroup>
      </Heading>

      <TabsRow>
        <Tabs aria-label="함수 관리 메뉴">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={tab.id === 'test'}
              $selected={tab.id === 'test'}
              disabled={!enabledTabs.includes(tab.id)}
              onClick={() => onSelectTab?.(tab.id)}
            />
          ))}
        </Tabs>
        <Button variant="secondary" icon={<Octicon name="history" size={16} />} disabled={!onViewLogs} onClick={onViewLogs}>실행 Log 보기</Button>
      </TabsRow>

      <TwoColumns>
        <Panel data-node-id="53:2097">
          <PanelHeader>
            <PanelTitle><Octicon name="code" size={16} />요청 페이로드</PanelTitle>
            <Button
              variant="primary"
              icon={<Octicon name="play" size={16} />}
              disabled={!onExecute || isExecuting}
              onClick={() => void execute()}
            >{isExecuting ? '실행 중…' : '실행'}</Button>
          </PanelHeader>
          <CodeFrame>
            <LineNumbers aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}</LineNumbers>
            <Editor aria-label="요청 페이로드 JSON" spellCheck={false} value={requestPayload} onChange={event => setRequestPayload(event.currentTarget.value)} />
          </CodeFrame>
          <Caption role={payloadError ? 'alert' : undefined}>{payloadError ?? '올바른 JSON 형식으로 입력하세요.'}</Caption>
        </Panel>

        <Panel data-node-id="53:2119">
          <PanelHeader>
            <PanelTitle><Octicon name="code" size={16} />응답 본문</PanelTitle>
            <Button
              variant="ghost"
              icon={<Octicon name="copy" size={16} />}
              disabled={!result || !onCopyResponse}
              onClick={() => result && onCopyResponse?.(result.responseJson)}
            >응답 복사</Button>
          </PanelHeader>
          <CodeFrame>
            <LineNumbers aria-hidden="true">{Array.from({ length: responseLineCount }, (_, index) => index + 1).join('\n')}</LineNumbers>
            <Output aria-label="함수 응답" data-node-id="53:2125">{result?.responseJson ?? ''}</Output>
          </CodeFrame>
          <Caption>{result?.statusLabel ? `응답 완료 · ${result.statusLabel}` : <Placeholder />}</Caption>
        </Panel>
      </TwoColumns>

      <SummaryRow aria-label="실행 결과 요약">
        <SummaryCard data-node-id="53:2139">
          <SummaryLabel><Octicon name="check-circle" size={16} />실행 상태</SummaryLabel>
          <SummaryValue>{result?.statusLabel ?? '—'}</SummaryValue>
          <Caption>{result?.statusMessage ?? <Placeholder />}</Caption>
        </SummaryCard>
        <SummaryCard data-node-id="53:2152">
          <SummaryLabel><Octicon name="play" size={16} />실행 경로</SummaryLabel>
          <SummaryValue>{result?.pathLabel ?? '—'}</SummaryValue>
          <Caption>{result?.dailyExecutionsUsed !== undefined && dailyExecutions
            ? `오늘 실행 ${result.dailyExecutionsUsed.toLocaleString('ko-KR')} / ${dailyExecutions.limit.toLocaleString('ko-KR')}회에 포함됩니다`
            : result?.pathCaption ?? <Placeholder />}</Caption>
        </SummaryCard>
        <SummaryCard data-node-id="593:6207">
          <SummaryLabel><Octicon name="clock" size={16} />걸린 시간</SummaryLabel>
          <SummaryValue>{result?.durationLabel ?? '—'}</SummaryValue>
          <Caption>{result?.durationCaption ?? <Placeholder />}</Caption>
        </SummaryCard>
      </SummaryRow>

      <LogsPanel data-node-id="53:2164">
        <PanelHeader>
          <PanelTitle><Octicon name="code" size={16} />출력 Log</PanelTitle>
        </PanelHeader>
        {outputLines.length > 0 ? outputLines.map((line, index) => (
          <LogLine key={`${index}-${line}`}><LineNumbers>{index + 1}</LineNumbers><span>{line}</span></LogLine>
        )) : <EmptyLog aria-label="실행 Log 없음" />}
        <Caption>{result?.timestampLabel ? `${result.timestampLabel} · console.log` : <Placeholder />}</Caption>
      </LogsPanel>
      {executionError && <ModalSurface labelledBy="serverless-test-error-title" onDismiss={onDismissExecutionError}>
        <ExecutionDialog>
          {executionError === 'inactive' ? <>
            <ExecutionDialogTitle id="serverless-test-error-title">비활성 함수는 실행할 수 없습니다</ExecutionDialogTitle>
            <ExecutionDialogCopy>{functionName}를 활성화하면 수동 테스트와 공개 URL 호출을 사용할 수 있습니다. 먼저 함수 상태를 변경해주세요.<br />현재 함수 상태<br />{active ? '활성' : '비활성'}</ExecutionDialogCopy>
            <ExecutionDialogActions>
              <Button type="button" variant="secondary" onClick={onDismissExecutionError}>닫기</Button>
              <Button type="button" variant="primary" onClick={onActivate}>함수 활성화</Button>
            </ExecutionDialogActions>
          </> : executionError === 'quota' ? <>
            <ExecutionDialogTitle id="serverless-test-error-title">한도에 닿아서 실행하지 않았습니다</ExecutionDialogTitle>
            <ExecutionDialogCopy>수동 실행도 하루 실행 한도에 포함됩니다. 다음 날 다시 실행해 주세요.<br />오늘 실행 {dailyExecutions?.used.toLocaleString('ko-KR') ?? '—'} / {dailyExecutions?.limit.toLocaleString('ko-KR') ?? '—'}회</ExecutionDialogCopy>
            <ExecutionDialogActions>
              <Button type="button" variant="secondary" onClick={onDismissExecutionError}>닫기</Button>
            </ExecutionDialogActions>
          </> : executionError === 'storage' ? <>
            <ExecutionDialogTitle id="serverless-test-error-title">테스트를 완료하지 못했습니다</ExecutionDialogTitle>
            <ExecutionDialogCopy>실행 결과를 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.</ExecutionDialogCopy>
            <ExecutionDialogActions><Button type="button" variant="secondary" onClick={onDismissExecutionError}>닫기</Button></ExecutionDialogActions>
          </> : <>
            <ExecutionDialogTitle id="serverless-test-error-title">함수를 찾을 수 없습니다</ExecutionDialogTitle>
            <ExecutionDialogActions><Button type="button" variant="secondary" onClick={onDismissExecutionError}>닫기</Button></ExecutionDialogActions>
          </>}
        </ExecutionDialog>
      </ModalSurface>}
      {jsonErrorOpen && <ModalSurface labelledBy="serverless-test-json-error-title" onDismiss={() => setJsonErrorOpen(false)}>
        <ExecutionDialog>
          <ExecutionDialogTitle id="serverless-test-json-error-title">JSON 형식을 확인해주세요</ExecutionDialogTitle>
          <ExecutionDialogCopy>
            요청 페이로드를 해석할 수 없어 실행하지 않았습니다. 입력 내용은 유지되며, 형식을 고친 뒤 다시 실행할 수 있습니다.
            {jsonErrorLine && <><br />{jsonErrorLine}번째 줄: 마지막 항목 뒤의 쉼표를 지워주세요.</>}
          </ExecutionDialogCopy>
          <ExecutionDialogActions><Button type="button" variant="primary" onClick={() => setJsonErrorOpen(false)}>계속 수정</Button></ExecutionDialogActions>
        </ExecutionDialog>
      </ModalSurface>}
    </Page>
  );
}

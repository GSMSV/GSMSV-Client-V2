import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../shared/ui/controls';
import { Pagination } from '../../shared/ui/data-display/Pagination';
import { Banner } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';

export type ServerlessLogsTab = 'code' | 'versions' | 'triggers' | 'environment' | 'test' | 'logs';
export type ServerlessRunResult = 'success' | 'failure' | 'timeout';

export interface ServerlessRunLog {
  id: string;
  result: ServerlessRunResult;
  startedAt: string;
  path: string;
  duration: string;
  outputLines?: string[];
}

export interface ServerlessLogsPageProps {
  functionName: string;
  runs?: ServerlessRunLog[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  selectedRunId?: string | null;
  emptyMessage?: string;
  enabledTabs?: readonly ServerlessLogsTab[];
  onSelectTab?: (tab: ServerlessLogsTab) => void;
  onSelectRun?: (runId: string) => void;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onDeleteAll?: () => void;
}

const tabs: Array<{ id: ServerlessLogsTab; label: string }> = [
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
`;

const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

const HeadingText = styled.div`
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

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const TabsAndActions = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Tabs = styled.nav`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow: hidden;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  min-width: 42px;
  height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: pointer;

  &:hover:not(:disabled):not([aria-current='page']) { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:active:not(:disabled):not([aria-current='page']) { background: ${({ theme }) => theme.colors.overlayPressed}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  &:disabled { color: ${({ theme }) => theme.colors.faint}; cursor: not-allowed; opacity: 0.65; }
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`;

const Surface = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const SurfaceTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Table = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 219px 300px 200px 180px minmax(120px, 1fr);
  align-items: stretch;
  width: 100%;

  @media (max-width: 1440px) {
    grid-template-columns: minmax(110px, 1fr) minmax(160px, 1.4fr) minmax(120px, 1fr) minmax(100px, 0.9fr) minmax(100px, 0.9fr);
  }
`;

const TableHeader = styled(Row)`
  min-height: 42px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const HeaderCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  padding: 12px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const DataRow = styled.button<{ $selected: boolean }>`
  min-height: 50px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : 'transparent'};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: -2px; }
  &:disabled { cursor: default; }
`;

const Cell = styled.span<{ $tone?: 'success' | 'failure' | 'neutral' }>`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  padding: 12px;
  color: ${({ theme, $tone }) => $tone === 'success' ? theme.colors.primary : $tone === 'failure' ? theme.colors.danger : theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyRow = styled.div`
  display: flex;
  min-height: 70px;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const PaginationRow = styled.div`
  padding-top: 0;
`;

const EmptyOutput = styled.p`
  margin: 0;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Output = styled.div`
  display: grid;
  min-height: 54px;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;

const LineNumbers = styled.div`
  color: ${({ theme }) => theme.colors.faint};
  user-select: none;
  white-space: pre;
`;

const OutputLines = styled.pre`
  overflow: auto;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const Footnote = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

function getResultLabel(result: ServerlessRunResult) {
  if (result === 'success') return '성공';
  return result === 'timeout' ? '시간 초과' : '실패';
}

export function ServerlessLogsPage({
  functionName,
  runs = [],
  totalCount = runs.length,
  page = 1,
  pageSize = 100,
  selectedRunId,
  emptyMessage = '실행 기록을 불러올 수 없습니다.',
  enabledTabs = ['logs'],
  onSelectTab,
  onSelectRun,
  onPageChange,
  onRefresh,
  onDeleteAll,
}: ServerlessLogsPageProps) {
  const [localSelection, setLocalSelection] = useState<string | null>(null);
  const currentSelection = selectedRunId ?? localSelection;
  const selectedRun = runs.find(run => run.id === currentSelection);
  const pageCount = Math.ceil(totalCount / pageSize);
  const firstRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min(page * pageSize, totalCount);

  const selectRun = (runId: string) => {
    if (selectedRunId === undefined) setLocalSelection(runId === currentSelection ? null : runId);
    onSelectRun?.(runId);
  };

  return (
    <Page data-node-id="53:2174">
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <HeadingText>
          <Title>{functionName}</Title>
          <Description>최근 7일 · 최대 1,000건의 실행 기록을 확인하세요.</Description>
        </HeadingText>
      </Heading>

      <TabsAndActions>
        <Tabs aria-label="함수 관리 메뉴">
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              type="button"
              $active={tab.id === 'logs'}
              aria-current={tab.id === 'logs' ? 'page' : undefined}
              disabled={!enabledTabs.includes(tab.id)}
              onClick={() => onSelectTab?.(tab.id)}
            >{tab.label}</Tab>
          ))}
        </Tabs>
        <Actions>
          <Button variant="secondary" icon={<Octicon name="sync" size={16} />} disabled={!onRefresh} onClick={onRefresh}>새로고침</Button>
          <Button variant="danger" icon={<Octicon name="trashcan" size={16} />} disabled={!onDeleteAll} onClick={onDeleteAll}>전체 삭제</Button>
        </Actions>
      </TabsAndActions>

      <Banner
        title="최근 7일 · 최대 1,000건 보관"
        description="요청·응답 본문은 저장하지 않습니다. 필요한 값은 함수 안에서 출력하세요. 출력은 1건당 8 KB까지 남기고 비밀 값은 가립니다."
        tone="neutral"
        icon={<Octicon name="info" size={20} />}
      />

      <Surface>
        <SurfaceTitle>최근 실행</SurfaceTitle>
        <Table role="table" aria-label="최근 함수 실행">
          <TableHeader role="row">
            <HeaderCell role="columnheader">결과</HeaderCell>
            <HeaderCell role="columnheader">실행 시각</HeaderCell>
            <HeaderCell role="columnheader">실행 경로</HeaderCell>
            <HeaderCell role="columnheader">걸린 시간</HeaderCell>
            <HeaderCell role="columnheader">상세</HeaderCell>
          </TableHeader>
          {runs.length === 0 ? (
            <EmptyRow role="row">{emptyMessage}</EmptyRow>
          ) : runs.map(run => {
            const selected = currentSelection === run.id;
            const tone = run.result === 'success' ? 'success' : run.result === 'timeout' || run.result === 'failure' ? 'failure' : 'neutral';
            return (
              <DataRow
                key={run.id}
                type="button"
                role="row"
                $selected={selected}
                aria-selected={selected}
                aria-label={`${getResultLabel(run.result)} ${run.startedAt} ${run.path}`}
                onClick={() => selectRun(run.id)}
              >
                <Cell role="cell" $tone={tone}>{getResultLabel(run.result)}</Cell>
                <Cell role="cell">{run.startedAt}</Cell>
                <Cell role="cell">{run.path}</Cell>
                <Cell role="cell">{run.duration}</Cell>
                <Cell role="cell">{selected ? '접기' : '펼치기'}</Cell>
              </DataRow>
            );
          })}
        </Table>
        {pageCount > 1 && onPageChange && (
          <PaginationRow>
            <Pagination
              page={page}
              pageCount={pageCount}
              summary={`${totalCount.toLocaleString('ko-KR')}개 중 ${firstRecord.toLocaleString('ko-KR')}–${lastRecord.toLocaleString('ko-KR')}`}
              onPageChange={onPageChange}
            />
          </PaginationRow>
        )}
      </Surface>

      <Surface>
        <SurfaceTitle>선택한 실행 · 출력 Log</SurfaceTitle>
        {selectedRun ? (
          <Output>
            <LineNumbers aria-hidden="true">{(selectedRun.outputLines ?? []).map((_, index) => index + 1).join('\n')}</LineNumbers>
            <OutputLines>{selectedRun.outputLines?.join('\n') ?? ''}</OutputLines>
          </Output>
        ) : (
          <EmptyOutput>실행을 선택하면 출력 Log를 확인할 수 있습니다.</EmptyOutput>
        )}
        <Footnote>출력은 1건당 8 KB까지 남고, 넘는 부분은 잘립니다. 비밀 변수 값은 가려서 보입니다.</Footnote>
      </Surface>
    </Page>
  );
}

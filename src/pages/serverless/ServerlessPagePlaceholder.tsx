import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Button, NavigationItem } from '../../shared/ui/controls';
import { ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon, type OcticonName } from '../../shared/ui/icons';

/**
 * Figma 14-02/14-03, 15-05/15-06 … 50-02/50-03: 머리글과 탭은 그대로 두고
 * 본문 카드 자리에 로딩 카드 또는 "불러오지 못했습니다" 카드를 보여준다.
 */

export type ServerlessPlaceholderTab = 'code' | 'versions' | 'triggers' | 'environment' | 'test' | 'logs';

const tabs: Array<{ id: ServerlessPlaceholderTab; label: string }> = [
  { id: 'code', label: '코드' },
  { id: 'versions', label: '버전' },
  { id: 'triggers', label: 'Trigger' },
  { id: 'environment', label: '환경변수' },
  { id: 'test', label: '테스트' },
  { id: 'logs', label: 'Logs' },
];

interface PlaceholderAction { label: string; icon: OcticonName; variant: 'primary' | 'secondary' | 'danger' }

const tabLayouts: Record<ServerlessPlaceholderTab, { description?: string; actions: PlaceholderAction[]; rows: number[][] }> = {
  code: { actions: [{ label: '함수 삭제', icon: 'trashcan', variant: 'danger' }, { label: '설정 저장', icon: 'check', variant: 'primary' }], rows: [[424], [416], [270]] },
  versions: { actions: [], rows: [[329]] },
  triggers: { description: '함수를 호출할 주소와 실행 일정을 관리하세요.', actions: [{ label: 'Trigger 추가', icon: 'plus', variant: 'primary' }], rows: [[292], [282], [172]] },
  environment: { description: '함수 코드에서 쓸 환경변수를 관리하세요.', actions: [{ label: '변수 추가', icon: 'plus', variant: 'secondary' }, { label: '변경사항 저장', icon: 'check', variant: 'primary' }], rows: [[210], [314], [200], [216]] },
  test: { description: '입력값을 넣어 함수를 직접 실행해 보세요.', actions: [{ label: '실행 Log 보기', icon: 'history', variant: 'secondary' }], rows: [[238, 238], [150, 150, 150], [194]] },
  logs: { description: '최근 7일 · 최대 1,000건의 실행 기록을 확인하세요.', actions: [{ label: '새로고침', icon: 'sync', variant: 'secondary' }, { label: '전체 삭제', icon: 'trashcan', variant: 'danger' }], rows: [[394], [216]] },
};

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
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.header`
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 600px) { flex-wrap: wrap; align-items: flex-start; }
`;

const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  overflow: hidden;
  min-height: ${({ theme }) => theme.typography.h1.lineHeight}px;
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
  }
`;

const TabButton = styled(NavigationItem)<{ $selected?: boolean }>`
  width: auto;
  padding: 0 12px;
  ${({ $selected, theme }) => $selected ? `color: ${theme.colors.primary}; background: ${theme.colors.primarySoft};` : ''}
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;

  @media (max-width: 760px) { margin-left: auto; }
`;

const CardRow = styled.div<{ $columns: number }>`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) { grid-template-columns: minmax(0, 1fr); }
`;

function PlaceholderCards({ rows, loadError, onRetry }: { rows: number[][]; loadError: boolean; onRetry: () => void }) {
  return <>
    {rows.map((row, rowIndex) => (
      <CardRow key={rowIndex} $columns={row.length}>
        {row.map((height, index) => loadError
          ? <ErrorCard key={index} onRetry={onRetry} />
          : <LoadingCard key={index} height={height} />)}
      </CardRow>
    ))}
  </>;
}

function PlaceholderActions({ actions }: { actions: PlaceholderAction[] }) {
  if (!actions.length) return null;
  return <Actions>{actions.map(action => <Button key={action.label} variant={action.variant} icon={<Octicon name={action.icon} size={16} />} disabled>{action.label}</Button>)}</Actions>;
}

export interface ServerlessFunctionPlaceholderProps {
  tab: ServerlessPlaceholderTab;
  functionName?: string;
  functionDescription?: string;
  loadError: boolean;
  onRetry: () => void;
}

export function ServerlessFunctionPlaceholder({ tab, functionName = '', functionDescription = '', loadError, onRetry }: ServerlessFunctionPlaceholderProps) {
  const layout = tabLayouts[tab];
  return (
    <Page aria-busy={!loadError}>
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <TitleGroup>
          <Title title={functionName}>{functionName}</Title>
          <Description>{layout.description ?? functionDescription}</Description>
        </TitleGroup>
      </Heading>
      <TabsRow>
        <Tabs aria-label="함수 관리 메뉴">
          {tabs.map(item => <TabButton key={item.id} label={item.label} active={item.id === tab} $selected={item.id === tab} disabled />)}
        </Tabs>
        <PlaceholderActions actions={layout.actions} />
      </TabsRow>
      <PlaceholderCards rows={layout.rows} loadError={loadError} onRetry={onRetry} />
    </Page>
  );
}

export function ServerlessCreatePlaceholder({ loadError, onRetry, onCancel }: { loadError: boolean; onRetry: () => void; onCancel: () => void }): ReactNode {
  return (
    <Page aria-busy={!loadError}>
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <TitleGroup>
          <Title>새 함수 만들기</Title>
          <Description>코드를 작성하면 다음 단계에서 실행 방법을 연결할 수 있습니다.</Description>
        </TitleGroup>
        <Actions>
          <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={onCancel}>취소</Button>
          <Button variant="primary" icon={<Octicon name="plus" size={16} />} disabled>함수 생성</Button>
        </Actions>
      </Heading>
      <PlaceholderCards rows={[[536], [392]]} loadError={loadError} onRetry={onRetry} />
    </Page>
  );
}

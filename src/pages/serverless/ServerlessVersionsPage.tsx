import styled from 'styled-components';
import { Button, NavigationItem } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';

export type ServerlessVersionTab = '코드' | '버전' | 'Trigger' | '환경변수' | '테스트' | 'Logs';

export interface ServerlessVersion {
  id: string;
  label: string;
  savedAt: string;
  author: string;
  changeSummary: string;
  current: boolean;
}

export interface ServerlessVersionsPageProps {
  functionName: string;
  description: string;
  versions: ServerlessVersion[];
  onSelectTab?: (tab: ServerlessVersionTab) => void;
  onRollback?: (versionId: string) => void;
}

const tabs: ServerlessVersionTab[] = ['코드', '버전', 'Trigger', '환경변수', '테스트', 'Logs'];

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

const Heading = styled.header`
  display: flex;
  width: 100%;
  min-height: 74px;
  align-items: flex-end;
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

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Tabs = styled.nav`
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  gap: 8px;
`;

const Tab = styled(NavigationItem)<{ $selected?: boolean }>`
  width: auto;
  padding: 0 12px;
  ${({ $selected, theme }) => $selected ? `color: ${theme.colors.primary}; background: ${theme.colors.primarySoft};` : ''}
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

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Count = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

const Table = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
`;

const TableRow = styled.div<{ $header?: boolean; $compact?: boolean }>`
  display: grid;
  grid-template-columns: 14% 40% 18% 28%;
  align-items: center;
  min-height: ${({ $header, $compact }) => $header ? '42px' : $compact ? '46px' : '66px'};
  border-radius: ${({ $header, theme }) => $header ? `${theme.radii.base}px` : '0'};
  background: ${({ $header, theme }) => $header ? theme.colors.raised : 'transparent'};

  &:not(:last-child):not(:first-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const HeaderCell = styled.div`
  min-width: 0;
  padding: 12px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Cell = styled.div<{ $muted?: boolean }>`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: ${({ theme, $muted }) => $muted ? theme.colors.muted : theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Summary = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
`;

const SummaryTitle = styled.p`
  margin: 0;
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/20px ${({ theme }) => theme.typography.button.family}, sans-serif;
`;

const SummaryDescription = styled.p`
  width: 100%;
  margin: 0;
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

export function ServerlessVersionsPage({
  functionName,
  description,
  versions,
  onSelectTab,
  onRollback,
}: ServerlessVersionsPageProps) {
  return (
    <Page data-node-id="593:6260">
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <TitleGroup>
          <Title title={functionName}>{functionName}</Title>
          <Description>{description}</Description>
        </TitleGroup>
      </Heading>

      <Tabs aria-label="함수 관리 메뉴">
        {tabs.map(tab => (
          <Tab
            key={tab}
            label={tab}
            active={tab === '버전'}
            $selected={tab === '버전'}
            disabled={tab !== '버전' && !onSelectTab}
            onClick={() => onSelectTab?.(tab)}
          />
        ))}
      </Tabs>

      <Surface>
        <SectionTitle>저장된 버전 · <Count>{versions.length}개</Count></SectionTitle>
        <Table role="table" aria-label="저장된 함수 버전">
          <TableRow role="row" $header>
            <HeaderCell role="columnheader">버전</HeaderCell>
            <HeaderCell role="columnheader">저장</HeaderCell>
            <HeaderCell role="columnheader">바뀐 것</HeaderCell>
            <HeaderCell role="columnheader">관리</HeaderCell>
          </TableRow>
          {versions.map(version => (
            <TableRow role="row" key={version.id} $compact={version.current}>
              <Cell role="cell">{version.label}</Cell>
              <Cell role="cell" $muted>{version.savedAt} · {version.author}</Cell>
              <Cell role="cell">{version.changeSummary}</Cell>
              <Cell role="cell">
                {version.current ? '현재 버전' : (
                  <Button
                    variant="ghost"
                    icon={<Octicon name="history" size={16} />}
                    disabled={!onRollback}
                    onClick={() => onRollback?.(version.id)}
                  >되돌리기</Button>
                )}
              </Cell>
            </TableRow>
          ))}
        </Table>
      </Surface>

      <Summary>
        <SummaryTitle>버전에는 코드 · Runtime · 실행 제한만 담깁니다</SummaryTitle>
        <SummaryDescription>되돌리면 고른 버전으로 새 버전이 하나 더 생깁니다. 환경변수 · Trigger · DB 연결은 바뀌지 않습니다. 최근 10개를 보관합니다.</SummaryDescription>
      </Summary>
    </Page>
  );
}

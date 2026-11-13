import styled from 'styled-components';
import { Button, Switch } from '../../shared/ui/controls';
import { Banner } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';

export type ServerlessTriggerTab = 'code' | 'versions' | 'triggers' | 'environment' | 'test' | 'logs';

export interface ServerlessConnectedTrigger {
  id: string;
  type: 'HTTP' | 'Cron';
  schedule: string;
  enabled: boolean;
}

export interface ServerlessTriggersPageProps {
  functionName: string;
  activeTab?: ServerlessTriggerTab;
  publicUrl?: string;
  httpMethod?: string;
  concurrentLimit?: number;
  dailyExecutions?: { used: number; limit: number };
  triggers?: ServerlessConnectedTrigger[];
  nextCronExecution?: string;
  domain?: string | null;
  enabledTabs?: readonly ServerlessTriggerTab[];
  onSelectTab?: (tab: ServerlessTriggerTab) => void;
  onAddTrigger?: () => void;
  onRegenerateUrl?: () => void;
  onTest?: () => void;
  onCopyAddress?: () => void;
  onOpenDocsExample?: () => void;
  onToggleTrigger?: (id: string, enabled: boolean) => void;
  onDeleteTrigger?: (id: string) => void;
  onConnectDomain?: () => void;
}

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
  max-width: 100%;
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

const TabsRow = styled.nav`
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.65 : 1};

  &:hover:not(:disabled) { background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 1px; }
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

const SurfaceHeading = styled.header`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const SurfaceTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

const AddressRow = styled.div`
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 16px;
`;

const IconSlot = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const AddressValue = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
`;

const Eyebrow = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Value = styled.p`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Helper = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Table = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
`;

const TableRow = styled.div`
  display: grid;
  min-height: 66px;
  grid-template-columns: 14% 40% 18% 28%;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TableHeader = styled(TableRow)`
  min-height: 42px;
  border-bottom: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const HeaderCell = styled.span`
  overflow: hidden;
  padding: 0 12px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Cell = styled.div`
  display: flex;
  min-width: 0;
  min-height: 46px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ScheduleNote = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const DomainValue = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
`;

const TriggerTabs: Array<{ id: ServerlessTriggerTab; label: string }> = [
  { id: 'code', label: '코드' },
  { id: 'versions', label: '버전' },
  { id: 'triggers', label: 'Trigger' },
  { id: 'environment', label: '환경변수' },
  { id: 'test', label: '테스트' },
  { id: 'logs', label: 'Logs' },
];

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

export function ServerlessTriggersPage({
  functionName,
  activeTab = 'triggers',
  publicUrl,
  httpMethod,
  concurrentLimit,
  dailyExecutions,
  triggers = [],
  nextCronExecution,
  domain,
  enabledTabs = ['triggers'],
  onSelectTab,
  onAddTrigger,
  onRegenerateUrl,
  onTest,
  onCopyAddress,
  onOpenDocsExample,
  onToggleTrigger,
  onDeleteTrigger,
  onConnectDomain,
}: ServerlessTriggersPageProps) {
  return (
    <Page data-node-id="52:3715">
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <TitleGroup>
          <Title>{functionName}</Title>
          <Subtitle>함수를 호출할 주소와 실행 일정을 관리하세요.</Subtitle>
        </TitleGroup>
      </Heading>

      <TabsRow aria-label="함수 설정">
        <Tabs>
          {TriggerTabs.map(tab => (
            <Tab
              key={tab.id}
              type="button"
              $active={activeTab === tab.id}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              disabled={!enabledTabs.includes(tab.id)}
              onClick={() => onSelectTab?.(tab.id)}
            >{tab.label}</Tab>
          ))}
        </Tabs>
        <Button variant="primary" icon={<Octicon name="plus" size={16} />} disabled={!onAddTrigger} onClick={onAddTrigger}>Trigger 추가</Button>
      </TabsRow>

      <Banner
        title="호출 주소는 공개돼 있습니다"
        description="주소를 아는 사람은 누구나 호출할 수 있습니다. 민감한 정보를 반환하지 않도록 코드와 응답을 확인하세요."
        tone="warning"
        icon={<Octicon name="unlock" size={20} />}
      />

      <Surface data-node-id="52:3851">
        <SurfaceHeading>
          <SurfaceTitle>호출 주소</SurfaceTitle>
          <Actions>
            <Button variant="secondary" icon={<Octicon name="sync" size={16} />} disabled={!onRegenerateUrl} onClick={onRegenerateUrl}>호출 주소 재발급</Button>
            <Button variant="secondary" icon={<Octicon name="play" size={16} />} disabled={!onTest} onClick={onTest}>테스트하기</Button>
          </Actions>
        </SurfaceHeading>

        <AddressRow>
          <IconSlot aria-hidden="true"><Octicon name="globe" size={16} /></IconSlot>
          <AddressValue>
            <Eyebrow>HTTP {httpMethod ?? '—'}</Eyebrow>
            <Value>{publicUrl ?? '—'}</Value>
          </AddressValue>
          <Button variant="ghost" icon={<Octicon name="copy" size={16} />} disabled={!publicUrl || !onCopyAddress} onClick={onCopyAddress}>주소 복사</Button>
        </AddressRow>

        <AddressRow>
          <IconSlot aria-hidden="true"><Octicon name="pulse" size={16} /></IconSlot>
          <AddressValue>
            <Eyebrow>호출 한도</Eyebrow>
            <Value>
              함수마다 동시 실행 {concurrentLimit == null ? '—' : `${formatNumber(concurrentLimit)}개`}
              {' · 오늘 실행 '}
              {dailyExecutions ? `${formatNumber(dailyExecutions.used)} / ${formatNumber(dailyExecutions.limit)}회` : '—'}
            </Value>
            <Helper>동시 실행을 넘는 요청은 429로 거절합니다. 하루 실행은 내 함수 전체를 합해 세요.</Helper>
          </AddressValue>
        </AddressRow>

        <AddressRow>
          <IconSlot aria-hidden="true"><Octicon name="shield" size={16} /></IconSlot>
          <AddressValue>
            <Eyebrow>인증</Eyebrow>
            <Value>인증이 필요하면 코드에서 요청 헤더를 확인하세요.</Value>
          </AddressValue>
          <Button variant="ghost" icon={<Octicon name="book" size={16} />} disabled={!onOpenDocsExample} onClick={onOpenDocsExample}>Docs 예시</Button>
        </AddressRow>
      </Surface>

      <Surface data-node-id="52:3785">
        <SurfaceHeading>
          <SurfaceTitle>연결된 Trigger</SurfaceTitle>
        </SurfaceHeading>
        <Table role="table" aria-label="연결된 Trigger">
          <TableHeader role="row">
            <HeaderCell role="columnheader">종류</HeaderCell>
            <HeaderCell role="columnheader">호출 방식 / 일정</HeaderCell>
            <HeaderCell role="columnheader">상태</HeaderCell>
            <HeaderCell role="columnheader">관리</HeaderCell>
          </TableHeader>
          {triggers.map(trigger => (
            <TableRow key={trigger.id} role="row">
              <Cell role="cell">{trigger.type}</Cell>
              <Cell role="cell">{trigger.schedule}</Cell>
              <Cell role="cell">
                <Switch
                  label=""
                  ariaLabel={`${trigger.type} Trigger`}
                  checked={trigger.enabled}
                  disabled={!onToggleTrigger}
                  onChange={checked => onToggleTrigger?.(trigger.id, checked)}
                />
              </Cell>
              <Cell role="cell">
                <RowActions>
                  <Button variant="ghost" aria-label="Trigger 삭제" icon={<Octicon name="trashcan" size={16} />} disabled={!onDeleteTrigger} onClick={() => onDeleteTrigger?.(trigger.id)} />
                </RowActions>
              </Cell>
            </TableRow>
          ))}
        </Table>
      </Surface>

      <ScheduleNote>
        <span>예약 실행은 서울 시간을 기준으로 합니다</span>
        <span>{nextCronExecution ? `다음 실행은 ${nextCronExecution}입니다. ` : ''}5분보다 짧은 간격은 저장할 수 없고, 앞 실행이 끝나지 않았으면 다음 실행을 건너뜁니다.</span>
      </ScheduleNote>

      <Surface data-node-id="589:6130">
        <SurfaceHeading>
          <SurfaceTitle>사용자 지정 도메인</SurfaceTitle>
          <Button variant="secondary" icon={<Octicon name="link" size={16} />} disabled={!onConnectDomain} onClick={onConnectDomain}>도메인 연결</Button>
        </SurfaceHeading>
        <AddressRow>
          <IconSlot aria-hidden="true"><Octicon name="globe" size={16} /></IconSlot>
          <DomainValue>
            <Eyebrow>연결된 도메인</Eyebrow>
            <Value>{domain === undefined ? '—' : domain ?? '아직 연결하지 않았습니다'}</Value>
            <Helper>함수마다 도메인 1개를 연결할 수 있습니다. DNS TXT 레코드로 소유를 확인한 뒤 연결하고, 인증서는 자동으로 발급합니다.</Helper>
          </DomainValue>
        </AddressRow>
      </Surface>
    </Page>
  );
}

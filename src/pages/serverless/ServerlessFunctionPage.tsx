import { useState } from 'react';
import styled from 'styled-components';
import { Banner } from '../../shared/ui/feedback';
import { DeleteConfirmDialog } from '../../shared/ui/feedback';
import { Button, NavigationItem, SegmentedControl, Switch } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import type { ServerlessRuntime } from './ServerlessCreatePage';

export type ServerlessFunctionTab = '코드' | '버전' | 'Trigger' | '환경변수' | '테스트' | 'Logs';

export interface ServerlessFunctionSettings {
  runtime: ServerlessRuntime;
  timeoutSeconds: 30 | 60;
  memoryMb: 128 | 256;
}

export interface ServerlessCodeSaveError {
  title: string;
  description: string;
}

export interface ServerlessFunctionPageProps {
  name?: string;
  description?: string;
  runtime?: ServerlessRuntime;
  timeoutSeconds?: 30 | 60;
  memoryMb?: 128 | 256;
  active?: boolean;
  code?: string;
  expiresAtLabel?: string;
  extensionMessage?: string;
  savedVersionLabel?: string;
  triggerSummary?: string;
  deleteSummary?: string;
  enabledTabs?: readonly ServerlessFunctionTab[];
  onNavigateTab?: (tab: ServerlessFunctionTab) => void;
  onDelete?: () => void;
  onSaveSettings?: (settings: ServerlessFunctionSettings) => void;
  /** 저장하지 못하면 화면 위 오류 안내에 쓸 문구를 돌려준다. */
  onSaveCode?: (code: string, runtime: ServerlessRuntime) => ServerlessCodeSaveError | void;
  /** 사용 기간이 끝나 정지된 함수 (Figma 15-03). */
  suspended?: { expiredAtLabel: string; deleteAtLabel: string };
  /** 팀 함수를 일반 팀원으로 볼 때 (Figma 15-04). */
  readOnly?: boolean;
  onTest?: () => void;
  onManageTriggers?: () => void;
  onExtend?: () => void;
  onToggleActive?: (active: boolean) => void;
}

const defaultCode = `export default async function handler(request, env) {
  let name = "GSM";
  if (request?.method === "POST") {
    const body = await request.json().catch(() => ({}));
    name = body.name || name;
  }
  const greeting = env.GREETING || "안녕하세요";
  console.log("Greeting sent", name);
  return Response.json({ message: \`${'${greeting}'}, ${'${name}'}!\` });
}`;

const tabs: ServerlessFunctionTab[] = ['코드', '버전', 'Trigger', '환경변수', '테스트', 'Logs'];

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
    scrollbar-width: thin;
  }
`;

const TabButton = styled(NavigationItem)<{ $selected?: boolean }>`
  width: auto;
  flex: 0 0 auto;
  padding: 0 16px;
  white-space: nowrap;
  ${({ $selected, theme }) => $selected ? `color: ${theme.colors.primary}; background: ${theme.colors.primarySoft};` : ''}
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;

  @media (max-width: 760px) { margin-left: auto; }
`;

const Panel = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 600px) { padding: 16px; }
`;

const PanelTitle = styled.h2`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Field = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Control = styled.div`
  box-sizing: border-box;
  width: 100%;
  height: 42px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};

  & > div { height: 100%; padding: 4px; background: transparent; }
  [role='radiogroup'] { height: 100%; background: ${({ theme }) => theme.colors.field}; }
  [role='radio'] { border-radius: ${({ theme }) => theme.radii.base}px; }
`;

const RuntimeHelp = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ToggleRow = styled.div`
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const ToggleCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ToggleTitle = styled.strong`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const ToggleDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const EditorHeader = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.primary};
`;

const EditorTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const CodeEditor = styled.div`
  display: grid;
  box-sizing: border-box;
  width: 100%;
  min-height: 252px;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;

  > textarea { min-width: 0; }
`;

const LineNumbers = styled.div`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.faint};
  text-align: left;
  user-select: none;
  white-space: pre;
`;

const CodeInput = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 220px;
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

const EditorActions = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const VersionCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const RuntimeRow = styled.div`
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 16px;
`;

const RuntimeValue = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
`;

const MetaLabel = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const MetaValue = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TriggerRow = styled(RuntimeRow)`
  ${RuntimeValue} { flex: 1 1 auto; }
`;

const DangerButton = styled(Button)`
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerSoft};
`;

const DeleteOverlay = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(0 0 0 / 54%);
`;

function displayRuntime(runtime: ServerlessRuntime) {
  if (runtime === 'javascript') return 'JavaScript';
  return runtime === 'typescript' ? 'TypeScript' : 'Python';
}

export function ServerlessFunctionPage({
  name = 'welcome-api',
  description = '서비스 첫 방문자를 위한 환영 메시지 API',
  runtime: initialRuntime = 'javascript',
  timeoutSeconds: initialTimeout = 30,
  memoryMb: initialMemory = 128,
  active: initialActive = true,
  code: initialCode = defaultCode,
  expiresAtLabel = '10월 6일 14:00',
  extensionMessage = '지금 연장하면 10월 20일 14:00까지 사용할 수 있습니다.',
  savedVersionLabel = '버전 7 · 2026. 09. 29. 14:32 저장',
  triggerSummary = 'HTTP POST · 매일 09:00 예약 실행',
  deleteSummary = '· 버전 7개 · HTTP Trigger 1개 · 예약 Trigger 1개 · 환경변수 2개',
  enabledTabs = ['코드'],
  onNavigateTab,
  onDelete,
  onSaveSettings,
  onSaveCode,
  onTest,
  onManageTriggers,
  onExtend,
  onToggleActive,
  suspended,
  readOnly = false,
}: ServerlessFunctionPageProps) {
  const [saveError, setSaveError] = useState<ServerlessCodeSaveError | null>(null);
  const [runtime, setRuntime] = useState<ServerlessRuntime>(initialRuntime);
  const [timeoutSeconds, setTimeoutSeconds] = useState<'30' | '60'>(String(initialTimeout) as '30' | '60');
  const [memoryMb, setMemoryMb] = useState<'128' | '256'>(String(initialMemory) as '128' | '256');
  const [active, setActive] = useState(initialActive);
  const [code, setCode] = useState(initialCode);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const lineCount = code.split('\n').length;
  const hasSettingsWriter = Boolean(onSaveSettings);

  const saveSettings = () => {
    onSaveSettings?.({
      runtime,
      timeoutSeconds: Number(timeoutSeconds) as 30 | 60,
      memoryMb: Number(memoryMb) as 128 | 256,
    });
  };

  const toggleActive = (nextActive: boolean) => {
    setActive(nextActive);
    onToggleActive?.(nextActive);
  };

  return (
    <Page data-node-id="52:3378">
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <TitleGroup>
          <Title title={name}>{name}</Title>
          <Description>{description}</Description>
        </TitleGroup>
      </Heading>

      <TabsRow>
        <Tabs aria-label="함수 관리 메뉴">
          {tabs.map(tab => (
            <TabButton
              key={tab}
              label={tab}
              active={tab === '코드'}
              $selected={tab === '코드'}
              disabled={!enabledTabs.includes(tab)}
              onClick={() => onNavigateTab?.(tab)}
            />
          ))}
        </Tabs>
        <Actions>
          <DangerButton variant="danger" icon={<Octicon name="trashcan" size={16} />} disabled={!onDelete} onClick={() => { setDeleteConfirmation(''); setDeleteDialogOpen(true); }}>함수 삭제</DangerButton>
          <Button variant="primary" icon={<Octicon name="check" size={16} />} disabled={!hasSettingsWriter} onClick={saveSettings}>설정 저장</Button>
        </Actions>
      </TabsRow>

      {saveError && <Banner
        tone="danger"
        title={saveError.title}
        description={saveError.description}
        icon={<Octicon name="alert" size={20} />}
      />}

      {readOnly && <Banner
        tone="neutral"
        title="일반 팀원으로 보고 있습니다"
        description="코드와 Log를 보고 사용 기간을 연장할 수 있습니다. 수정·실행·삭제는 팀장과 DevOps만 할 수 있습니다."
        icon={<Octicon name="shield" size={20} />}
      />}

      {suspended ? <Banner
        tone="danger"
        title="정지됐습니다 · 3일 뒤 삭제됩니다"
        description={`${suspended.expiredAtLabel}에 만료돼 호출과 예약 실행이 멈췄습니다. ${suspended.deleteAtLabel}에 삭제됩니다.`}
        icon={<Octicon name="clock" size={20} />}
        action={<Button variant="secondary" icon={<Octicon name="calendar" size={16} />} disabled={!onExtend} onClick={onExtend}>사용 기간 연장</Button>}
      /> : <Banner
        tone="primary"
        title={`만료까지 7일 남았습니다`}
        description={`${expiresAtLabel}에 정지됩니다. ${extensionMessage}`}
        icon={<Octicon name="clock" size={20} />}
        action={<Button variant="secondary" icon={<Octicon name="calendar" size={16} />} disabled={!onExtend} onClick={onExtend}>사용 기간 연장</Button>}
      />}

      <Panel aria-labelledby="function-settings-title">
        <PanelTitle id="function-settings-title">함수 상태</PanelTitle>
        <Field>
          <FieldLabel>Runtime</FieldLabel>
          <Control>
            <SegmentedControl
              label="Runtime"
              options={[
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'python', label: 'Python' },
              ]}
              value={runtime}
              disabled={!hasSettingsWriter}
              onChange={value => setRuntime(value as ServerlessRuntime)}
            />
          </Control>
          <RuntimeHelp>Runtime이나 실행 제한을 바꾸면 새 버전으로 저장됩니다.</RuntimeHelp>
        </Field>
        <Field>
          <FieldLabel>실행 시간</FieldLabel>
          <Control>
            <SegmentedControl
              label="실행 시간"
              options={[{ value: '30', label: '30초' }, { value: '60', label: '60초' }]}
              value={timeoutSeconds}
              disabled={!hasSettingsWriter}
              onChange={value => setTimeoutSeconds(value as '30' | '60')}
            />
          </Control>
        </Field>
        <Field>
          <FieldLabel>메모리</FieldLabel>
          <Control>
            <SegmentedControl
              label="메모리"
              options={[{ value: '128', label: '128MB' }, { value: '256', label: '256MB' }]}
              value={memoryMb}
              disabled={!hasSettingsWriter}
              onChange={value => setMemoryMb(value as '128' | '256')}
            />
          </Control>
        </Field>
        <ToggleRow>
          <ToggleCopy>
            <ToggleTitle>함수 활성화</ToggleTitle>
            <ToggleDescription>끄면 HTTP 호출 · 예약 실행 · 수동 실행이 모두 멈춥니다.</ToggleDescription>
          </ToggleCopy>
          <Switch label="" ariaLabel="함수 활성화" checked={active} disabled={!onToggleActive} onChange={toggleActive} />
        </ToggleRow>
      </Panel>

      <Panel aria-labelledby="code-editor-title">
        <EditorHeader>
          <Octicon name="code" size={16} aria-hidden="true" />
          <EditorTitle id="code-editor-title">{runtime === 'python' ? 'main.py' : runtime === 'typescript' ? 'index.ts' : 'index.js'}</EditorTitle>
        </EditorHeader>
        <CodeEditor>
          <LineNumbers aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}</LineNumbers>
          <CodeInput aria-label="함수 코드" spellCheck={false} readOnly={readOnly} value={code} onChange={event => setCode(event.currentTarget.value)} />
        </CodeEditor>
        <EditorActions>
          <VersionCaption>{savedVersionLabel}</VersionCaption>
          <Button variant="primary" icon={<Octicon name="check" size={16} />} disabled={!onSaveCode} onClick={() => setSaveError(onSaveCode?.(code, runtime) ?? null)}>코드 저장</Button>
        </EditorActions>
      </Panel>

      <Panel aria-labelledby="execution-settings-title">
        <TabsRow>
          <PanelTitle id="execution-settings-title">실행 설정</PanelTitle>
          <Button variant="secondary" icon={<Octicon name="play" size={16} />} disabled={!onTest} onClick={onTest}>테스트하기</Button>
        </TabsRow>
        <RuntimeRow>
          <Octicon name="code" size={16} aria-hidden="true" />
          <RuntimeValue><MetaLabel>Runtime</MetaLabel><MetaValue>{displayRuntime(runtime)}</MetaValue></RuntimeValue>
        </RuntimeRow>
        <RuntimeRow>
          <Octicon name="cpu" size={16} aria-hidden="true" />
          <RuntimeValue><MetaLabel>실행 제한</MetaLabel><MetaValue>실행 시간 {timeoutSeconds}초 · 메모리 {memoryMb}MB</MetaValue></RuntimeValue>
        </RuntimeRow>
        <TriggerRow>
          <Octicon name="zap" size={16} aria-hidden="true" />
          <RuntimeValue><MetaLabel>연결된 Trigger</MetaLabel><MetaValue>{triggerSummary}</MetaValue></RuntimeValue>
          <Button variant="ghost" icon={<Octicon name="arrow-right" size={16} />} disabled={!onManageTriggers} onClick={onManageTriggers}>Trigger 관리</Button>
        </TriggerRow>
      </Panel>
      {deleteDialogOpen && <DeleteOverlay onMouseDown={event => { if (event.target === event.currentTarget) setDeleteDialogOpen(false); }}>
        <DeleteConfirmDialog
          open
          title={`${name}를 삭제하시겠습니까?`}
          description="함수와 버전, Trigger, 실행 Log를 모두 지웁니다. 호출 주소는 바로 막힙니다."
          items={deleteSummary}
          fieldLabel="확인하려면 함수 이름을 입력하세요"
          confirmationName={name}
          value={deleteConfirmation}
          onValueChange={setDeleteConfirmation}
          onConfirm={() => { setDeleteDialogOpen(false); onDelete?.(); }}
          onCancel={() => setDeleteDialogOpen(false)}
          caption="삭제한 함수는 되살릴 수 없습니다."
          hint={`${name}를 정확하게 입력해 주세요.`}
          confirmLabel="삭제"
          confirmDisabled={!onDelete}
        />
      </DeleteOverlay>}
    </Page>
  );
}

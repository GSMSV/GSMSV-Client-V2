import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button, Switch } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import type { ServerlessFunctionTab } from './ServerlessFunctionPage';

export interface ServerlessEnvironmentVariable {
  name: string;
  secret: boolean;
  /** Non-secret values may be supplied for display. Secret values are never returned. */
  value?: string;
}

export interface ServerlessDatabaseOption {
  id: string;
  label: string;
}

export interface ServerlessEnvironmentPageProps {
  functionName: string;
  variables?: ServerlessEnvironmentVariable[];
  storageBytesUsed?: number;
  storageBytesLimit?: number;
  databases?: ServerlessDatabaseOption[];
  selectedDatabaseId?: string;
  onSelectTab?: (tab: ServerlessFunctionTab) => void;
  onAddVariable?: (variable: ServerlessEnvironmentVariable) => void;
  onUpdateVariable?: (name: string, value: string) => void;
  onDeleteVariable?: (name: string) => void;
  onSaveChanges?: () => void;
  onEditVariables?: () => void;
  onSelectDatabase?: (databaseId: string) => void;
}

const tabs: ServerlessFunctionTab[] = ['코드', '버전', 'Trigger', '환경변수', '테스트', 'Logs'];

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
`;

const Tabs = styled.nav`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`;

const Tab = styled.button<{ $active: boolean }>`
  height: 42px;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.text};
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.65 : 1};

  &:hover:not(:disabled):not([aria-current='page']) { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
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
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const BodyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Notice = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const NoticeIcon = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const NoticeCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`;

const NoticeTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const NoticeDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const VariableRow = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
`;

const VariableIcon = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const VariableCopy = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
`;

const VariableName = styled.strong`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const VariableValue = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`;

const FieldGroup = styled.label`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.field};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; }
`;

const Select = styled.select`
  box-sizing: border-box;
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.field};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; }
  &:disabled { cursor: not-allowed; opacity: 0.65; }
`;

const Code = styled.pre`
  overflow-x: auto;
  width: 100%;
  margin: 0;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.sidebar};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;

const CodeLine = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(max-content, 1fr);
  gap: 16px;
`;

const LineNumber = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

const UpdateOverlay = styled.div`
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 24px;
  background: rgba(14, 12, 16, 0.66);
`;

const UpdateDialog = styled.form`
  box-sizing: border-box;
  display: flex;
  width: min(480px, 100%);
  max-height: calc(100vh - 48px);
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 16px rgba(0, 0, 0, 0.45);
`;

const UpdateTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const UpdateNotes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const UpdateActions = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export function ServerlessEnvironmentPage({
  functionName,
  variables = [],
  storageBytesUsed,
  storageBytesLimit,
  databases = [],
  selectedDatabaseId,
  onSelectTab,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  onSaveChanges,
  onEditVariables,
  onSelectDatabase,
}: ServerlessEnvironmentPageProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [secret, setSecret] = useState(false);
  const [secretUpdate, setSecretUpdate] = useState<{ name: string; value: string } | null>(null);
  const canEdit = Boolean(onAddVariable);

  const addVariable = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !onAddVariable) return;
    onAddVariable({ name: name.trim(), value, secret });
    setName('');
    setValue('');
    setSecret(false);
  };

  const updateSecretVariable = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!secretUpdate?.value || !onUpdateVariable) return;
    onUpdateVariable(secretUpdate.name, secretUpdate.value);
    setSecretUpdate(null);
  };

  return (
    <Page data-node-id="53:1670">
      <Breadcrumb>Serverless</Breadcrumb>
      <Heading>
        <TitleGroup>
          <Title>{functionName}</Title>
          <Description>함수 코드에서 쓸 환경변수를 관리하세요.</Description>
        </TitleGroup>
      </Heading>

      <TabsRow>
        <Tabs aria-label="함수 설정 탭">
          {tabs.map(tab => (
            <Tab
              key={tab}
              type="button"
              $active={tab === '환경변수'}
              aria-current={tab === '환경변수' ? 'page' : undefined}
              disabled={!onSelectTab}
              onClick={() => onSelectTab?.(tab)}
            >{tab}</Tab>
          ))}
        </Tabs>
        <Actions>
          <Button variant="secondary" icon={<Octicon name="plus" size={16} />} disabled={!onAddVariable} onClick={() => document.getElementById('serverless-new-variable-name')?.focus()}>변수 추가</Button>
          <Button variant="primary" icon={<Octicon name="check" size={16} />} disabled={!onSaveChanges} onClick={onSaveChanges}>변경사항 저장</Button>
        </Actions>
      </TabsRow>

      <Notice role="note">
        <NoticeIcon aria-hidden="true"><Octicon name="lock" size={20} /></NoticeIcon>
        <NoticeCopy>
          <NoticeTitle>비밀 변수는 저장한 뒤 다시 볼 수 없습니다</NoticeTitle>
          <NoticeDescription>일반 변수는 팀원 모두가 볼 수 있습니다. API 키처럼 숨길 값은 비밀로 저장하세요.</NoticeDescription>
        </NoticeCopy>
      </Notice>

      <Panel>
        <PanelHeading>
          <PanelTitle>
            등록된 변수 · {variables.length}개
            {storageBytesUsed !== undefined && storageBytesLimit !== undefined
              ? ` · ${(storageBytesUsed / 1024).toFixed(1)} / ${(storageBytesLimit / 1024).toFixed(0)} KB`
              : ''}
          </PanelTitle>
          <Button variant="ghost" icon={<Octicon name="pencil" size={16} />} disabled={!onEditVariables} onClick={onEditVariables}>변수 편집</Button>
        </PanelHeading>
        {variables.map(variable => (
          <VariableRow key={variable.name}>
            <VariableIcon aria-hidden="true"><Octicon name="key" size={16} /></VariableIcon>
            <VariableCopy>
              <VariableName>{variable.name}</VariableName>
              <VariableValue>{variable.secret ? '비밀 · 저장한 뒤 다시 볼 수 없습니다' : variable.value ?? ''}</VariableValue>
            </VariableCopy>
            {variable.secret && (
              <RowActions>
                <Button variant="ghost" icon={<Octicon name="pencil" size={16} />} disabled={!onUpdateVariable} onClick={() => setSecretUpdate({ name: variable.name, value: '' })}>값 바꾸기</Button>
                <Button variant="ghost" icon={<Octicon name="trashcan" size={16} />} disabled={!onDeleteVariable} onClick={() => onDeleteVariable?.(variable.name)}>지우기</Button>
              </RowActions>
            )}
          </VariableRow>
        ))}
      </Panel>

      <Panel as="form" onSubmit={addVariable}>
        <PanelHeading>
          <PanelTitle>새 환경변수</PanelTitle>
          <Button variant="ghost" icon={<Octicon name="trashcan" size={16} />} disabled={!canEdit} onClick={() => { setName(''); setValue(''); setSecret(false); }}>이 행 삭제</Button>
        </PanelHeading>
        <FieldGroup htmlFor="serverless-new-variable-name">키
          <Input id="serverless-new-variable-name" value={name} onChange={event => setName(event.currentTarget.value)} disabled={!canEdit} />
        </FieldGroup>
        <FieldGroup htmlFor="serverless-new-variable-value">값
          <Input id="serverless-new-variable-value" value={value} onChange={event => setValue(event.currentTarget.value)} disabled={!canEdit} />
        </FieldGroup>
        <Switch label="비밀로 저장" checked={secret} disabled={!canEdit} onChange={setSecret} />
        {onAddVariable && <Button type="submit" variant="secondary" disabled={!name.trim()}>변수 추가</Button>}
      </Panel>

      <Panel>
        <PanelHeading><PanelTitle>DB 연결</PanelTitle></PanelHeading>
        <FieldGroup htmlFor="serverless-database">연결할 Database
          <Select
            id="serverless-database"
            value={selectedDatabaseId ?? ''}
            disabled={!databases.length || !onSelectDatabase}
            onChange={event => onSelectDatabase?.(event.currentTarget.value)}
          >
            <option value="">{databases.length ? 'Database를 선택하세요' : '연결할 Database 없음'}</option>
            {databases.map(database => <option key={database.id} value={database.id}>{database.label}</option>)}
          </Select>
        </FieldGroup>
        <BodyText>고른 Database의 접속 정보가 비밀 변수로 들어갑니다. 코드에 비밀번호를 적지 않아도 됩니다.</BodyText>
      </Panel>

      <Panel>
        <PanelHeading>
          <PanelTitle><Octicon name="code" size={16} /> 코드에서 사용하기</PanelTitle>
        </PanelHeading>
        <Code aria-label="환경변수 사용 예시">
          <CodeLine><LineNumber>1</LineNumber><code>const greeting = env.GREETING;</code></CodeLine>
          <CodeLine><LineNumber>2</LineNumber><code>const serviceName = env.SERVICE_NAME;</code></CodeLine>
        </Code>
        <BodyText>바꾼 값은 다음 실행부터 반영됩니다.</BodyText>
      </Panel>
      {secretUpdate && <UpdateOverlay onMouseDown={event => { if (event.currentTarget === event.target) setSecretUpdate(null); }}>
        <UpdateDialog role="dialog" aria-modal="true" aria-labelledby="secret-variable-update-title" onSubmit={updateSecretVariable}>
          <UpdateTitle id="secret-variable-update-title">{secretUpdate.name} 값을 바꾸시겠습니까?</UpdateTitle>
          <UpdateNotes>
            <span>· 저장하면 지금 값은 다시 볼 수 없습니다.</span>
            <span>· 다음 실행부터 새 값을 씁니다.</span>
          </UpdateNotes>
          <FieldGroup htmlFor="serverless-secret-variable-value">새 값
            <Input id="serverless-secret-variable-value" type="password" autoComplete="new-password" autoFocus value={secretUpdate.value} placeholder="새 값을 입력하세요" onChange={event => setSecretUpdate(current => current ? { ...current, value: event.currentTarget.value } : current)} />
          </FieldGroup>
          <UpdateActions>
            <Button type="button" variant="secondary" onClick={() => setSecretUpdate(null)}>취소</Button>
            <Button type="submit" variant="primary" disabled={!secretUpdate.value.trim()}>저장</Button>
          </UpdateActions>
        </UpdateDialog>
      </UpdateOverlay>}
    </Page>
  );
}

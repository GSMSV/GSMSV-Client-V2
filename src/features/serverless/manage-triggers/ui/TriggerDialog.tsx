import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import styled from 'styled-components';
import { formatCronExecution, getNextCronExecution, validateCronExpression, type DemoServerlessTrigger } from '../../../../entities/serverless';
import { Button, SelectField, TextField } from '../../../../shared/ui/controls';
import { Octicon } from '../../../../shared/ui/icons';

type TriggerType = DemoServerlessTrigger['type'];
type TriggerDraft = Omit<DemoServerlessTrigger, 'id'>;
type TriggerAddResult = boolean | string | void;

export interface TriggerDialogProps {
  type: TriggerType;
  onAdd: (trigger: TriggerDraft) => TriggerAddResult;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 24px;
  background: rgba(14, 12, 16, 0.66);
`;

const Panel = styled.section`
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
  outline: none;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const HeaderIcon = styled.span<{ $error: boolean }>`
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${({ theme, $error }) => $error ? theme.colors.danger : theme.colors.primary};
`;

const Title = styled.h2<{ $error: boolean }>`
  flex: 1 1 auto;
  margin: 0;
  color: ${({ theme, $error }) => $error ? theme.colors.danger : theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Notes = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  list-style: none;
`;

const FieldGroup = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`;

const InlineHelp = styled.p<{ $error?: boolean }>`
  margin: 0;
  color: ${({ theme, $error }) => $error ? theme.colors.danger : theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Actions = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
  padding-top: 0;
`;

const MethodOptions = [
  { value: 'ALL', label: '전체 · GET, POST, PUT, PATCH, DELETE' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export function TriggerDialog({ type, onAdd, onClose }: TriggerDialogProps) {
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [method, setMethod] = useState('ALL');
  const [cronExpression, setCronExpression] = useState('*/5 * * * *');
  const [submissionError, setSubmissionError] = useState('');
  const validation = validateCronExpression(cronExpression);
  const nextExecution = validation.valid ? getNextCronExecution(cronExpression) : undefined;

  useEffect(() => {
    panelRef.current?.focus();
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const isCron = type === 'Cron';
  const hasCronError = isCron && !validation.valid;
  const isTooFrequent = hasCronError && validation.reason === 'frequency';
  const errorTitle = isTooFrequent
    ? '5분보다 짧은 간격은 쓸 수 없습니다'
    : hasCronError && validation.reason === 'calendar'
      ? '실행할 날짜가 없습니다'
      : 'Cron 표현식을 확인해주세요';
  const errorDescription = isTooFrequent
    ? '예약 실행은 5분에 한 번까지 할 수 있습니다. 간격을 5분 이상으로 바꿔 주세요.'
    : hasCronError && validation.reason === 'calendar'
      ? '날짜·월·요일 조합으로 실행되는 날짜를 찾을 수 없습니다. 표현식을 수정해 주세요.'
      : '표현식이 올바르지 않아 Trigger를 추가하지 않았습니다. 표현식을 수정하면 다음 실행 시각을 확인할 수 있습니다.';

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const controls = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submit = () => {
    if (isCron && !validation.valid) return;
    const added = onAdd({ type, schedule: isCron ? cronExpression.trim() : method, enabled: true });
    if (added === false || typeof added === 'string') {
      setSubmissionError(typeof added === 'string' ? added : '최신 Trigger 상태와 달라 추가하지 못했습니다. 취소한 뒤 목록을 확인하고 다시 시도해 주세요.');
      return;
    }
    onClose();
  };

  return (
    <Overlay
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <Panel ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="serverless-trigger-dialog-title" tabIndex={-1}>
        <Header>
          <HeaderIcon $error={Boolean(hasCronError)} aria-hidden="true">
            <Octicon name={hasCronError ? 'alert' : isCron ? 'clock' : 'globe'} size={24} />
          </HeaderIcon>
          <Title id="serverless-trigger-dialog-title" $error={Boolean(hasCronError)}>
            {hasCronError ? errorTitle : `${type} Trigger 추가`}
          </Title>
        </Header>

        {isCron ? (
          <>
            <Description>{hasCronError ? errorDescription : '예약한 시각에 함수가 실행됩니다. 다음 실행 시각을 확인하고 추가하세요.'}</Description>
            {!hasCronError && <Notes>
              <li>· 다음 실행 · {nextExecution ? formatCronExecution(nextExecution) : '계산할 수 없습니다'}</li>
              <li>· 예약 실행 결과는 실행 Log에 남습니다.</li>
              <li>· 예약 Trigger는 함수마다 3개까지 · 5분보다 짧은 간격은 쓸 수 없습니다.</li>
            </Notes>}
            <FieldGroup>
              <TextField
                label="Cron 표현식"
                value={cronExpression}
                onChange={event => { setCronExpression(event.currentTarget.value); setSubmissionError(''); }}
                error={validation.valid ? undefined : validation.reason === 'frequency'
                  ? `${validation.minimumIntervalMinutes}분마다 실행 · 5분 이상으로 입력해 주세요.`
                  : validation.reason === 'calendar'
                    ? '실행되는 날짜가 없습니다. 날짜·월·요일을 확인해 주세요.'
                    : '올바른 Cron 표현식을 입력해 주세요. 예: */5 * * * *'}
              />
              <TextField label="다음 실행" value={nextExecution ? formatCronExecution(nextExecution) : '올바른 표현식을 입력하면 표시됩니다.'} disabled />
              <InlineHelp>시간대 · Asia/Seoul · 서울 시간으로 고정됩니다.</InlineHelp>
            </FieldGroup>
          </>
        ) : (
          <>
            <Description>HTTP Trigger는 함수마다 1개입니다. 호출 주소로 들어온 요청을 받습니다.</Description>
            <Notes>
              <li>· 동시에 2개까지 실행합니다. 넘은 요청은 429로 거절합니다.</li>
            </Notes>
            <SelectField label="받을 메서드" value={method} options={MethodOptions} onChange={setMethod} />
          </>
        )}

        <Actions>
          <Button variant="secondary" icon={<Octicon name={hasCronError ? 'arrow-left' : 'x'} size={16} />} onClick={onClose}>
            {hasCronError ? '돌아가기' : '취소'}
          </Button>
          <Button
            variant="primary"
            icon={<Octicon name="plus" size={16} />}
            disabled={!onAdd || Boolean(hasCronError) || Boolean(submissionError)}
            onClick={submit}
          >Trigger 추가</Button>
        </Actions>
        {hasCronError && <InlineHelp $error>표현식 오류를 수정한 뒤 Trigger를 추가할 수 있습니다.</InlineHelp>}
        {submissionError && <InlineHelp $error role="alert">{submissionError}</InlineHelp>}
      </Panel>
    </Overlay>
  );
}

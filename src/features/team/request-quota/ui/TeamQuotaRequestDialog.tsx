import { useId, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button, SelectField, TextField } from '../../../../shared/ui/controls';
import { ModalSurface } from '../../../../shared/ui/feedback/ModalSurface';
import { Octicon } from '../../../../shared/ui/icons';

const Panel = styled.div`
  display: flex;
  width: min(480px, calc(100vw - 32px));
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  svg { flex: none; }
`;

const Title = styled.h2`
  margin: 0;
  font: ${({ theme: { typography: { h2 } } }) => `${h2.weight} ${h2.size}px/${h2.lineHeight}px ${h2.family}`}, sans-serif;
`;

const Copy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  white-space: pre-line;
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const FieldStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const Help = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme: { typography: { caption } } }) => `${caption.weight} ${caption.size}px/${caption.lineHeight}px ${caption.family}`}, sans-serif;
`;

const Error = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme: { typography: { caption } } }) => `${caption.weight} ${caption.size}px/${caption.lineHeight}px ${caption.family}`}, sans-serif;
`;

const tiers = [
  { value: '소형', label: '소형 · vCPU 4 · RAM 8GB · SSD 60GB' },
  { value: '중형', label: '중형 · vCPU 8 · RAM 16GB · SSD 120GB' },
  { value: '대형', label: '대형 · vCPU 16 · RAM 32GB · SSD 240GB' },
];

export function TeamQuotaRequestDialog({ teamName, onDismiss, onSubmit }: {
  teamName: string;
  onDismiss: () => void;
  onSubmit: (tier: '소형' | '중형' | '대형', reason: string) => boolean | Promise<boolean>;
}) {
  const titleId = useId();
  const [tier, setTier] = useState<'소형' | '중형' | '대형'>('중형');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > 500) {
      setError('사유를 1~500자로 입력해 주세요.');
      return;
    }
    setBusy(true);
    try {
      if (!await onSubmit(tier, trimmed)) setError('할당량 요청을 저장하지 못했습니다. 다시 시도해 주세요.');
    } catch {
      setError('할당량 요청을 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return <ModalSurface labelledBy={titleId} onDismiss={onDismiss}>
    <Panel>
      <Header><Octicon name="graph" size={24} aria-hidden="true" /><Title id={titleId}>할당량 늘리기 요청</Title></Header>
      <Copy>관리자가 승인하면 {teamName} 팀원 전원에게 알립니다.</Copy>
      <FieldStack onSubmit={submit}>
        <SelectField label="요청 등급" value={tier} options={tiers} onChange={value => {
          if (value === '소형' || value === '중형' || value === '대형') setTier(value);
        }} disabled={busy} />
        <TextField label="사유" value={reason} onChange={event => { setReason(event.currentTarget.value); setError(''); }} placeholder="DB 서버를 분리해 상시 운영하려고 합니다." maxLength={500} disabled={busy} />
        <Help>요청할 자원 등급과 필요한 이유를 입력해 주세요.</Help>
        {error && <Error role="alert">{error}</Error>}
        <Actions>
          <Button type="button" variant="secondary" onClick={onDismiss} disabled={busy}>취소</Button>
          <Button type="submit" disabled={busy}>{busy ? '보내는 중…' : '요청 보내기'}</Button>
        </Actions>
      </FieldStack>
    </Panel>
  </ModalSurface>;
}

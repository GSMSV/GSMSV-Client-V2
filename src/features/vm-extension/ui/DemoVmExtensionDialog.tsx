import { useId, useState } from 'react';
import styled from 'styled-components';
import { Button, TextareaField } from '../../../shared/ui/controls';
import { ModalSurface } from '../../../shared/ui/feedback/ModalSurface';
import { Octicon } from '../../../shared/ui/icons';

const Panel = styled.div`
  display: flex;
  width: min(480px, calc(100vw - 32px));
  flex-direction: column;
  gap: 16px;
  padding: 25px;
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;

  svg { flex-shrink: 0; }
`;

const Copy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

interface DemoVmExtensionDialogProps {
  initialPurpose: string;
  extensionCount: number;
  error: string;
  onConfirm: (purpose?: string) => void;
  onDismiss: () => void;
}

export function DemoVmExtensionDialog({ initialPurpose, extensionCount, error, onConfirm, onDismiss }: DemoVmExtensionDialogProps) {
  const titleId = useId();
  const [purpose, setPurpose] = useState(initialPurpose);

  return (
    <ModalSurface labelledBy={titleId} onDismiss={onDismiss} dismissOnBackdrop>
      <Panel>
        <Title id={titleId}><Octicon name="calendar" size={24} aria-hidden="true" />아직 이 목적으로 사용 중입니까?</Title>
        <Copy>{extensionCount}번째 연장입니다. 사용 목적을 확인해 주세요.</Copy>
        <TextareaField label="사용 목적" value={purpose} maxLength={100} onChange={event => setPurpose(event.currentTarget.value)} />
        {error && <Copy role="alert">{error}</Copy>}
        <Actions>
          <Button variant="secondary" icon={<Octicon name="pencil" />} disabled={!purpose.trim() || purpose.trim().length > 100} onClick={() => onConfirm(purpose)}>목적 수정 후 연장</Button>
          <Button variant="primary" icon={<Octicon name="calendar" />} onClick={() => onConfirm()}>그대로 연장</Button>
        </Actions>
      </Panel>
    </ModalSurface>
  );
}

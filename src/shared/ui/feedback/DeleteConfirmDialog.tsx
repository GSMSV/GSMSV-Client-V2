import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Button, TextField } from '../controls';
import { Octicon } from '../icons';

const Panel = styled.section<{ $matched: boolean }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 480px;
  height: ${({ $matched }) => $matched ? '392px' : '426px'};
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const WarningIcon = styled.span`
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${({ theme }) => theme.colors.danger};
`;

const Title = styled.h2`
  margin: 0;
  flex: 1 1 auto;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.h2.family};
  font-size: ${({ theme }) => theme.typography.h2.size}px;
  font-weight: ${({ theme }) => theme.typography.h2.weight};
  line-height: ${({ theme }) => theme.typography.h2.lineHeight}px;
`;

const Copy = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.bodySmall.family};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  white-space: pre-line;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const Caption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font-family: ${({ theme }) => theme.typography.caption.family};
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
`;

export interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  items?: ReactNode;
  fieldLabel: string;
  confirmationName: string;
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  caption?: ReactNode;
  hint?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  className?: string;
}

export function DeleteConfirmDialog({
  open,
  title,
  description,
  items,
  fieldLabel,
  confirmationName,
  value,
  onValueChange,
  onConfirm,
  onCancel,
  caption,
  hint,
  cancelLabel = '취소',
  confirmLabel = '삭제',
  className,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  const matched = value === confirmationName;

  return (
    <Panel $matched={matched} className={className} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
      <Header>
        <WarningIcon aria-hidden="true"><Octicon name="alert" size={24} /></WarningIcon>
        <Title id="delete-confirm-title">{title}</Title>
      </Header>
      {description && <Copy>{description}</Copy>}
      {items && <Copy>{items}</Copy>}
      <FieldGroup>
        <TextField
          label={fieldLabel}
          value={value}
          onChange={event => onValueChange(event.currentTarget.value)}
        />
        {caption && <Caption>{caption}</Caption>}
      </FieldGroup>
      <Actions>
        <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="danger" icon={<Octicon name="trashcan" size={16} />} disabled={!matched} onClick={onConfirm}>{confirmLabel}</Button>
      </Actions>
      {!matched && hint && <Caption>{hint}</Caption>}
    </Panel>
  );
}

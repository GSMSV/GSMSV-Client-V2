import { useState } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from '../controls';

const SecretRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
`;

const SecretLabel = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.label.family};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const SecretValue = styled.code`
  flex: 1 1 auto;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.code.family};
  font-size: ${({ theme }) => theme.typography.code.size}px;
  line-height: ${({ theme }) => theme.typography.code.lineHeight}px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

export interface RevealableSecretProps {
  label: string;
  value: string;
  showLabel?: string;
  hideLabel?: string;
  onReveal?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function RevealableSecret({ label, value, showLabel = '표시', hideLabel = '숨기기', onReveal, actions, className }: RevealableSecretProps) {
  const [shown, setShown] = useState(false);

  const toggle = () => {
    if (!shown) onReveal?.();
    setShown(current => !current);
  };

  return (
    <SecretRow className={className}>
      <SecretLabel>{label}</SecretLabel>
      <SecretValue aria-label={label}>{shown ? value : '••••••••'}</SecretValue>
      <Actions>
        {actions}
        <Button variant="ghost" onClick={toggle} aria-pressed={shown}>
          {shown ? hideLabel : showLabel}
        </Button>
      </Actions>
    </SecretRow>
  );
}

export interface WriteOnlySecretProps {
  name: string;
  onChange: () => void;
  onDelete: () => void;
  changeLabel?: string;
  deleteLabel?: string;
  className?: string;
}

export function WriteOnlySecret({ name, onChange, onDelete, changeLabel = '변경', deleteLabel = '삭제', className }: WriteOnlySecretProps) {
  return (
    <SecretRow className={className}>
      <SecretLabel>{name}</SecretLabel>
      <SecretValue aria-label={`${name}: 저장된 값은 다시 볼 수 없습니다`}>••••••••</SecretValue>
      <Actions>
        <Button variant="ghost" onClick={onChange}>{changeLabel}</Button>
        <Button variant="danger" onClick={onDelete}>{deleteLabel}</Button>
      </Actions>
    </SecretRow>
  );
}

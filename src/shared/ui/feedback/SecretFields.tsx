import { useState } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from '../controls';
import { Octicon } from '../icons';

const SecretRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 600px;
`;

const KeySlot = styled.span`
  display: inline-flex;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.faint};
`;

const ValueStack = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`;

const SecretLabel = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font-family: ${({ theme }) => theme.typography.label.family};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const SecretValue = styled.span<{ $shown: boolean }>`
  display: block;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme, $shown }) => $shown ? theme.typography.code.family : theme.typography.bodySmall.family};
  font-size: ${({ theme, $shown }) => ($shown ? theme.typography.code.size : theme.typography.bodySmall.size)}px;
  line-height: ${({ theme, $shown }) => ($shown ? theme.typography.code.lineHeight : theme.typography.bodySmall.lineHeight)}px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const WriteOnlyDescription = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.bodySmall.family};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

export interface RevealableSecretProps {
  label: string;
  value: string;
  showLabel?: string;
  hideLabel?: string;
  copyLabel?: string;
  onReveal?: () => void;
  onCopy?: (value: string) => void | Promise<void>;
  actions?: ReactNode;
  className?: string;
}

export function RevealableSecret({
  label,
  value,
  showLabel = '표시',
  hideLabel = '숨기기',
  copyLabel = '복사',
  onReveal,
  onCopy,
  actions,
  className,
}: RevealableSecretProps) {
  const [shown, setShown] = useState(false);

  const toggle = () => {
    if (!shown) onReveal?.();
    setShown(current => !current);
  };

  const copy = async () => {
    if (onCopy) {
      await onCopy(value);
      return;
    }
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Clipboard access can be unavailable in insecure or restricted contexts.
    }
  };

  return (
    <SecretRow className={className}>
      <KeySlot aria-hidden="true"><Octicon name="key" size={16} /></KeySlot>
      <ValueStack>
        <SecretLabel>{label}</SecretLabel>
        <SecretValue $shown={shown} aria-label={label}>{shown ? value : '••••••••••••'}</SecretValue>
      </ValueStack>
      <Actions>
        {actions}
        <Button variant="ghost" icon={<Octicon name={shown ? 'eye-closed' : 'eye'} size={16} />} onClick={toggle} aria-pressed={shown} aria-label={shown ? hideLabel : showLabel}>
          {shown ? hideLabel : showLabel}
        </Button>
        <Button variant="ghost" icon={<Octicon name="copy" size={16} />} onClick={copy} aria-label={copyLabel}>{copyLabel}</Button>
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

export function WriteOnlySecret({ name, onChange, onDelete, changeLabel = '값 바꾸기', deleteLabel = '지우기', className }: WriteOnlySecretProps) {
  return (
    <SecretRow className={className}>
      <KeySlot aria-hidden="true"><Octicon name="key" size={16} /></KeySlot>
      <ValueStack>
        <SecretLabel>{name}</SecretLabel>
        <WriteOnlyDescription aria-label={`${name}: 저장한 뒤 다시 볼 수 없습니다`}>
          비밀 · 저장한 뒤 다시 볼 수 없습니다
        </WriteOnlyDescription>
      </ValueStack>
      <Actions>
        <Button variant="ghost" icon={<Octicon name="pencil" size={16} />} onClick={onChange}>{changeLabel}</Button>
        <Button variant="ghost" icon={<Octicon name="trashcan" size={16} />} onClick={onDelete}>{deleteLabel}</Button>
      </Actions>
    </SecretRow>
  );
}

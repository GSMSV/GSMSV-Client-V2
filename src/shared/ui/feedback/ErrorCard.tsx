import styled from 'styled-components';
import { Button } from '../controls';
import { Octicon } from '../icons';

export type ErrorCardSize = 'default' | 'compact';

const Surface = styled.section<{ $size: ErrorCardSize }>`
  display: flex;
  flex-direction: ${({ $size }) => $size === 'compact' ? 'row' : 'column'};
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: ${({ $size }) => $size === 'compact' ? '82px' : '174px'};
  padding: ${({ $size, theme }) => $size === 'compact' ? `${theme.space[16]}px ${theme.space[24]}px` : `${theme.space[24]}px`};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
`;

const IconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.warning};
`;

const Message = styled.span`
  font-family: ${({ theme }) => theme.typography.bodySmall.family};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

export interface ErrorCardProps {
  onRetry: () => void;
  size?: ErrorCardSize;
  retryLabel?: string;
  className?: string;
}

export function ErrorCard({ onRetry, size = 'default', retryLabel = '다시 시도', className }: ErrorCardProps) {
  return (
    <Surface $size={size} className={className} role="alert">
      <IconSlot aria-hidden="true"><Octicon name="alert" size={16} /></IconSlot>
      <Message>불러오지 못했습니다</Message>
      <Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={onRetry}>{retryLabel}</Button>
    </Surface>
  );
}

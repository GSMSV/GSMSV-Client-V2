import type { ReactNode } from 'react';
import styled from 'styled-components';

export type StatusTone = 'neutral' | 'primary' | 'warning' | 'danger';

const StyledBadge = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  font-family: ${({ theme }) => theme.typography.label.family};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
  white-space: nowrap;
  color: ${({ theme, $tone }) =>
    $tone === 'primary' ? theme.colors.primary :
    $tone === 'warning' ? theme.colors.warning :
    $tone === 'danger' ? theme.colors.danger : theme.colors.muted};
  background: ${({ theme, $tone }) =>
    $tone === 'primary' ? theme.colors.primarySoft :
    $tone === 'warning' ? theme.colors.warningSoft :
    $tone === 'danger' ? theme.colors.dangerSoft : theme.colors.raised};
`;

export interface StatusBadgeProps {
  children: ReactNode;
  tone: StatusTone;
  className?: string;
}

export function StatusBadge({ children, tone, className }: StatusBadgeProps) {
  return <StyledBadge $tone={tone} className={className}>{children}</StyledBadge>;
}

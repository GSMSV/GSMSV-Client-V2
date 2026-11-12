import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Octicon } from '../icons';

export type BannerTone = 'neutral' | 'primary' | 'warning' | 'danger';

const Surface = styled.section<{ $tone: BannerTone }>`
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 82px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $tone }) =>
    $tone === 'primary' ? theme.colors.primarySoft :
    $tone === 'warning' ? theme.colors.warningSoft :
    $tone === 'danger' ? theme.colors.dangerSoft : theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`;

const IconSlot = styled.span<{ $tone: BannerTone }>`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${({ theme, $tone }) =>
    $tone === 'primary' ? theme.colors.primary :
    $tone === 'warning' ? theme.colors.warning :
    $tone === 'danger' ? theme.colors.danger : theme.colors.muted};
`;

const Copy = styled.div`
  display: grid;
  flex: 1 1 auto;
  gap: 4px;
  min-width: 0;
`;

const Title = styled.strong<{ $tone: BannerTone }>`
  color: ${({ theme, $tone }) =>
    $tone === 'primary' ? theme.colors.primary :
    $tone === 'warning' ? theme.colors.warning :
    $tone === 'danger' ? theme.colors.danger : theme.colors.text};
  font-family: ${({ theme }) => theme.typography.bodySmall.family};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: 500;
  line-height: 20px;
`;

const Description = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.bodySmall.family};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const Actions = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

export interface BannerProps {
  title: string;
  description?: ReactNode;
  tone: BannerTone;
  icon?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function Banner({ title, description, tone, icon, action, secondaryAction, className }: BannerProps) {
  return (
    <Surface $tone={tone} className={className} role="status">
      <IconSlot $tone={tone} aria-hidden="true">
        {icon ?? <Octicon name="clock" size={20} />}
      </IconSlot>
      <Copy>
        <Title $tone={tone}>{title}</Title>
        {description != null && <Description>{description}</Description>}
      </Copy>
      {action && (
        <Actions>
          {secondaryAction && <>{secondaryAction}</>}
          {action}
        </Actions>
      )}
    </Surface>
  );
}

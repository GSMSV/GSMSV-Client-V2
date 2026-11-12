import type { ReactNode } from 'react';
import styled from 'styled-components';

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

const IconSlot = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const Copy = styled.div`
  display: grid;
  flex: 1 1 auto;
  gap: 4px;
  min-width: 0;
`;

const Title = styled.strong`
  font-family: ${({ theme }) => theme.typography.label.family};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: 600;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
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
      {icon && <IconSlot aria-hidden="true">{icon}</IconSlot>}
      <Copy>
        <Title>{title}</Title>
        {description != null && <Description>{description}</Description>}
      </Copy>
      {(secondaryAction || action) && (
        <Actions>
          {secondaryAction}
          {action}
        </Actions>
      )}
    </Surface>
  );
}

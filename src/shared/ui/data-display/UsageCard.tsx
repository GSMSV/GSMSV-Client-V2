import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Meter, type MeterTone } from './Meter';

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 371px;
  min-height: 174px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconSlot = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Label = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.label.family};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const Value = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.h2.family};
  font-size: ${({ theme }) => theme.typography.h2.size}px;
  font-weight: ${({ theme }) => theme.typography.h2.weight};
  line-height: ${({ theme }) => theme.typography.h2.lineHeight}px;
`;

const Caption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font-family: ${({ theme }) => theme.typography.caption.family};
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

export interface UsageCardProps {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon?: ReactNode;
  meter?: { value: number; tone: MeterTone; label: string };
  className?: string;
}

export function UsageCard({ label, value, caption, icon, meter, className }: UsageCardProps) {
  return (
    <Card className={className}>
      <Header>
        {icon && <IconSlot aria-hidden="true">{icon}</IconSlot>}
        <Label>{label}</Label>
      </Header>
      <Value>{value}</Value>
      {meter && <Meter value={meter.value} tone={meter.tone} label={meter.label} />}
      {caption != null && <Caption>{caption}</Caption>}
    </Card>
  );
}

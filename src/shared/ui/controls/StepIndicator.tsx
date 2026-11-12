import styled from 'styled-components';

export interface StepIndicatorProps {
  number: number;
  label: string;
  active?: boolean;
}

export interface StepConnectorProps {
  length?: 18 | 36;
}

const StepRoot = styled.div<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.muted)};
`;

const StepNumber = styled.span<{ $active: boolean }>`
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: 50%;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.muted)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : 'transparent')};
  font-family: ${({ theme }) => theme.typography.label.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const StepLabel = styled.span<{ $active: boolean }>`
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.muted)};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: ${({ theme, $active }) => ($active ? 500 : theme.typography.bodySmall.weight)};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

export function StepIndicator({ number, label, active = false }: StepIndicatorProps) {
  return (
    <StepRoot $active={active} aria-current={active ? 'step' : undefined}>
      <StepNumber $active={active}>{number}</StepNumber>
      <StepLabel $active={active}>{label}</StepLabel>
    </StepRoot>
  );
}

const Connector = styled.span<{ $length: 18 | 36 }>`
  display: inline-block;
  width: ${({ $length }) => $length}px;
  height: 1px;
  flex: 0 0 ${({ $length }) => $length}px;
  background: ${({ theme }) => theme.colors.border};
`;

export function StepConnector({ length = 36 }: StepConnectorProps) {
  return <Connector $length={length} role="presentation" />;
}

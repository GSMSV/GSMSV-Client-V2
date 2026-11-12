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
  gap: 12px;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.muted)};
`;

const StepNumber = styled.span<{ $active: boolean }>`
  display: inline-flex;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.sm}px;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : theme.colors.canvas)};
  font-family: ${({ theme }) => theme.typography.label.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const StepLabel = styled.span<{ $active: boolean }>`
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.border)};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  font-weight: ${({ theme }) => theme.typography.caption.weight};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
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
  width: 1px;
  height: ${({ $length }) => $length}px;
  flex: 0 0 1px;
  background: ${({ theme }) => theme.colors.border};
`;

export function StepConnector({ length = 36 }: StepConnectorProps) {
  return <Connector $length={length} role="presentation" />;
}

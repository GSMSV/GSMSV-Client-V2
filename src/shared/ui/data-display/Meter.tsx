import styled from 'styled-components';

export type MeterTone = 'primary' | 'warning' | 'danger';

const Track = styled.div`
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
`;

const Fill = styled.div<{ $value: number; $tone: MeterTone }>`
  width: ${({ $value }) => `${Math.max(0, Math.min(100, $value))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ theme, $tone }) =>
    $tone === 'warning' ? theme.colors.warning :
    $tone === 'danger' ? theme.colors.danger : theme.colors.primary};
`;

export interface MeterProps {
  value: number | 'over';
  tone?: MeterTone;
  label: string;
  className?: string;
}

export function Meter({ value, tone, label, className }: MeterProps) {
  const numericValue = value === 'over' ? 100 : value;
  const normalized = Math.max(0, Math.min(100, numericValue));
  const resolvedTone = tone ?? (value === 'over' ? 'danger' : value >= 80 ? 'warning' : 'primary');

  return (
    <Track
      className={className}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      aria-valuetext={value === 'over' ? '초과' : `${normalized}%`}
    >
      <Fill $value={normalized} $tone={resolvedTone} />
    </Track>
  );
}

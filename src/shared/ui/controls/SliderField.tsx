import type { InputHTMLAttributes } from 'react';
import styled from 'styled-components';

export interface SliderFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  label: string;
  value: number;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  valueLabel?: string;
  step?: number;
  helper?: string;
  showHelper?: boolean;
  onChange?: (value: number) => void;
}

const Root = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.label.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const Value = styled.output`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
`;

const Track = styled.div`
  position: relative;
  width: 100%;
  height: 20px;
`;

const TrackRest = styled.span`
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  transform: translateY(-50%);
  pointer-events: none;
`;

const TrackFill = styled.span<{ $percent: number; $offset: number }>`
  position: absolute;
  top: 50%;
  left: 0;
  width: calc(${({ $percent }) => $percent}% + ${({ $offset }) => $offset}px);
  height: 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.primary};
  transform: translateY(-50%);
  pointer-events: none;
`;

const Thumb = styled.img<{ $percent: number; $offset: number }>`
  position: absolute;
  z-index: 1;
  top: 50%;
  left: calc(${({ $percent }) => $percent}% + ${({ $offset }) => $offset}px);
  display: block;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const Range = styled.input`
  position: absolute;
  z-index: 2;
  inset: 0;
  width: 100%;
  height: 20px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 20px;
    background: transparent;
  }

  &::-moz-range-track {
    height: 20px;
    border: 0;
    background: transparent;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    margin: 0;
    border: 0;
    background: transparent;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border: 0;
    background: transparent;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const Helper = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

const RangeLabels = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.faint};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  font-weight: ${({ theme }) => theme.typography.caption.weight};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
  white-space: nowrap;
`;

export function SliderField({
  label,
  value,
  min,
  max,
  minLabel = `최소 ${min}`,
  maxLabel = `최대 ${max}`,
  valueLabel,
  step,
  helper,
  showHelper = false,
  onChange,
  id,
  ...props
}: SliderFieldProps) {
  const inputId = id ?? `slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const percent = max <= min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const offset = 10 - (percent * 0.2);

  return (
    <Root>
      <LabelRow>
        <Label htmlFor={inputId}>{label}</Label>
        <Value htmlFor={inputId}>{valueLabel ?? value}</Value>
      </LabelRow>
      <Track>
        <TrackRest aria-hidden="true" />
        <TrackFill $percent={percent} $offset={offset} aria-hidden="true" />
        <Thumb src="/assets/slider-thumb.svg" alt="" width={20} height={20} $percent={percent} $offset={offset} />
        <Range
          {...props}
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(event) => onChange?.(Number(event.currentTarget.value))}
        />
      </Track>
      <RangeLabels aria-hidden="true">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </RangeLabels>
      {showHelper && helper && <Helper>{helper}</Helper>}
    </Root>
  );
}

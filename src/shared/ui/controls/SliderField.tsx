import type { InputHTMLAttributes } from 'react';
import styled from 'styled-components';

export interface SliderFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  label: string;
  value: number;
  min: number;
  max: number;
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
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.label.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const Value = styled.output`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.code.family}, monospace;
  font-size: ${({ theme }) => theme.typography.code.size}px;
  font-weight: ${({ theme }) => theme.typography.code.weight};
  line-height: ${({ theme }) => theme.typography.code.lineHeight}px;
`;

const Range = styled.input<{ $percent: number }>`
  width: 100%;
  height: 20px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      ${({ theme }) => theme.colors.primary} 0%,
      ${({ theme }) => theme.colors.primary} ${({ $percent }) => `calc(20px + (100% - 20px) * ${$percent / 100})`},
      ${({ theme }) => theme.colors.raised} ${({ $percent }) => `calc(20px + (100% - 20px) * ${$percent / 100})`},
      ${({ theme }) => theme.colors.raised} 100%
    );
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.raised};
  }

  &::-moz-range-progress {
    height: 4px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.primary};
  }

  &::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
    margin-top: -6px;
    appearance: none;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.canvas};
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.canvas};
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

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  helper,
  showHelper = Boolean(helper),
  onChange,
  id,
  ...props
}: SliderFieldProps) {
  const inputId = id ?? `slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const percent = max <= min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <Root>
      <LabelRow>
        <Label htmlFor={inputId}>{label}</Label>
        <Value htmlFor={inputId}>{value}</Value>
      </LabelRow>
      <Range
        {...props}
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        $percent={percent}
        aria-label={label}
        onChange={(event) => onChange?.(Number(event.currentTarget.value))}
      />
      {showHelper && helper && <Helper>{helper}</Helper>}
    </Root>
  );
}

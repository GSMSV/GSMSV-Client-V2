import { useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import styled from 'styled-components';

export interface SwitchProps {
  label: string;
  ariaLabel?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

const SwitchRow = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
`;

const SwitchTrack = styled.span<{ $checked: boolean; $disabled: boolean }>`
  position: relative;
  box-sizing: border-box;
  width: 44px;
  height: 24px;
  flex: 0 0 44px;
  border-radius: 12px;
  background: ${({ theme, $checked }) => ($checked ? theme.colors.primary : theme.colors.raised)};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};
  transition: background-color 120ms ease, border-color 120ms ease;

  &::after {
    position: absolute;
    top: 2px;
    left: ${({ $checked }) => ($checked ? '22px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme, $checked }) => ($checked ? theme.colors.onPrimary : theme.colors.muted)};
    content: '';
    transition: left 120ms ease;
  }
`;

const HiddenSwitch = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);

  &:focus-visible + ${SwitchTrack} {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const SwitchText = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

export function Switch({ label, ariaLabel, checked, defaultChecked, disabled = false, onChange }: SwitchProps) {
  const id = useId();
  const [internalChecked, setInternalChecked] = useState(Boolean(defaultChecked));
  const isChecked = checked ?? internalChecked;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (checked === undefined) setInternalChecked(event.currentTarget.checked);
    onChange?.(event.currentTarget.checked);
  };

  return (
    <SwitchRow htmlFor={id} $disabled={disabled}>
      <HiddenSwitch
        id={id}
        type="checkbox"
        role="switch"
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        aria-checked={isChecked}
        aria-label={ariaLabel}
      />
      <SwitchTrack $checked={isChecked} $disabled={disabled} aria-hidden="true" />
      <span>{label}</span>
      <SwitchText aria-live="polite">{isChecked ? '켜짐' : '꺼짐'}</SwitchText>
    </SwitchRow>
  );
}

export interface SegmentedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  label: string;
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const SegmentGroup = styled.div`
  display: flex;
  width: 100%;
  min-width: 0;
  height: ${({ theme }) => theme.size.control}px;
  gap: ${({ theme }) => theme.space[4]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const SegmentButton = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  min-width: 0;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.muted)};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primarySoft : 'transparent')};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
  text-align: center;
  cursor: pointer;

  &:hover:not(:disabled):not([aria-checked='true']) {
    background: ${({ theme }) => theme.colors.overlayHover};
  }

  &:active:not(:disabled):not([aria-checked='true']) {
    background: ${({ theme }) => theme.colors.overlayPressed};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export function SegmentedControl({
  label,
  options,
  value,
  defaultValue,
  disabled = false,
  onChange,
}: SegmentedControlProps) {
  const id = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value);
  const selectedValue = value ?? internalValue;

  const choose = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const enabled = options.map((option, optionIndex) => (option.disabled || disabled ? -1 : optionIndex)).filter((i) => i >= 0);
    if (enabled.length === 0) return;
    const current = enabled.indexOf(index);
    let next = current;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else if (event.key === 'ArrowRight') next = (current + 1 + enabled.length) % enabled.length;
    else next = (current - 1 + enabled.length) % enabled.length;
    const option = options[enabled[next]];
    if (option) choose(option.value);
    buttonRefs.current[enabled[next]]?.focus();
  };

  return (
    <div>
      <SegmentGroup role="radiogroup" aria-label={label}>
        {options.map((option, index) => (
          <SegmentButton
            key={option.value}
            ref={(element) => { buttonRefs.current[index] = element; }}
            id={`segment-${id}-${index}`}
            type="button"
            role="radio"
            aria-checked={selectedValue === option.value}
            aria-label={option.label}
            $selected={selectedValue === option.value}
            disabled={disabled || option.disabled}
            tabIndex={selectedValue === option.value ? 0 : -1}
            onClick={() => choose(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {option.label}
          </SegmentButton>
        ))}
      </SegmentGroup>
    </div>
  );
}

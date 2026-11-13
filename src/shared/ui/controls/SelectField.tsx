import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import { Octicon } from '../icons';

export interface SelectOption {
  value: string;
  label: string;
  caption?: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export interface ComboboxProps extends SelectFieldProps {
  value?: string;
  onInputChange?: (query: string) => void;
}

const Root = styled.div`
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.label.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const Trigger = styled.button<{ $open: boolean; $invalid: boolean; $disabled: boolean }>`
  display: flex;
  width: 100%;
  min-width: 0;
  height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: ${({ theme, $invalid, $open }) =>
    $invalid ? `1px solid ${theme.colors.danger}` : $open ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.field};
  font: inherit;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};

  &:hover:not(:disabled):not([aria-expanded='true']) {
    border-color: ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.faint)};
  }

  &:focus-visible {
    border: 2px solid ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.primary)};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ValueText = styled.span<{ $placeholder: boolean }>`
  overflow: hidden;
  color: ${({ theme, $placeholder }) => ($placeholder ? theme.colors.faint : theme.colors.text)};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Caret = styled.span<{ $open: boolean }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  color: ${({ theme }) => theme.colors.muted};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 120ms ease;

  & > svg {
    display: block;
  }
`;

const Menu = styled.ul`
  position: absolute;
  z-index: 1100;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  display: flex;
  max-height: 264px;
  flex-direction: column;
  overflow-y: auto;
  margin: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  gap: 2px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 16px rgba(0, 0, 0, 0.45);
  list-style: none;
`;

const OptionButton = styled.button<{ $selected: boolean }>`
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 9px 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.text)};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primarySoft : 'transparent')};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled):not([aria-selected='true']),
  &:focus-visible:not([aria-selected='true']) {
    background: ${({ theme }) => theme.colors.overlayHover};
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const OptionCopy = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
`;

const Caption = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

const Message = styled.span<{ $error: boolean }>`
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.muted)};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

function getOptionLabel(options: SelectOption[], value?: string) {
  return options.find((option) => option.value === value)?.label;
}

export function SelectField({
  label,
  value,
  defaultValue,
  options,
  placeholder = '선택하세요',
  error,
  disabled = false,
  onChange,
}: SelectFieldProps) {
  const generatedId = useId();
  const id = `select-${generatedId}`;
  const listId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedValue = value ?? internalValue;
  const selectedLabel = getOptionLabel(options, selectedValue);
  const activeIndex = activeValue === null ? -1 : options.findIndex(option => option.value === activeValue);

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
    setActiveValue(null);
    triggerRef.current?.focus();
  };

  const move = (direction: 1 | -1) => {
    const enabled = options.map((option, index) => (option.disabled ? -1 : index)).filter((i) => i >= 0);
    if (enabled.length === 0) return;
    const currentPosition = enabled.indexOf(activeIndex);
    const nextPosition = currentPosition < 0
      ? (direction === 1 ? 0 : enabled.length - 1)
      : (currentPosition + direction + enabled.length) % enabled.length;
    setActiveValue(options[enabled[nextPosition]].value);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) setOpen(true);
      move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveValue(null);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;
      if (open && activeOption) {
        commit(activeOption);
      } else {
        setOpen(current => !current);
        if (open) setActiveValue(null);
      }
    }
  };

  return (
    <Root>
      {label && <Label id={`${id}-label`} htmlFor={id}>{label}</Label>}
      <Trigger
        ref={triggerRef}
        id={id}
        type="button"
        $open={open}
        $invalid={Boolean(error)}
        $disabled={disabled}
        disabled={disabled}
        role="combobox"
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={error ? 'true' : undefined}
        onClick={() => {
          setOpen(current => !current);
          if (open) setActiveValue(null);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <ValueText $placeholder={!selectedLabel}>{selectedLabel ?? placeholder}</ValueText>
        <Caret $open={open} aria-hidden="true"><Octicon name="chevron-down" size={16} /></Caret>
      </Trigger>
      {open && (
        <Menu id={listId} role="listbox" aria-labelledby={label ? `${id}-label` : undefined}>
          {options.map((option, index) => (
            <li key={option.value} role="presentation">
              <OptionButton
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === selectedValue}
                disabled={option.disabled}
                $selected={option.value === selectedValue || index === activeIndex}
                onMouseEnter={() => setActiveValue(option.value)}
                onClick={() => commit(option)}
              >
                <OptionCopy>
                  <span>{option.label}</span>
                  {option.caption && <Caption>{option.caption}</Caption>}
                </OptionCopy>
                {option.value === selectedValue && <Octicon name="check" size={16} />}
              </OptionButton>
            </li>
          ))}
        </Menu>
      )}
      {error && <Message $error role="alert">{error}</Message>}
    </Root>
  );
}

const ComboControl = styled.div<{ $open: boolean; $invalid: boolean; $disabled: boolean }>`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-width: 0;
  height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: ${({ theme, $invalid, $open }) =>
    $invalid ? `1px solid ${theme.colors.danger}` : $open ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.muted};
  background: ${({ theme }) => theme.colors.field};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};

  &:focus-within {
    border: 2px solid ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.primary)};
  }
`;

const ComboIcon = styled.span<{ $open?: boolean }>`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 120ms ease;
`;

const ComboInput = styled.input<{ $open: boolean; $invalid: boolean }>`
  box-sizing: border-box;
  width: auto;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;

  &:focus { outline: none; }

  &::placeholder {
    color: ${({ theme }) => theme.colors.faint};
    opacity: 1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export function Combobox({
  label,
  value,
  defaultValue,
  options,
  placeholder = '이름이나 이메일로 검색',
  error,
  disabled = false,
  onChange,
  onInputChange,
}: ComboboxProps) {
  const generatedId = useId();
  const id = `combobox-${generatedId}`;
  const listId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedValue = value ?? internalValue;
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    [options, query],
  );

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const enabled = filteredOptions.map((option, index) => (option.disabled ? -1 : index)).filter((i) => i >= 0);
      if (enabled.length > 0) {
        const currentPosition = enabled.indexOf(activeIndex);
        const nextPosition = currentPosition < 0
          ? (direction === 1 ? 0 : enabled.length - 1)
          : (currentPosition + direction + enabled.length) % enabled.length;
        setActiveIndex(enabled[nextPosition]);
      }
    } else if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) commit(option);
    }
  };

  return (
    <Root>
      {label && <Label id={`${id}-label`} htmlFor={id}>{label}</Label>}
      <ComboControl $open={open} $invalid={Boolean(error)} $disabled={disabled}>
        <ComboIcon aria-hidden="true"><Octicon name="search" size={16} /></ComboIcon>
        <ComboInput
        ref={inputRef}
        id={id}
        role="combobox"
        value={open ? query : getOptionLabel(options, selectedValue) ?? query}
        placeholder={placeholder}
        disabled={disabled}
        $open={open}
        $invalid={Boolean(error)}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={error ? 'true' : undefined}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setOpen(true);
          setActiveIndex(-1);
          onInputChange?.(event.currentTarget.value);
        }}
        onKeyDown={onKeyDown}
        />
        <ComboIcon $open={open} aria-hidden="true"><Octicon name="chevron-down" size={16} /></ComboIcon>
      </ComboControl>
      {open && (
        <Menu id={listId} role="listbox" aria-labelledby={label ? `${id}-label` : undefined}>
          {filteredOptions.map((option, index) => (
            <li key={option.value} role="presentation">
              <OptionButton
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === selectedValue}
                disabled={option.disabled}
                $selected={option.value === selectedValue || activeIndex === index}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(option)}
              >
                <OptionCopy>
                  <span>{option.label}</span>
                  {option.caption && <Caption>{option.caption}</Caption>}
                </OptionCopy>
                {option.value === selectedValue && <Octicon name="check" size={16} />}
              </OptionButton>
            </li>
          ))}
        </Menu>
      )}
      {error && <Message $error role="alert">{error}</Message>}
    </Root>
  );
}

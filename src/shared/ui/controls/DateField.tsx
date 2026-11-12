import { useId, useRef, useState } from 'react';
import styled from 'styled-components';
import type { ReactNode } from 'react';
import { Octicon } from '../icons';

export interface DateFieldProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  calendarIcon?: ReactNode;
  previousIcon?: ReactNode;
  nextIcon?: ReactNode;
  onChange?: (value: string) => void;
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

const DateTrigger = styled.button<{ $open: boolean; $disabled: boolean }>`
  display: flex;
  width: 100%;
  height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: 1px solid ${({ theme, $open }) => ($open ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.field};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`;

const Calendar = styled.div`
  position: absolute;
  z-index: 1100;
  top: calc(100% + 4px);
  left: 0;
  width: 284px;
  padding: ${({ theme }) => theme.space[16]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  box-shadow: 0 8px 24px #00000033;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[8]}px;
`;

const MonthLabel = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: 500;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const MonthButton = styled.button`
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  color: ${({ theme }) => theme.colors.muted};
  background: transparent;
  font: inherit;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.overlayHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
  }
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 36px);
  justify-content: center;
  gap: 0;
`;

const Weekday = styled.span`
  display: flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

const DayButton = styled.button<{ $selected: boolean }>`
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme, $selected }) => ($selected ? theme.colors.primary : 'transparent')};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.text)};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primarySoft : 'transparent')};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.overlayHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
  }
`;

const EmptyDay = styled.span`
  width: 36px;
  height: 36px;
`;

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function parseDate(value?: string) {
  if (!value) return undefined;
  const match = /^([0-9]{4})\.([0-9]{2})\.([0-9]{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    return undefined;
  }
  return date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function DateField({
  label,
  value,
  defaultValue,
  disabled = false,
  calendarIcon = <Octicon name="calendar" size={16} />,
  previousIcon = <Octicon name="arrow-left" size={16} />,
  nextIcon = <Octicon name="arrow-right" size={16} />,
  onChange,
}: DateFieldProps) {
  const id = useId();
  const triggerId = `date-${id}`;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selected = parseDate(selectedValue);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const initial = selected ?? new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const shiftMonth = (amount: number) => {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <Root>
      {label && <Label htmlFor={triggerId}>{label}</Label>}
      <DateTrigger
        ref={triggerRef}
        id={triggerId}
        type="button"
        $open={open}
        $disabled={disabled}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label ?? '날짜 선택'}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        <span>{selectedValue ?? 'YYYY.MM.DD'}</span>
        <span aria-hidden="true">{calendarIcon}</span>
      </DateTrigger>
      {open && (
        <Calendar role="dialog" aria-label="날짜 선택 달력">
          <CalendarHeader>
            <MonthButton type="button" aria-label="이전 달" onClick={() => shiftMonth(-1)}>{previousIcon}</MonthButton>
            <MonthLabel>{view.getFullYear()}년 {view.getMonth() + 1}월</MonthLabel>
            <MonthButton type="button" aria-label="다음 달" onClick={() => shiftMonth(1)}>{nextIcon}</MonthButton>
          </CalendarHeader>
          <WeekGrid role="grid" aria-label={`${view.getFullYear()}년 ${view.getMonth() + 1}월`}>
            {weekdays.map((weekday) => <Weekday role="columnheader" key={weekday}>{weekday}</Weekday>)}
            {Array.from({ length: firstWeekday }, (_, index) => <EmptyDay role="gridcell" key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = new Date(view.getFullYear(), view.getMonth(), day);
              const isSelected = selected?.getFullYear() === date.getFullYear()
                && selected.getMonth() === date.getMonth()
                && selected.getDate() === day;
              return (
                <div role="gridcell" key={day}>
                  <DayButton
                    type="button"
                    $selected={Boolean(isSelected)}
                    aria-pressed={Boolean(isSelected)}
                    aria-label={formatDate(date)}
                    onClick={() => {
                      const nextValue = formatDate(date);
                      if (value === undefined) setInternalValue(nextValue);
                      onChange?.(nextValue);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    {day}
                  </DayButton>
                </div>
              );
            })}
          </WeekGrid>
        </Calendar>
      )}
    </Root>
  );
}

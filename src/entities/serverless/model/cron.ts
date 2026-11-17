type CronField = {
  values: Set<number>;
  wildcard: boolean;
};

type ParsedCron = {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
};

type CalendarSchedule = {
  /** null means every date; otherwise values are day offsets in the repeating 400-year cycle. */
  matchingDays: Uint32Array | null;
  hasDates: boolean;
  minimumDayDistance: number | null;
};

export type CronValidation =
  | { valid: true; minimumIntervalMinutes: number | null }
  | { valid: false; reason: 'syntax' | 'frequency' | 'calendar'; minimumIntervalMinutes?: number };

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEMO_CLOCK = new Date('2026-09-30T09:00:00+09:00');
const GREGORIAN_CYCLE_START = Date.UTC(2000, 0, 1);
const DAYS_IN_GREGORIAN_CYCLE = 146_097;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const calendarScheduleCache = new Map<string, CalendarSchedule>();
const FIELD_RANGES = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
] as const;

function parseField(source: string, minimum: number, maximum: number, sundayAlias = false): CronField | undefined {
  if (!source) return undefined;

  const values = new Set<number>();
  const parts = source.split(',');
  if (parts.some(part => !part)) return undefined;

  for (const part of parts) {
    const segments = part.split('/');
    if (segments.length > 2) return undefined;
    const [base, stepText] = segments;
    if (stepText !== undefined && !/^\d+$/.test(stepText)) return undefined;
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isSafeInteger(step) || step < 1) return undefined;

    let start: number;
    let end: number;
    if (base === '*') {
      start = minimum;
      end = maximum;
    } else if (base.includes('-')) {
      const range = base.split('-');
      if (range.length !== 2 || !range.every(item => /^\d+$/.test(item))) return undefined;
      start = Number(range[0]);
      end = Number(range[1]);
      if (start > end) return undefined;
    } else {
      if (!/^\d+$/.test(base)) return undefined;
      start = Number(base);
      end = stepText === undefined ? start : maximum;
    }

    if (start < minimum || end > maximum) return undefined;
    for (let value = start; value <= end; value += step) {
      values.add(sundayAlias && value === 7 ? 0 : value);
    }
  }

  // Cronie marks a day field as a wildcard when its source begins with `*`,
  // including stepped wildcards such as `*/2`. This affects DOM/DOW matching.
  return { values, wildcard: source.startsWith('*') };
}

function parseCron(expression: string): ParsedCron | undefined {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return undefined;
  const parsed = fields.map((field, index) => {
    const [minimum, maximum] = FIELD_RANGES[index];
    return parseField(field, minimum, maximum, index === 4);
  });
  if (parsed.some(field => field === undefined)) return undefined;
  return {
    minute: parsed[0]!,
    hour: parsed[1]!,
    dayOfMonth: parsed[2]!,
    month: parsed[3]!,
    dayOfWeek: parsed[4]!,
  };
}

function calendarScheduleKey(parsed: ParsedCron): string {
  return [parsed.dayOfMonth, parsed.month, parsed.dayOfWeek]
    .map(field => `${field.wildcard}:${[...field.values].sort((left, right) => left - right).join(',')}`)
    .join('|');
}

function matchesCalendarDate(parsed: ParsedCron, date: Date): boolean {
  const dayOfMonth = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const dayOfWeek = date.getUTCDay();
  const dayMatches = parsed.dayOfMonth.wildcard || parsed.dayOfWeek.wildcard
    ? parsed.dayOfMonth.values.has(dayOfMonth) && parsed.dayOfWeek.values.has(dayOfWeek)
    : parsed.dayOfMonth.values.has(dayOfMonth) || parsed.dayOfWeek.values.has(dayOfWeek);

  return dayMatches && parsed.month.values.has(month);
}

function getCalendarSchedule(parsed: ParsedCron): CalendarSchedule {
  const key = calendarScheduleKey(parsed);
  const cached = calendarScheduleCache.get(key);
  if (cached) {
    calendarScheduleCache.delete(key);
    calendarScheduleCache.set(key, cached);
    return cached;
  }

  if (parsed.dayOfMonth.wildcard && parsed.month.wildcard && parsed.dayOfWeek.wildcard) {
    const everyDate = { matchingDays: null, hasDates: true, minimumDayDistance: 1 };
    calendarScheduleCache.set(key, everyDate);
    return everyDate;
  }

  const matchingDays: number[] = [];
  for (let day = 0; day < DAYS_IN_GREGORIAN_CYCLE; day += 1) {
    const matches = matchesCalendarDate(parsed, new Date(GREGORIAN_CYCLE_START + day * DAY_MS));
    if (matches) matchingDays.push(day);
  }
  let minimumDayDistance: number | null = null;
  if (matchingDays.length > 0) {
    minimumDayDistance = DAYS_IN_GREGORIAN_CYCLE - matchingDays[matchingDays.length - 1] + matchingDays[0];
    for (let index = 1; index < matchingDays.length; index += 1) {
      minimumDayDistance = Math.min(minimumDayDistance, matchingDays[index] - matchingDays[index - 1]);
    }
  }

  const schedule = {
    matchingDays: Uint32Array.from(matchingDays),
    hasDates: matchingDays.length > 0,
    minimumDayDistance,
  };
  calendarScheduleCache.set(key, schedule);
  if (calendarScheduleCache.size > 8) calendarScheduleCache.delete(calendarScheduleCache.keys().next().value!);
  return schedule;
}

function getScheduledMinutes(parsed: ParsedCron): number[] {
  return [...parsed.hour.values]
    .flatMap(hour => [...parsed.minute.values].map(minute => hour * 60 + minute))
    .sort((left, right) => left - right);
}

function getMinimumScheduleInterval(parsed: ParsedCron, calendarSchedule: CalendarSchedule): number | null {
  const times = getScheduledMinutes(parsed);
  if (!times.length) return null;

  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 1; index < times.length; index += 1) {
    const interval = times[index] - times[index - 1];
    minimum = Math.min(minimum, interval);
  }

  const dayDistance = calendarSchedule.minimumDayDistance;
  if (dayDistance !== null) {
    const betweenDates = (dayDistance - 1) * 24 * 60 + 24 * 60 - times[times.length - 1] + times[0];
    minimum = Math.min(minimum, betweenDates);
  }
  return Number.isFinite(minimum) ? minimum : null;
}

export function validateCronExpression(expression: string): CronValidation {
  const parsed = parseCron(expression);
  if (!parsed) return { valid: false, reason: 'syntax' };
  const calendarSchedule = getCalendarSchedule(parsed);
  if (!calendarSchedule.hasDates) return { valid: false, reason: 'calendar' };
  const minimumIntervalMinutes = getMinimumScheduleInterval(parsed, calendarSchedule);
  if (minimumIntervalMinutes !== null && minimumIntervalMinutes < 5) {
    return { valid: false, reason: 'frequency', minimumIntervalMinutes };
  }
  return { valid: true, minimumIntervalMinutes };
}

function getCycleDayIndex(date: Date): number {
  const cycleYear = 2000 + (((date.getUTCFullYear() - 2000) % 400) + 400) % 400;
  return Math.floor((Date.UTC(cycleYear, date.getUTCMonth(), date.getUTCDate()) - GREGORIAN_CYCLE_START) / DAY_MS);
}

function findFirstMatchingDay(days: Uint32Array, dayIndex: number): number {
  let low = 0;
  let high = days.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (days[middle] < dayIndex) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function getNextCronExecution(
  expression: string,
  after: Date = DEMO_CLOCK,
): Date | undefined {
  const validation = validateCronExpression(expression);
  const parsed = parseCron(expression);
  if (!validation.valid || !parsed) return undefined;

  const calendarSchedule = getCalendarSchedule(parsed);
  const scheduledMinutes = getScheduledMinutes(parsed);
  const localNextMinute = Math.floor((after.getTime() + SEOUL_OFFSET_MS) / MINUTE_MS) * MINUTE_MS + MINUTE_MS;
  const localCursor = new Date(localNextMinute);
  const localDayStart = Date.UTC(localCursor.getUTCFullYear(), localCursor.getUTCMonth(), localCursor.getUTCDate());
  const firstMinute = localCursor.getUTCHours() * 60 + localCursor.getUTCMinutes();

  if (calendarSchedule.matchingDays === null) {
    const minute = scheduledMinutes.find(candidate => candidate >= firstMinute);
    if (minute !== undefined) return new Date(localDayStart + minute * MINUTE_MS - SEOUL_OFFSET_MS);
    return new Date(localDayStart + DAY_MS + scheduledMinutes[0] * MINUTE_MS - SEOUL_OFFSET_MS);
  }

  const days = calendarSchedule.matchingDays;
  const currentCycleDay = getCycleDayIndex(localCursor);
  const firstMatch = findFirstMatchingDay(days, currentCycleDay);
  for (let offset = 0; offset < days.length; offset += 1) {
    const matchingDay = days[(firstMatch + offset) % days.length];
    const dayDistance = matchingDay >= currentCycleDay
      ? matchingDay - currentCycleDay
      : DAYS_IN_GREGORIAN_CYCLE - currentCycleDay + matchingDay;
    const earliestMinute = dayDistance === 0 ? firstMinute : 0;
    const minute = scheduledMinutes.find(candidate => candidate >= earliestMinute);
    if (minute !== undefined) {
      return new Date(localDayStart + dayDistance * DAY_MS + minute * MINUTE_MS - SEOUL_OFFSET_MS);
    }
  }
  return undefined;
}

export function formatCronExecution(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Seoul',
  }).format(date);
}

export function describeCronExpression(expression: string): string {
  const normalized = expression.trim().replace(/\s+/g, ' ');
  if (normalized === '0 9 * * *') return '매일 09:00';
  const everyMinutes = /^\*\/(\d+) \* \* \* \*$/.exec(normalized);
  if (everyMinutes) {
    const interval = Number(everyMinutes[1]);
    if (!Number.isSafeInteger(interval) || interval < 1) return normalized;
    if (60 % interval === 0) return `${interval}분마다`;
    const scheduledMinutes: string[] = [];
    for (let minute = 0; minute < 60; minute += interval) scheduledMinutes.push(String(minute).padStart(2, '0'));
    return `매시 ${scheduledMinutes.join('·')}분`;
  }
  return normalized;
}

export function formatCronSchedule(expression: string): string {
  const description = describeCronExpression(expression);
  return description === expression.trim() ? expression : `${expression} · ${description}`;
}

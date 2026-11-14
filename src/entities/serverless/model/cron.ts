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

export type CronValidation =
  | { valid: true; minimumIntervalMinutes: number | null }
  | { valid: false; reason: 'syntax' | 'frequency'; minimumIntervalMinutes?: number };

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEMO_CLOCK = new Date('2026-09-30T09:00:00+09:00');
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
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) return undefined;

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

  const fullRangeSize = sundayAlias ? 7 : maximum - minimum + 1;
  return { values, wildcard: values.size === fullRangeSize };
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

function hasAdjacentMatchingDates(parsed: ParsedCron): boolean {
  const cycleStart = Date.UTC(2000, 0, 1);
  const dayMilliseconds = 24 * 60 * 60 * 1000;
  const daysInGregorianCycle = 146_097;
  let firstDateMatches = false;
  let previousDateMatches = false;

  for (let day = 0; day < daysInGregorianCycle; day += 1) {
    const matches = matchesCronDate(parsed, new Date(cycleStart + day * dayMilliseconds));
    if (day === 0) firstDateMatches = matches;
    if (matches && previousDateMatches) return true;
    previousDateMatches = matches;
  }

  return previousDateMatches && firstDateMatches;
}

function getMinimumScheduleInterval(parsed: ParsedCron): number | null {
  const times = [...parsed.hour.values]
    .flatMap(hour => [...parsed.minute.values].map(minute => hour * 60 + minute))
    .sort((left, right) => left - right);
  if (!times.length) return null;

  let minimum: number | null = null;
  for (let index = 1; index < times.length; index += 1) {
    const interval = times[index] - times[index - 1];
    minimum = minimum === null ? interval : Math.min(minimum, interval);
  }

  const overnightInterval = 24 * 60 - times[times.length - 1] + times[0];
  if (overnightInterval < 5 && hasAdjacentMatchingDates(parsed)) {
    minimum = minimum === null ? overnightInterval : Math.min(minimum, overnightInterval);
  }
  return minimum;
}

export function validateCronExpression(expression: string): CronValidation {
  const parsed = parseCron(expression);
  if (!parsed) return { valid: false, reason: 'syntax' };
  const minimumIntervalMinutes = getMinimumScheduleInterval(parsed);
  if (minimumIntervalMinutes !== null && minimumIntervalMinutes < 5) {
    return { valid: false, reason: 'frequency', minimumIntervalMinutes };
  }
  return { valid: true, minimumIntervalMinutes };
}

function matchesCronDate(parsed: ParsedCron, localDate: Date): boolean {
  const minute = localDate.getUTCMinutes();
  const hour = localDate.getUTCHours();
  const dayOfMonth = localDate.getUTCDate();
  const month = localDate.getUTCMonth() + 1;
  const dayOfWeek = localDate.getUTCDay();
  const dayMatches = parsed.dayOfMonth.wildcard
    ? parsed.dayOfWeek.values.has(dayOfWeek)
    : parsed.dayOfWeek.wildcard
      ? parsed.dayOfMonth.values.has(dayOfMonth)
      : parsed.dayOfMonth.values.has(dayOfMonth) || parsed.dayOfWeek.values.has(dayOfWeek);

  return parsed.minute.values.has(minute)
    && parsed.hour.values.has(hour)
    && dayMatches
    && parsed.month.values.has(month);
}

export function getNextCronExecution(
  expression: string,
  after: Date = DEMO_CLOCK,
): Date | undefined {
  const validation = validateCronExpression(expression);
  const parsed = parseCron(expression);
  if (!validation.valid || !parsed) return undefined;

  const nextMinute = Math.floor((after.getTime() + SEOUL_OFFSET_MS) / 60_000) * 60_000 + 60_000 - SEOUL_OFFSET_MS;
  const searchLimit = nextMinute + 366 * 24 * 60 * 60_000;
  for (let timestamp = nextMinute; timestamp <= searchLimit; timestamp += 60_000) {
    const localDate = new Date(timestamp + SEOUL_OFFSET_MS);
    if (matchesCronDate(parsed, localDate)) return new Date(timestamp);
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
  if (everyMinutes) return `${everyMinutes[1]}분마다`;
  return normalized;
}

export function formatCronSchedule(expression: string): string {
  const description = describeCronExpression(expression);
  return description === expression.trim() ? expression : `${expression} · ${description}`;
}

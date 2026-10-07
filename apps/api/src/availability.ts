import type { BookingWindowDay, Slot } from './generated/index.ts';

// Модуль доступности: правила вычисления слотов (спека, GLOSSARY.md).
// Все расчёты — в поясе Owner, интервалы полуоткрытые [начало, конец).

// BookingWindow — сегодня и ещё 13 календарных дней
const WINDOW_DAYS = 14;
// WorkingHours — Пн–Пт 09:00–18:00
const WORKDAY_START_MINUTES = 9 * 60;
const WORKDAY_END_MINUTES = 18 * 60;
// Шаг сетки начал слотов для всех EventType; длительность EventType ему кратна
export const GRID_STEP_MINUTES = 15;
// MinimumNotice — слот доступен, только если начало ≥ сейчас + 60 минут
const MINIMUM_NOTICE_MINUTES = 60;

const MINUTE_MS = 60_000;

export type BookingWindowInput = {
  now: Date;
  // IANA-пояс Owner
  timeZone: string;
  durationMinutes: number;
};

// Дни BookingWindow со слотами EventType и их статусами.
// Броней пока нет, поэтому все слоты свободны: занятость с учётом Buffer
// (и Booking на входе) подключает тикет создания Booking
export function bookingWindow({ now, timeZone, durationMinutes }: BookingWindowInput): BookingWindowDay[] {
  const today = zonedDate(now, timeZone);
  const earliestStart = now.getTime() + MINIMUM_NOTICE_MINUTES * MINUTE_MS;

  return Array.from({ length: WINDOW_DAYS }, (_, offset) => {
    const date = addDays(today, offset);
    if (!isWorkingDay(date)) {
      return { date: formatPlainDate(date), isWorkingDay: false, slots: [] };
    }

    const slots: Slot[] = [];
    for (
      let startMinutes = WORKDAY_START_MINUTES;
      startMinutes + durationMinutes <= WORKDAY_END_MINUTES;
      startMinutes += GRID_STEP_MINUTES
    ) {
      const start = zonedTimeToUtc(date, startMinutes, timeZone);
      const end = zonedTimeToUtc(date, startMinutes + durationMinutes, timeZone);
      // Прошедшие слоты и слоты внутри MinimumNotice не возвращаются вовсе
      if (start < earliestStart) continue;
      slots.push({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        status: 'free',
      });
    }
    return { date: formatPlainDate(date), isWorkingDay: true, slots };
  });
}

// Календарная дата без времени и пояса
type PlainDate = { year: number; month: number; day: number };

function addDays(date: PlainDate, days: number): PlainDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

function isWorkingDay(date: PlainDate): boolean {
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

function formatPlainDate({ year, month, day }: PlainDate): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Части момента по стенным часам пояса
function zonedParts(instant: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
      .formatToParts(instant)
      .map((part) => [part.type, Number(part.value)]),
  );
  return parts as Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>;
}

// Календарная дата момента по поясу
function zonedDate(instant: Date, timeZone: string): PlainDate {
  const { year, month, day } = zonedParts(instant.getTime(), timeZone);
  return { year, month, day };
}

// Смещение пояса относительно UTC в момент instant, мс
function offsetAt(instant: number, timeZone: string): number {
  const { year, month, day, hour, minute } = zonedParts(instant, timeZone);
  return Date.UTC(year, month - 1, day, hour, minute) - Math.floor(instant / MINUTE_MS) * MINUTE_MS;
}

// Момент UTC для стенного времени (минуты от полуночи) даты в поясе.
// Смещение берём в момент первой оценки и уточняем: так учитывается смена смещения (летнее время)
function zonedTimeToUtc(date: PlainDate, minutes: number, timeZone: string): number {
  const wallClock = Date.UTC(date.year, date.month - 1, date.day, 0, minutes);
  const guess = wallClock - offsetAt(wallClock, timeZone);
  return wallClock - offsetAt(guess, timeZone);
}

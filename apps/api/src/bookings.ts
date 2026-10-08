import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { BookedInterval } from './availability.ts';
import type { Booking, EventType } from './generated/index.ts';

export type BookingInput = {
  eventType: Pick<EventType, 'id' | 'name'>;
  start: Date;
  end: Date;
  guestName: string;
  guestEmail: string;
};

type IntervalRow = { start_at: number; end_at: number };

export type BookingStore = ReturnType<typeof createBookingStore>;

// Хранилище Booking: строки БД ↔ модель контракта
export function createBookingStore(db: DatabaseSync) {
  const selectIntervalsEndingAfter = db.prepare('SELECT start_at, end_at FROM bookings WHERE end_at > ?');
  const insert = db.prepare(
    `INSERT INTO bookings (id, event_type_id, start_at, end_at, guest_name, guest_email, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  function intervalsEndingAfter(moment: Date): BookedInterval[] {
    return (selectIntervalsEndingAfter.all(moment.getTime()) as IntervalRow[]).map((row) => ({
      start: row.start_at,
      end: row.end_at,
    }));
  }

  return {
    // Интервалы Booking, которые заканчиваются позже moment: прошедшие на слоты уже не влияют
    intervalsEndingAfter,

    // Создаёт Booking, если assertAllowed не отказал по интервалам существующих Booking.
    // Проверка и INSERT — в BEGIN IMMEDIATE … COMMIT одним синхронным участком без await (ADR 0005):
    // между чтением броней и вставкой никто не создаст пересекающуюся Booking
    createChecked(
      input: BookingInput,
      createdAt: Date,
      assertAllowed: (existing: BookedInterval[]) => void,
    ): Booking {
      db.exec('BEGIN IMMEDIATE');
      try {
        assertAllowed(intervalsEndingAfter(createdAt));
        const id = randomUUID();
        insert.run(
          id,
          input.eventType.id,
          input.start.getTime(),
          input.end.getTime(),
          input.guestName,
          input.guestEmail,
          createdAt.getTime(),
        );
        db.exec('COMMIT');
        return {
          id,
          start: input.start.toISOString(),
          end: input.end.toISOString(),
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          createdAt: createdAt.toISOString(),
          eventType: { id: input.eventType.id, name: input.eventType.name },
        };
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

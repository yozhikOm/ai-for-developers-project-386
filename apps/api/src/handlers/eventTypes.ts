import { HttpError } from '../errors.ts';
import type { EventTypeStore } from '../eventTypes.ts';
import type { RouteHandlers } from '../generated/fastify.gen.ts';

// Шаг сетки слотов: длительность EventType должна быть ему кратна.
// Контракт кратность выразить не может, поэтому проверка здесь
const DURATION_STEP_MINUTES = 15;

// listEventTypes — опубликованные EventType для публичной страницы;
// createEventType — Owner создаёт новый тип
export function eventTypeHandlers(
  eventTypes: EventTypeStore,
  now: () => Date,
): Pick<RouteHandlers, 'listEventTypes' | 'createEventType'> {
  return {
    listEventTypes(_request, reply) {
      reply.code(200).send(eventTypes.list());
    },

    createEventType(request, reply) {
      // Длины, диапазон и типы полей уже проверены по контракту
      const { durationMinutes } = request.body;
      const name = request.body.name.trim();
      const description = request.body.description?.trim();

      if (name === '') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Название не может быть пустым');
      }
      if (durationMinutes % DURATION_STEP_MINUTES !== 0) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `Длительность должна быть кратна ${DURATION_STEP_MINUTES} минутам`,
        );
      }

      // Пустое после обрезки описание — «нет описания»
      const eventType = eventTypes.create(
        { name, ...(description && { description }), durationMinutes },
        now(),
      );
      reply.code(201).send(eventType);
    },
  };
}

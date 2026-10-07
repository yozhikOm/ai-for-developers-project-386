import { bookingWindow } from '../availability.ts';
import type { EventTypeStore } from '../eventTypes.ts';
import type { RouteHandlers } from '../generated/fastify.gen.ts';
import type { Owner } from '../generated/index.ts';
import { findEventTypeOrThrow } from './eventTypes.ts';

// listSlots — всё BookingWindow со слотами EventType в поясе Owner
export function slotHandlers(
  eventTypes: EventTypeStore,
  owner: Owner,
  now: () => Date,
): Pick<RouteHandlers, 'listSlots'> {
  return {
    listSlots(request, reply) {
      const { durationMinutes } = findEventTypeOrThrow(eventTypes, request.params.eventTypeId);
      const days = bookingWindow({ now: now(), timeZone: owner.timezone, durationMinutes });
      reply.code(200).send(days);
    },
  };
}

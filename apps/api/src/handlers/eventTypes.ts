import type { EventTypeStore } from '../eventTypes.ts';
import type { RouteHandlers } from '../generated/fastify.gen.ts';

// listEventTypes — опубликованные EventType для публичной страницы
export function eventTypeHandlers(eventTypes: EventTypeStore): Pick<RouteHandlers, 'listEventTypes'> {
  return {
    listEventTypes(_request, reply) {
      reply.code(200).send(eventTypes.list());
    },
  };
}

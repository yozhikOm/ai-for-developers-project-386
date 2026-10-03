import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ApiError, ApiErrorCode } from './generated/index.ts';

export function apiError(code: ApiErrorCode, message: string): ApiError {
  return { code, message };
}

// Относится ли URL (возможно, с query-строкой) к API: /api или /api/...
export function isApiUrl(url: string): boolean {
  const pathname = url.split('?', 1)[0];
  return pathname === '/api' || pathname.startsWith('/api/');
}

// Ответ на неизвестный маршрут под /api
export function replyApiNotFound(request: FastifyRequest, reply: FastifyReply) {
  reply.code(404).send(apiError('NOT_FOUND', `Маршрут ${request.method} ${request.url} не найден`));
}

// Приводит ответы API к единой модели ApiError { code, message } из контракта.
// Регистрировать до маршрутов glue: дочерние контексты наследуют обработчики.
export async function registerApiErrors(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;

    // Отказы клиента: ошибки валидации Fastify (error.validation), битый JSON,
    // неподдерживаемый Content-Type и т. п. Статус сохраняем, текст — от Fastify.
    if (error.validation || (statusCode >= 400 && statusCode < 500)) {
      const code = statusCode === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR';
      reply.code(error.validation ? 400 : statusCode).send(apiError(code, error.message));
      return;
    }

    // Непредвиденная ошибка: подробности только в лог, клиенту — общий текст.
    // Свой обработчик отключает логирование Fastify, поэтому пишем сами.
    request.log.error({ err: error }, 'Непредвиденная ошибка');
    reply.code(500).send(apiError('INTERNAL_ERROR', 'Внутренняя ошибка сервера'));
  });

  // Неизвестные маршруты под /api. Обработчик ограничен префиксом,
  // поэтому 404 остальных маршрутов он не затрагивает.
  await app.register(
    async (api) => {
      api.setNotFoundHandler(replyApiNotFound);
    },
    { prefix: '/api' },
  );
}

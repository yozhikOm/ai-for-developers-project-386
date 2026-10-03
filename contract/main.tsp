// API-контракт «Календаря звонков» — единый источник правды (ADR 0003).
// Изменение API начинается здесь; затем `npm run generate` пересобирает
// OpenAPI, SDK для apps/web и серверные артефакты для apps/api (ADR 0004).
//
// Правила:
// - у каждой операции явный @operationId в camelCase вида <глагол><Сущность>:
//   по нему fastify-openapi-glue находит обработчик, а Hey API называет функцию SDK;
// - все 4xx/5xx отвечают моделью ApiError.
import "@typespec/http";
import "@typespec/openapi";

using Http;
using OpenAPI;

@service(#{ title: "Календарь звонков" })
@route("/api")
namespace CallCalendar;

/** Машиночитаемая причина ошибки: клиент различает отказы по ней, а не по тексту. */
union ApiErrorCode {
  /** Тело или параметры запроса не прошли проверку. */
  "VALIDATION_ERROR",

  /** Неизвестный маршрут под /api. */
  "NOT_FOUND",

  /** Непредвиденная ошибка сервера. */
  "INTERNAL_ERROR",
}

/** Единая модель ошибки API. */
@error
model ApiError {
  code: ApiErrorCode;

  /** Описание для разработчика; пользователю UI показывает свой текст по `code`. */
  message: string;
}

/** Ответ проверки живости. */
model Health {
  status: "ok";
}

/** Owner — владелец календаря; задаётся конфигурацией сервера. */
model Owner {
  /** Имя, которое видит Guest на публичной странице. */
  name: string;

  /** IANA-пояс Owner (например, `Europe/Moscow`): в нём считается и показывается время. */
  timezone: string;
}

/** Проверка живости: используется smoke-тестом и Docker HEALTHCHECK. */
@route("/health")
@get
@operationId("getHealth")
op getHealth(): Health | ApiError;

/** Имя и часовой пояс Owner. */
@route("/owner")
@get
@operationId("getOwner")
op getOwner(): Owner | ApiError;

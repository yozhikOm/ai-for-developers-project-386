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

/** EventType — вид звонка, который публикует Owner; Guest бронирует время в его рамках. */
model EventType {
  /** Системный id (UUID): его назначает сервер. */
  @format("uuid")
  id: string;

  /** Название; не уникально. */
  name: string;

  /** Необязательное описание; без описания поле отсутствует. */
  description?: string;

  /** Длительность звонка в минутах. */
  durationMinutes: int32;

  /** Момент создания: по нему упорядочен список типов. */
  createdAt: utcDateTime;
}

/** Данные нового EventType; id и момент создания назначает сервер. */
model NewEventType {
  /** Название; не уникально. Сервер обрезает пробелы по краям, название из одних пробелов — пустое. */
  @minLength(1)
  @maxLength(100)
  name: string;

  /** Необязательное описание; пустое после обрезки пробелов означает «нет описания». */
  @maxLength(500)
  description?: string;

  /** Длительность звонка в минутах, кратная 15: кратность контракт выразить не может, её проверяет сервер. */
  @minValue(15)
  @maxValue(540)
  durationMinutes: int32;
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

/** Все EventType по возрастанию времени создания. */
@route("/event-types")
@get
@operationId("listEventTypes")
op listEventTypes(): EventType[] | ApiError;

/** Создаёт EventType и возвращает его с назначенным id (нужен для подсветки в списке Owner). */
@route("/event-types")
@post
@operationId("createEventType")
op createEventType(@body body: NewEventType): {
  @statusCode statusCode: 201;
  @body body: EventType;
} | ApiError;

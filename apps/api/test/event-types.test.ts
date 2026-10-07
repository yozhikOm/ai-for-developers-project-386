import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;

async function listEventTypes(app: App) {
  const response = await app.inject({ method: 'GET', url: '/api/event-types' });
  expect(response.statusCode).toBe(200);
  return response.json();
}

describe('GET /api/event-types', () => {
  it('на пустой БД возвращает пустой список', async () => {
    const app = await buildApp();

    expect(await listEventTypes(app)).toEqual([]);

    await app.close();
  });
});

describe('хранение в файле БД', () => {
  let tempDir: string;
  // Каталог data/ ещё не существует: его должно создать приложение
  let databasePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'call-calendar-'));
    databasePath = path.join(tempDir, 'data', 'calendar.db');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('применяет миграции к новому файлу и сама ничего не засевает', async () => {
    const app = await buildApp({ databasePath });

    expect(await listEventTypes(app)).toEqual([]);

    await app.close();
  });

  it('засевает два EventType при создании новой БД', async () => {
    const app = await buildApp({ databasePath, seedNewDatabase: true });

    const eventTypes = await listEventTypes(app);

    expect(eventTypes).toEqual([
      {
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        name: 'Звонок 15 минут',
        description: expect.any(String),
        durationMinutes: 15,
        createdAt: expect.any(String),
      },
      {
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        name: 'Встреча 30 минут',
        description: expect.any(String),
        durationMinutes: 30,
        createdAt: expect.any(String),
      },
    ]);
    expect(new Date(eventTypes[0].createdAt).toISOString()).toBe(eventTypes[0].createdAt);

    await app.close();
  });

  it('данные переживают пересоздание приложения, а засев при повторном открытии не дублируется', async () => {
    const first = await buildApp({ databasePath, seedNewDatabase: true });
    const seeded = await listEventTypes(first);
    await first.close();

    const reopened = await buildApp({ databasePath, seedNewDatabase: true });

    expect(await listEventTypes(reopened)).toEqual(seeded);

    await reopened.close();
  });
});

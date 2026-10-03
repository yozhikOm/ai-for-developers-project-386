#!/usr/bin/env node
// Smoke test: минимальная проверка, что приложение после запуска отвечает.
//
// Два режима:
//   node scripts/smoke.mjs
//     — локальный: сам поднимает сервер на порту 3100
//       (требуется собранный frontend: npm run build);
//   SMOKE_URL=http://host:port node scripts/smoke.mjs
//     — только проверки против внешнего URL
//       (используется в CI против запущенного Docker-контейнера).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

const smokeUrl = process.env.SMOKE_URL;
const selfManaged = !smokeUrl;
const baseUrl = (smokeUrl ?? 'http://localhost:3100').replace(/\/$/, '');

const STARTUP_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @type {import('node:child_process').ChildProcess | null} */
let serverProcess = null;
let serverExited = false;
/** Последние строки лога сервера — печатаем при падении для отладки */
const serverLog = [];

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function startServer() {
  if (!existsSync('apps/web/dist/index.html')) {
    console.error('✗ apps/web/dist не найден. Сначала соберите frontend: npm run build');
    process.exit(1);
  }

  // Запускаем node напрямую (без npm-обёртки), чтобы kill() гарантированно
  // прибивал именно процесс сервера
  serverProcess = spawn(process.execPath, ['apps/api/src/index.ts'], {
    env: { ...process.env, PORT: '3100', HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout?.on('data', (chunk) => {
    serverLog.push(chunk.toString());
    if (serverLog.length > 50) serverLog.shift();
  });
  serverProcess.stderr?.on('data', (chunk) => serverLog.push(chunk.toString()));
  serverProcess.on('exit', () => {
    serverExited = true;
  });

  // Не оставляем сервер зомби при завершении скрипта
  process.on('exit', stopServer);
}

async function waitForReady() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (serverExited) {
      throw new Error(`сервер завершился при старте. Лог:\n${serverLog.join('')}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // сервер ещё не поднялся — ждём следующую итерацию
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`сервер не ответил за ${STARTUP_TIMEOUT_MS / 1000} с (${baseUrl}/api/health)`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let failed = false;

async function check(title, fn) {
  try {
    await fn();
    console.log(`✓ ${title}`);
  } catch (error) {
    failed = true;
    console.error(`✗ ${title}: ${error.message}`);
  }
}

async function main() {
  console.log(selfManaged
    ? 'Режим: локальный (поднимаем сервер сами, порт 3100)'
    : `Режим: проверка внешнего URL (${baseUrl})`);

  if (selfManaged) startServer();

  await waitForReady();

  await check('GET /api/health → 200 и { status: "ok" }', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert(response.status === 200, `ожидали 200, получили ${response.status}`);
    const body = await response.json();
    assert(body.status === 'ok', `неожиданное тело: ${JSON.stringify(body)}`);
  });

  await check('GET /api/owner → 200, имя и пояс Owner', async () => {
    const response = await fetch(`${baseUrl}/api/owner`);
    assert(response.status === 200, `ожидали 200, получили ${response.status}`);
    const body = await response.json();
    assert(
      typeof body.name === 'string' && body.name.length > 0 && typeof body.timezone === 'string',
      `неожиданное тело: ${JSON.stringify(body)}`,
    );
  });

  await check('GET / → 200, HTML с <div id="root">', async () => {
    const response = await fetch(`${baseUrl}/`);
    assert(response.status === 200, `ожидали 200, получили ${response.status}`);
    const contentType = response.headers.get('content-type') ?? '';
    assert(contentType.includes('text/html'), `неожиданный content-type: ${contentType}`);
    const html = await response.text();
    assert(html.includes('<div id="root">'), 'в HTML нет <div id="root">');
  });

  stopServer();

  if (failed) {
    console.error('\nSmoke test: ПРОВАЛЕН');
    process.exit(1);
  }
  console.log('\nSmoke test: OK');
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  stopServer();
  process.exit(1);
});

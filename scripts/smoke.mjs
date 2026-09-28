import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Smoke test: поднимает production-сборку и проверяет, что приложение отвечает.
// Работает на чистом Node без зависимостей (кроссплатформенно, включая Windows).

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.env.SMOKE_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const READY_TIMEOUT_MS = 10_000;

const apiEntry = path.join(rootDir, "apps", "api", "dist", "index.js");
const webDist = path.join(rootDir, "apps", "web", "dist");

if (!existsSync(apiEntry) || !existsSync(webDist)) {
  console.error(
    "Не найдены собранные артефакты. Сначала выполните: npm run build",
  );
  process.exit(1);
}

console.log(`Запускаем сервер на порту ${PORT}…`);

const server = spawn(process.execPath, [apiEntry], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: String(PORT),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverLog = "";
server.stdout.on("data", (chunk) => {
  serverLog += chunk;
});
server.stderr.on("data", (chunk) => {
  serverLog += chunk;
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    if (server.exitCode !== null) {
      throw new Error(
        `сервер завершился с кодом ${server.exitCode} до готовности`,
      );
    }
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // сервер ещё не поднялся — ждём
    }
    await delay(200);
  }
  throw new Error(`сервер не ответил за ${READY_TIMEOUT_MS} мс`);
}

async function run() {
  await waitForServer();

  const healthResponse = await fetch(`${BASE_URL}/api/health`);
  const healthBody = await healthResponse.json();
  if (healthResponse.status !== 200 || healthBody.status !== "ok") {
    throw new Error(
      `/api/health: неожиданный ответ ${healthResponse.status} ${JSON.stringify(healthBody)}`,
    );
  }
  console.log('GET /api/health → 200 { "status": "ok" }');

  const indexResponse = await fetch(`${BASE_URL}/`);
  const html = await indexResponse.text();
  if (indexResponse.status !== 200 || !html.includes('id="root"')) {
    throw new Error('GET /: ожидали 200 и HTML с id="root"');
  }
  console.log('GET / → 200, HTML содержит id="root"');
}

function stopServer() {
  if (server.exitCode === null) {
    server.kill();
  }
}

try {
  await run();
  console.log("Smoke test: OK");
  stopServer();
  process.exit(0);
} catch (error) {
  console.error(`Smoke test: FAIL — ${error.message}`);
  if (serverLog.trim()) {
    console.error(`--- Лог сервера ---\n${serverLog}`);
  }
  stopServer();
  process.exit(1);
}

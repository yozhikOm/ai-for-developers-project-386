const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const maxAttempts = 30
const delayMs = 1000

const checks = [
  {
    url: `${baseUrl}/api/health`,
    check: async (response) => {
      const body = await response.json()
      return body.status === 'ok'
    },
  },
  { url: `${baseUrl}/`, check: async () => true },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForApp() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {
      // app not ready yet, keep retrying
    }
    await sleep(delayMs)
  }
  throw new Error(`App at ${baseUrl} did not become ready in time`)
}

async function runChecks() {
  for (const { url, check } of checks) {
    const response = await fetch(url)
    if (!response.ok || !(await check(response))) {
      throw new Error(`Smoke check failed for ${url} (status ${response.status})`)
    }
    console.log(`OK  ${url}`)
  }
}

await waitForApp()
await runChecks()
console.log('Smoke test passed: app responds after startup.')

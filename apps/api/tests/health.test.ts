import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.ts";

describe("GET /api/health", () => {
  it("отвечает 200 и статусом ok", async () => {
    const app = await buildApp();

    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });

    await app.close();
  });
});

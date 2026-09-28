import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "api",
          root: "apps/api",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
    ],
  },
});

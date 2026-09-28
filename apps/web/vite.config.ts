import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // В dev-режиме API ходит на тот же origin, что и фронтенд, — CORS не нужен
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});

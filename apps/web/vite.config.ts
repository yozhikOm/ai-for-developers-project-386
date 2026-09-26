import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // В dev-режиме API-запросы уходят на backend (apps/api, порт 3000)
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    name: 'web',
    // Секция для Vitest: React-компоненты тестируем в jsdom
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
})

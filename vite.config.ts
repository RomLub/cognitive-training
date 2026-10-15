/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed port: progress lives in localStorage, which is scoped per origin (port included).
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
  },
})

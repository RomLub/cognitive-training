/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the build works at a domain root or in a sub-folder (e.g. GitHub Pages).
  base: './',
  // Fixed port: progress lives in localStorage, which is scoped per origin (port included).
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    // Never talk to the real Supabase project from tests (.env.local is loaded otherwise); tests inject fakes.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
})

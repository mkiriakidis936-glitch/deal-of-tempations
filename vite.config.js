import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: {
    port: 5173,
    // `npm run dev` (frontend) + `npm run dev:server` (API) in two terminals
    proxy: { '/api': 'http://localhost:3000' },
  },
})

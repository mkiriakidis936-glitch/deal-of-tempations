import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'))
const gitSha = (() => {
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
})()
const builtAt = new Date().toISOString()
const build = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || gitSha || builtAt.replace(/\D/g, '').slice(0, 12)
const versionInfo = { version: pkg.version, build, builtAt }

const versionFile = () => ({
  name: 'dot-version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(versionInfo) })
  },
})

export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(versionInfo.version),
    __APP_BUILD__: JSON.stringify(versionInfo.build),
    __APP_BUILT_AT__: JSON.stringify(versionInfo.builtAt),
  },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000', '/media': 'http://localhost:3000' },
  },
})

import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const spaFallback = () => ({
  name: 'spa-404-fallback',
  closeBundle() {
    const index = resolve(import.meta.dirname, 'dist/index.html')
    if (existsSync(index)) copyFileSync(index, resolve(import.meta.dirname, 'dist/404.html'))
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')

  return {
    // "/" for a root deploy, "/<repo>/" for a GitHub Pages project site
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss(), spaFallback()],
  }
})

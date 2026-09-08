import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')

  return {
    // "/" for a root deploy, "/<repo>/" for a GitHub Pages project site
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
  }
})

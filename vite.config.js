import { copyFileSync, existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
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

// Dev-only endpoint behind the cover adjuster (src/components/CoverEditor.jsx):
// writes a post's coverFocus/coverZoom into its frontmatter. Vite then sees
// the .md change and hot-reloads the post like any other edit.
const FRONTMATTER = /^---(\r?\n)([\s\S]*?)\r?\n---/
const FOCUS = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/

// Sets or removes (value null) single-line keys, keeping the file's line
// endings. New keys go after the last cover* line, so framing sits with cover.
const setFrontmatter = (source, fields) => {
  const match = source.match(FRONTMATTER)
  if (!match) throw new Error('Post has no frontmatter')

  const eol = match[1]
  const lines = match[2].split(/\r?\n/)
  for (const [key, value] of Object.entries(fields)) {
    const at = lines.findIndex(line => line.startsWith(`${key}:`))
    if (value == null) {
      if (at !== -1) lines.splice(at, 1)
      continue
    }
    const line = `${key}: ${value}`
    if (at !== -1) lines[at] = line
    else lines.splice(lines.findLastIndex(l => l.startsWith('cover')) + 1 || lines.length, 0, line)
  }

  return `---${eol}${lines.join(eol)}${eol}---${source.slice(match[0].length)}`
}

const readBody = req =>
  new Promise((resolveBody, reject) => {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => resolveBody(body))
    req.on('error', reject)
  })

const coverFraming = () => ({
  name: 'dev-cover-framing',
  apply: 'serve',
  configureServer(server) {
    const postsDir = resolve(import.meta.dirname, 'src/content/blog')

    server.middlewares.use('/__cover-framing', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        return res.end()
      }
      try {
        const { file, focus, zoom } = JSON.parse(await readBody(req))
        // A bare filename in the posts folder, nothing that could walk out of it
        if (typeof file !== 'string' || !/^[\w.-]+\.md$/.test(file)) throw new Error('Bad file')
        if (focus != null && !FOCUS.test(focus)) throw new Error('Bad focus')
        if (zoom != null && !(zoom >= 1 && zoom <= 3)) throw new Error('Bad zoom')

        const path = resolve(postsDir, file)
        const source = await readFile(path, 'utf8')
        await writeFile(path, setFrontmatter(source, { coverFocus: focus, coverZoom: zoom }))
        res.end('ok')
      } catch (error) {
        res.statusCode = 400
        res.end(error.message)
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')

  return {
    // "/" for a root deploy, "/<repo>/" for a GitHub Pages project site
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss(), spaFallback(), coverFraming()],
  }
})

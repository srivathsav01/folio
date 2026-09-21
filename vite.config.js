import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
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

// Link previews. Scrapers don't run JavaScript, so every URL would otherwise
// show index.html's site-wide card. After the build this writes
// dist/blog/<slug>/index.html for each published post, a copy of the built
// index.html whose meta tags carry the post's title, summary and cover. The
// host serves that file ahead of its SPA rewrite and the app boots as usual.
//
// Slug and draft rules mirror src/utils/posts.js, which can't be imported here
// (it leans on import.meta.glob).
const OG_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }

const readFrontmatter = source => {
  const data = {}
  const match = source.match(FRONTMATTER)
  if (!match) return data
  for (const line of match[2].split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at !== -1) data[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^['"]|['"]$/g, '')
  }
  return data
}

const escapeAttr = value =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const setMeta = (html, key, value) =>
  html.replace(
    new RegExp(`(<meta (?:property|name)="${key}" content=")[^"]*(")`),
    (_, open, close) => open + escapeAttr(value) + close,
  )

const dropMeta = (html, key) => html.replace(new RegExp(`\\s*<meta property="${key}" content="[^"]*" />`), '')

const postPreviews = env => ({
  name: 'post-link-previews',
  apply: 'build',
  closeBundle() {
    const root = import.meta.dirname
    const dist = resolve(root, 'dist')
    const postsDir = resolve(root, 'src/content/blog')
    if (!existsSync(resolve(dist, 'index.html')) || env.VITE_SHOW_BLOG === 'false') return

    const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
    const site = (env.VITE_SITE_URL || '').replace(/\/$/, '')

    for (const file of readdirSync(postsDir).filter(name => name.endsWith('.md'))) {
      const post = readFrontmatter(readFileSync(resolve(postsDir, file), 'utf8'))
      if (post.draft === 'true' || !post.title) continue

      const slug = post.slug || file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
      const url = `${site}/blog/${slug}`
      const title = `${post.title} — ${env.VITE_NAME}`
      const summary = post.summary || title

      let html = template
        .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeAttr(title)}</title>`)
        .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, open, close) => open + escapeAttr(url) + close)
      html = setMeta(html, 'description', summary)
      html = setMeta(html, 'og:type', 'article')
      html = setMeta(html, 'og:url', url)
      for (const key of ['og:title', 'twitter:title']) html = setMeta(html, key, post.title)
      for (const key of ['og:description', 'twitter:description']) html = setMeta(html, key, summary)

      // Scrapers mostly ignore SVG, so a vector cover keeps the site card
      const cover = post.cover && !/^https?:|^\//.test(post.cover) ? post.cover.split('/').pop() : ''
      const ext = cover.split('.').pop().toLowerCase()
      if (OG_TYPES[ext] && existsSync(resolve(postsDir, 'images', cover))) {
        // A stable, unhashed URL: scrapers cache previews by image address
        mkdirSync(resolve(dist, 'og'), { recursive: true })
        copyFileSync(resolve(postsDir, 'images', cover), resolve(dist, 'og', `${slug}.${ext}`))
        const image = `${site}/og/${slug}.${ext}`

        for (const key of ['og:image', 'twitter:image']) html = setMeta(html, key, image)
        html = setMeta(html, 'og:image:type', OG_TYPES[ext])
        html = setMeta(html, 'og:image:alt', post.coverAlt || post.title)
        // The site card's 1200×630 no longer applies, and scrapers measure it themselves
        html = dropMeta(dropMeta(html, 'og:image:width'), 'og:image:height')
      }

      mkdirSync(resolve(dist, 'blog', slug), { recursive: true })
      writeFileSync(resolve(dist, 'blog', slug, 'index.html'), html)
    }
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')

  return {
    // "/" for a root deploy, "/<repo>/" for a GitHub Pages project site
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss(), spaFallback(), coverFraming(), postPreviews(env)],
  }
})

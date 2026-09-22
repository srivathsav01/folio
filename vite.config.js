import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
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

// The card is cropped the way the page frames the cover — object-fit: cover at
// the coverFocus point, then coverZoom scaled around that same point (see
// src/utils/cover-framing.js) — only into the 1.91:1 box scrapers show.
const OG_WIDTH = 1200
const OG_HEIGHT = 630

const clampTo = (value, min, max) => Math.min(max, Math.max(min, value))

const cropRegion = (width, height, post) => {
  const [x = 50, y = 50] = (post.coverFocus?.match(/-?\d+(\.\d+)?/g) ?? []).map(n => clampTo(Number(n), 0, 100))
  const zoom = clampTo(Number(post.coverZoom) || 1, 1, 3)

  // Image pixels per box pixel, after object-fit: cover and the zoom
  const scale = Math.max(OG_WIDTH / width, OG_HEIGHT / height) * zoom
  const cropWidth = Math.min(width, Math.round(OG_WIDTH / scale))
  const cropHeight = Math.min(height, Math.round(OG_HEIGHT / scale))

  // object-position puts the focus point at the same percentage of the box,
  // and a zoom around that point keeps it there
  return {
    left: Math.round((width - cropWidth) * (x / 100)),
    top: Math.round((height - cropHeight) * (y / 100)),
    width: cropWidth,
    height: cropHeight,
  }
}

const writeCard = async (source, target, post) => {
  const image = sharp(source)
  const { width, height } = await image.metadata()
  await image.extract(cropRegion(width, height, post)).resize(OG_WIDTH, OG_HEIGHT).jpeg({ quality: 85 }).toFile(target)
}

const postPreviews = env => ({
  name: 'post-link-previews',
  apply: 'build',
  async closeBundle() {
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
        // A stable, unhashed URL: scrapers cache previews by image address, so
        // the ?v= changes with the framing to make them fetch a re-cropped card
        mkdirSync(resolve(dist, 'og'), { recursive: true })
        await writeCard(resolve(postsDir, 'images', cover), resolve(dist, 'og', `${slug}.jpg`), post)
        const version = createHash('md5').update(`${post.coverFocus}|${post.coverZoom}`).digest('hex').slice(0, 8)
        const image = `${site}/og/${slug}.jpg?v=${version}`

        for (const key of ['og:image', 'twitter:image']) html = setMeta(html, key, image)
        html = setMeta(html, 'og:image:type', 'image/jpeg')
        html = setMeta(html, 'og:image:alt', post.coverAlt || post.title)
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

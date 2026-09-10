// Blog posts are plain markdown files in src/content/blog/. Vite inlines every
// file matching the glob below at build time, so publishing a post is: add a
// .md file, commit, redeploy. There is no registry to update and no code to
// touch — this file never needs editing when you write.
//
// A post looks like:
//
//   ---
//   title: Why I stopped mocking the database
//   date: 2026-03-04
//   summary: One or two lines that run under the title on the blog front page.
//   tags: [java, testing]
//   draft: false
//   ---
//
//   Your markdown body starts here.
//
// The filename becomes the URL: `stop-mocking-the-db.md` is served at
// /blog/stop-mocking-the-db. A leading `YYYY-MM-DD-` is stripped from the slug,
// so `2026-03-04-stop-mocking-the-db.md` gives the same URL while keeping the
// folder in date order. Set `slug:` in the frontmatter to override.
//
// Every frontmatter key is optional except `title` and `date`. Drafts are
// visible while running `npm run dev` and dropped from the built site.

const files = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

const unquote = value => value.replace(/^['"]|['"]$/g, '')

// Values are single-line: a bare scalar, or a [bracketed, list]
const parseValue = raw => {
  const value = raw.trim()
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map(entry => unquote(entry.trim()))
      .filter(Boolean)
  }
  return unquote(value)
}

const parse = source => {
  const match = source.match(FRONTMATTER)
  if (!match) return { data: {}, body: source }

  const data = {}
  for (const line of match[1].split('\n')) {
    const at = line.indexOf(':')
    if (at === -1) continue
    data[line.slice(0, at).trim()] = parseValue(line.slice(at + 1))
  }

  return { data, body: source.slice(match[0].length) }
}

const slugFrom = path =>
  path
    .split('/')
    .pop()
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')

// Built from the parts rather than Date.parse: an ISO date string is treated as
// UTC midnight, which reads as the previous day west of Greenwich.
const toDate = value => {
  const [year, month, day] = String(value).split('-').map(Number)
  if (!Number.isFinite(year)) return null
  return new Date(year, (month || 1) - 1, day || 1)
}

export const formatDate = date =>
  date
    ? date
        .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        .replace(',', '')
        .toUpperCase()
    : ''

const readingTime = body => {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export const posts = Object.entries(files)
  .map(([path, source]) => {
    const { data, body } = parse(source)
    const date = toDate(data.date)
    const fallbackSlug = slugFrom(path)

    return {
      slug: data.slug || fallbackSlug,
      title: data.title || fallbackSlug,
      summary: data.summary || '',
      tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
      draft: String(data.draft) === 'true',
      date,
      dateLabel: formatDate(date),
      readingTime: readingTime(body),
      body,
    }
  })
  .filter(post => import.meta.env.DEV || !post.draft)
  .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))

export const getPost = slug => posts.find(post => post.slug === slug) ?? null

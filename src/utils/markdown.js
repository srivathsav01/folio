// Helpers for rendering a post's markdown: the gloss syntax, the footnote
// plumbing remark-gfm leaves behind, and one prop cleanup every component
// override needs.

// react-markdown hands every component override the mdast node it came from,
// which is useful for branching but not something a DOM element should carry.
export const withoutNode = props => {
  const rest = { ...props }
  delete rest.node
  return rest
}

// Tailwind's last class wins, so a component's own classes have to survive the
// className remark may already have put on the element
export const joinClasses = (...values) => values.filter(Boolean).join(' ')

// --- Glosses: `[term]{explanation}` -------------------------------------------
//
// Rewritten before parsing into a link with a private scheme —
// `[term](<gloss:...>)` — because remark would otherwise split an explanation
// containing a link or emphasis across several nodes and leave the braces
// showing. Inside angle brackets a percent-encoded destination is opaque, so an
// explanation can hold any markdown it likes.
//
// Writing them: `[term]{}` repeats the explanation given for that term earlier
// (case-insensitive), the first `}` ends an explanation (write a literal one as
// `&#125;`), and code is left alone so a post can show the syntax itself.

export const GLOSS_SCHEME = 'gloss:'

const CODE = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g
const GLOSS = /\[([^\]\n]+)\]\{([^}]*)\}/g

// Code is blanked out rather than skipped over, so the syntax can be shown in a
// code span while a gloss further along still spans one: the mask keeps every
// offset where it was, and the matched text is read back off the original.
const maskCode = markdown => markdown.replace(CODE, code => ' '.repeat(code.length))

// [{ start, end, term, note }] for every gloss written outside code
const findGlosses = markdown => {
  const found = []

  for (const match of maskCode(markdown).matchAll(GLOSS)) {
    const raw = markdown.slice(match.index, match.index + match[0].length)
    const brace = raw.indexOf(']{')

    found.push({
      start: match.index,
      end: match.index + raw.length,
      term: raw.slice(1, brace).trim(),
      note: raw.slice(brace + 2, -1).trim(),
    })
  }

  return found
}

export const withGlosses = markdown => {
  if (!markdown.includes(']{')) return markdown

  const glosses = findGlosses(markdown)
  if (!glosses.length) return markdown

  // First definition of a term wins, so `[term]{}` later reuses this one
  const notes = new Map()
  for (const { term, note } of glosses) {
    const key = term.toLowerCase()
    if (note && !notes.has(key)) notes.set(key, note)
  }

  let out = ''
  let at = 0

  for (const { start, end, term, note } of glosses) {
    const text = note || notes.get(term.toLowerCase())
    out += markdown.slice(at, start)
    // A term whose explanation was never written stays plain prose
    out += text ? `[${term}](<${GLOSS_SCHEME}${encodeURIComponent(text)}>)` : term
    at = end
  }

  return out + markdown.slice(at)
}

export const isGloss = props => Boolean(props.href?.startsWith(GLOSS_SCHEME))

export const glossNote = href => {
  try {
    return decodeURIComponent(href.slice(GLOSS_SCHEME.length))
  } catch {
    // A hand-written `gloss:` link could carry a stray %, which is not fatal
    return href.slice(GLOSS_SCHEME.length)
  }
}

// remark-rehype namespaces footnote ids to keep them from clobbering globals
const PREFIX = 'user-content-'
const REF = `#${PREFIX}fnref-`
const DEF = `#${PREFIX}fn-`

// remark-gfm marks its own anchors, and the href says which end is which, so
// either signal is enough to tell a reference marker from a way back up
export const isFootnoteRef = props =>
  props['data-footnote-ref'] !== undefined || Boolean(props.href?.startsWith(DEF))

export const isFootnoteBackref = props =>
  props['data-footnote-backref'] !== undefined || Boolean(props.href?.startsWith(REF))

export const isFootnotesSection = props => props['data-footnotes'] !== undefined

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Scrolls to a reference, or back to the sentence that cited it, and flashes the
// target: a jump the reader did not watch happen leaves them hunting for it.
export const jumpTo = hash => {
  const target = document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!target) return

  target.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'center',
  })

  target.classList.remove('note-flash')
  // Reading the layout restarts the animation when the same target is hit twice
  void target.offsetWidth
  target.classList.add('note-flash')
  window.setTimeout(() => target.classList.remove('note-flash'), 1900)
}

// A reference's own text, minus its back-arrow, reused as the hover preview.
// Read from the DOM rather than threaded through: the references list is part
// of the same render, so it is on the page before anyone can hover a number.
export const readReference = hash => {
  const source = document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!source) return ''

  const copy = source.cloneNode(true)
  copy.querySelectorAll('[data-footnote-backref]').forEach(node => node.remove())
  return copy.textContent.replace(/\s+/g, ' ').trim()
}

// The text a post is read aloud from, taken off the rendered article rather
// than the markdown, so glosses, footnote markers and links read as the words
// on screen. Built from the text nodes themselves instead of innerText: every
// character keeps a pointer back to its node, which is what lets the sentence
// being spoken be highlighted with a DOM Range, and a click on the page be
// traced back to the sentence under it.

// Code, pictures and their captions, footnote numbers and back-arrows, copy
// buttons, and anything marked as page furniture
const SKIP = [
  'pre',
  'figure',
  'figcaption',
  'img',
  'picture',
  'svg',
  'video',
  'audio',
  'script',
  'style',
  'template',
  'button[data-copy]',
  '[data-copy-button]',
  '.copy-button',
  '[aria-hidden="true"]',
  '[href^="#user-content-fn"]',
  '[data-footnote-backref]',
  // The References list remark-gfm appends, heading and all
  '[data-footnotes]',
  '[data-read-aloud-skip]',
].join(',')

// Elements that end a sentence at their edges: a heading with no full stop
// shouldn't run on into the paragraph beneath it
const BLOCKS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'DD', 'DETAILS', 'DIV', 'DL', 'DT', 'FOOTER',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'SECTION',
  'SUMMARY', 'TABLE', 'TD', 'TH', 'TR', 'UL',
])

// Read aloud but never highlighted, like the post's title and summary
const QUIET = '[data-read-aloud-quiet]'

// { text, rangeFor(start, end, includeQuiet), spanOf(element) }. Line breaks in
// the text mark block edges and nothing else: whitespace inside a text node is
// flattened to spaces one for one, so offsets in the text are offsets in the
// nodes.
export const readArticle = root => {
  let text = ''
  const nodes = [] // { node, start } in document order
  const spans = new WeakMap() // element -> [start, end] of the text inside it
  const quiet = [] // [start, end] spans that are never highlighted

  const breakLine = () => {
    if (text && !text.endsWith('\n')) text += '\n'
  }

  const walk = parent => {
    for (const child of parent.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        nodes.push({ node: child, start: text.length })
        text += child.data.replace(/\s/g, ' ')
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches(SKIP)) {
        const block = BLOCKS.has(child.tagName)
        if (block) breakLine()
        const from = text.length
        walk(child)
        spans.set(child, [from, text.length])
        if (child.matches(QUIET)) quiet.push([from, text.length])
        if (block) breakLine()
      }
    }
  }

  if (root) walk(root)

  // The last node starting at or before an offset
  const nodeAt = offset => {
    let low = 0
    let high = nodes.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (nodes[mid].start <= offset) low = mid
      else high = mid - 1
    }
    return nodes[low]
  }

  // Sentences are trimmed, so both ends always fall inside a text node. Null
  // for a sentence in a quiet span, which stays unhighlighted, unless asked.
  const rangeFor = (start, end, includeQuiet = false) => {
    if (!nodes.length || end <= start) return null
    if (!includeQuiet && quiet.some(([from, to]) => start >= from && start < to)) return null
    const first = nodeAt(start)
    const last = nodeAt(end - 1)
    if (!first.node.isConnected || !last.node.isConnected) return null

    const range = document.createRange()
    range.setStart(first.node, Math.min(start - first.start, first.node.length))
    range.setEnd(last.node, Math.min(end - last.start, last.node.length))
    return range
  }

  // [start, end] of the text inside the nearest element that was read, or
  // null for anything skipped (code, images, the player itself)
  const spanOf = element => {
    for (let el = element; el && el !== root.parentElement; el = el.parentElement) {
      if (spans.has(el)) return spans.get(el)
      if (el.matches(SKIP)) return null
    }
    return null
  }

  return { text, rangeFor, spanOf }
}

// Room around a line of text that still counts as "on" it, so the gaps of a
// generous line height don't make the pointer flicker between sentences
const SLOP = 6

export const rangeHits = (range, x, y) =>
  Array.from(range.getClientRects()).some(
    rect => x >= rect.left - 2 && x <= rect.right + 2 && y >= rect.top - SLOP && y <= rect.bottom + SLOP,
  )

// --- Highlighting ------------------------------------------------------------
//
// Drawn as tinted boxes over each line of the range, in a layer of its own at
// the end of <body>, so the article's markup is never touched and links,
// glosses and line breaks are exactly as they were. The boxes sit in page
// coordinates, so scrolling needs nothing; a layout change (an image loading,
// a resize) calls repaintHighlights. This works the same in every browser,
// unlike the CSS Custom Highlight API, which Safari paints unreliably. Styled
// in index.css.

const PAD = 2 // px either side of a line, so the tint doesn't clip the glyphs

// A range's client rects come per text node and per inline element, so a line
// with a link in it arrives in overlapping pieces; each line is merged into
// one box, or the overlaps would show as darker patches.
const lineBoxes = range => {
  const rects = Array.from(range.getClientRects())
    .filter(rect => rect.width > 0.5 && rect.height > 0.5)
    .map(({ left, right, top, bottom }) => ({ left, right, top, bottom }))
    .sort((a, b) => a.top - b.top || a.left - b.left)

  const lines = []
  for (const rect of rects) {
    const line = lines.find(
      box => rect.top < box.bottom - 2 && rect.bottom > box.top + 2 && rect.left <= box.right + PAD * 2,
    )
    if (!line) {
      lines.push(rect)
      continue
    }
    line.left = Math.min(line.left, rect.left)
    line.right = Math.max(line.right, rect.right)
    line.top = Math.min(line.top, rect.top)
    line.bottom = Math.max(line.bottom, rect.bottom)
  }
  return lines
}

const layers = new Map() // name -> { layer, range }

const paint = entry => {
  const { scrollX, scrollY } = window
  entry.layer.replaceChildren(
    ...lineBoxes(entry.range).map(line => {
      const box = document.createElement('div')
      box.style.left = `${line.left + scrollX - PAD}px`
      box.style.top = `${line.top + scrollY}px`
      box.style.width = `${line.right - line.left + PAD * 2}px`
      box.style.height = `${line.bottom - line.top}px`
      return box
    }),
  )
}

// 'read-aloud' is the sentence being spoken, 'read-aloud-hover' the one a
// click would jump to. A null range clears it.
export const highlightRange = (range, name = 'read-aloud') => {
  let entry = layers.get(name)

  if (!range) {
    entry?.layer.remove()
    layers.delete(name)
    return
  }

  if (!entry) {
    const layer = document.createElement('div')
    layer.className = 'read-aloud-layer'
    layer.dataset.highlight = name
    layer.setAttribute('aria-hidden', 'true')
    document.body.append(layer)
    entry = { layer }
    layers.set(name, entry)
  }

  entry.range = range
  paint(entry)
}

export const repaintHighlights = () => layers.forEach(paint)

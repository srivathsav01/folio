// The text a post is read aloud from, taken off the rendered article rather
// than the markdown, so glosses, footnote markers and links read as the words
// on screen. Built from the text nodes themselves instead of innerText: every
// character keeps a pointer back to its node, which is what lets the sentence
// being spoken be highlighted in place with a DOM Range, and a click on the
// page be traced back to the sentence under it.

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

// The text node and offset under a point on screen. Chrome 128+ and Firefox
// have the standard call, Safari and older Chrome the WebKit one.
const caretAt = (x, y) => {
  if (document.caretPositionFromPoint) {
    const caret = document.caretPositionFromPoint(x, y)
    return caret && { node: caret.offsetNode, offset: caret.offset }
  }
  if (document.caretRangeFromPoint) {
    const caret = document.caretRangeFromPoint(x, y)
    return caret && { node: caret.startContainer, offset: caret.startOffset }
  }
  return null
}

// { text, rangeFor(start, end), offsetAt(x, y) }. Line breaks in the text mark
// block edges and nothing else: whitespace inside a text node is flattened to
// spaces one for one, so offsets in the text are offsets in the nodes.
export const readArticle = root => {
  let text = ''
  const nodes = [] // { node, start } in document order
  const starts = new Map() // text node -> its start, for offsetAt
  const quiet = [] // [start, end] spans that are never highlighted

  const breakLine = () => {
    if (text && !text.endsWith('\n')) text += '\n'
  }

  const walk = parent => {
    for (const child of parent.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        nodes.push({ node: child, start: text.length })
        starts.set(child, text.length)
        text += child.data.replace(/\s/g, ' ')
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches(SKIP)) {
        const block = BLOCKS.has(child.tagName)
        if (block) breakLine()
        const from = text.length
        walk(child)
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
  // for a sentence in a quiet span, which stays unhighlighted.
  const rangeFor = (start, end) => {
    if (!nodes.length || end <= start) return null
    if (quiet.some(([from, to]) => start >= from && start < to)) return null
    const first = nodeAt(start)
    const last = nodeAt(end - 1)
    if (!first.node.isConnected || !last.node.isConnected) return null

    const range = document.createRange()
    range.setStart(first.node, Math.min(start - first.start, first.node.length))
    range.setEnd(last.node, Math.min(end - last.start, last.node.length))
    return range
  }

  // The offset in the text under a point, or -1 off the text (a margin, an
  // image, anything skipped)
  const offsetAt = (x, y) => {
    const caret = caretAt(x, y)
    const start = caret && starts.get(caret.node)
    return start === undefined || start === null ? -1 : start + caret.offset
  }

  return { text, rangeFor, offsetAt }
}

// --- Highlighting ------------------------------------------------------------
//
// The CSS Custom Highlight API paints a range without wrapping it in an
// element, so links, glosses and line breaks are exactly as they were. Where
// it isn't supported there is simply no highlight. Styled in index.css.

const canHighlight = () => typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function'

// 'read-aloud' is the sentence being spoken, 'read-aloud-hover' the one a
// click would jump to
export const highlightRange = (range, name = 'read-aloud') => {
  if (!canHighlight()) return
  if (range) CSS.highlights.set(name, new Highlight(range))
  else CSS.highlights.delete(name)
}

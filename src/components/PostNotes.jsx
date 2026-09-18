import Annotation from './Annotation'
import { jumpTo, readReference } from '../utils/markdown'

// The two ways a post can annotate a word.
//
// 1. A gloss — `[term]{explanation}` — is a dotted-underlined word with a
//    hover/tap pop-up. Nothing appears at the foot of the post.
// 2. A footnote — `[^id]` in the prose, `[^id]: explanation` anywhere below —
//    is a numbered marker listed under References at the end. Hovering it
//    previews the reference; clicking scrolls down to it, and the arrow beside
//    the reference scrolls back to where the reader was.

const TERM = [
  // Inline, not the button default of inline-block, so a two-word term still
  // breaks across a line like the prose around it
  'inline cursor-help border-b border-dotted border-cream/45 pb-px text-cream',
  'transition-colors duration-[250ms] hover:border-cream hover:bg-cream/[0.06]',
  'focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-cream/60',
].join(' ')

export function GlossTerm({ note = '', children }) {
  // An explanation that never got written leaves the term as plain prose
  if (!note) return <span>{children}</span>

  return (
    <Annotation label={children} note={note} triggerClassName={TERM}>
      {children}
    </Annotation>
  )
}

const NUMBER = [
  'ml-px rounded px-[0.18rem] font-mono text-cream/70 no-underline',
  'transition-colors duration-[250ms] hover:bg-cream/12 hover:text-cream',
  'focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-cream/60',
].join(' ')

export function FootnoteRef({ href = '', id, children }) {
  return (
    <Annotation
      href={href}
      triggerId={id}
      label="Reference"
      // Resolved when the pop-up opens, so it reads the rendered reference
      note={() => readReference(href) || 'Jump to the reference below.'}
      triggerClassName={NUMBER}
      onActivate={() => jumpTo(href)}
    >
      [{children}]
    </Annotation>
  )
}

export function FootnoteBackref({ href = '', label, children }) {
  return (
    <a
      href={href}
      data-footnote-backref=""
      aria-label={label || 'Back to the text'}
      className="ml-1.5 inline-block text-cream/35 no-underline transition-colors duration-[250ms] hover:text-cream"
      onClick={event => {
        event.preventDefault()
        jumpTo(href)
      }}
    >
      {children}
    </a>
  )
}

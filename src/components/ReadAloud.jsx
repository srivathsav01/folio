import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Pause, Play, Square } from 'lucide-react'
import { highlightRange, rangeHits, readArticle, repaintHighlights } from '../utils/article-text'
import { setDockPlayer } from '../utils/dock-player'
import { RATES, useReadAloud } from '../utils/read-aloud'

// "Listen to this post": the browser reads the article aloud and the sentence
// being spoken is highlighted as it goes. Hidden where the browser has no
// speech engine. Keyed by post in BlogPost, so leaving a post ends its reading.
// Once the reader scrolls past it mid-reading, pause and stop move to the dock.
//
// While listening, clicking a sentence moves the reading there. The place
// reached is kept per post in localStorage, so a return visit carries on.

const WORDS_PER_MINUTE = 150

const FOCUS = 'focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-cream/60'

const BUTTON = [
  'inline-flex h-8 items-center justify-center gap-2 rounded-full text-cream/60',
  'transition-colors duration-[250ms] hover:bg-cream/10 hover:text-cream',
  'disabled:pointer-events-none disabled:opacity-30',
  FOCUS,
].join(' ')

const SELECT = [
  'h-8 cursor-pointer appearance-none rounded-full bg-transparent pr-6 pl-3 tracking-[0.1em] text-cream/60',
  'transition-colors duration-[250ms] hover:bg-cream/10 hover:text-cream',
  FOCUS,
].join(' ')

const PILL = 'inline-flex items-center gap-0.5 rounded-full border border-cream/12 bg-cream/[0.04] p-0.5'

// "Microsoft Ava Online (Natural) - English (United States)" -> "Ava (Natural)".
// Safari often names a Premium or Enhanced voice plainly and keeps the tier in
// its voiceURI, so the tier is added back where the name leaves it out.
const voiceLabel = voice => {
  const name = voice.name
    .replace(/^Microsoft\s+/, '')
    .replace(/\s+Online\b/, '')
    .replace(/\s+-\s+English.*$/, '')
  if (name.includes('(')) return name
  const tier = voice.voiceURI.match(/\b(premium|enhanced)\b/i)?.[1]
  return tier ? `${name} (${tier[0].toUpperCase()}${tier.slice(1).toLowerCase()})` : name
}

const Chevron = () => (
  <ChevronDown
    className="pointer-events-none absolute right-2 size-3 text-cream/40"
    strokeWidth={1.6}
    aria-hidden="true"
  />
)

// Tall enough to clear the fixed navbar, which hides whatever is beneath it
const NAVBAR = 96

const TOGGLE = {
  idle: { label: 'Listen', aria: 'Listen to this post', Icon: Play },
  saved: { label: 'Resume', aria: 'Resume listening where you left off', Icon: Play },
  playing: { label: 'Pause', aria: 'Pause reading', Icon: Pause },
  paused: { label: 'Resume', aria: 'Resume reading', Icon: Play },
}

const STATUS = { idle: '', playing: 'Reading aloud', paused: 'Reading paused' }

// Links, glosses and footnote numbers keep their own click
const INTERACTIVE = 'a, button, select, input, textarea, label, [data-read-aloud-skip]'

// Past this many sentences under one element (the gap between paragraphs
// lands on the whole post body), the pointer isn't over any one of them
const MAX_CANDIDATES = 40

// The first sentence ending after an offset
const firstEndingAfter = (sentences, offset) => {
  let low = 0
  let high = sentences.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (sentences[mid].end <= offset) low = mid + 1
    else high = mid
  }
  return low
}

// The sentence under a pointer event, or -1. Found by checking where the
// sentences in the element under the pointer sit on screen, rather than asking
// the browser for the caret there: WebKit won't place a caret in text that is
// user-select: none, as the whole site is.
const sentenceUnder = (event, article, sentences) => {
  if (!article || event.target.closest?.(INTERACTIVE)) return -1
  const span = article.spanOf(event.target)
  if (!span) return -1

  const [from, to] = span
  for (let i = firstEndingAfter(sentences, from), n = 0; i < sentences.length && sentences[i].start < to; i++) {
    if (++n > MAX_CANDIDATES) return -1
    const range = article.rangeFor(sentences[i].start, sentences[i].end, true)
    if (range && rangeHits(range, event.clientX, event.clientY)) return i
  }
  return -1
}

export default function ReadAloud({ articleRef, slug, source }) {
  const [text, setText] = useState('')
  const article = useRef(null)

  // Read off the DOM once the post has rendered, and again if its body changes
  useEffect(() => {
    article.current = readArticle(articleRef.current)
    setText(article.current.text)
  }, [articleRef, source])

  const {
    state,
    play,
    startOver,
    pause,
    resume,
    stop,
    seek,
    currentSentenceIndex,
    savedSentenceIndex,
    isSupported,
    sentences,
    rate,
    setRate,
    voices,
    voice,
    setVoice,
  } = useReadAloud(text, { resumeKey: `read-aloud:${slug}` })

  const ready = isSupported && sentences.length > 0
  const listening = state !== 'idle'
  const sentence = listening ? sentences[currentSentenceIndex] : null

  // Highlight only: the page is the reader's to scroll
  useEffect(() => {
    highlightRange(sentence ? article.current?.rangeFor(sentence.start, sentence.end) : null)
  }, [sentence])

  useEffect(() => () => highlightRange(null), [])

  // The highlight is drawn in page coordinates, so it's redrawn when the post
  // reflows: an image loading above it, fonts arriving, the window resizing
  useEffect(() => {
    const root = articleRef.current
    if (!listening || !root) return
    const observer = new ResizeObserver(() => repaintHighlights())
    observer.observe(root)
    window.addEventListener('resize', repaintHighlights)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', repaintHighlights)
    }
  }, [listening, articleRef])

  // Clicking a sentence jumps the reading to it. With a mouse, the sentence
  // under the pointer is faintly highlighted first, so the target is clear.
  useEffect(() => {
    const root = articleRef.current
    if (!listening || !root) return

    const onClick = event => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const index = sentenceUnder(event, article.current, sentences)
      if (index !== -1) seek(index)
    }

    let frame = 0
    let hovered = -1
    const clearHover = () => {
      cancelAnimationFrame(frame)
      hovered = -1
      highlightRange(null, 'read-aloud-hover')
      delete root.dataset.readAloudTarget
    }

    const onPointerMove = event => {
      if (event.pointerType !== 'mouse') return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const index = sentenceUnder(event, article.current, sentences)
        if (index === hovered) return
        hovered = index
        const under = sentences[index]
        highlightRange(under ? article.current?.rangeFor(under.start, under.end) : null, 'read-aloud-hover')
        if (under) root.dataset.readAloudTarget = ''
        else delete root.dataset.readAloudTarget
      })
    }

    root.addEventListener('click', onClick)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerleave', clearHover)
    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', clearHover)
      clearHover()
    }
  }, [listening, articleRef, sentences, seek])

  // Whether the controls are on screen, below the navbar
  const controls = useRef(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    if (!ready || !controls.current) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: `-${NAVBAR}px 0px 0px 0px`,
    })
    observer.observe(controls.current)
    return () => observer.disconnect()
  }, [ready])

  useEffect(() => {
    const docked = listening && !inView
    setDockPlayer(docked ? { state, toggle: state === 'playing' ? pause : resume, stop } : null)
  }, [listening, state, inView, pause, resume, stop])

  useEffect(() => () => setDockPlayer(null), [])

  // Words before each sentence, for the time left from any point
  const wordsBefore = useMemo(() => {
    const counts = [0]
    for (const { text: words } of sentences) counts.push(counts.at(-1) + words.split(' ').length)
    return counts
  }, [sentences])

  if (!ready) return null

  const hasSaved = !listening && savedSentenceIndex > 0
  const from = listening ? Math.max(0, currentSentenceIndex) : Math.max(0, savedSentenceIndex)
  const wordsLeft = wordsBefore.at(-1) - wordsBefore[from]
  const minutes = Math.max(1, Math.round(wordsLeft / (WORDS_PER_MINUTE * rate)))

  const toggle = TOGGLE[hasSaved ? 'saved' : state]
  const onToggle = { idle: play, playing: pause, paused: resume }[state]

  return (
    <div
      data-read-aloud-skip=""
      className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.6rem] tracking-[0.2em] text-cream/40 uppercase"
    >
      <div ref={controls} role="group" aria-label="Read aloud" className={PILL}>
        <button type="button" className={`${BUTTON} pr-3.5 pl-3`} aria-label={toggle.aria} onClick={onToggle}>
          <toggle.Icon
            className={`size-3 ${state === 'playing' ? 'text-signal' : ''}`}
            strokeWidth={1.8}
            fill="currentColor"
            aria-hidden="true"
          />
          {/* Six mono characters at this tracking, so the pill never jumps */}
          <span className="w-[4.8em] text-left">{toggle.label}</span>
        </button>

        <button
          type="button"
          className={`${BUTTON} w-8`}
          aria-label="Stop reading"
          disabled={!listening}
          onClick={stop}
        >
          <Square className="size-2.5" strokeWidth={1.8} fill="currentColor" aria-hidden="true" />
        </button>

        <span className="mx-0.5 h-4 w-px bg-cream/15" aria-hidden="true" />

        <label className="relative inline-flex items-center">
          <select
            value={rate}
            onChange={event => setRate(Number(event.target.value))}
            aria-label="Reading speed"
            className={SELECT}
          >
            {RATES.map(value => (
              <option key={value} value={value} className="bg-ink text-cream">
                {value}×
              </option>
            ))}
          </select>
          <Chevron />
        </label>
      </div>

      {/* Voices differ by browser and device; with one or none there's no choice */}
      {voices.length > 1 && (
        <label className={`${PILL} relative`}>
          <select
            value={voice?.voiceURI ?? ''}
            onChange={event => setVoice(event.target.value)}
            aria-label="Voice"
            className={`${SELECT} max-w-[13rem] truncate normal-case`}
          >
            {voices.map(option => (
              <option
                key={option.voiceURI}
                value={option.voiceURI}
                title={`${option.name} (${option.lang})`}
                className="bg-ink text-cream"
              >
                {voiceLabel(option)}
              </option>
            ))}
          </select>
          <Chevron />
        </label>
      )}

      <span>
        ~{minutes} min {from > 0 ? 'left' : 'listen'}
      </span>

      {hasSaved && (
        <button
          type="button"
          onClick={startOver}
          className={`uppercase underline decoration-cream/25 underline-offset-4 transition-colors duration-[250ms] hover:text-cream hover:decoration-cream ${FOCUS}`}
        >
          Start over
        </button>
      )}

      <span className="sr-only" role="status">
        {STATUS[state]}
      </span>
    </div>
  )
}

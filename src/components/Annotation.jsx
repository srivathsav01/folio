import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { withoutNode } from '../utils/markdown'

// The pop-up behind both annotation styles in a post: the hover gloss
// (`[term]{explanation}`) and the preview on a footnote's reference number.
// It lives in a portal so the prose's overflow containers can never clip it.

const GAP = 10 // between trigger and panel
const EDGE = 12 // smallest gap to the viewport edge
const OPEN_DELAY = 110
const CLOSE_DELAY = 180

const PANEL = [
  'pointer-events-auto fixed z-[150] w-[min(23rem,calc(100vw-1.5rem))]',
  'rounded-xl border border-cream/15 bg-ink/95 px-4 py-3.5',
  'shadow-[0_18px_48px_rgba(0,0,0,0.6)] backdrop-blur-[20px] backdrop-saturate-[160%]',
].join(' ')

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

// Explanations are inline markdown, so a note can carry a link or some code
const NOTE_MARKDOWN = {
  p: props => <p className="my-0 [&+p]:mt-2.5" {...withoutNode(props)} />,
  a: props => (
    <a
      className="text-cream underline decoration-cream/40 underline-offset-2 transition-colors duration-200 hover:decoration-cream"
      target="_blank"
      rel="noreferrer"
      {...withoutNode(props)}
    />
  ),
  code: props => (
    <code
      className="rounded bg-cream/10 px-1 py-0.5 font-mono text-[0.82em] text-cream"
      {...withoutNode(props)}
    />
  ),
  ul: props => (
    <ul
      className="mt-2 flex list-disc flex-col gap-1 pl-4 marker:text-cream/25"
      {...withoutNode(props)}
    />
  ),
  ol: props => (
    <ol
      className="mt-2 flex list-decimal flex-col gap-1 pl-4 marker:text-cream/25"
      {...withoutNode(props)}
    />
  ),
  img: props => (
    <img
      className="mt-2.5 w-full rounded-lg border border-cream/10"
      loading="lazy"
      {...withoutNode(props)}
    />
  ),
}

// Mounted with the pop-up, never before it: a note given as a function — a
// footnote's, read off its rendered reference — resolves on open, not on every
// render of the post.
const NoteBody = ({ note }) => {
  const text = typeof note === 'function' ? note() : note

  return typeof text === 'string' ? (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={NOTE_MARKDOWN}>
      {text}
    </ReactMarkdown>
  ) : (
    text
  )
}

export default function Annotation({
  label,
  note,
  href,
  triggerId,
  children,
  triggerClassName = '',
  onActivate,
}) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false) // clicked or focused, so hovering away keeps it
  const [box, setBox] = useState(null)

  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const timer = useRef(0)
  const panelId = useId()
  const reduceMotion = useReducedMotion()

  const cancel = useCallback(() => window.clearTimeout(timer.current), [])

  const show = (delay = 0) => {
    cancel()
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }

  const hide = useCallback(
    (delay = 0) => {
      cancel()
      timer.current = window.setTimeout(() => {
        setOpen(false)
        setPinned(false)
      }, delay)
    },
    [cancel],
  )

  useEffect(() => cancel, [cancel])

  // Measured after mount but before paint, so the panel never flashes at 0,0
  const place = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const t = trigger.getBoundingClientRect()
    const { width, height } = panel.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = window.innerHeight

    const fitsBelow = t.bottom + GAP + height <= viewportHeight - EDGE
    const fitsAbove = t.top - GAP - height >= EDGE
    const above = !fitsBelow && fitsAbove

    const left = clamp(
      t.left + t.width / 2 - width / 2,
      EDGE,
      Math.max(EDGE, viewportWidth - EDGE - width),
    )

    setBox({
      left,
      top: above ? t.top - GAP - height : t.bottom + GAP,
      above,
      arrow: clamp(t.left + t.width / 2 - left, 16, Math.max(16, width - 16)),
    })
  }, [])

  // A layout effect, so the measured position lands before the browser paints
  // and the panel is never seen at the wrong place
  useLayoutEffect(() => {
    if (!open) return

    place()
    const reposition = () => place()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open, place])

  // A tap outside, or Escape, dismisses a pinned pop-up
  useEffect(() => {
    if (!open) return

    const onPointerDown = event => {
      if (triggerRef.current?.contains(event.target)) return
      if (panelRef.current?.contains(event.target)) return
      hide()
    }
    const onKeyDown = event => {
      if (event.key !== 'Escape') return
      hide()
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, hide])

  const handleClick = event => {
    event.preventDefault()

    // A footnote number is a link first: clicking it jumps to the reference
    if (onActivate) {
      cancel()
      setOpen(false)
      setPinned(false)
      onActivate(event)
      return
    }

    const next = !(open && pinned)
    cancel()
    setOpen(next)
    setPinned(next)
  }

  const Trigger = href ? 'a' : 'button'

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id={panelId}
          role="tooltip"
          className={PANEL}
          style={{
            top: box?.top ?? 0,
            left: box?.left ?? 0,
            visibility: box ? 'visible' : 'hidden',
          }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: box?.above ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: box?.above ? 3 : -3 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onPointerEnter={cancel}
          onPointerLeave={event => event.pointerType !== 'touch' && !pinned && hide(CLOSE_DELAY)}
        >
          <span
            className={`absolute size-2.5 rotate-45 border-cream/15 bg-ink ${
              box?.above ? 'bottom-[-0.32rem] border-r border-b' : 'top-[-0.32rem] border-t border-l'
            }`}
            style={{ left: (box?.arrow ?? 16) - 5 }}
            aria-hidden="true"
          />

          {label && (
            <p className="mb-2 font-mono text-[0.55rem] tracking-[0.2em] text-cream/40 uppercase">
              {label}
            </p>
          )}

          <div className="text-[0.875rem] leading-[1.7] text-cream/80">
            <NoteBody note={note} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <Trigger
        ref={triggerRef}
        id={triggerId}
        {...(href ? { href } : { type: 'button' })}
        className={triggerClassName}
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onClick={handleClick}
        onPointerEnter={event => event.pointerType !== 'touch' && show(OPEN_DELAY)}
        onPointerLeave={event => event.pointerType !== 'touch' && !pinned && hide(CLOSE_DELAY)}
        onFocus={() => {
          setPinned(true)
          show()
        }}
        onBlur={event => {
          if (panelRef.current?.contains(event.relatedTarget)) return
          hide(CLOSE_DELAY)
        }}
      >
        {children}
      </Trigger>

      {/* Portalled to <body>, so no overflow container in the prose clips it.
          The wrapper stays mounted while closed, so the pop-up can animate out. */}
      {typeof document === 'undefined' ? null : createPortal(panel, document.body)}
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Move } from 'lucide-react'
import { clampFraming, DEFAULT_FRAMING, ZOOM_MAX, ZOOM_MIN } from '../utils/cover-framing'

// Dev-only: reframe a post's cover in place. It sits over the cover as a
// sibling (never inside the post's link), so dragging can't open the post.
// Drag pans, the wheel or slider zooms, and Save writes coverFocus/coverZoom
// into the post's frontmatter through the dev server (see vite.config.js).
// Loaded through DevCoverEditor, so none of this reaches a production build.

const BUTTON =
  'cursor-pointer rounded-md border border-cream/15 bg-ink/75 px-2.5 py-1.5 font-mono text-[0.58rem] tracking-[0.18em] text-cream/80 uppercase backdrop-blur-md transition-colors duration-[250ms] hover:bg-ink/90 hover:text-cream disabled:cursor-default disabled:opacity-40'

const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places

// Only non-default values are written; a default removes the key instead
const toFrontmatter = ({ x, y, zoom }) => {
  const [rx, ry, rz] = [round(x, 1), round(y, 1), round(zoom, 2)]
  const centred = rx === DEFAULT_FRAMING.x && ry === DEFAULT_FRAMING.y
  return {
    focus: centred ? null : `${rx}% ${ry}%`,
    zoom: rz === DEFAULT_FRAMING.zoom ? null : rz,
  }
}

export default function CoverEditor({ file, framing, onChange, className = 'inset-0' }) {
  const [editing, setEditing] = useState(false)
  // null, 'saving', 'saved', or an error message
  const [status, setStatus] = useState(null)

  const boxRef = useRef(null)
  const dragRef = useRef(null)
  // Latest props and actions, for the window listeners below
  const live = useRef({})

  const begin = () => {
    setStatus(null)
    setEditing(true)
  }

  // Dropping the draft puts the cover back to what the file says
  const cancel = () => {
    onChange(null)
    setStatus(null)
    setEditing(false)
  }

  const save = async () => {
    setStatus('saving')
    try {
      const response = await fetch('/__cover-framing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, ...toFrontmatter(framing) }),
      })
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`)
      setStatus('saved')
      setEditing(false)
    } catch (error) {
      setStatus(`Not saved: ${error.message}`)
    }
  }

  useEffect(() => {
    live.current = { framing, onChange, cancel, save }
  })

  // Wheel zoom needs a non-passive listener to keep the page from scrolling,
  // which React's onWheel can't give
  useEffect(() => {
    if (!editing) return
    const box = boxRef.current

    const onWheel = event => {
      event.preventDefault()
      const { framing: current, onChange: change } = live.current
      change(clampFraming({ ...current, zoom: current.zoom * Math.exp(-event.deltaY * 0.0015) }))
    }
    const onKey = event => {
      if (event.key === 'Escape') live.current.cancel()
      // A focused button handles its own Enter
      if (event.key === 'Enter' && !event.target.closest?.('button, input')) live.current.save()
    }

    box.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      box.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [editing])

  useEffect(() => {
    if (status !== 'saved') return
    const timer = setTimeout(() => setStatus(null), 1600)
    return () => clearTimeout(timer)
  }, [status])

  const onPointerDown = event => {
    if (event.target.closest('[data-toolbar]')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY }
  }

  // Dragging right should pull the left of the photo into view, so the focus
  // moves against the pointer. How far one pixel goes depends on how much of
  // the photo is hidden, i.e. on the zoom; the floor keeps an unzoomed cover
  // in an odd-shaped frame (a square thumbnail) movable.
  const onPointerMove = event => {
    const drag = dragRef.current
    if (!drag) return
    const rect = boxRef.current.getBoundingClientRect()
    const reach = Math.max(framing.zoom - 1, 0.25)
    onChange(
      clampFraming({
        ...framing,
        x: framing.x - ((event.clientX - drag.x) / (rect.width * reach)) * 100,
        y: framing.y - ((event.clientY - drag.y) / (rect.height * reach)) * 100,
      }),
    )
    dragRef.current = { x: event.clientX, y: event.clientY }
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const saving = status === 'saving'
  const error = status && !['saving', 'saved'].includes(status) ? status : null

  return (
    <div
      ref={boxRef}
      className={`absolute z-10 rounded-xl ${className} ${
        editing
          ? 'cursor-grab touch-none ring-2 ring-signal/80 select-none active:cursor-grabbing'
          : 'pointer-events-none'
      }`}
      onPointerDown={editing ? onPointerDown : undefined}
      onPointerMove={editing ? onPointerMove : undefined}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Rule-of-thirds guides while framing */}
      {editing && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <span className="absolute inset-y-0 left-1/3 w-px bg-white/35" />
          <span className="absolute inset-y-0 left-2/3 w-px bg-white/35" />
          <span className="absolute inset-x-0 top-1/3 h-px bg-white/35" />
          <span className="absolute inset-x-0 top-2/3 h-px bg-white/35" />
        </div>
      )}

      <div
        data-toolbar
        className="pointer-events-none absolute top-3 right-3 left-3 flex flex-wrap items-center justify-end gap-2 [&>*]:pointer-events-auto"
      >
        {editing ? (
          <>
            <span className="rounded-md bg-ink/75 px-2.5 py-1.5 font-mono text-[0.58rem] tracking-[0.12em] text-cream/60 backdrop-blur-md">
              Drag to move · scroll to zoom · {Math.round(framing.x)}% {Math.round(framing.y)}% ·{' '}
              {framing.zoom.toFixed(2)}×
            </span>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={framing.zoom}
              onChange={event => onChange(clampFraming({ ...framing, zoom: Number(event.target.value) }))}
              className="w-24 cursor-pointer accent-signal"
              aria-label="Zoom"
            />
            <button type="button" className={BUTTON} onClick={() => onChange(DEFAULT_FRAMING)}>
              Reset
            </button>
            <button type="button" className={BUTTON} onClick={cancel}>
              Cancel
            </button>
            <button
              type="button"
              className={`${BUTTON} border-signal/50 text-signal-soft`}
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Saving' : 'Save'}
            </button>
          </>
        ) : (
          <button type="button" className={`${BUTTON} inline-flex items-center gap-1.5`} onClick={begin}>
            <Move className="size-3" strokeWidth={1.8} aria-hidden="true" />
            {status === 'saved' ? 'Saved' : 'Adjust'}
          </button>
        )}

        {error && (
          <span className="basis-full text-right font-mono text-[0.58rem] text-red-400">{error}</span>
        )}
      </div>
    </div>
  )
}

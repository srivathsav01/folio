import { createPortal } from 'react-dom'
import './Toast.css'

// Rendered into <body> so it escapes the navbar's mix-blend-mode group
export default function Toast({ message, visible }) {
  return createPortal(
    <div
      className={`toast${visible ? ' is-visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>,
    document.body
  )
}

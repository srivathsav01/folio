import { createPortal } from 'react-dom'

const TOAST = [
  'pointer-events-none fixed right-4 bottom-[calc(4.25rem_+_env(safe-area-inset-bottom,0px))] z-[200]',
  'md:right-6 md:bottom-[calc(1.5rem_+_env(safe-area-inset-bottom,0px))]',
  'rounded-[0.7rem] border border-cream/15 bg-cream/[0.09] px-[0.9rem] py-[0.6rem]',
  'font-mono text-[0.6rem] tracking-[0.12em] text-cream uppercase',
  'shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-[24px] backdrop-saturate-[180%]',
  'transition-[opacity,translate,visibility] duration-300 ease-out-expo',
].join(' ')

// Rendered into <body> so it escapes the navbar's mix-blend-mode group
export default function Toast({ message, visible }) {
  return createPortal(
    <div
      className={`${TOAST} ${
        visible ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>,
    document.body,
  )
}

import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

// The theme lives on <html data-theme>. index.html sets it before first paint
// from the saved choice, so a light-mode visitor never sees a dark flash; this
// module only changes it afterwards. The light palette is in index.css.

const KEY = 'theme'
const root = document.documentElement
const listeners = new Set()

export const getTheme = () => (root.dataset.theme === 'light' ? 'light' : 'dark')

export const subscribeTheme = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useTheme = () => useSyncExternalStore(subscribeTheme, getTheme)

const apply = theme => {
  root.dataset.theme = theme
  // Browser chrome (the mobile address bar) follows the page ground
  const ink = getComputedStyle(root).getPropertyValue('--color-ink').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ink)
  // Flushed so the navbar icon has already swapped when the transition below
  // captures the new state
  flushSync(() => listeners.forEach(listener => listener()))
}

// origin is the point the new theme grows out from (the toggle's centre);
// without one the circle starts at the top-right corner, where the toggle sits
export function setTheme(theme, origin) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Storage blocked: the switch still works, it just isn't remembered
  }

  const animate =
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!animate) return apply(theme)

  // Going to light, the new theme grows as a circle out of the toggle until it
  // reaches the farthest corner of the viewport; going to dark it runs in
  // reverse, the old theme shrinking back into the toggle. data-transition
  // switches off the post-opening animation in index.css so only this clip
  // runs, and spins the toggle's icon.
  const x = origin?.x ?? innerWidth
  const y = origin?.y ?? 0
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const grow = theme === 'light'
  const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]

  root.dataset.transition = grow ? 'theme' : 'theme-reverse'
  const transition = document.startViewTransition(() => apply(theme))
  let clip
  transition.ready.then(() => {
    clip = root.animate(
      { clipPath: grow ? clipPath : clipPath.reverse() },
      {
        duration: 650,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        // Holds the final clip until the transition tears down; otherwise the
        // shrunk light snapshot springs back to full size for a frame on top.
        // Cancelled below once it's done, or the held clip would carry over
        // to the next switch's snapshots.
        fill: 'forwards',
        pseudoElement: grow ? '::view-transition-new(root)' : '::view-transition-old(root)',
      }
    )
  })
  transition.finished.finally(() => {
    clip?.cancel()
    delete root.dataset.transition
  })
}

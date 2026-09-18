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

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Storage blocked: the switch still works, it just isn't remembered
  }

  const animate =
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!animate) return apply(theme)

  // Crossfades the whole page; data-transition picks the theme animation over
  // the post-opening one in index.css
  root.dataset.transition = 'theme'
  document
    .startViewTransition(() => apply(theme))
    .finished.finally(() => delete root.dataset.transition)
}

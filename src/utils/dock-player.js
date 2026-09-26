import { useSyncExternalStore } from 'react'

// Hands a post's read-aloud controls to the dock. While a post is being read
// and its own player has scrolled out of sight, ReadAloud publishes
// { state, toggle, stop } here and the dock shows pause/resume and stop. It
// publishes null again when the player is back in view, the reading stops or
// finishes, or the post is left.

let player = null
const listeners = new Set()

const subscribe = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const setDockPlayer = next => {
  if (next === player) return
  player = next
  listeners.forEach(listener => listener())
}

export const useDockPlayer = () => useSyncExternalStore(subscribe, () => player)

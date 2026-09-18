import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

// Opening a post runs through the browser's View Transitions API: the cover on
// the blog front page and the cover on the post share a view-transition-name,
// so the browser morphs one into the other while the rest of the page fades.
// React Router only wires this up for data routers, and the app uses
// <BrowserRouter>, so the navigation is started here by hand.

// view-transition-name has to be a CSS ident, and a slug can start with a digit
export const coverTransitionName = slug => `post-cover-${slug.replace(/[^a-zA-Z0-9_-]/g, '-')}`

// BlogPost is a lazy route, so the first frame after navigating can still be
// the Suspense fallback. The transition's new state is only captured once the
// promise returned from its callback settles, so wait for the article to mount.
// Rendering is paused mid-transition, which rules out requestAnimationFrame.
const whenMounted = (selector, timeout = 1500) =>
  new Promise(resolve => {
    if (document.querySelector(selector)) return resolve()

    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) return
      finish()
    })
    const timer = setTimeout(() => finish(), timeout)
    const finish = () => {
      observer.disconnect()
      clearTimeout(timer)
      resolve()
    }

    observer.observe(document.body, { childList: true, subtree: true })
  })

const isPlainClick = event =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey

// Returns a click handler for a <Link> to a post. Anything it declines to
// handle (new-tab clicks, reduced motion, browsers without the API) falls
// through to the Link's ordinary navigation.
export function useOpenPost() {
  const navigate = useNavigate()

  return useCallback(
    (event, slug) => {
      if (!isPlainClick(event)) return
      if (typeof document.startViewTransition !== 'function') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      event.preventDefault()
      document.startViewTransition(async () => {
        flushSync(() => navigate(`/blog/${slug}`))
        await whenMounted(`[data-post="${CSS.escape(slug)}"]`)
        // Land at the top of the post before the new state is captured
        window.scrollTo(0, 0)
      })
    },
    [navigate],
  )
}

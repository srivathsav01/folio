import { useEffect } from 'react'
import { PAGE, PAGE_TITLE } from './page-styles'

export default function Blog() {
  // Standalone route: it isn't part of the one-page scroll, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className={PAGE}>
      <h1 className={PAGE_TITLE}>Blog</h1>
    </main>
  )
}

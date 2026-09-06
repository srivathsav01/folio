import { useEffect } from 'react'
import './pages.css'

export default function Blog() {
  // Standalone route: it isn't part of the one-page scroll, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="page">
      <h1 className="page-title">Blog</h1>
    </main>
  )
}

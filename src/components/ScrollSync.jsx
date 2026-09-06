import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Route <-> section mapping. Order matters: used for scroll-spy.
const SECTIONS = [
  { path: '/', id: 'home' },
  { path: '/experience', id: 'experience' },
  { path: '/projects', id: 'projects' },
  { path: '/skills', id: 'skills' },
]

export default function ScrollSync() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const currentPath = useRef(pathname)
  const mounted = useRef(false)
  // While a programmatic scroll is in flight, ignore scroll-driven route updates
  const lockUntil = useRef(0)

  // Route change -> scroll to the matching section
  useEffect(() => {
    if (mounted.current && pathname === currentPath.current) return
    currentPath.current = pathname

    const section = SECTIONS.find(s => s.path === pathname)
    const el = section && document.getElementById(section.id)
    if (!el) return

    const behavior = mounted.current ? 'smooth' : 'auto'
    mounted.current = true
    lockUntil.current = performance.now() + (behavior === 'smooth' ? 1000 : 100)
    el.scrollIntoView({ behavior, block: 'start' })
  }, [pathname])

  // Scroll -> route (scroll spy)
  useEffect(() => {
    let rafId = null

    const sync = () => {
      rafId = null
      if (performance.now() < lockUntil.current) return

      const marker = window.innerHeight * 0.4
      let active = SECTIONS[0]
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id)
        if (el && el.getBoundingClientRect().top <= marker) active = section
      }

      // Bottom of the page always resolves to the last section
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        active = SECTIONS[SECTIONS.length - 1]
      }

      if (active.path !== currentPath.current) {
        currentPath.current = active.path
        navigate(active.path, { replace: true })
      }
    }

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(sync)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [navigate])

  return null
}

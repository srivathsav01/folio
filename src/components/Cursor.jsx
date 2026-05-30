import { useEffect, useRef } from 'react'
import './Cursor.css'

export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    // Start at centre so the dot doesn't flash at (0, 0)
    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx, ry = my
    let rafId

    const isLarge = () => window.innerWidth >= 768

    const onMove = e => {
      if (!isLarge()) return
      mx = e.clientX; my = e.clientY
      dot.style.left = mx + 'px'
      dot.style.top  = my + 'px'
    }
    document.addEventListener('mousemove', onMove)

    const animRing = () => {
      if (isLarge()) {
        rx += (mx - rx) * 0.12
        ry += (my - ry) * 0.12
        ring.style.left = rx + 'px'
        ring.style.top  = ry + 'px'
      }
      rafId = requestAnimationFrame(animRing)
    }
    rafId = requestAnimationFrame(animRing)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  )
}

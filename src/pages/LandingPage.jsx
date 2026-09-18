import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json'

import { NAME, ROLE, STACK, LOCATION_NOTE } from '../site'
import { subscribeTheme } from '../utils/theme'

export default function LandingPage() {
  const canvasRef = useRef(null)
  // Drives the staggered hero entrance, replacing the old body.loaded class
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 200)

    const canvas = canvasRef.current
    const w = window.innerWidth
    const h = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
    camera.position.z = 7

    const font = new FontLoader().parse(fontData)
    const textGeo = new TextGeometry(NAME.charAt(0).toUpperCase() || 'S', {
      font,
      size: 3,
      depth: 0.6,
      curveSegments: 5,
    })
    textGeo.computeBoundingBox()
    textGeo.center()

    const wireGeo = new THREE.WireframeGeometry(textGeo)
    const wireMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.8 })
    const mesh = new THREE.LineSegments(wireGeo, wireMat)
    scene.add(mesh)

    // Read the ground and line colours from the theme tokens rather than
    // repeating the hex, so the canvas can never drift from the CSS background
    // behind every other section — a mismatch of even one step is visible. Runs
    // again whenever the theme is switched.
    const paint = () => {
      const tokens = getComputedStyle(document.documentElement)
      const ink = tokens.getPropertyValue('--color-ink').trim()
      const cream = tokens.getPropertyValue('--color-cream').trim()
      renderer.setClearColor(new THREE.Color(ink || '#0a0a0a'), 1)
      wireMat.color.set(cream || '#f0ede6')
    }
    paint()
    const unsubscribeTheme = subscribeTheme(paint)

    // Responsive scale: maps viewport width to a 0.45–1.0 scale range
    const computeScale = () => Math.max(0.45, Math.min(1.0, window.innerWidth / 1200))
    mesh.scale.setScalar(computeScale())

    // Pointer events cover mouse, touch and pen with one code path. The canvas
    // has touch-action: pan-y, so vertical swipes still scroll the page while
    // horizontal drags rotate the letter.
    const TAP_MAX_MOVE = 8 // px
    const TAP_MAX_MS = 250
    const SPIN_MS = 900

    let activePointer = null
    let isDragging = false
    let prevX = 0
    let downX = 0
    let downTime = 0
    let velocityY = 0
    // Tap spin: a full turn layered on top of the base rotation, eased out so
    // the letter lands exactly where it started
    let spinStart = null
    let spinOffset = 0

    const onPointerDown = e => {
      if (activePointer !== null) return
      activePointer = e.pointerId
      isDragging = true
      prevX = downX = e.clientX
      downTime = performance.now()
      velocityY = 0
    }
    const onPointerMove = e => {
      if (!isDragging || e.pointerId !== activePointer) return
      const dx = e.clientX - prevX
      velocityY = dx * 0.012
      mesh.rotation.y += velocityY
      prevX = e.clientX
    }
    const onPointerUp = e => {
      if (e.pointerId !== activePointer) return
      const isTap =
        e.type === 'pointerup' &&
        Math.abs(e.clientX - downX) < TAP_MAX_MOVE &&
        performance.now() - downTime < TAP_MAX_MS
      if (isTap) {
        velocityY = 0
        spinStart = performance.now()
      }
      activePointer = null
      isDragging = false
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    let threeRafId
    let startTime = performance.now()

    const animate = () => {
      threeRafId = requestAnimationFrame(animate)
      const t = (performance.now() - startTime) / 1000

      if (isDragging) {
        velocityY *= 0.85
      } else {
        if (Math.abs(velocityY) > 0.0005) {
          mesh.rotation.y += velocityY
          velocityY *= 0.92
        } else {
          velocityY = 0
          mesh.rotation.y += 0.004
        }
      }

      // Remove last frame's spin offset before applying this frame's
      mesh.rotation.y -= spinOffset
      spinOffset = 0
      if (spinStart !== null) {
        const p = Math.min(1, (performance.now() - spinStart) / SPIN_MS)
        if (p < 1) spinOffset = (1 - Math.pow(1 - p, 3)) * Math.PI * 2
        else spinStart = null
      }
      mesh.rotation.y += spinOffset

      mesh.rotation.x = Math.sin(t * 0.4) * 0.15

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = window.innerWidth, nh = window.innerHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
      mesh.scale.setScalar(computeScale())
    }
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(timer)
      unsubscribeTheme()

      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('resize', onResize)

      cancelAnimationFrame(threeRafId)
      renderer.dispose()
      textGeo.dispose()
      wireGeo.dispose()
      wireMat.dispose()
    }
  }, [])

  const rise = (delay, distance) =>
    `transition-[opacity,translate] duration-1000 ease-out-expo ${delay} ${
      loaded ? 'translate-y-0 opacity-100' : `${distance} opacity-0`
    }`

  return (
    <div id="home" className="h-screen shrink-0 overflow-hidden bg-ink">
      <div className="relative h-screen w-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block size-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        />

        <div className="absolute bottom-22 left-6 z-[2] md:bottom-16 md:left-12">
          <div
            className={`mb-2 flex max-w-[27ch] justify-start text-left font-mono text-[0.85rem] tracking-[0.3em] text-cream/40 uppercase md:mb-[1.2rem] md:max-w-none ${rise('delay-300', 'translate-y-5')}`}
          >
            {ROLE}
          </div>

          <h1
            className={`m-0 flex justify-start font-serif text-[clamp(3.4rem,5.5vw,4.5rem)] leading-[0.95] font-normal tracking-[-0.02em] text-cream italic ${rise('delay-500', 'translate-y-10')} duration-[1200ms]`}
          >
            {NAME}
          </h1>

          <p
            className={`flex max-w-[32ch] font-mono text-[0.75rem] leading-relaxed tracking-[0.08em] text-cream/55 md:text-[0.82rem] ${rise('delay-700', 'translate-y-5')}`}
          >
            {STACK}
          </p>
          {LOCATION_NOTE && (
            <p
              className={`flex max-w-[32ch] font-mono text-[0.75rem] leading-relaxed tracking-[0.08em] text-cream/55 md:text-[0.82rem] ${rise('delay-700', 'translate-y-5')}`}
            >
              {LOCATION_NOTE}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

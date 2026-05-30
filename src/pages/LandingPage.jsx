import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json'
import './LandingPage.css'

export default function LandingPage() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => document.body.classList.add('loaded'), 200)

    const canvas = canvasRef.current
    const w = window.innerWidth
    const h = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x0a0a0a, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
    camera.position.z = 7

    const font = new FontLoader().parse(fontData)
    const textGeo = new TextGeometry('S', {
      font,
      size: 3,
      depth: 0.6,
      curveSegments: 5,
    })
    textGeo.computeBoundingBox()
    textGeo.center()

    const wireGeo = new THREE.WireframeGeometry(textGeo)
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xf0ede6,
      transparent: true,
      opacity: 0.8,
    })
    const mesh = new THREE.LineSegments(wireGeo, wireMat)
    scene.add(mesh)

    // Responsive scale: maps viewport width to a 0.45–1.0 scale range
    const computeScale = () => Math.max(0.45, Math.min(1.0, window.innerWidth / 1200))
    mesh.scale.setScalar(computeScale())

    // Interaction only on screens wider than 768 px
    const isLargeScreen = () => window.innerWidth >= 768

    let isDragging = false
    let prevX = 0
    let velocityY = 0

    const onMouseDown = e => {
      if (!isLargeScreen()) return
      isDragging = true; prevX = e.clientX; velocityY = 0
    }
    const onMouseUp   = () => { isDragging = false }
    const onMouseMove = e => {
      if (!isDragging || !isLargeScreen()) return
      const dx = e.clientX - prevX
      velocityY = dx * 0.012
      mesh.rotation.y += velocityY
      prevX = e.clientX
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    let threeRafId
    let startTime = performance.now()

    const animate = () => {
      threeRafId = requestAnimationFrame(animate)
      const t = (performance.now() - startTime) / 1000

      if (isDragging && isLargeScreen()) {
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
      document.body.classList.remove('loaded')

      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)

      cancelAnimationFrame(threeRafId)
      renderer.dispose()
      textGeo.dispose()
      wireGeo.dispose()
      wireMat.dispose()
    }
  }, [])

  return (
    <>
      <div className="landing-page">
        <div className="hero-cover">
          <canvas ref={canvasRef} className="hero-canvas" />
          <div className="hero-name">
            <div className="hero-label">Portfolio · Software Developer</div>
            <h1 className="hero-title">Srivathsav</h1>
          </div>
        </div>
      </div>
    </>
  )
}

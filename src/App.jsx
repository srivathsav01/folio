import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dock from './components/Dock'
// import Cursor from './components/Cursor'
import Footer from './components/Footer'
import ScrollSync from './components/ScrollSync'
import LandingPage from './pages/LandingPage'
import Experience from './pages/Experience'
import Projects from './pages/Projects'
import Skills from './pages/Skills'
import { SHOW_BLOG } from './site'

const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))

// The stacked one-page scroll: /, /experience, /projects and /skills all live here
function ScrollHome() {
  return (
    <>
      <ScrollSync />
      <LandingPage />
      <Experience />
      <Projects />
      <Skills />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* <Cursor /> */}
      <Navbar />
      <Dock />
      <Suspense fallback={<div className="min-h-screen bg-ink" />}>
        <Routes>
          {SHOW_BLOG && <Route path="/blog" element={<Blog />} />}
          {SHOW_BLOG && <Route path="/blog/:slug" element={<BlogPost />} />}
          <Route path="*" element={<ScrollHome />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  )
}

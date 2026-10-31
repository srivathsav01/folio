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
import OpenSource from './pages/OpenSource'
import Skills from './pages/Skills'
import { SHOW_BLOG } from './site'

const loadBlog = () => import('./pages/Blog')
const Blog = lazy(loadBlog)
const BlogPost = lazy(() => import('./pages/BlogPost'))

// Fetch the blog chunk once the first screen has settled, so the dock's Blog
// link rarely has to wait on the network
if (SHOW_BLOG) {
  const idle = window.requestIdleCallback ?? (cb => setTimeout(cb, 2000))
  window.addEventListener('load', () => idle(() => loadBlog()), { once: true })
}

// The stacked one-page scroll: /, /experience, /projects, /open-source and
// /skills all live here
function ScrollHome() {
  return (
    <>
      <ScrollSync />
      <LandingPage />
      <Experience />
      <Projects />
      <OpenSource />
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

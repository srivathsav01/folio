import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dock from './components/Dock'
import Cursor from './components/Cursor'
import Footer from './components/Footer'
import ScrollSync from './components/ScrollSync'
import LandingPage from './pages/LandingPage'
import Experience from './pages/Experience'
import Projects from './pages/Projects'
import Skills from './pages/Skills'
import Blog from './pages/Blog'
import './App.css'

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
    <BrowserRouter>
      <Cursor />
      <Navbar />
      <Dock />
      <Routes>
        <Route path="/blog" element={<Blog />} />
        <Route path="*" element={<ScrollHome />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

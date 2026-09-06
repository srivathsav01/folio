import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dock from './components/Dock'
import Cursor from './components/Cursor'
import ScrollSync from './components/ScrollSync'
import LandingPage from './pages/LandingPage'
import About from './pages/About'
import Work from './pages/Work'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import './App.css'

// The stacked one-page scroll: /, /about, /work and /contact all live here
function ScrollHome() {
  return (
    <>
      <ScrollSync />
      <LandingPage />
      <About />
      <Work />
      <Contact />
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
    </BrowserRouter>
  )
}

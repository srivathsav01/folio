import { NavLink } from 'react-router-dom'
import './Dock.css'

const icon = {
  about: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  work: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12h18" />
    </>
  ),
  contact: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  blog: (
    <>
      <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4v5h5" />
      <path d="M8 13h7M8 17h5" />
    </>
  ),
}

// `scroll: false` keeps Blog out of the stacked one-page scroll
const ITEMS = [
  { to: '/about', label: 'About', glyph: 'about', scroll: true },
  { to: '/work', label: 'Work', glyph: 'work', scroll: true },
  { to: '/contact', label: 'Contact', glyph: 'contact', scroll: true },
  { to: '/blog', label: 'Blog', glyph: 'blog', scroll: false },
]

function DockItem({ item }) {
  return (
    <NavLink to={item.to} className="dock-item" aria-label={item.label}>
      <svg
        className="dock-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {icon[item.glyph]}
      </svg>
      <span className="dock-label">{item.label}</span>
    </NavLink>
  )
}

export default function Dock() {
  const scrollItems = ITEMS.filter(i => i.scroll)
  const asideItems = ITEMS.filter(i => !i.scroll)

  return (
    <nav className="dock">
      {scrollItems.map(item => (
        <DockItem key={item.to} item={item} />
      ))}
      <span className="dock-divider" />
      {asideItems.map(item => (
        <DockItem key={item.to} item={item} />
      ))}
    </nav>
  )
}

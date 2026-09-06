import { NavLink } from 'react-router-dom'
import './Dock.css'

const icon = {
  experience: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12h18" />
    </>
  ),
  projects: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  skills: (
    <>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 5-3 14" />
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
  { to: '/experience', label: 'Experience', glyph: 'experience', scroll: true },
  { to: '/projects', label: 'Projects', glyph: 'projects', scroll: true },
  { to: '/skills', label: 'Skills', glyph: 'skills', scroll: true },
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

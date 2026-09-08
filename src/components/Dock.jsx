import { NavLink } from 'react-router-dom'
import { Briefcase, CodeXml, FileText, LayoutGrid } from 'lucide-react'
import { OPEN_TO_WORK, OPEN_TO_WORK_LABEL, SHOW_BLOG } from '../site'

// `scroll: false` keeps Blog out of the stacked one-page scroll
const ITEMS = [
  { to: '/experience', label: 'Experience', Icon: Briefcase, scroll: true },
  { to: '/projects', label: 'Projects', Icon: LayoutGrid, scroll: true },
  { to: '/skills', label: 'Skills', Icon: CodeXml, scroll: true },
  { to: '/blog', label: 'Blog', Icon: FileText, scroll: false },
]

// The 0fr -> 1fr grid track animates to the label's real width, so the reveal
// runs the full duration instead of snapping once a fixed width is reached.
const LABEL_SHELL =
  'grid transition-[grid-template-columns,margin-left,opacity] duration-[450ms] ease-out-expo motion-reduce:transition-none'
const LABEL_TEXT =
  'min-w-0 overflow-hidden font-mono text-[0.6rem] tracking-[0.14em] whitespace-nowrap uppercase'

// Labels stay collapsed below md: on a phone the dock has no room to expand
// without crowding the icons, so it stays icon-only there.
const LABEL_HIDDEN = 'ml-0 grid-cols-[0fr] opacity-0'
const LABEL_SHOWN = 'md:ml-[0.4rem] md:grid-cols-[1fr] md:opacity-100'

function DockItem({ item }) {
  const { Icon } = item

  return (
    <NavLink
      to={item.to}
      aria-label={item.label}
      className={({ isActive }) =>
        `flex h-[1.9rem] items-center rounded-[0.65rem] px-[0.45rem] text-cream no-underline transition-colors duration-[250ms] md:h-8 md:px-2 ${
          isActive ? 'bg-cream/15' : 'hover:bg-cream/10'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`size-[1.05rem] shrink-0 transition-opacity duration-[250ms] ${
              isActive ? 'opacity-100' : 'opacity-60'
            }`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span
            className={`${LABEL_SHELL} ${LABEL_HIDDEN} ${isActive ? LABEL_SHOWN : ''}`}
          >
            <span className={LABEL_TEXT}>{item.label}</span>
          </span>
        </>
      )}
    </NavLink>
  )
}

const Divider = () => (
  <span className="mx-[0.25rem] my-[0.3rem] w-px self-stretch bg-cream/15" />
)

export default function Dock() {
  const visible = ITEMS.filter(i => i.scroll || SHOW_BLOG)
  const scrollItems = visible.filter(i => i.scroll)
  const asideItems = visible.filter(i => !i.scroll)

  return (
    <nav className="fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom,0px))] left-1/2 z-[100] flex -translate-x-1/2 items-center gap-[0.15rem] rounded-[0.95rem] border border-cream/15 bg-cream/[0.07] p-[0.3rem] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(240,237,230,0.14)] backdrop-blur-[24px] backdrop-saturate-[180%] md:bottom-[calc(1.5rem_+_env(safe-area-inset-bottom,0px))]">
      {scrollItems.map(item => (
        <DockItem key={item.to} item={item} />
      ))}

      {asideItems.length > 0 && <Divider />}
      {asideItems.map(item => (
        <DockItem key={item.to} item={item} />
      ))}

      {OPEN_TO_WORK && (
        <>
          <Divider />
          <div
            title={OPEN_TO_WORK_LABEL}
            className="group flex h-[1.9rem] cursor-default items-center rounded-[0.65rem] px-[0.5rem] text-cream transition-colors duration-[250ms] hover:bg-cream/10 md:h-8 md:px-[0.55rem]"
          >
            <span
              aria-hidden="true"
              className="relative size-2 shrink-0 rounded-full bg-signal shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]"
            >
              <span className="absolute inset-0 animate-beacon rounded-full bg-signal opacity-75 motion-reduce:animate-none" />
            </span>
            <span
              className={`${LABEL_SHELL} ${LABEL_HIDDEN} md:group-hover:ml-[0.45rem] md:group-hover:grid-cols-[1fr] md:group-hover:opacity-100`}
            >
              <span className={LABEL_TEXT}>{OPEN_TO_WORK_LABEL}</span>
            </span>
          </div>
        </>
      )}
    </nav>
  )
}

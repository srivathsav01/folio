import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Briefcase, CodeXml, FileText, LayoutGrid, Pause, Play, Square } from 'lucide-react'
import { OPEN_TO_WORK, OPEN_TO_WORK_LABEL, SHOW_BLOG } from '../site'
import { useDockPlayer } from '../utils/dock-player'

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

// Hover tooltip, drawn from data-tip and floated above the dock. Hidden below
// md, where there is no hover to speak of.
const TOOLTIP = [
  'after:pointer-events-none after:absolute after:bottom-full after:left-1/2 after:mb-2',
  'after:-translate-x-1/2 after:translate-y-[3px] after:rounded-md after:border',
  'after:border-cream/15 after:bg-ink/95 after:px-2 after:py-1 after:font-mono',
  'after:text-[0.55rem] after:tracking-[0.14em] after:whitespace-nowrap after:uppercase',
  'after:text-cream after:opacity-0 after:transition after:duration-[250ms]',
  'after:content-[attr(data-tip)] hover:after:translate-y-0 hover:after:opacity-100',
  'max-md:after:hidden',
].join(' ')

function DockItem({ item }) {
  const { Icon } = item

  return (
    <NavLink
      to={item.to}
      aria-label={item.label}
      data-tip={item.label}
      className={({ isActive }) =>
        `relative flex h-[1.9rem] items-center rounded-[0.65rem] px-[0.45rem] text-cream no-underline transition-colors duration-[250ms] md:h-8 md:px-2 ${TOOLTIP} ${
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

const CONTROL = [
  'relative flex h-[1.9rem] items-center rounded-[0.65rem] px-[0.45rem] text-cream transition-colors duration-[250ms] hover:bg-cream/10 md:h-8 md:px-2',
  'focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-cream/60',
  TOOLTIP,
].join(' ')

// A post's pause and stop, here while the post is being read and its own
// player is scrolled out of sight (see src/utils/dock-player.js). Clipped
// while it slides open, then unclipped so the tooltips can rise above it.
function ListeningControls() {
  const player = useDockPlayer()
  const reduceMotion = useReducedMotion()
  const playing = player?.state === 'playing'
  const toggleLabel = playing ? 'Pause reading' : 'Resume reading'
  const ToggleIcon = playing ? Pause : Play

  return (
    <AnimatePresence initial={false}>
      {player && (
        <motion.div
          key="listening"
          role="group"
          aria-label="Read aloud"
          className="flex items-center gap-[0.15rem] self-stretch"
          style={{ overflow: 'hidden' }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
          exit={{ width: 0, opacity: 0, overflow: 'hidden' }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Divider />
          <button
            type="button"
            className={CONTROL}
            aria-label={toggleLabel}
            data-tip={toggleLabel}
            onClick={player.toggle}
          >
            <ToggleIcon
              className={`size-[1.05rem] shrink-0 ${playing ? 'text-signal' : 'opacity-60'}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className={CONTROL}
            aria-label="Stop reading"
            data-tip="Stop reading"
            onClick={player.stop}
          >
            <Square className="size-[0.95rem] shrink-0 opacity-60" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Dock() {
  const visible = ITEMS.filter(i => i.scroll || SHOW_BLOG)
  const scrollItems = visible.filter(i => i.scroll)
  const asideItems = visible.filter(i => !i.scroll)

  return (
    <nav className="fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom,0px))] left-1/2 z-[100] flex -translate-x-1/2 items-center gap-[0.15rem] rounded-[0.95rem] border border-cream/15 bg-cream/[0.07] p-[0.3rem] shadow-[0_8px_32px_color-mix(in_oklab,var(--color-shade)_50%,transparent),inset_0_1px_0_rgba(240,237,230,0.14)] backdrop-blur-[24px] backdrop-saturate-[180%] md:bottom-[calc(1.5rem_+_env(safe-area-inset-bottom,0px))]">
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

      <ListeningControls />
    </nav>
  )
}

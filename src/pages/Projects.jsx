import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SkillPill from '../components/SkillPill'
import Logomark from '../components/Logomark'
import { GithubIcon } from '../components/icons'
import { getSkill } from '../utils/skill-icons'
import { getCompany } from '../utils/experience'
import { projects } from '../utils/projects'
import { NAME } from '../site'
import { PAGE, PAGE_TITLE } from './page-styles'

// The site's shared reveal curve, in the tuple form framer-motion wants
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

// Milliseconds per character in the `cat` command that heads the readme pane
const TYPE_SPEED = 26

const FILTERS = [
  { id: 'all', flag: '--all' },
  { id: 'personal', flag: '--personal' },
  { id: 'work', flag: '--work' },
]

const listFor = id => (id === 'all' ? projects : projects.filter(p => p.kind === id))

// Shell-style prompt label for the window bar
const HOST = `${NAME.toLowerCase()}@folio`

// Work entries are labelled by their employer, personal ones by the kind itself
const sourceLabel = project => {
  const company = project.kind === 'work' ? getCompany(project.companyId) : null
  return company ? company.name.toLowerCase() : 'personal'
}

const Prompt = () => <span className="text-signal-soft/70">$</span>

const Caret = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`inline-block h-[0.9em] w-[0.45em] translate-y-[0.1em] animate-caret bg-cream/70 motion-reduce:animate-none ${className}`}
  />
)

// Reveals `text` one character at a time, and hands back how long that will take
// so the readme underneath can wait its turn. The readme is keyed by project id,
// so this remounts — and the count restarts — on every selection.
const useTypedText = (text, reduceMotion) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduceMotion) return

    let index = 0
    const id = setInterval(() => {
      index += 1
      setCount(index)
      if (index >= text.length) clearInterval(id)
    }, TYPE_SPEED)

    return () => clearInterval(id)
  }, [text, reduceMotion])

  const typed = reduceMotion ? text : text.slice(0, count)

  return {
    typed,
    done: typed.length >= text.length,
    duration: reduceMotion ? 0 : (text.length * TYPE_SPEED) / 1000,
  }
}

const Listing = ({ filter, onFilter, activeId, onSelect, visible }) => {
  const onKeyDown = event => {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const at = visible.findIndex(p => p.id === activeId)
    onSelect(visible[(at + step + visible.length) % visible.length].id)
  }

  return (
    <div className="border-b border-cream/10 p-4 md:border-r md:border-b-0 md:p-5">
      {/* The filters read as flags on the ls command rather than as UI chrome */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.72rem]">
        <Prompt />
        <span className="text-cream/70">ls</span>
        {FILTERS.map(({ id, flag }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => onFilter(id)}
            className={`cursor-pointer border-none bg-transparent p-0 transition-colors duration-[250ms] ${
              filter === id
                ? 'text-cream underline decoration-cream/30 underline-offset-4'
                : 'text-cream/25 hover:text-cream/60'
            }`}
          >
            {flag}
          </button>
        ))}
      </div>

      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Projects"
        onKeyDown={onKeyDown}
        className="mt-4 flex flex-col gap-0.5"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map(project => {
            const isActive = project.id === activeId
            const company = project.kind === 'work' ? getCompany(project.companyId) : null

            return (
              <motion.button
                key={project.id}
                layout={false}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                type="button"
                role="tab"
                id={`project-tab-${project.id}`}
                aria-selected={isActive}
                aria-controls={`project-readme-${project.id}`}
                onClick={() => onSelect(project.id)}
                title={`${project.id}/`}
                className={`group flex cursor-pointer items-center gap-2 rounded-md border-none px-2 py-1.5 text-left font-mono text-[0.72rem] transition-colors duration-[250ms] ${
                  isActive
                    ? 'bg-cream/[0.09] text-cream'
                    : 'bg-transparent text-cream/40 hover:bg-cream/[0.04] hover:text-cream/70'
                }`}
              >
                <span className={`w-2 shrink-0 ${isActive ? 'text-signal-soft' : 'text-transparent'}`}>
                  ▸
                </span>
                <span className="truncate">{project.id}/</span>
                <span
                  className={`ml-auto shrink-0 tabular-nums ${isActive ? 'text-cream/40' : 'text-cream/20'}`}
                >
                  {project.year}
                </span>
                <Logomark
                  src={company?.logo}
                  alt={company ? `${company.name} logo` : ''}
                  fallback={NAME.charAt(0)}
                  title={company ? company.name : 'Personal project'}
                  className="size-4 rounded-[0.2rem]"
                  fallbackClassName="text-[0.5rem]"
                  padding="p-px"
                />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <p className="mt-4 font-mono text-[0.62rem] text-cream/20">
        {String(visible.length).padStart(2, '0')} {visible.length === 1 ? 'entry' : 'entries'}
      </p>
    </div>
  )
}

const Readme = ({ project, reduceMotion }) => {
  const command = `cat ${project.id}/README.md`
  const { typed, done, duration } = useTypedText(command, reduceMotion)

  const list = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: duration + 0.1 } },
  }
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
  }

  const links = [
    project.repo && { href: project.repo, label: 'repo', Icon: GithubIcon },
    project.live && { href: project.live, label: 'live', Icon: ArrowUpRight },
  ].filter(Boolean)

  return (
    <div
      id={`project-readme-${project.id}`}
      role="tabpanel"
      aria-labelledby={`project-tab-${project.id}`}
      className="p-5 md:p-7"
    >
      <p className="flex items-center gap-2 font-mono text-[0.72rem] text-cream/45">
        <Prompt />
        <span>
          {typed}
          {!done && <Caret className="ml-0.5" />}
        </span>
      </p>

      <motion.div variants={list} initial="hidden" animate="show" className="mt-6">
        <motion.h2 variants={item} className="font-mono text-[0.95rem] text-cream md:text-[1.05rem]">
          <span className="text-cream/25"># </span>
          {project.name}
        </motion.h2>

        <motion.p
          variants={item}
          className="mt-2 font-mono text-[0.62rem] tracking-[0.18em] text-cream/35 uppercase"
        >
          {project.year} · {sourceLabel(project)}
        </motion.p>

        {project.summary && (
          <motion.p
            variants={item}
            className="mt-5 max-w-[62ch] font-mono text-[0.78rem] leading-relaxed text-cream/60 italic"
          >
            <span className="text-cream/25">&gt; </span>
            {project.summary}
          </motion.p>
        )}

        <ul className="mt-5 flex flex-col gap-2.5">
          {project.bullets.map(bullet => (
            <motion.li
              key={bullet}
              variants={item}
              className="flex gap-2.5 font-mono text-[0.78rem] leading-relaxed text-cream/75"
            >
              <span aria-hidden="true" className="shrink-0 text-cream/25">
                -
              </span>
              <span className="max-w-[64ch]">{bullet}</span>
            </motion.li>
          ))}
        </ul>

        <motion.div variants={item} className="mt-7">
          <p className="font-mono text-[0.68rem] text-cream/25">
            # stack ({String(project.stack.length).padStart(2, '0')})
          </p>
          <div className="mt-3 flex flex-wrap gap-2 md:gap-3">
            {project.stack.map(name => {
              const skill = getSkill(name)
              return <SkillPill key={name} skillName={skill.name} icon={skill.icon} />
            })}
          </div>
        </motion.div>

        {/* Links are a personal-project affordance — work entries have nowhere public to point */}
        {links.length > 0 && (
          <motion.div variants={item} className="mt-7 flex flex-wrap gap-2 md:gap-3">
            {links.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-cream/10 bg-cream/[0.07] px-3 py-1.5 font-mono text-[0.72rem] text-cream/70 transition-colors duration-[250ms] hover:border-cream/25 hover:text-cream"
              >
                <Prompt />
                open {label}
                <Icon className="block size-3" aria-hidden="true" />
              </a>
            ))}
          </motion.div>
        )}

        <motion.p variants={item} className="mt-7 flex items-center gap-2 font-mono text-[0.72rem]">
          <Prompt />
          <Caret />
        </motion.p>
      </motion.div>
    </div>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('all')
  const [activeId, setActiveId] = useState(projects[0]?.id ?? null)
  const reduceMotion = useReducedMotion()

  const visible = useMemo(() => listFor(filter), [filter])
  const active = visible.find(p => p.id === activeId) ?? visible[0]

  // Switching flags re-runs ls, so the first entry of the new listing opens
  const onFilter = next => {
    setFilter(next)
    setActiveId(listFor(next)[0]?.id ?? null)
  }

  return (
    <section id="projects" className={PAGE}>
      <div className="w-full max-w-4xl">
        <h1 className={`${PAGE_TITLE} mb-10 md:mb-14`}>Projects</h1>

        <div className="overflow-hidden rounded-2xl border border-cream/12 bg-cream/[0.03]">
          {/* Window bar: monochrome lights, so it reads as a terminal without the costume */}
          <div className="flex items-center gap-3 border-b border-cream/10 bg-cream/[0.04] px-4 py-2.5">
            <span aria-hidden="true" className="flex shrink-0 gap-1.5">
              <span className="size-2 rounded-full bg-cream/20" />
              <span className="size-2 rounded-full bg-cream/15" />
              <span className="size-2 rounded-full bg-cream/10" />
            </span>
            <span className="mx-auto truncate font-mono text-[0.62rem] tracking-[0.14em] text-cream/35">
              {HOST}:~/projects
            </span>
            <span className="shrink-0 font-mono text-[0.62rem] text-cream/20 tabular-nums">
              {String(projects.length).padStart(2, '0')}
            </span>
          </div>

          <div className="grid md:min-h-[28rem] md:grid-cols-[minmax(0,16rem)_1fr]">
            <Listing
              filter={filter}
              onFilter={onFilter}
              activeId={active?.id}
              onSelect={setActiveId}
              visible={visible}
            />

            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                >
                  <Readme project={active} reduceMotion={reduceMotion} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

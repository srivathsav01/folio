import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import SkillPill from '../components/SkillPill'
import SectionRule from '../components/SectionRule'
import Logomark from '../components/Logomark'
import { getSkill } from '../utils/skill-icons'
import { companies } from '../utils/experience'
import { PAGE, PAGE_TITLE } from './page-styles'

// The site's shared reveal curve, in the tuple form framer-motion wants
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

const CompanyHeader = ({ company }) => (
  <div className="mb-8 md:mb-10">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <Logomark
        src={company.logo}
        alt={`${company.name} logo`}
        fallback={company.name.charAt(0)}
      />

      <div className="min-w-0">
        <h2 className="font-serif text-[1.5rem] leading-tight font-normal tracking-[-0.01em] text-cream italic md:text-[1.85rem]">
          {company.name}
        </h2>
        {company.location && (
          <p className="mt-1 font-mono text-[0.62rem] tracking-[0.18em] text-cream/40 uppercase">
            {company.location}
          </p>
        )}
      </div>

      <div className="ml-auto text-right font-mono text-[0.62rem] tracking-[0.14em] text-cream/40 uppercase">
        <p>{company.period}</p>
        {company.tenure && <p className="mt-1 text-cream/25">{company.tenure}</p>}
      </div>
    </div>

    <span className="mt-5 block h-px w-full bg-linear-to-r from-cream/15 to-transparent md:mt-6" />
  </div>
)

const RailNode = ({ role, isActive, isPast }) => (
  <span
    aria-hidden="true"
    className="relative mx-auto flex size-[0.6rem] items-center justify-center"
  >
    <span
      className={`size-full rounded-full transition-[background-color,box-shadow] duration-[400ms] ${
        role.current && isActive
          ? 'bg-signal shadow-[0_0_10px_2px_rgba(34,197,94,0.55)]'
          : isActive
            ? 'bg-cream shadow-[0_0_10px_2px_rgba(240,237,230,0.35)]'
            : isPast
              ? 'bg-cream/45'
              : 'bg-cream/20'
      }`}
    />
    {role.current && isActive && (
      <span className="absolute inset-0 animate-beacon rounded-full bg-signal opacity-75 motion-reduce:animate-none" />
    )}
    {/* Halo that only the selected node wears */}
    <span
      className={`absolute -inset-[0.3rem] rounded-full border transition-[opacity,transform] duration-[400ms] ease-out-expo ${
        isActive
          ? 'scale-100 border-cream/25 opacity-100'
          : 'scale-50 border-transparent opacity-0'
      }`}
    />
  </span>
)

// One station per role, a hairline between them, and a filled segment that grows
// to whichever station is selected.
const Rail = ({ companyName, roles, activeIndex, onSelect }) => {
  // Nodes sit centred in equal columns, so the first and last centres land half
  // a column in from each edge — that inset is where the line starts and ends.
  const inset = 50 / roles.length
  const span = 100 - inset * 2

  const onKeyDown = event => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    onSelect((activeIndex + step + roles.length) % roles.length)
  }

  return (
    <div className="relative mb-10 md:mb-14">
      {/* Both lines are pinned to the vertical centre of the 0.6rem nodes */}
      <span
        aria-hidden="true"
        className="absolute top-[0.3rem] h-px -translate-y-1/2 bg-cream/12"
        style={{ left: `${inset}%`, right: `${inset}%` }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute top-[0.3rem] h-px -translate-y-1/2 bg-linear-to-r from-cream/30 to-cream/60"
        style={{ left: `${inset}%` }}
        initial={false}
        animate={{ width: `${(span * activeIndex) / (roles.length - 1)}%` }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
      />

      <div
        role="tablist"
        aria-label={`${companyName} roles`}
        onKeyDown={onKeyDown}
        className="grid items-start gap-2"
        style={{ gridTemplateColumns: `repeat(${roles.length}, minmax(0, 1fr))` }}
      >
        {roles.map((role, index) => {
          const isActive = index === activeIndex

          return (
            <button
              key={role.id}
              type="button"
              role="tab"
              id={`role-tab-${role.id}`}
              aria-selected={isActive}
              aria-controls={`role-panel-${role.id}`}
              onClick={() => onSelect(index)}
              className="group flex cursor-pointer flex-col items-center gap-3 border-none bg-transparent p-0 text-center focus-visible:outline-none"
            >
              <RailNode role={role} isActive={isActive} isPast={index < activeIndex} />

              <span
                className={`font-mono text-[0.6rem] leading-relaxed tracking-[0.16em] text-balance uppercase transition-colors duration-[300ms] md:text-[0.62rem] ${
                  isActive
                    ? 'text-cream'
                    : 'text-cream/35 group-hover:text-cream/70 group-focus-visible:text-cream/70'
                }`}
              >
                {role.title}
              </span>

              <span
                className={`hidden font-mono text-[0.58rem] tracking-[0.1em] whitespace-nowrap transition-colors duration-[300ms] md:block ${
                  isActive ? 'text-cream/45' : 'text-cream/20'
                }`}
              >
                {role.period}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const RolePanel = ({ role, reduceMotion }) => {
  // Panel contents cascade in rather than all landing at once
  const list = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
  }
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
  }

  return (
    <motion.div
      id={`role-panel-${role.id}`}
      role="tabpanel"
      aria-labelledby={`role-tab-${role.id}`}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
    >
      <motion.div variants={list} initial="hidden" animate="show">
        <motion.h3
          variants={item}
          className="font-serif text-[clamp(1.75rem,4vw,2.6rem)] leading-tight font-normal tracking-[-0.01em] text-cream italic"
        >
          {role.title}
        </motion.h3>

        <motion.div
          variants={item}
          className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.62rem] tracking-[0.14em] text-cream/45 uppercase"
        >
          <span>{role.period}</span>
          <span className="text-cream/15">/</span>
          <span>{role.duration}</span>
          {role.current && (
            <>
              <span className="text-cream/15">/</span>
              <span className="text-signal-soft">Current</span>
            </>
          )}
        </motion.div>

        {role.summary && (
          <motion.p
            variants={item}
            className="mt-5 max-w-[52ch] font-serif text-[1.05rem] leading-relaxed text-cream/70 italic md:text-[1.15rem]"
          >
            {role.summary}
          </motion.p>
        )}

        <ul className="mt-6 flex flex-col gap-3 md:mt-7">
          {role.bullets.map((bullet, index) => (
            <motion.li
              key={bullet}
              variants={item}
              className="flex gap-3 text-[0.9rem] leading-relaxed text-cream/75 md:gap-4 md:text-[0.95rem]"
            >
              <span className="mt-[0.3rem] shrink-0 font-mono text-[0.6rem] text-cream/25 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="max-w-[62ch]">{bullet}</span>
            </motion.li>
          ))}
        </ul>

        <motion.div variants={item} className="mt-8 md:mt-10">
          <SectionRule label="Stack" count={role.stack.length} />
          <div className="flex flex-wrap gap-2 md:gap-3">
            {role.stack.map(name => {
              const skill = getSkill(name)
              return <SkillPill key={name} skillName={skill.name} icon={skill.icon} />
            })}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

const CompanyBlock = ({ company }) => {
  // Opens on the newest role — the one a visitor is most likely there for
  const [activeIndex, setActiveIndex] = useState(company.roles.length - 1)
  const reduceMotion = useReducedMotion()
  const role = company.roles[activeIndex]

  return (
    <article>
      <CompanyHeader company={company} />

      {/* A single-role company has nothing to climb, so the rail is skipped */}
      {company.roles.length > 1 && (
        <Rail
          companyName={company.name}
          roles={company.roles}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      )}

      {/* The min-height keeps the card from collapsing between role swaps,
          since AnimatePresence unmounts the old panel before the new one lands */}
      <div className="min-h-[26rem] rounded-2xl border border-cream/10 bg-cream/[0.035] p-6 md:min-h-[24rem] md:p-9">
        <AnimatePresence mode="wait">
          <RolePanel key={role.id} role={role} reduceMotion={reduceMotion} />
        </AnimatePresence>
      </div>
    </article>
  )
}

export default function Experience() {
  return (
    <section id="experience" className={PAGE}>
      <div className="w-full max-w-4xl">
        <h1 className={`${PAGE_TITLE} mb-10 md:mb-14`}>Experience</h1>

        <div className="flex flex-col gap-16 md:gap-24">
          {companies.map(company => (
            <CompanyBlock key={company.id} company={company} />
          ))}
        </div>
      </div>
    </section>
  )
}

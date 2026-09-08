import { motion } from 'framer-motion'
import { groupedSkills } from '../utils/skill-icons'
import { PAGE, PAGE_TITLE } from './page-styles'

// The icons arrive with mismatched (or missing) width/height attributes, so the
// wrapper forces every one of them to fill the same box.
const ICON_SLOT =
  'absolute inset-0 flex items-center justify-center [&_svg]:size-full'

const SkillPill = ({ skillName, icon }) => {
  return (
    <motion.div
      className="flex w-fit cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-cream/10 bg-cream/[0.07] px-3 py-1.5 text-sm text-cream md:px-4 md:py-2"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <div className="relative size-4 shrink-0 overflow-hidden md:size-6">
        <motion.span
          className={ICON_SLOT}
          variants={{
            rest: { y: 0, opacity: 1 },
            hover: { y: '-100%', opacity: 0 },
          }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {icon}
        </motion.span>

        <motion.span
          className={ICON_SLOT}
          variants={{
            rest: { y: '100%', opacity: 0 },
            hover: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {icon}
        </motion.span>
      </div>

      <span className="font-medium whitespace-nowrap">{skillName}</span>
    </motion.div>
  )
}

// Heading for one group: label, a hairline that eats the leftover width, and
// the count — so the four groups read as rows rather than one undifferentiated
// wall of pills.
const GroupHeading = ({ label, count }) => (
  <div className="mb-3 flex items-center gap-3">
    <span className="font-mono text-[0.6rem] tracking-[0.28em] text-cream/45 uppercase">
      {label}
    </span>
    <span className="h-px flex-1 bg-linear-to-r from-cream/15 to-transparent" />
    <span className="font-mono text-[0.6rem] text-cream/20 tabular-nums">
      {String(count).padStart(2, '0')}
    </span>
  </div>
)

export default function Skills() {
  return (
    <section id="skills" className={PAGE}>
      <div className="w-full max-w-4xl">
        <h1 className={`${PAGE_TITLE} mb-10 md:mb-14`}>Skills</h1>

        <div className="flex flex-col gap-7 md:gap-9">
          {groupedSkills.map(group => (
            <div key={group.id}>
              <GroupHeading label={group.label} count={group.items.length} />
              <div className="flex flex-wrap gap-2 md:gap-3">
                {group.items.map(skill => (
                  <SkillPill key={skill.name} skillName={skill.name} icon={skill.icon} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

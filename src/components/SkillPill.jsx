import { motion } from 'framer-motion'

// The icons arrive with mismatched (or missing) width/height attributes, so the
// wrapper forces every one of them to fill the same box.
const ICON_SLOT =
  'absolute inset-0 flex items-center justify-center [&_svg]:size-full'

// Two stacked copies of the icon: the resting one rolls up and out while the
// second rolls in from below, so the pill reads as a tiny flip-board.
export default function SkillPill({ skillName, icon }) {
  return (
    <motion.div
      className="flex w-fit cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-cream/10 bg-cream/[0.07] px-3 py-1.5 text-sm text-cream md:px-4 md:py-2"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {icon && (
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
      )}

      <span className="font-medium whitespace-nowrap">{skillName}</span>
    </motion.div>
  )
}

import { motion } from 'framer-motion'

// A small nudge for first-time visitors, telling them something nearby is
// clickable. Pages drop it once the visitor has used the control, so it never
// hardens into permanent furniture.
export default function HintBadge({
  icon: Icon,
  label,
  reduceMotion,
  nudge = { x: [0, -3, 0] },
  className = '',
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-cream/12 bg-cream/[0.06] px-2.5 py-1 font-mono text-[0.52rem] tracking-[0.16em] text-cream/45 uppercase ${className}`}
    >
      <motion.span
        className="flex"
        animate={reduceMotion ? {} : nudge}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="size-3" strokeWidth={1.7} aria-hidden="true" />
      </motion.span>
      {label}
    </motion.span>
  )
}

// Heading for one group: label, a hairline that eats the leftover width, and an
// optional count — so groups read as rows rather than one undifferentiated wall.
export default function SectionRule({ label, count }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-[0.6rem] tracking-[0.28em] text-cream/45 uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-linear-to-r from-cream/15 to-transparent" />
      {count !== undefined && (
        <span className="font-mono text-[0.6rem] text-cream/20 tabular-nums">
          {String(count).padStart(2, '0')}
        </span>
      )}
    </div>
  )
}

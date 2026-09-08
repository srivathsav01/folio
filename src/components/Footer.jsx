import { EMAIL, FOOTER_STATUS, OPEN_TO_WORK } from '../site'

export default function Footer() {
  const status = OPEN_TO_WORK ? FOOTER_STATUS : ''

  return (
    // Extra bottom room so the fixed dock never covers the content
    <footer className="flex shrink-0 flex-col items-start gap-4 border-t border-cream/10 bg-ink px-6 pt-8 pb-[6.5rem] font-mono text-[0.6rem] tracking-[0.12em] md:flex-row md:items-center md:justify-between md:gap-6 md:px-12 md:pt-10 md:pb-24 md:text-[0.65rem]">
      {status ? (
        <p className="m-0 flex items-center gap-[0.55rem] text-cream/55 uppercase">
          <span className="size-1.5 shrink-0 rounded-full bg-signal-soft shadow-[0_0_0_3px_rgba(124,217,146,0.15)]" />
          {status}
        </p>
      ) : (
        <span />
      )}
      {EMAIL && (
        <a
          className="border-b border-cream/25 pb-[2px] text-cream no-underline opacity-60 transition-opacity duration-[250ms] hover:opacity-100"
          href={`mailto:${EMAIL}`}
        >
          {EMAIL}
        </a>
      )}
    </footer>
  )
}

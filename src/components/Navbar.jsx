import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileDown, Mail } from 'lucide-react'
import Toast from './Toast'
import { GithubIcon, LinkedinIcon } from './icons'
import { GITHUB, LINKEDIN, RESUME, RESUME_FILENAME, EMAIL } from '../site'

// The label under each icon is drawn from data-tip via a ::after pseudo-element
const NAV_ACTION = [
  'relative flex cursor-pointer items-center justify-center border-none bg-transparent p-[0.35rem]',
  'text-cream opacity-55 transition-opacity duration-[250ms] hover:opacity-100',
  'after:pointer-events-none after:absolute after:top-full after:right-0 after:mt-[0.35rem]',
  'after:-translate-y-[3px] after:font-mono after:text-[0.55rem] after:tracking-[0.12em]',
  'after:whitespace-nowrap after:uppercase after:text-cream after:opacity-0',
  'after:transition after:duration-[250ms] after:content-[attr(data-tip)]',
  'hover:after:translate-y-0 hover:after:opacity-70 max-md:after:hidden',
].join(' ')

export default function Navbar() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (insecure context, denied permission) — fall back to the mail client
      window.location.href = `mailto:${EMAIL}`
    }
  }

  return (
    <nav className="fixed top-0 right-0 left-0 z-[100] flex items-center justify-between bg-ink p-6 md:px-12 md:py-8">
      <Link
        to="/"
        className="font-serif text-[0.85rem] tracking-[0.25em] text-cream uppercase no-underline opacity-90"
      >
        Portfolio
      </Link>

      <div className="flex items-center gap-[0.15rem] md:gap-[0.35rem]">
        {GITHUB && (
          <a
            className={NAV_ACTION}
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            data-tip="GitHub"
            aria-label="GitHub"
          >
            <GithubIcon />
          </a>
        )}
        {LINKEDIN && (
          <a
            className={NAV_ACTION}
            href={LINKEDIN}
            target="_blank"
            rel="noreferrer"
            data-tip="LinkedIn"
            aria-label="LinkedIn"
          >
            <LinkedinIcon />
          </a>
        )}
        {RESUME && (
          <a
            className={NAV_ACTION}
            href={RESUME}
            download={RESUME_FILENAME}
            data-tip="Resume"
            aria-label="Download resume"
          >
            <FileDown className="block size-4" strokeWidth={1.6} aria-hidden="true" />
          </a>
        )}
        {EMAIL && (
          <button
            type="button"
            className={`${NAV_ACTION}${copied ? ' opacity-100 after:translate-y-0 after:opacity-70' : ''}`}
            onClick={copyEmail}
            data-tip="Copy email"
            aria-label="Copy email address"
          >
            <Mail className="block size-4" strokeWidth={1.6} aria-hidden="true" />
          </button>
        )}
      </div>

      <Toast message="Copied to clipboard" visible={copied} />
    </nav>
  )
}

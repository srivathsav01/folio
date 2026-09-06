import { useState } from 'react'
import { Link } from 'react-router-dom'
import Toast from './Toast'
import { GITHUB, LINKEDIN, RESUME, EMAIL } from '../site'
import './Navbar.css'

const GithubIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
)

const ResumeIcon = () => (
  <svg
    className="nav-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M12 11v6" />
    <path d="m9.5 14.5 2.5 2.5 2.5-2.5" />
  </svg>
)

const MailIcon = () => (
  <svg
    className="nav-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
)

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
    <nav className="navbar">
      <Link to="/" className="nav-logo">Portfolio</Link>

      <div className="nav-actions">
        <a
          className="nav-action"
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          data-tip="GitHub"
          aria-label="GitHub"
        >
          <GithubIcon />
        </a>
        <a
          className="nav-action"
          href={LINKEDIN}
          target="_blank"
          rel="noreferrer"
          data-tip="LinkedIn"
          aria-label="LinkedIn"
        >
          <LinkedinIcon />
        </a>
        <a
          className="nav-action"
          href={RESUME}
          download="Srivathsav-Resume.pdf"
          data-tip="Resume"
          aria-label="Download resume"
        >
          <ResumeIcon />
        </a>
        <button
          type="button"
          className="nav-action"
          onClick={copyEmail}
          data-tip="Copy email"
          aria-label="Copy email address"
        >
          <MailIcon />
        </button>
      </div>

      <Toast message="Copied to clipboard" visible={copied} />
    </nav>
  )
}

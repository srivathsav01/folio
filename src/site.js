// Every configurable value in the site funnels through here, so hosting is a
// matter of editing .env (or setting the same keys in the host's dashboard)
// rather than hunting through components. See .env.example for the full list.
const env = import.meta.env

// Vite inlines env vars as strings, and an unset key comes back `undefined`
// while an empty line comes back `''` — both should fall back to the default.
const text = (value, fallback = '') => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || fallback
}

const flag = (value, fallback = false) => {
  const trimmed = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!trimmed) return fallback
  return trimmed === 'true' || trimmed === '1' || trimmed === 'yes'
}

// --- Identity ---------------------------------------------------------------
export const NAME = text(env.VITE_NAME, 'Srivathsav')
export const ROLE = text(env.VITE_ROLE, 'Full-Stack Software Engineer')
export const STACK = text(env.VITE_STACK, 'React + Java/Spring Boot')
export const LOCATION_NOTE = text(env.VITE_LOCATION_NOTE)

// --- Links ------------------------------------------------------------------
// An empty URL is a deliberate "hide this link" signal, so no fallbacks here.
export const GITHUB = text(env.VITE_GITHUB_URL)
export const LINKEDIN = text(env.VITE_LINKEDIN_URL)
export const EMAIL = text(env.VITE_EMAIL)
export const RESUME = text(env.VITE_RESUME_URL)
export const RESUME_FILENAME = text(env.VITE_RESUME_FILENAME, 'resume.pdf')

// --- Availability -----------------------------------------------------------
export const OPEN_TO_WORK = flag(env.VITE_OPEN_TO_WORK, true)
export const OPEN_TO_WORK_LABEL = text(env.VITE_OPEN_TO_WORK_LABEL, 'Open to work')
export const FOOTER_STATUS = text(env.VITE_FOOTER_STATUS)

// --- Sections ---------------------------------------------------------------
export const SHOW_BLOG = flag(env.VITE_SHOW_BLOG, true)

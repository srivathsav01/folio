




// Every company you have worked at, and the roles you held inside each one.
// Filling this in never means touching the layout.
//
// Companies are listed newest first — that is the order they appear on the page.
// Roles inside a company go oldest -> newest, because the rail draws the climb
// from left to right in that order.
//
// `stack` entries are matched by name against src/utils/skill-icons.jsx — spell
// one the same way it is spelled there and the icon comes along for free. A name
// that isn't in that list still renders, just without an icon.
//
// `logo`: drop a file in src/assets/logos/, import it the way Comcast does
// below, and hand it to the company. Left null, the tile falls back to a
// monogram built from the company name.
//
// The Projects page reads these same entries, so a company logo is declared
// once here and shows up on every work project tagged with its id.
import comcastLogo from '../assets/logos/comcast_logo.png'

export const companies = [
  {
    id: 'comcast',
    name: 'Comcast',
    logo: comcastLogo,
    location: 'Chennai, India',
    // The whole span at this company, across every role below
    period: 'Jun 2023 — Present',
    tenure: '3 yrs',
    roles: [
      {
        id: 'intern',
        title: 'Software Engineering Intern',
        period: 'Jun 2023 — Dec 2023',
        duration: '7 mos',
        // One line in serif italic under the title. Optional — drop it if unwanted.
        summary: 'Placeholder — the one-line version of what this stint was about.',
        bullets: [
          'Placeholder — what you built, on which stack, and who used it.',
          'Placeholder — a number that shows scale: latency, throughput, users, cost.',
          'Placeholder — something you shipped end to end, start to production.',
        ],
        stack: ['Java', 'Spring Boot', 'React', 'MySQL', 'Git'],
      },
      {
        id: 'e1',
        title: 'Software Engineer 1',
        period: 'Jan 2024 — Jul 2025',
        duration: '1 yr 7 mos',
        summary: 'Placeholder — the one-line version of what this level was about.',
        bullets: [
          'Placeholder — the service or feature you owned, and what it replaced.',
          'Placeholder — a measurable win: p95 down, build time down, coverage up.',
          'Placeholder — the hard bug, migration, or incident you drove to a close.',
          'Placeholder — where you widened scope beyond the ticket you were handed.',
        ],
        stack: ['Java', 'Spring Boot', 'REST APIs', 'PostgreSQL', 'Docker', 'CI/CD'],
      },
      {
        id: 'e2',
        title: 'Software Engineer 2',
        period: 'Aug 2025 — Present',
        duration: '1 yr 2 mos',
        // Lights the node with the same beacon the dock uses for "open to work"
        current: true,
        summary: 'Placeholder — the one-line version of what you are doing now.',
        bullets: [
          'Placeholder — the system you own now and the surface it serves.',
          'Placeholder — an architecture or platform call you made, and the tradeoff.',
          'Placeholder — how you multiplied the team: reviews, docs, mentoring, tooling.',
          'Placeholder — the number your work moved this year.',
        ],
        stack: [
          'TypeScript',
          'React',
          'Spring Boot',
          'Kubernetes',
          'GitHub Actions',
          'InfluxDB',
          'Playwright',
        ],
      },
    ],
  },
]

// Work projects reference a company by id rather than restating its logo
export const getCompany = id => companies.find(company => company.id === id) ?? null

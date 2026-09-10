// Everything the Projects terminal renders. Filling this in never means
// touching the layout.
//
// `id` doubles as the directory name in the `ls` listing and in the `cat
// <id>/README.md` line above each readme, so keep it short and kebab-case.
// `name` is the human title, printed as the readme's heading.
//
// `kind`: 'personal' or 'work'.
//   personal — shows your monogram as the source mark, and renders whichever of
//              `repo` / `live` you provide. Leave one blank to hide that link.
//   work     — shows the company logo instead, and never renders links. Point
//              `companyId` at an id from src/utils/experience.js so the logo is
//              declared in exactly one place.
//
// `stack` entries are matched by name against src/utils/skill-icons.jsx — spell
// one the same way it is spelled there and the icon comes along for free. A name
// that isn't in that list still renders, just without an icon.
//
// Order is the order they appear on the page. Newest first reads best.

export const projects = [
  {
    id: 'folio',
    name: 'Portfolio',
    kind: 'personal',
    year: '2025',
    // One line in serif italic at the top of the expanded row. Optional.
    summary: 'Placeholder — the one-line pitch, in plain language.',
    bullets: [
      'Placeholder — the problem it solves and who it is for.',
      'Placeholder — the piece you are proudest of building.',
      'Placeholder — a constraint you designed around: offline, cost, scale, latency.',
    ],
    stack: ['React', 'Tailwind CSS', 'Javascript'],
    repo: 'https://github.com/your-handle/folio',
    live: 'https://your-domain.dev',
  },
  {
    id: 'work-platform',
    name: 'Placeholder Work Project',
    kind: 'work',
    companyId: 'comcast',
    year: '2025',
    summary: 'Placeholder — what this system does, without the internal jargon.',
    bullets: [
      'Placeholder — the surface you owned and the scale it runs at.',
      'Placeholder — a measurable win: p95 down, cost down, throughput up.',
      'Placeholder — the design call you made and the tradeoff you accepted.',
    ],
    stack: ['Java', 'Spring Boot', 'Kubernetes', 'PostgreSQL'],
  },
  {
    id: 'side-tool',
    name: 'Placeholder Side Tool',
    kind: 'personal',
    year: '2024',
    summary: 'Placeholder — the itch you scratched by building this.',
    bullets: [
      'Placeholder — what it does in one sentence.',
      'Placeholder — the technically interesting part.',
    ],
    stack: ['TypeScript', 'React', 'PostgreSQL'],
    repo: 'https://github.com/your-handle/side-tool',
    // No `live` — the link simply will not render
  },
  {
    id: 'work-service',
    name: 'Placeholder Internal Service',
    kind: 'work',
    companyId: 'comcast',
    year: '2024',
    summary: 'Placeholder — the one-line version of what this service does.',
    bullets: [
      'Placeholder — what it replaced, and why that mattered.',
      'Placeholder — how you proved it worked: tests, load runs, rollout plan.',
    ],
    stack: ['Java', 'REST APIs', 'Docker', 'Apache JMeter'],
  },
]

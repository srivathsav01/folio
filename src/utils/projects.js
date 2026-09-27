// Everything the Projects terminal renders. Filling this in never means
// touching the layout.
//
// `id` doubles as the directory name in the `ls` listing and in the `cat
// <id>/README.md` line above each readme, so keep it short and kebab-case.
// `name` is the human title, printed as the readme's heading.
//
// `kind`: 'personal' or 'work'.
//   personal — shows your monogram as the source mark, and renders whichever of
//              `repo` / `live` / `npm` you provide. Leave one blank to hide that link.
//              A project with an `npm` link is a published package: it shows the
//              npm logo in place of the monogram and an "open npm" link.
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
    id: 'performance-portal',
    name: 'Performance Portal',
    kind: 'work',
    companyId: 'comcast',
    summary: 'A Kubernetes-native performance-testing platform used by 50+ engineering teams to simulate load and monitor application performance, now extended with an AI agentic layer for autonomous test maintenance.',
    bullets: [
      'Architected a Kubernetes-native platform provisioning pods on demand across data centres to simulate user load and run JMeter load tests',
      'Replaced a licensed legacy tool — saving ~$10M annually',
      'Built the frontend end-to-end with a shared component library and Grafana integration for in-platform result viewing',
      'Built the reporting pipeline — InfluxDB metric streaming, HTML report generation, WebSocket/email alerts — and a REST API for concurrent, CI-triggered runs',
      'Co-built an AI agentic system (Spring AI, MCP, GPT-4) that reads Jira tickets and autonomously updates test scripts and triggers runs, cutting manual maintenance time'
    ],
    stack: ['Angular','typescript','Java', 'Spring Boot','InfluxDB','Spring AI','Apache JMeter','Grafana','Kubernetes', 'MySQL'],
  },
  {
    id: 'slow-start',
    name: 'Slow-Start',
    kind: 'personal',
    summary: 'A zero-dependency rate limiter published to npm that ramps up to its configured rate instead of opening at full throttle, so services with cold caches and unfilled connection pools never meet peak traffic.',
    bullets: [
      'Implemented Google Guava\'s SmoothWarmingUp algorithm in TypeScript — verified against the Java original, with a maximum 1 µs divergence traced to Java\'s integer truncation',
      'Designed three limiters behind one uniform API — warm-up ramp, fixed-rate pacer, and queue bounds that wrap any two-method scheduler',
      'Shipped Express middleware and a guard() wrapper that limits any async function, not just HTTP handlers',
      'Built 392 tests on an injected clock, with golden vectors replayed against the packed tarball on every CI push',
      'Benchmarked against a token bucket: 37 requests admitted in the first cold second versus 400, with ~250 ns of limiter overhead per acquisition',
    ],
    stack: ['Typescript'],
    repo: 'https://github.com/srivathsav01/slow-start',
    npm: 'https://www.npmjs.com/package/slow-start',
  },
  {
    id: 'mini-queue',
    name: 'MiniQueue',
    kind: 'personal',
    summary: 'A lightweight message broker built from scratch with at-least-once delivery semantics, topic-based fan-out, and explicit consumer acknowledgement.',
    bullets: [
      'Inspired by RabbitMQ\'s core concepts — built to understand them from the inside out.',
      'Designed a PostgreSQL-backed broker with Topic/Queue/Message state-machine modeling, supporting at-least-once delivery, topic-based fan-out, and explicit ack/nack semantics',
      'Built a configurable redelivery scheduler with retry counting and dead-letter queue routing for messages exceeding max attempts',
      'Implemented WebSocket-based push delivery alongside a REST API, paired with a React dashboard for real-time queue monitoring',
    ],
    stack: ['React', 'Typescript','Java','Spring Boot','PostgreSQL','Docker','Spring Data JPA'],
    repo: 'https://github.com/srivathsav01/MiniQueue',
    live: 'https://miniqueue.onrender.com/',
  },
  // {
  //   id: 'side-tool',
  //   name: 'Placeholder Side Tool',
  //   kind: 'personal',
  //   summary: 'Placeholder — the itch you scratched by building this.',
  //   bullets: [
  //     'Placeholder — what it does in one sentence.',
  //     'Placeholder — the technically interesting part.',
  //   ],
  //   stack: ['TypeScript', 'React', 'PostgreSQL'],
  //   repo: 'https://github.com/your-handle/side-tool',
  //   // No `live` — the link simply will not render
  // },
  // {
  //   id: 'work-service',
  //   name: 'Placeholder Internal Service',
  //   kind: 'work',
  //   companyId: 'comcast',
  //   summary: 'Placeholder — the one-line version of what this service does.',
  //   bullets: [
  //     'Placeholder — what it replaced, and why that mattered.',
  //     'Placeholder — how you proved it worked: tests, load runs, rollout plan.',
  //   ],
  //   stack: ['Java', 'REST APIs', 'Docker', 'Apache JMeter'],
  // },
]

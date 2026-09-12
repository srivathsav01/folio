




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
    period: 'Jan 2023 — Present',
    tenure: '3 yrs',
    roles: [
      {
        id: 'intern',
        title: 'Development Engineer Intern',
        period: 'Jan 2023 — Jun 2023',
        duration: '6 mos',
        summary: 'A QA tooling-focused internship building browser automation tools to speed up test creation for engineering teams',
        bullets: [
          'Built an inner-source Chrome extension that records browser interactions and generates Automation test scripts at 75% accuracy',
          'Drove adoption to multiple QA teams and cut manual test-authoring time by 50% through a script management and editing UI'
        ],
        stack: ['TypeScript', 'JavaScript', 'Git'],
      },
      {
        id: 'e1',
        title: 'Product Development Engineer 1',
        period: 'Jul 2023 — Mar 2025',
        duration: '1 yr 9 mos',
        summary: 'Role focused on architecting a Kubernetes-native performance-testing platform end to end — frontend to API-driven test orchestration',
        bullets: [
          'Built the Performance Portal to simulate user load and monitor application performance.',
          'Drove adoption to 50+ teams via demos to team, organisation and senior leadership audiences, contributing an estimated $10M in annual savings',
          'Designed , Built and Optimized the frontend end to end, cutting page load time by 40% and improving QA cycle efficiency by 60%.',
          'Received the Spotlight Award for outstanding contribution to the development and support of Performance Portal'
        ],
        stack: ['TypeScript',
          'Angular',
          'Java',
          'Spring Boot',
          'Docker',
          'Kubernetes',
          'InfluxDB',
          'Apache JMeter',
          'Grafana',
          'MySQL','CI/CD'],
      },
      {
        id: 'e2',
        title: 'Product Development Engineer 2',
        period: 'Apr 2025 — Present',
        duration: '1 yr 6 mos',
        current: true,
        summary: 'Role focused on leading the Performance Portal\'s evolution — frontend architecture, AI agentic tooling, and cross-team adoption.',
        bullets: [
          'Lead ongoing development and support of the Performance Portal serving 50+ engineering teams',
          'Own the portal\’s frontend architecture, including the shared component library and state management, and integrate Grafana dashboards',
          'Own the Playwright-based test recorder used across multiple QA teams',
          'Standardised UX across four internal products through the shared component library, cutting build time for new features',
          'Co-built an AI agentic system for the Performance Portal that autonomously updates test scripts and triggers performance runs',
          'Awarded the Circle of Success award for innovation in operational excellence'
        ],
        stack: [
          'React',
          'Angular',
          'Java',
          'Spring Boot',
          'Elasticsearch',
          'Kubernetes',
          'InfluxDB',
          'Spring AI',
          'GPT-4',
          'Model Context Protocol (MCP)',
          'Playwright'
        ],
      },
    ],
  },
]

// Work projects reference a company by id rather than restating its logo
export const getCompany = id => companies.find(company => company.id === id) ?? null

// Everything the Open Source terminal renders: pull requests to repositories
// you don't own. Your own repos belong in src/utils/projects.js.
//
// One entry per upstream repository, with every PR you sent it under `prs`.
// `repo` is the owner/name slug exactly as GitHub prints it; the link to the
// repository is built from it.
//
// `summary` is the one line a reader needs to know why the work mattered —
// written for someone who has never used the library.
//
// Each PR:
//   number    — the PR number, rendered as #1234
//   title     — the PR title, verbatim
//   status    — 'merged', 'open' or 'closed'
//   date      — 'YYYY-MM-DD': the merge date, or the opening date if unmerged
//   additions / deletions — the diff stat from GitHub. Optional.
//   issue     — the issue this PR fixes. Optional. `{ number, date, reportedByMe }`:
//               `date` is when it was opened, and `reportedByMe: true` marks a bug
//               you found yourself, which the page calls out as "found & fixed".
//
// `stack` entries are matched by name against src/utils/skill-icons.jsx, the
// same way project stacks are.
//
// Order here doesn't matter: the page sorts repos oldest first, by each repo's
// earliest PR date.

export const contributions = [
  {
    repo: 'quarkusio/quarkus',
    summary: 'The Kubernetes-native Java framework built for fast startup and low memory. Fixed database detection so apps using Hibernate ORM with offline startup boot on DB2 and keep PostgreSQL on its faster defaults.',
    prs: [
      {
        number: 58143,
        title: 'Fix PostgreSQL and DB2 detection when starting Hibernate ORM offline',
        status: 'merged',
        date: '2026-11-06',
        additions: 110,
        deletions: 2,
        issue: { number: 50209, date: '2025-09-22', reportedByMe: false },
      },
    ],
    bullets: [
      'The PostgreSQL/DB2 check compared `Optional.toString()` (`"Optional[db2]"`) against the database kind, so it never matched',
      'DB2 apps failed at startup because they were forced onto a local temporary-table strategy DB2Dialect does not support, and PostgreSQL silently lost its CTE-based defaults',
      'Fixed the operator grouping so the presence check covers both databases (the same helper is shared with Hibernate Reactive), and added offline-startup tests for DB2 and PostgreSQL',
    ],
    stack: ['Java', 'PostgreSQL', 'SQL'],
  },
  {
    repo: 'testcontainers/testcontainers-java',
    summary: 'The Java library for throwaway Docker containers in integration tests. Fixed Docker Compose parsing so the images Testcontainers pre-pulls match the ones Compose actually runs.',
    prs: [
      {
        number: 12095,
        title: 'Keep values tagged with `!override` when parsing compose files',
        status: 'merged',
        date: '2026-10-17',
        additions: 119,
        deletions: 3,
        issue: { number: 12094, date: '2026-09-29', reportedByMe: true },
      },
    ],
    bullets: [
      'Values tagged `!override` were being dropped like `!reset`, so an override file\'s image was ignored and the base file\'s image pre-pulled instead',
      'Kept the YAML constructor restricted to safe tags, so arbitrary-class deserialization is still rejected',
      'Stopped one malformed service from silently ending the parse of every service after it, and kept top-level keys and `x-*` extension fields from being mistaken for services',
    ],
    stack: ['Java', 'Docker'],
  },
  // {
  //   repo: 'owner/repo',
  //   summary: 'Placeholder — what the project is, and what your change did for its users.',
  //   prs: [
  //     {
  //       number: 123,
  //       title: 'Placeholder — the PR title, verbatim',
  //       status: 'open',
  //       date: '2026-01-01',
  //     },
  //   ],
  //   bullets: ['Placeholder — the technically interesting part.'],
  //   stack: ['TypeScript'],
  // },
]

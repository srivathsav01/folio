import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, CircleDot, GitPullRequest } from 'lucide-react'
import SkillPill from '../components/SkillPill'
import { GithubIcon } from '../components/icons'
import { getSkill } from '../utils/skill-icons'
import { contributions } from '../utils/contributions'
import { PAGE, PAGE_TITLE } from './page-styles'

// The site's shared reveal curve, in the tuple form framer-motion wants
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

// The graph is drawn in a 3rem gutter: upstream main runs down x = 12px, each
// contribution forks out to a branch at x = 36px and, once merged, curves back.
// Dots are 7px, so they sit 3.5px either side of the line they mark.
const FORK = 'M12 0 C12 20 36 12 36 32'
const MERGE = 'M36 0 C36 20 12 12 12 32'

const allPrs = contributions.flatMap(c => c.prs)
const merged = allPrs.filter(pr => pr.status === 'merged')
const linesUpstream = merged.reduce((sum, pr) => sum + (pr.additions ?? 0) + (pr.deletions ?? 0), 0)

const pad = n => String(n).padStart(2, '0')

const formatDate = iso =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en', { month: 'short', year: 'numeric' })

// PR titles and bullets quote config keys in backticks, as GitHub would render them
const Inline = ({ text }) =>
  text.split('`').map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded bg-cream/[0.07] px-1 py-px text-cream/85">
        {part}
      </code>
    ) : (
      part
    ),
  )

// GitHub's five-square diffstat: the share of green is the share of additions
const DiffBar = ({ additions = 0, deletions = 0 }) => {
  const total = additions + deletions
  if (!total) return null
  const green = Math.round((additions / total) * 5)

  return (
    <span className="inline-flex items-center gap-2" title={`+${additions} −${deletions}`}>
      <span className="text-signal-soft/70">+{additions}</span>
      <span className="text-cream/35">−{deletions}</span>
      <span aria-hidden="true" className="flex gap-px">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`size-[7px] rounded-[1px] ${i < green ? 'bg-signal-soft/70' : 'bg-cream/20'}`} />
        ))}
      </span>
    </span>
  )
}

// Same chip as the Projects readme links, so every way off-site looks alike
const ChipLink = ({ href, Icon, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="group inline-flex items-center gap-1.5 rounded-md border border-cream/10 bg-cream/[0.07] px-2.5 py-1 font-mono text-[0.65rem] text-cream/70 no-underline transition-colors duration-[250ms] hover:border-cream/25 hover:text-cream"
  >
    <Icon className="block size-3" strokeWidth={1.8} aria-hidden="true" />
    {children}
    <ArrowUpRight
      className="block size-3 text-cream/40 transition-[translate,color] duration-[400ms] ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cream"
      aria-hidden="true"
    />
  </a>
)

// An event on the branch, with its dot sitting on the branch line in the gutter
const BranchEvent = ({ dot, children }) => (
  <li className="relative">
    <span aria-hidden="true" className={`absolute top-[0.45rem] -left-[15.5px] size-[7px] rounded-full ${dot}`} />
    {children}
  </li>
)

// The issue opens the branch: a hollow ring, as GitHub draws an issue
const Issue = ({ repo, issue }) => (
  <BranchEvent dot="border border-cream/50 bg-ink">
    <p className="font-mono text-[0.68rem] leading-relaxed text-cream/45">
      {issue.reportedByMe ? 'Found the bug and reported it' : 'Picked up'} as{' '}
      <a
        href={`https://github.com/${repo}/issues/${issue.number}`}
        target="_blank"
        rel="noreferrer"
        className="text-cream/80 underline decoration-cream/30 underline-offset-[3px] transition-colors duration-[250ms] hover:text-cream hover:decoration-cream/70"
      >
        issue #{issue.number}
      </a>
      {issue.date && <span className="text-cream/30"> · {formatDate(issue.date)}</span>}
    </p>
  </BranchEvent>
)

const PullRequest = ({ repo, pr }) => {
  const isMerged = pr.status === 'merged'

  return (
    <>
      {pr.issue && <Issue repo={repo} issue={pr.issue} />}

      {/* A commit on the branch: filled once merged, hollow while still open */}
      <BranchEvent dot={`border border-cream/50 ${isMerged ? 'bg-cream/70' : 'bg-ink'}`}>
        <p className="font-mono text-[0.78rem] leading-relaxed text-cream/85">
          <span className="mr-2 text-cream/35 tabular-nums">#{pr.number}</span>
          <Inline text={pr.title} />
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.62rem] text-cream/35 tabular-nums">
          <DiffBar additions={pr.additions} deletions={pr.deletions} />
          <span>
            {pr.status} · {formatDate(pr.date)}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ChipLink href={`https://github.com/${repo}/pull/${pr.number}`} Icon={GitPullRequest}>
            View PR #{pr.number}
          </ChipLink>
          {pr.issue && (
            <ChipLink href={`https://github.com/${repo}/issues/${pr.issue.number}`} Icon={CircleDot}>
              Issue #{pr.issue.number}
            </ChipLink>
          )}
        </div>
      </BranchEvent>
    </>
  )
}

const Contribution = ({ contribution, reduceMotion }) => {
  const { repo, summary, prs, bullets = [], stack = [] } = contribution
  const [owner, name] = repo.split('/')

  // The branch merges back once anything on it has landed upstream
  const mergedPrs = prs.filter(pr => pr.status === 'merged')
  const isMerged = mergedPrs.length > 0
  const mergedOn = isMerged ? mergedPrs.map(pr => pr.date).sort().at(-1) : null
  const foundAndFixed = mergedPrs.some(pr => pr.issue?.reportedByMe)

  const draw = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true, margin: '-15% 0px' },
          transition: { duration: 0.6, delay, ease: EASE_OUT_EXPO },
        }

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-15% 0px' },
        transition: { duration: 0.7, delay: 0.25, ease: EASE_OUT_EXPO },
      }

  return (
    <li className={`relative pl-12 ${isMerged ? 'pb-16' : 'pb-10'}`}>
      <svg aria-hidden="true" className="absolute top-0 left-0 h-8 w-12 overflow-visible" fill="none">
        <motion.path d={FORK} className="stroke-cream/30" strokeWidth="1" {...draw()} />
      </svg>

      <motion.span
        aria-hidden="true"
        className={`absolute top-8 left-[35.5px] w-px origin-top bg-cream/30 ${isMerged ? 'bottom-14' : 'bottom-4'}`}
        {...(reduceMotion
          ? {}
          : {
              initial: { scaleY: 0 },
              whileInView: { scaleY: 1 },
              viewport: { once: true, margin: '-15% 0px' },
              transition: { duration: 0.9, delay: 0.3, ease: EASE_OUT_EXPO },
            })}
      />

      {isMerged ? (
        <>
          <svg aria-hidden="true" className="absolute bottom-6 left-0 h-8 w-12 overflow-visible" fill="none">
            <motion.path d={MERGE} className="stroke-cream/30" strokeWidth="1" {...draw(1)} />
          </svg>
          <span
            aria-hidden="true"
            className="absolute bottom-[calc(1.5rem-3.5px)] left-[8.5px] size-[7px] rounded-full bg-signal-soft shadow-[0_0_0_3px_rgba(124,217,146,0.15)]"
          />
          <p className="absolute bottom-[calc(1.5rem-0.5em)] left-12 font-mono text-[0.6rem] leading-none tracking-[0.18em] text-signal-soft/70 uppercase">
            merged upstream · {formatDate(mergedOn)}
          </p>
        </>
      ) : (
        <span
          aria-hidden="true"
          className="absolute bottom-[calc(1rem-3.5px)] left-[32.5px] size-[7px] rounded-full border border-cream/40 bg-ink"
        />
      )}

      <motion.div className="pt-7" {...reveal}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.68rem] tracking-[0.08em] text-cream/40">
          {owner} /
          {foundAndFixed && (
            <span className="rounded-full border border-signal-soft/30 px-2 py-px text-[0.58rem] tracking-[0.16em] text-signal-soft/80 uppercase">
              Found &amp; fixed
            </span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3">
          <h2 className="font-serif text-[clamp(1.9rem,4.5vw,2.8rem)] leading-[1.05] font-normal tracking-[-0.01em] break-words text-cream italic">
            {name}
          </h2>
          <ChipLink href={`https://github.com/${repo}`} Icon={GithubIcon}>
            View repo
          </ChipLink>
        </div>

        {/* What and where on the left, how on the right; stacked below md */}
        <div className="mt-5 grid gap-x-12 gap-y-6 md:grid-cols-2">
          <div>
            {summary && (
              <p className="max-w-[60ch] font-mono text-[0.78rem] leading-relaxed text-cream/55">{summary}</p>
            )}

            <ul className="mt-6 flex flex-col gap-4">
              {prs.map(pr => (
                <PullRequest key={pr.number} repo={repo} pr={pr} />
              ))}
            </ul>
          </div>

          <div>
            {bullets.length > 0 && (
              <ul className="flex flex-col gap-2.5">
                {bullets.map(bullet => (
                  <li key={bullet} className="flex gap-2.5 font-mono text-[0.74rem] leading-relaxed text-cream/60">
                    <span aria-hidden="true" className="shrink-0 text-cream/25">
                      ↳
                    </span>
                    <span className="max-w-[64ch]">
                      <Inline text={bullet} />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {stack.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 md:gap-3">
                {stack.map(skillName => {
                  const skill = getSkill(skillName)
                  return <SkillPill key={skillName} skillName={skill.name} icon={skill.icon} />
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </li>
  )
}

export default function OpenSource() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="open-source" className={PAGE}>
      <div className="w-full max-w-4xl">
        <h1 className={`${PAGE_TITLE} mb-4 md:mb-5`}>Open Source</h1>

        <p className="mb-10 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.65rem] tracking-[0.18em] text-cream/40 uppercase md:mb-14">
          <span>
            <span className="text-cream/80 tabular-nums">{pad(contributions.length)}</span>{' '}
            {contributions.length === 1 ? 'repo' : 'repos'}
          </span>
          <span>
            <span className="text-cream/80 tabular-nums">{pad(merged.length)}</span> merged{' '}
            {merged.length === 1 ? 'PR' : 'PRs'}
          </span>
          {linesUpstream > 0 && (
            <span>
              <span className="text-cream/80 tabular-nums">{linesUpstream.toLocaleString('en')}</span> lines
              upstream
            </span>
          )}
        </p>

        <div className="relative">
          {/* Upstream main: one line through every contribution, fading out at both ends */}
          <span
            aria-hidden="true"
            className="absolute -top-6 -bottom-2 left-[11.5px] w-px bg-linear-to-b from-transparent via-cream/30 to-transparent"
          />
          <ol className="relative">
            {contributions.map(contribution => (
              <Contribution key={contribution.repo} contribution={contribution} reduceMotion={reduceMotion} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

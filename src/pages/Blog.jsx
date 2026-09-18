import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import DevCoverEditor from '../components/DevCoverEditor'
import SectionRule from '../components/SectionRule'
import { framingStyle } from '../utils/cover-framing'
import { posts } from '../utils/posts'
import { coverTransitionName, useOpenPost } from '../utils/view-transition'
import { PAGE, PAGE_TITLE } from './page-styles'

// The site's shared reveal curve, in the tuple form framer-motion wants
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
}

const Meta = ({ post, lead = false, className = 'text-cream/40' }) => (
  <div
    className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6rem] tracking-[0.2em] uppercase ${className}`}
  >
    {lead && <span className="text-signal-soft">Latest</span>}
    {lead && <span className="opacity-40">·</span>}
    <span>{post.dateLabel}</span>
    <span className="opacity-40">·</span>
    <span>{post.readingTime} min</span>
    {post.tags.map(tag => (
      <span key={tag} className="opacity-70">
        [{tag}]
      </span>
    ))}
  </div>
)

const ReadCue = () => (
  <span className="mt-6 inline-flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.24em] text-cream/70 uppercase transition-colors duration-[300ms] group-hover:text-cream">
    Read
    <ArrowRight
      className="size-3.5 transition-transform duration-[400ms] ease-out-expo group-hover:translate-x-1"
      strokeWidth={1.6}
      aria-hidden="true"
    />
  </span>
)

const LEAD_TITLE =
  'font-serif leading-[1.06] font-normal tracking-[-0.02em] text-cream italic transition-transform duration-[500ms] ease-out-expo group-hover:translate-x-1'

// Headline size bounds on the cover, in px. The title is scaled to fill the
// width on one line; below the floor it wraps instead of shrinking further.
const TITLE_MAX = 48
const TITLE_MIN = 16

// Sizes `box` so the text in `text` (an inline child) runs exactly one line.
// Text width scales linearly with font size, so one measurement at the max
// size is enough to work out the fit.
const useFitText = (max, min) => {
  const boxRef = useRef(null)
  const textRef = useRef(null)

  useLayoutEffect(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return

    let live = true
    const fit = () => {
      if (!live) return
      box.style.whiteSpace = 'nowrap'
      box.style.fontSize = `${max}px`
      const fitted = (max * box.clientWidth) / text.getBoundingClientRect().width
      const size = Math.max(min, Math.min(max, fitted))
      box.style.fontSize = `${Math.floor(size * 10) / 10}px`
      if (fitted < min) box.style.whiteSpace = 'normal'
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    // The serif face can arrive after first paint and change the width
    document.fonts?.ready.then(fit)

    return () => {
      live = false
      observer.disconnect()
    }
  }, [max, min])

  return [boxRef, textRef]
}

// The newest post runs as the lead story: the headline and meta sit on the
// cover, over a gradient that keeps them legible whatever the photo is. The
// standfirst and the call to action run underneath.
const LeadPost = ({ post }) => {
  const openPost = useOpenPost()
  const [titleRef, titleTextRef] = useFitText(TITLE_MAX, TITLE_MIN)
  // Unsaved framing from the dev cover adjuster; null means "as the file says"
  const [draft, setDraft] = useState(null)

  return (
    <motion.article variants={rise} className="relative">
      <Link
        to={`/blog/${post.slug}`}
        onClick={event => openPost(event, post.slug)}
        className="group block"
      >
        {post.cover ? (
          // Named so it morphs into the post's own cover when opened. Held in
          // the dark palette so the scrim and type match in both themes.
          <div
            className="theme-dark relative overflow-hidden rounded-xl border border-cream/10"
            style={{ viewTransitionName: coverTransitionName(post.slug) }}
          >
            {/* Covers are 16:9, so matching that shows the whole photo */}
            <img
              src={post.cover}
              alt={post.coverAlt}
              style={framingStyle(draft ?? post.framing)}
              // Framing follows the pointer while adjusting, so no easing then
              className={`aspect-video w-full object-cover ease-out-expo group-hover:scale-[1.015] ${draft ? '' : 'transition-transform duration-[800ms]'}`}
            />

            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/80 via-ink/25 to-ink/0"
              aria-hidden="true"
            />

            <div className="absolute inset-x-0 bottom-0 p-5 md:p-10">
              <Meta post={post} lead className="text-cream/75" />
              <h2 ref={titleRef} className={`${LEAD_TITLE} mt-3 md:mt-4`}>
                <span ref={titleTextRef}>{post.title}</span>
              </h2>
            </div>
          </div>
        ) : (
          // No cover to set the headline on: fall back to a plain text lead
          <div className="border-t border-cream/12 pt-8 md:pt-10">
            <Meta post={post} lead />
            <h2 className={`${LEAD_TITLE} mt-4 text-[clamp(1.7rem,4.2vw,3rem)]`}>{post.title}</h2>
          </div>
        )}

        {post.summary && (
          <p className="mt-6 max-w-[52ch] font-serif text-[1rem] leading-relaxed text-cream/65 italic md:text-[1.1rem]">
            {post.summary}
          </p>
        )}

        <ReadCue />
      </Link>

      {post.cover && (
        <DevCoverEditor
          file={post.source}
          framing={draft ?? post.framing}
          onChange={setDraft}
          className="inset-x-0 top-0 aspect-video"
        />
      )}
    </motion.article>
  )
}

// One post per row: thumbnail, title with its full standfirst (wrapping as
// needed), and the date and reading time pinned to the right edge.
const PostRow = ({ post }) => {
  const openPost = useOpenPost()

  return (
    <motion.article variants={rise}>
      <Link
        to={`/blog/${post.slug}`}
        onClick={event => openPost(event, post.slug)}
        className="group flex items-start gap-4 border-t border-cream/8 py-5 md:gap-6 md:py-6"
      >
        {post.cover && (
          <span
            className="size-16 shrink-0 overflow-hidden rounded-lg border border-cream/10 md:h-20 md:w-28"
            style={{ viewTransitionName: coverTransitionName(post.slug) }}
          >
            <img
              src={post.cover}
              alt={post.coverAlt}
              loading="lazy"
              style={framingStyle(post.framing)}
              className="size-full object-cover transition-transform duration-[600ms] ease-out-expo group-hover:scale-105"
            />
          </span>
        )}

        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate font-serif text-[1.15rem] leading-snug text-cream/85 italic transition-[color,transform] duration-[400ms] ease-out-expo group-hover:translate-x-1 group-hover:text-cream md:text-[1.3rem]">
            {post.title}
          </span>

          {post.summary && (
            <span className="font-serif text-[0.95rem] leading-relaxed text-cream/45 italic">
              {post.summary}
            </span>
          )}

          {/* On a phone the meta drops under the title instead of the right edge */}
          <span className="font-mono text-[0.6rem] tracking-[0.18em] text-cream/30 uppercase md:hidden">
            {post.dateLabel} · {post.readingTime} min
          </span>
        </span>

        <span className="mt-1.5 hidden shrink-0 flex-col items-end gap-1.5 font-mono text-[0.6rem] tracking-[0.18em] text-cream/30 uppercase md:flex">
          <span>{post.dateLabel}</span>
          <span className="text-cream/20">{post.readingTime} min</span>
        </span>

        <ArrowRight
          className="mt-1 hidden size-4 shrink-0 text-cream/25 transition-[color,transform] duration-[400ms] ease-out-expo group-hover:translate-x-1 group-hover:text-cream md:block"
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </Link>
    </motion.article>
  )
}

export default function Blog() {
  // Standalone route: it isn't part of the one-page scroll, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Warm the post route's chunk so opening a post doesn't wait on the network
  useEffect(() => {
    import('./BlogPost')
  }, [])

  const [lead, ...rest] = posts

  return (
    <main className={PAGE}>
      <div className="w-full max-w-4xl">
        <h1 className={`${PAGE_TITLE} mb-10 md:mb-14`}>Blog</h1>

        {posts.length === 0 ? (
          <p className="border-t border-cream/12 pt-8 font-mono text-[0.72rem] text-cream/35">
            Nothing published yet.
          </p>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            <LeadPost post={lead} />

            {rest.length > 0 && (
              <div className="mt-14 md:mt-20">
                <SectionRule label="Earlier" count={rest.length} />
                <div className="border-b border-cream/8">
                  {rest.map(post => (
                    <PostRow key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  )
}

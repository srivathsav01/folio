import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionRule from '../components/SectionRule'
import { posts } from '../utils/posts'
import { PAGE, PAGE_TITLE } from './page-styles'

// The site's shared reveal curve, in the tuple form framer-motion wants
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
}

const Meta = ({ post, lead = false }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6rem] tracking-[0.2em] text-cream/40 uppercase">
    {lead && <span className="text-signal-soft/80">Latest</span>}
    {lead && <span className="text-cream/15">·</span>}
    <span>{post.dateLabel}</span>
    <span className="text-cream/15">·</span>
    <span>{post.readingTime} min</span>
    {post.tags.map(tag => (
      <span key={tag} className="text-cream/25">
        [{tag}]
      </span>
    ))}
  </div>
)

// The newest post runs as the lead story: oversized title, standfirst, and the
// only explicit call to action on the page.
const LeadPost = ({ post }) => (
  <motion.article variants={rise}>
    <Link
      to={`/blog/${post.slug}`}
      className="group block border-t border-cream/12 pt-8 md:pt-10"
    >
      <Meta post={post} lead />

      <h2 className="mt-4 max-w-[18ch] font-serif text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.05] font-normal tracking-[-0.02em] text-cream italic transition-transform duration-[500ms] ease-out-expo group-hover:translate-x-1">
        {post.title}
      </h2>

      {post.summary && (
        <p className="mt-5 max-w-[54ch] font-serif text-[1.05rem] leading-relaxed text-cream/65 italic md:text-[1.2rem]">
          {post.summary}
        </p>
      )}

      <span className="mt-7 inline-flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.24em] text-cream/60 uppercase transition-colors duration-[300ms] group-hover:text-cream">
        Read
        <ArrowRight
          className="size-3.5 transition-transform duration-[400ms] ease-out-expo group-hover:translate-x-1"
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </span>
    </Link>
  </motion.article>
)

const PostRow = ({ post }) => (
  <motion.article variants={rise}>
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col gap-2 border-t border-cream/8 py-5 md:py-6"
    >
      <div className="flex items-baseline justify-between gap-4 font-mono text-[0.6rem] tracking-[0.18em] text-cream/30 uppercase">
        <span>{post.dateLabel}</span>
        <span className="text-cream/20">{post.readingTime} min</span>
      </div>

      <h3 className="font-serif text-[1.15rem] leading-snug text-cream/85 italic transition-[color,transform] duration-[400ms] ease-out-expo group-hover:translate-x-1 group-hover:text-cream md:text-[1.3rem]">
        {post.title}
      </h3>
    </Link>
  </motion.article>
)

export default function Blog() {
  // Standalone route: it isn't part of the one-page scroll, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0)
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
                <div className="grid gap-x-12 md:grid-cols-2">
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

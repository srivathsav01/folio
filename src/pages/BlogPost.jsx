import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPost } from '../utils/posts'
import { NAME } from '../site'
import { PAGE } from './page-styles'

// Headings keep the site's serif; body copy stays in the text face, because
// IM Fell is a display serif and tiring across a long read.
const HEADING = 'font-serif font-normal italic text-cream tracking-[-0.01em]'

const MARKDOWN = {
  // A post's own h1 would duplicate the title above it, so it renders as an h2
  h1: props => <h2 className={`${HEADING} mt-12 mb-4 text-[1.75rem] md:text-[2rem]`} {...props} />,
  h2: props => <h2 className={`${HEADING} mt-12 mb-4 text-[1.5rem] md:text-[1.75rem]`} {...props} />,
  h3: props => <h3 className={`${HEADING} mt-9 mb-3 text-[1.2rem] md:text-[1.35rem]`} {...props} />,
  h4: props => <h4 className={`${HEADING} mt-8 mb-3 text-[1.05rem]`} {...props} />,

  p: props => <p className="my-5 leading-[1.85] text-cream/75" {...props} />,

  a: props => (
    <a
      className="text-cream underline decoration-cream/30 underline-offset-4 transition-colors duration-[250ms] hover:decoration-cream"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noreferrer' : undefined}
      {...props}
    />
  ),

  ul: props => <ul className="my-5 flex list-disc flex-col gap-2 pl-5 marker:text-cream/25" {...props} />,
  ol: props => (
    <ol className="my-5 flex list-decimal flex-col gap-2 pl-5 marker:font-mono marker:text-[0.8em] marker:text-cream/30" {...props} />
  ),
  li: props => <li className="leading-[1.8] text-cream/75" {...props} />,

  blockquote: props => (
    <blockquote
      className="my-7 border-l border-cream/20 pl-5 font-serif text-[1.1rem] leading-relaxed text-cream/60 italic [&>p]:my-0"
      {...props}
    />
  ),

  // The child selector undoes the inline-code pill for fenced blocks
  pre: props => (
    <pre
      className="my-7 overflow-x-auto rounded-xl border border-cream/10 bg-cream/[0.05] p-4 font-mono text-[0.78rem] leading-relaxed text-cream/80 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit"
      {...props}
    />
  ),
  code: props => (
    <code className="rounded bg-cream/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cream" {...props} />
  ),

  img: props => <img className="my-7 w-full rounded-xl border border-cream/10" loading="lazy" {...props} />,
  hr: () => <hr className="my-10 h-px border-0 bg-cream/12" />,

  table: props => (
    <div className="my-7 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.9rem]" {...props} />
    </div>
  ),
  th: props => (
    <th
      className="border-b border-cream/15 px-3 py-2 font-mono text-[0.6rem] tracking-[0.18em] text-cream/50 uppercase"
      {...props}
    />
  ),
  td: props => <td className="border-b border-cream/8 px-3 py-2 text-cream/75" {...props} />,
}

const Article = ({ post }) => {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [post.slug])

  useEffect(() => {
    const previous = document.title
    document.title = `${post.title} — ${NAME}`
    return () => {
      document.title = previous
    }
  }, [post.title])

  return (
    <>
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[110] h-px origin-left bg-cream/50"
        aria-hidden="true"
      />

      <main className={PAGE}>
        <article className="w-full max-w-[46rem]">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.24em] text-cream/40 uppercase transition-colors duration-[250ms] hover:text-cream"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-[400ms] ease-out-expo group-hover:-translate-x-1"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            All posts
          </Link>

          <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6rem] tracking-[0.2em] text-cream/40 uppercase">
            <span>{post.dateLabel}</span>
            <span className="text-cream/15">·</span>
            <span>{post.readingTime} min</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-cream/25">
                [{tag}]
              </span>
            ))}
          </div>

          <h1 className="mt-4 font-serif text-[clamp(2rem,5.5vw,3.2rem)] leading-[1.08] font-normal tracking-[-0.02em] text-cream italic">
            {post.title}
          </h1>

          {post.summary && (
            <p className="mt-5 max-w-[54ch] font-serif text-[1.1rem] leading-relaxed text-cream/60 italic">
              {post.summary}
            </p>
          )}

          <hr className="mt-10 h-px border-0 bg-cream/12" />

          <div className="text-[1rem] md:text-[1.05rem]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN}>
              {post.body}
            </ReactMarkdown>
          </div>

          <hr className="mt-14 h-px border-0 bg-cream/12" />

          <Link
            to="/blog"
            className="group mt-8 inline-flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.24em] text-cream/40 uppercase transition-colors duration-[250ms] hover:text-cream"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-[400ms] ease-out-expo group-hover:-translate-x-1"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            All posts
          </Link>
        </article>
      </main>
    </>
  )
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)

  // An unknown slug is a dead link, not an error page worth designing
  if (!post) return <Navigate to="/blog" replace />

  return <Article post={post} />
}

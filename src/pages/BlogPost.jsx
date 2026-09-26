import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DevCoverEditor from '../components/DevCoverEditor'
import ReadAloud from '../components/ReadAloud'
import { FootnoteBackref, FootnoteRef, GlossTerm } from '../components/PostNotes'
import {
  GLOSS_SCHEME,
  glossNote,
  isFootnoteBackref,
  isFootnoteRef,
  isFootnotesSection,
  isGloss,
  joinClasses,
  withGlosses,
  withoutNode,
} from '../utils/markdown'
import { framingStyle } from '../utils/cover-framing'
import { getPost, resolveImage } from '../utils/posts'
import { coverTransitionName } from '../utils/view-transition'
import { NAME } from '../site'
import { PAGE } from './page-styles'

// Headings keep the site's serif; body copy stays in the text face, because
// IM Fell is a display serif and tiring across a long read.
const HEADING = 'font-serif font-normal italic text-cream tracking-[-0.01em]'

// remark-gfm titles the footnote list "Footnotes" and hides the heading from
// sighted readers; a post's notes read as references, so they get a real one.
const REMARK_REHYPE = {
  footnoteLabel: 'References',
  footnoteLabelProperties: {},
  footnoteBackContent: '↩',
  footnoteBackLabel: (reference, repeat) =>
    `Back to reference ${reference + 1}${repeat > 1 ? `-${repeat}` : ''}`,
}

// react-markdown drops link destinations whose scheme it does not know, which
// would take a gloss's explanation with it
const urlTransform = url => (url.startsWith(GLOSS_SCHEME) ? url : defaultUrlTransform(url))

// The <img> element when a paragraph holds nothing else, ignoring whitespace
const soleImage = node => {
  const children = node?.children?.filter(child => child.type !== 'text' || child.value.trim()) ?? []
  return children.length === 1 && children[0].tagName === 'img' ? children[0] : null
}

const MARKDOWN = {
  // A post's own h1 would duplicate the title above it, so it renders as an h2
  h1: props => <h2 className={`${HEADING} mt-12 mb-4 text-[1.75rem] md:text-[2rem]`} {...withoutNode(props)} />,
  h2: props => <h2 className={`${HEADING} mt-12 mb-4 text-[1.5rem] md:text-[1.75rem]`} {...withoutNode(props)} />,
  h3: props => <h3 className={`${HEADING} mt-9 mb-3 text-[1.2rem] md:text-[1.35rem]`} {...withoutNode(props)} />,
  h4: props => <h4 className={`${HEADING} mt-8 mb-3 text-[1.05rem]`} {...withoutNode(props)} />,

  // An image on a line of its own becomes a figure, its alt text the caption.
  // Swapped for the paragraph rather than nested in it: a <figure> can't sit in a <p>.
  p: props => {
    const image = soleImage(props.node)
    if (!image) return <p className="my-5 leading-[1.85] text-cream/75" {...withoutNode(props)} />

    return (
      <figure className="my-7">
        {props.children}
        {image.properties.alt && (
          <figcaption className="mt-3 text-center text-[0.85rem] leading-relaxed text-cream/50 italic">
            {image.properties.alt}
          </figcaption>
        )}
      </figure>
    )
  },

  // Three kinds of anchor arrive here: a gloss, the two ends of a footnote,
  // and an ordinary link
  a: props => {
    if (isGloss(props)) return <GlossTerm note={glossNote(props.href)}>{props.children}</GlossTerm>

    if (isFootnoteRef(props))
      return (
        <FootnoteRef href={props.href} id={props.id}>
          {props.children}
        </FootnoteRef>
      )

    if (isFootnoteBackref(props))
      return (
        <FootnoteBackref href={props.href} label={props['aria-label']}>
          {props.children}
        </FootnoteBackref>
      )

    return (
      <a
        className="text-cream underline decoration-cream/30 underline-offset-4 transition-colors duration-[250ms] hover:decoration-cream"
        target={props.href?.startsWith('http') ? '_blank' : undefined}
        rel={props.href?.startsWith('http') ? 'noreferrer' : undefined}
        {...withoutNode(props)}
      />
    )
  },

  sup: props => <sup className="top-[-0.35em] text-[0.74em] leading-none" {...withoutNode(props)} />,

  // The References block remark-gfm appends when a post uses footnotes. It
  // arrives with a className of its own, so ours is merged in rather than set.
  section: props => {
    const { className, ...rest } = withoutNode(props)
    if (!isFootnotesSection(props)) return <section className={className} {...rest} />

    return (
      <section
        className={joinClasses(
          className,
          'mt-14 border-t border-cream/12 pt-2',
          '[&_li]:text-[0.92rem] [&_li]:text-cream/65 [&_ol]:gap-3 [&_ol]:pl-6',
          '[&_p]:my-0 [&_p]:text-[0.92rem] [&_p]:leading-[1.7]',
        )}
        {...rest}
      />
    )
  },

  ul: props => <ul className="my-5 flex list-disc flex-col gap-2 pl-5 marker:text-cream/25" {...withoutNode(props)} />,
  ol: props => (
    <ol className="my-5 flex list-decimal flex-col gap-2 pl-5 marker:font-mono marker:text-[0.8em] marker:text-cream/30" {...withoutNode(props)} />
  ),
  li: props => <li className="leading-[1.8] text-cream/75" {...withoutNode(props)} />,

  blockquote: props => (
    <blockquote
      className="my-7 border-l border-cream/20 pl-5 font-serif text-[1.1rem] leading-relaxed text-cream/60 italic [&>p]:my-0"
      {...withoutNode(props)}
    />
  ),

  // The child selector undoes the inline-code pill for fenced blocks
  pre: props => (
    <pre
      className="my-7 overflow-x-auto rounded-xl border border-cream/10 bg-cream/[0.05] p-4 font-mono text-[0.78rem] leading-relaxed text-cream/80 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit"
      {...withoutNode(props)}
    />
  ),
  code: props => (
    <code className="rounded bg-cream/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cream" {...withoutNode(props)} />
  ),

  img: props => (
    <img
      className="w-full rounded-xl border border-cream/10 [p>&]:my-7"
      loading="lazy"
      {...withoutNode(props)}
      src={resolveImage(props.src)}
    />
  ),
  hr: () => <hr className="my-10 h-px border-0 bg-cream/12" />,

  table: props => (
    <div className="my-7 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.9rem]" {...withoutNode(props)} />
    </div>
  ),
  th: props => (
    <th
      className="border-b border-cream/15 px-3 py-2 font-mono text-[0.6rem] tracking-[0.18em] text-cream/50 uppercase"
      {...withoutNode(props)}
    />
  ),
  td: props => <td className="border-b border-cream/8 px-3 py-2 text-cream/75" {...withoutNode(props)} />,
}

const Article = ({ post }) => {
  // Glosses are rewritten before remark sees the post — see withGlosses
  const body = useMemo(() => withGlosses(post.body), [post.body])
  // Unsaved framing from the dev cover adjuster; null means "as the file says"
  const [draft, setDraft] = useState(null)
  const articleRef = useRef(null)

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
        {/* data-post tells the opening transition the post has mounted.
            data-read-aloud-skip keeps page furniture out of the read-aloud,
            and data-read-aloud-quiet reads a part without highlighting it. */}
        <article ref={articleRef} className="w-full max-w-[46rem]" data-post={post.slug}>
          <Link
            to="/blog"
            data-read-aloud-skip=""
            className="group inline-flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.24em] text-cream/40 uppercase transition-colors duration-[250ms] hover:text-cream"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-[400ms] ease-out-expo group-hover:-translate-x-1"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            All posts
          </Link>

          <div data-read-aloud-skip="" className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6rem] tracking-[0.2em] text-cream/40 uppercase">
            <span>{post.dateLabel}</span>
            <span className="text-cream/15">·</span>
            <span>{post.readingTime} min</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-cream/25">
                [{tag}]
              </span>
            ))}
          </div>

          <h1 data-read-aloud-quiet="" className="mt-4 font-serif text-[clamp(2rem,5.5vw,3.2rem)] leading-[1.08] font-normal tracking-[-0.02em] text-cream italic">
            {post.title}
          </h1>

          {post.summary && (
            <p data-read-aloud-quiet="" className="mt-5 max-w-[54ch] font-serif text-[1.1rem] leading-relaxed text-cream/60 italic">
              {post.summary}
            </p>
          )}

          <ReadAloud key={post.slug} articleRef={articleRef} slug={post.slug} source={post.body} />

          {/* Above the fold, so it loads eagerly unlike images in the body. It
              shares a transition name with the cover on the blog front page. */}
          {post.cover && (
            <figure
              className="relative mt-10 overflow-hidden rounded-xl border border-cream/10"
              style={{ viewTransitionName: coverTransitionName(post.slug) }}
            >
              <img
                src={post.cover}
                alt={post.coverAlt}
                style={framingStyle(draft ?? post.framing)}
                className="aspect-video w-full object-cover"
              />
              <DevCoverEditor
                file={post.source}
                framing={draft ?? post.framing}
                onChange={setDraft}
              />
            </figure>
          )}

          <hr className="mt-10 h-px border-0 bg-cream/12" />

          <div className="text-[1rem] md:text-[1.05rem]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              remarkRehypeOptions={REMARK_REHYPE}
              urlTransform={urlTransform}
              components={MARKDOWN}
            >
              {body}
            </ReactMarkdown>
          </div>

          <hr className="mt-14 h-px border-0 bg-cream/12" />

          <Link
            to="/blog"
            data-read-aloud-skip=""
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

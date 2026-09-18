---
title: How this blog works
date: 2026-09-08
summary: A sample post. Delete it once you have written something real — but read it first, because it explains the whole publishing workflow.
tags: [meta]
cover: hello-world.svg
coverAlt: Concentric rings with a green marker at the centre.
draft: true
---

This file lives at `src/content/blog/hello-world.md`. That is the entire reason
it appears on the blog. No component imports it, no list registers it, and
nothing in `src/` had to change for it to show up.

## Publishing a post

1. Add a `.md` file to `src/content/blog/`.
2. Give it a frontmatter block (the fenced section at the top of this file).
3. Commit and deploy.

The filename becomes the URL. This file is `hello-world.md`, so it is served at
`/blog/hello-world` — a real link you can send to someone, and it opens straight
to the post rather than to the index.

If you prefer your folder in date order, name the file
`2026-09-08-hello-world.md` instead. The date prefix is stripped from the URL,
so the link stays clean. Setting `slug:` in the frontmatter overrides both.

## The frontmatter

| Key       | Required | Notes                                          |
| --------- | -------- | ---------------------------------------------- |
| `title`   | yes      | Shown on the index and as the post heading     |
| `date`    | yes      | `YYYY-MM-DD`, used for ordering                |
| `summary` | no       | The standfirst under the title on the index    |
| `tags`    | no       | `[like, this]`                                 |
| `cover`   | no       | A file in `src/content/blog/images/`           |
| `coverAlt`| no       | Describes the image for screen readers         |
| `draft`   | no       | `true` keeps it out of the built site          |

Reading time is counted from the body, so there is nothing to maintain there.

## Cover images

Drop a photo in `src/content/blog/images/` and name it in `cover:`. The newest
post shows it full width on the index; older ones show it as a thumbnail. A
post without a cover simply renders without one. A full `https://` URL works
too, as does a path into `public/`.

## Drafts

Set `draft: true` and the post stays visible while you run `npm run dev` but is
dropped from the production build. That way a half-finished piece can sit in the
repo without going live.

## One thing to know

The site is static, so a new post goes live on the next build — pushing the
markdown file is what triggers it. Nothing is read at runtime.

Write `[term]{explanation}` and the term keeps its place in the sentence, with the explanation one hover away. Rome's metro is a [strangler fig]{Build the new system around the old one, then retire the old one piece by piece — named after the vine that grows over a host tree and outlives it.} in concrete, and the tunnelling crews practise [defensive digging]{Preliminary soundings before the machines move, so a find costs a redesign rather than a collapse.} for the same reason a careful engineer reads the call sites first.

Repeat a term with empty braces and the explanation comes back: the [strangler fig]{} pattern shows up again here, defined once above.

Explanations take markdown, so they can carry a [link]{Like [this one](https://example.com) — links inside a gloss open in a new tab.}, some `code`, or *emphasis*. The first `}` ends an explanation, so a literal closing brace goes in as `&#125;`. Anything inside backticks is left alone, which is how this post can show `[term]{explanation}` without it turning into a gloss.

A gloss works on hover, on tap, and on tab-and-focus; Escape closes it. Use one when the explanation is an aside: there if you want it, invisible if you don't.

## Two: a numbered reference

Write a footnote and the word gets a number that lists itself at the foot of the post. Hovering the number previews the reference, clicking scrolls down to it, and the arrow beside the reference scrolls back to the sentence you left.[^how]

The instinct is to call tunnel planning pathfinding[^astar] around obstacles, but the obstacles are not known upfront — which is also the difference between refactoring a mapped system and an undocumented one.[^undocumented]

Use a reference when the explanation is substantial, or when you want a reader to be able to find it again without hunting for the sentence that cited it.

[^how]: Both styles share one pop-up, so they look and behave the same on hover. The only difference is whether the text also lands at the bottom of the page.

[^astar]: A\* with a fixed maze is the classic version you would meet in a DSA course: the whole graph is known before the search starts, and it never changes while you solve it.

    Rome's metro is not that. The maze reveals new walls as you dig, which sometimes forces a reroute mid-execution.

[^undocumented]: Barely 10% of ancient Rome has been uncovered, so every dig is a survey as much as a build.

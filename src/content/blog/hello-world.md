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

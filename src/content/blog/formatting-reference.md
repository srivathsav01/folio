---
title: Formatting reference
date: 2026-08-21
summary: A sample post showing every markdown element the reader styles, so you can see what a piece will look like before you write one.
tags: [meta, markdown]
cover: formatting-reference.svg
coverAlt: Abstract blocks standing in for headings, body copy and a code block.
---

A second sample post — delete this one too. It exists so you can see how each
markdown element is styled without having to write a real piece first.

## Headings and body copy

Body text sits at a comfortable measure with generous leading, so a long piece
stays readable end to end. Headings use the site's serif; the body does not,
because IM Fell is a display face and gets tiring at paragraph length.

### A third-level heading

Inline formatting works as you would expect: **bold**, *italic*, `inline code`,
and [links](https://example.com), which open in a new tab when they point
somewhere external.

## Lists

- An unordered item
- Another one, long enough to wrap onto a second line so you can see how the
  indentation holds up
- A third

1. Ordered items are numbered in mono
2. Which keeps them aligned with the rest of the site
3. Even past nine

## Quotes

> A blockquote is set in serif italic behind a hairline rule, which makes it read
> as a quote rather than as an aside.

## Code

Inline `const x = 1` sits in a small tinted pill. Fenced blocks get a card with
a border and scroll sideways rather than wrapping:

```js
export const posts = Object.entries(files)
  .map(([path, source]) => parse(source, path))
  .filter(post => import.meta.env.DEV || !post.draft)
  .sort((a, b) => b.date - a.date)
```

## Tables

GitHub-flavoured markdown is enabled, so tables, strikethrough and task lists
all work.

| Element | Face  | Notes                    |
| ------- | ----- | ------------------------ |
| Heading | Serif | Italic, tracking tight   |
| Body    | Sans  | 1.85 leading             |
| Code    | Mono  | Tinted card              |

---

A horizontal rule renders as a hairline, like the one above.

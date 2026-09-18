---
title: Annotating a post
date: 2026-09-18
summary: A scratch post for the two ways a word can carry an explanation — a hover gloss, and a numbered reference at the foot of the page.
tags: [meta]
draft: true
---

This post is a draft, so it only shows up under `npm run dev`. It exists to try both annotation styles side by side.

## One: a hover gloss

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

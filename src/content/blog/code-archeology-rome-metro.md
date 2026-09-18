---
title: Code Archeology: Lessons from Rome’s Metro
date: 2026-09-18
summary: A system that's been under construction for decades, threading tunnels through two thousand years of buried history, taught me more about working with legacy code than any codebase ever has.
tags: [Legacy Systems, Rome]
cover: Rome_metro.jpeg
coverAlt: Rome Colosseum Metro Station
coverFocus: 53.5% 43.7%
draft: true
---
> Intro and my reaction to it

I had the privilege of visiting Rome for a brief duration last Summer. Standing on Rome's varied topography and amid its ancient ruins, something very common caught my fascination - Its Metro. A System that's been under continuous, incremental construction for decades with old and new sections coexisting and yet somehow threads through hills, ruins and centuries of buried history. Intrigued by its construction, I had to do a research on it. And while doing it, It drew a parallel to ___________.

Unlike other metro networks around the world, Rome can't survey once and build. Every dig risks hitting something undocumented - a Roman barracks, a burial ground, a wall nobody mapped. One such finding was the [Hadrian's Athenaeum](https://www.thehistoryblog.com/archives/22476) which is currently open for public was found while digging Line C in 2009. Similarly, In 2016, A [2nd-century Roman military barracks](https://www.bbc.com/news/world-europe-36311156) was unearthed during excavation for a metro station. These are not random one-off findings, rather barely 10% of ancient Rome is uncovered.

The Instinct is to call this pathfinding[^astar] around obstacles, but there is a catch. The obstacles aren't known upfront. That's exactly what it feels like touching an undocumented system where you don't know what depends on the thing you're about to change. 

- Preliminary soundings before construction ↔ auditing/mapping dependencies before refactoring
- Pausing mid-dig when archaeologists find something ↔ a change surfacing a hidden downstream consumer
- Redesigning station shape around a find (Porta Metronia integrating the barracks into the station) ↔ the Strangler Fig pattern — building around and incorporating the old rather than ripping it out
- Sensors monitoring the Colosseum for vibration during tunneling ↔ monitoring/observability before touching fragile production systems

[^astar]: A* is the traditional pathfinding in a maze where the entire maze/graph is known upfront before you start searching. The algorithm's job is just to find the optimal route through the grid that never changes dynamically. Rome's Metro is not that. The obstacles aren't known in advance. You don't find out a Roman barracks or a burial ground is sitting in your planned tunnel path until you're already digging. So this isn't a "find the best path through a known maze" problem but rather "find a path while the maze reveals new walls as you go, sometimes forcing you to backtrack, redesign, or reroute mid-execution."

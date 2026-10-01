---
title: Slow Start Verification
date: 2026-10-02
summary: A sample post. Delete it once you have written something real — but read it first, because it explains the whole publishing workflow.
tags: [meta]
cover: ARPANET_IMP.jpg
coverAlt: Concentric rings with a green marker at the centre.
coverFocus: 54.5% 0%
draft: true
---

In October 1986, the internet nearly stopped working.

Two machines at Berkeley, a few hundred metres apart, watched their throughput fall from 32 kbps to 40 bps. A factor of a thousand, across a distance you could walk in five minutes. Nothing was broken. No cable had been cut, no router had failed. Every sender on the network was behaving exactly as its code said it should. Every computer was sending as fast as it could. The network jammed, everyone retried, and the retries made the jam worse.

Jacobson and Michael Karels worked out what had happened and published it in 1988 as [*Congestion Avoidance and Control*](https://ee.lbl.gov/papers/congavoid.pdf), which remains one of the most consequential papers in networking. The failure was this. A TCP sender opened a connection and immediately started transmitting at the window size it had been configured with — a number chosen in advance, with no relationship to what the path between the two endpoints could actually carry. If the network could carry less, the queues filled. Full queues drop packets. Dropped packets are retransmitted. Retransmissions add load to a network that was already over capacity, which fills the queues further. Every step in that loop is a correct implementation of its specification. The loop still eats the network.


Van Jacobson's fix was almost polite: start slow. Send a little, see what gets through, then speed up. Every TCP connection you open today still does this. It's called slow start. It simply said : 

> When starting or restarting after a loss, set `cwnd` to one packet.

> On each ack for new data, increase `cwnd` by one packet.

One packet. Then two, then four — the window roughly doubles every round trip, and it stops growing the moment the network signals that it has had enough. The acknowledgements coming back become a clock: a new packet is not put into the network until an old one has left it.
Somewhere on the similar lines, A consumer of my performance testing application reported a bug that when running script they were getting 429 Error. The application was making the same mistake those 1986 machines made. It fired everything at once with Promise.all, failed, retried, and failed harder.
So I built slow-start, a small rate limiter for Node and the browser.

Before each call, you await acquire(). It resolves when there's capacity. If the request stops mattering (the user navigates away, a timeout fires), you pass an AbortSignal and the wait is cancelled, so nothing is left stuck in the queue.

https://www.oreilly.com/library/view/site-reliability-engineering/9781491929117/ch22.html

---

The underlying principle is the one I keep returning to. *You do not know the capacity of the path, so do not guess it.* Start below what you think it can take, and let the system itself tell you when to stop climbing.

---

## The part almost nobody quotes

Slow start is usually taught as a startup behaviour, which undersells it. Read [RFC 5681](https://www.rfc-editor.org/rfc/rfc5681.txt), section 4.1, titled *Restarting Idle Connections*:

> a TCP SHOULD set `cwnd` to no more than RW before beginning transmission if the TCP has not sent data in an interval exceeding the retransmission timeout.

A connection that has been sitting idle must throw away what it learned and start small *again*. The stated reason:

> After an idle period, TCP cannot use the ACK clock to strobe new segments into the network, as all the ACKs have drained from the network.

The measurement has expired. The path may have filled with other traffic while you were quiet, and you have no acknowledgements in flight to tell you either way. Whatever you knew about the capacity, you no longer know it. You are cold again.

And then, a few lines further down, a caveat that reads like a bug report from the future:

> Using the last time a segment was received to determine whether or not to decrease `cwnd` can fail to deflate `cwnd` in the common case of persistent HTTP connections.

A web server receives a request before it transmits a response, so it never *looks* idle — and therefore dumps a full window into a path it has no current measurement of.

Forty years on, I ran into the same shape one layer up the stack.

---

## Ramp-up, and the absence of it

The platform I work on runs more than fifty performance test runs a day, and every one of them begins with a ramp-up period.

That is not a formality or a politeness. A system measured from cold measures the warm-up rather than the system. Open a load test at full throughput and your p99 is a story about JIT compilation and empty caches.

It took me an embarrassingly long time to notice that production traffic extends no such courtesy.

Real traffic arrives at whatever rate it happens to arrive, and a service that restarted thirty seconds ago has no way of asking it to wait. The gap is at its widest immediately after a deploy, which is exactly when it is least convenient: caches are empty, the connection pool is unfilled, the JIT has optimised nothing, lazy singletons have not been constructed. A rate limiter configured for a thousand requests a second will hand over a thousand requests a second to a process that can currently serve perhaps a hundred.

Requests queue. Latency climbs. Health checks time out. The orchestrator concludes the instance is unhealthy and restarts it. The replacement starts cold.

Self-reinforcing, and made of correct code.

The uncomfortable detail is that the standard tool makes it worse rather than better. A token bucket accumulates capacity while it sits idle — that is the whole point of a token bucket, and it is a genuinely good property for smoothing bursts against a steady-state system. But it means that a bucket which has been idle is a bucket which is *full*, and so the moment of restart is the moment the limiter is at its most permissive.

Which is the precise opposite of what RFC 5681 concluded about idle connections in 2009.

---

## The algorithm already existed

Java has had an answer to this for years, and I had walked past it more than once without registering what it was: Guava's `SmoothWarmingUp`, a mode of its `RateLimiter` that opens at a fraction of its configured rate after an idle period and climbs to full over a window you choose.

The intuition people reach for is "a token bucket run backwards." That is a useful first image and it is not the mechanism, so it is worth stating the mechanism properly.

The limiter holds **stored permits** — a pot that fills while idle, like a bucket. The difference is what a permit *costs*. In a token bucket, a token is a token; having lots of them means you can go fast. Here, the cost of a permit depends on how full the pot is:

```
intervalAt(x) = stableInterval                             if x ≤ thresholdPermits
              = stableInterval + (x − threshold) × slope   if x > thresholdPermits
```

A permit drawn from a nearly-full pot costs `coldInterval` — with a cold factor of 3, three times the steady-state interval. A permit drawn at or below the threshold costs `stableInterval`, which is full configured rate.

So a full pot is a *slow* pot. The limiter warms up by being used: every acquisition drains stored permits, which lowers the price of the next one. The ramp is not a schedule imposed on top of the limiter, it is a consequence of how the limiter charges.

The geometry follows from that. The wait for a batch of *n* permits is the area under the interval curve between where the pot starts and where it ends — a trapezoid in the sloped region, a rectangle below the threshold. And the constants are chosen so that the areas come out meaningful: draining the entire sloped region costs *exactly* the warm-up period you configured. That identity is not decoration; it is the definition the constants are derived from.

Two further pieces that surprised me.

**Idle converts back into permits.** The resync step takes the time elapsed since the limiter was last busy and buys stored permits with it at a fixed cool-down interval, capped at maximum. Go quiet for long enough and you are fully cold again — the same conclusion RFC 5681 reached about congestion windows, arrived at independently, for a completely different resource.

**Callers pay the previous caller's bill.** A caller is granted at the *current* `nextFreeTicket`, and only then is the cost of its permits added. So the first caller to arrive after an idle period waits precisely zero, and its cost lands on whoever comes next. The debt is always one caller behind. I stared at that for a while before I was convinced it was intentional rather than an off-by-one, and it is: it makes the limiter's behaviour depend on demand rather than on arrival timing.

Alibaba's Sentinel later adapted the same algorithm into QPS admission control and made the cold factor configurable. Node, meanwhile, has mostly settled on token buckets.

So I implemented it in TypeScript, working from the published equations rather than translating the Java, and published it as [`slow-start`](https://www.npmjs.com/package/slow-start).

The number that makes the difference concrete: fire 400 requests at once at a limiter configured for 100 a second. A token bucket with the same 300-permit stored capacity admits all 400 inside the first second. From cold, `slow-start` admits 37.

---

## Writing it was the short part

Then came the problem I had not budgeted for, which is that I had no idea whether it was right.

An algorithm implemented from equations is exactly the sort of thing that can be quietly, confidently wrong. And the obvious way to test it is a trap: run the implementation, look at the output, turn the output into assertions. That suite will pass forever. Every misreading you made is already sitting in the expectations, labelled as correct behaviour. Drop the `0.5` from `thresholdPermits = 0.5 × warmupPeriod / stableInterval` and every derived value in the system shifts together, consistently, and nothing ever goes red.

What you need is an **oracle** — expected values produced by something that is not your code. I ended up with three, each catching a different class of mistake.

**Hand derivation from the equations.** Twelve acquisitions, chosen to hit every branch: cold start, resync firing, resync deliberately *not* firing because the timeline was already ahead of the clock, the threshold crossing, an idle period longer than the whole warm-up window, a request for more permits than the pot can hold, and a fully drained pot. Worked out in a spreadsheet with live formulas rather than typed-in results, so the parameters remain editable and every number recomputes.

**Self-consistency against the geometry.** The constants were derived from a handful of properties, so those properties have to hold. Draining the sloped region must cost exactly the warm-up period. Draining the flat region must cost exactly half of it. `intervalAt(maxPermits)` must equal `coldInterval`. A wrong constant breaks at least one of them.

**Guava itself.** This was the one that mattered, because the first two layers share a failure mode: both come from *my* reading of the same equations. If the reading is wrong, they agree with each other and are wrong together. Only a genuinely independent implementation breaks that.

---

## A small Java harness

Driving Guava through the same twelve steps turned out to be most of an evening, almost none of it interesting, so here is the map.

It cannot run on a real clock — `acquire()` genuinely sleeps, and wall-clock jitter makes the run unreproducible. Guava's own test suite solves this with a fake `SleepingStopwatch` that advances only when told to, which is the same seam as the injected `Clock` in my implementation. The class is package-private, so the harness declares itself part of `com.google.common.util.concurrent` and lives in a matching directory.

Three details that cost real time:

- The limiter has to be built through the package-private `RateLimiter.create(rate, warmupPeriod, unit, coldFactor, stopwatch)` and cast to `SmoothRateLimiter`, because the state lives on the subclass rather than the public type.
- `acquire()` is the wrong entry point — it sleeps and returns seconds slept. `reserveEarliestAvailable(permits, nowMicros)` returns the grant time directly.
- `storedPermits` is package-private and readable. `nextFreeTicketMicros` is **private**, and has to come out through the accessor `queryEarliestAvailable(0)`.

Then twelve rows in, twelve rows out, and a diff.

---

## One microsecond

They agreed. Maximum divergence across all twelve steps: **1.0000 µs**.

The interesting part was not the size of the gap. It was where the gap wasn't.

Steps 6, 7 and 8 matched *exactly* — every digit, on grant time, stored permits and next-free ticket alike. Those happen to be the three steps whose costs land on whole microseconds: 3,100,000 and 10,000. There is nothing there for Guava to round.

That is the control, and I did not design the trace to produce it. Where truncation cannot occur, the two implementations are identical. Which means the divergence everywhere else is arithmetic representation rather than a disagreement about the algorithm — and that distinction is the entire question I set out to answer.

The truncation also turned out not to stay in the time domain, which I had assumed it would. At step 3, Guava floored `nextFreeTicket` to 89,399 instead of 89,400. At step 4, resync therefore measured the idle gap as 10,601 µs rather than 10,600, and bought 1.0601 permits instead of 1.0600 — leaving 297.0601 stored permits against an exact 297.0600. A rounding artifact in one step becomes different *state* in the next.

The effect is bounded and it is worth knowing the direction. Guava's timeline runs up to a microsecond behind exact, per acquisition, which means it grants marginally early. Against a 10,000 µs stable interval that is a systematic rate error below **0.01%**, always in the permissive direction.

---

## Deciding not to match

Having found the divergence, the obvious move is to reproduce it. I decided not to.

Guava floors because a Java `long` cannot hold a fraction of a microsecond. That is a constraint of the language, compiled into the reference implementation — not a decision anyone made about rate limiting. TypeScript numbers are doubles. Reproducing the truncation would mean writing *additional* code to import another runtime's arithmetic limitation, and being marginally less accurate as a result.

So the implementation keeps exact arithmetic, is not bit-identical to Guava, and says so in its README, along with the bound and the direction.

Fidelity to a reference implementation and correctness are not the same property. Most of the time they point the same way, and it is worth noticing the cases where they don't, so that you can say which one you actually bought.

---

## Where the analogy runs out

I should be honest about the limit of the story I have just told, because it is a real one.

TCP slow start is **closed-loop**. The congestion window responds to acknowledgements and to loss — the network is continuously telling the sender what it can take, and the sender listens. That feedback is the whole idea.

`SmoothWarmingUp` is **open-loop**. It ramps on a timer. No signal from the service can change the curve: if your cache warms in 200 milliseconds you still serve the full window at reduced rate, and if it takes thirty seconds the limiter opens anyway, on schedule, into a process that is not ready.

The closed-loop version does exist — Netflix's [concurrency-limits](https://github.com/Netflix/concurrency-limits) estimates the bottleneck from observed latency in something close to the spirit of the 1988 paper, and Node has `perf_hooks.monitorEventLoopDelay`, which is arguably a better overload signal than anything available on the JVM.

But *following a rate you configured* and *deciding the rate for you* are two different products, and the second one drags in signal collection, cgroup-aware CPU accounting and an entire class of oscillation problems that need their own test strategy. It is filed as an issue on the repository and deliberately not built.

---

## The thing that transferred

1986: you do not know the capacity of the path, so do not guess it. Start below what you think it can take.

The version I needed: you do not know the capacity of a process that started thirty seconds ago either. Start below what you think it can take.

Same conclusion, different resource, forty years apart. Most of what looks like a new problem in infrastructure is a solved problem that has been re-encountered at a different layer, wearing different words. The trick is recognising the shape.

---

**`slow-start`** — [npm](https://www.npmjs.com/package/slow-start) · [GitHub](https://github.com/srivathsav01/slow-start)

The twelve golden vectors, the spreadsheet, the raw Guava output and the full write-up are committed in the repository under `verification/`.

### Sources

- Van Jacobson, [*Congestion Avoidance and Control*](https://ee.lbl.gov/papers/congavoid.pdf), SIGCOMM 1988
- [RFC 5681](https://www.rfc-editor.org/rfc/rfc5681.txt), *TCP Congestion Control*, §4.1 Restarting Idle Connections
- Google Guava, [`SmoothRateLimiter.SmoothWarmingUp`](https://github.com/google/guava/blob/master/guava/src/com/google/common/util/concurrent/SmoothRateLimiter.java) (Apache-2.0)
- Alibaba Sentinel, [`WarmUpController`](https://github.com/alibaba/Sentinel/blob/master/sentinel-core/src/main/java/com/alibaba/csp/sentinel/slots/block/flow/controller/WarmUpController.java) (Apache-2.0)
- Netflix, [concurrency-limits](https://github.com/Netflix/concurrency-limits)
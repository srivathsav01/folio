---
title: A Number That Was True Earlier
date: 2026-10-02
summary: I implemented Guava's warm-up rate limiter in TypeScript, then spent longer proving it correct than writing it. Along the way: why the internet collapsed in 1986, why a token bucket is most generous exactly when your service is least ready, and the one microsecond where Google and I disagree.
tags: [meta]
cover: ARPANET_IMP.jpg
coverAlt: Concentric rings with a green marker at the centre.
coverFocus: 54.5% 0%
---

In October 1986, the internet nearly stopped working.

Two machines at Berkeley, a few hundred metres apart, watched their throughput fall from 32 kbps to 40 bps. A factor of a thousand, across a distance you could walk in five minutes.

Nothing was broken. No cable had been cut, no router had failed. Every sender on the network was doing exactly what its code told it to do, which was to send as fast as it could. The network jammed, everyone retried, and the retries made the jam worse.

Van Jacobson and Michael Karels worked out what had happened and published it in 1988 as [*Congestion Avoidance and Control*](https://ee.lbl.gov/papers/congavoid.pdf), still one of the most consequential papers in networking.

The failure went like this. A TCP sender opened a connection and immediately began transmitting at whatever window size it had been configured with. That number was picked in advance, and it had no relationship to what the path between the two machines could actually carry. When the path could carry less, the queues filled. Full queues drop packets. Dropped packets get retransmitted. Retransmissions add load to a network that is already over capacity, which fills the queues further.

Every step in that loop is a correct implementation of its specification. The loop still eats the network.

Jacobson's fix was almost polite: **start slow**. Send a little, see what gets through, then speed up. Set the window to a single packet, and for every acknowledgement that comes back, add one more. The window roughly doubles each round trip and stops climbing the moment the network signals that it has had enough. The acknowledgements become a clock, and no new packet goes into the network until an old one has left it.

Every TCP connection you open today still does this. It is called slow start.

---

## The part almost nobody quotes

Slow start gets taught as a startup behaviour, which undersells it. [RFC 5681]{An RFC is how the internet's technical standards get written down. [RFC 5681](https://www.rfc-editor.org/rfc/rfc5681.txt), "TCP Congestion Control" (2009), is the official IETF specification that turned Jacobson's 1988 paper into a binding standard} applies it to restart as well. A connection that has gone quiet for longer than its [retransmission timeout]{how long a TCP sender waits for an acknowledgement before deciding the packet was lost and sending it again} is told to shrink its window back down and climb again from the bottom.

The reason is that the congestion window is only ever a guess, and it stays trustworthy only while it is being checked. The sender raised it to its current value because packets kept coming back acknowledged at that rate, which was live evidence the path could carry it. Go quiet and that evidence stops arriving. The path is shared, so other senders may have taken the room you were using, and you have no way of finding out because finding out requires packets in flight. What you are left holding is a number that was true earlier.

The RFC then adds a caveat that reads like a bug report from the future. To apply the rule at all you have to decide when a connection counts as idle, and the obvious way is to check how long it has been since traffic last moved. The warning is about which direction you look. A server that measures from the last thing it received will never see an idle connection, because the request always arrives a moment before the response goes out. By that measure the connection has only just been busy. So the server keeps the large window it earned earlier and sends a full burst down a path it has not measured in minutes.

Forty years later I ran into the same shape one layer up.

---

## A 429 in a bug report

The platform I work on runs more than fifty performance test runs a day, and every one of them begins with a ramp-up period. That is not a formality. A system measured from cold measures the warm-up rather than the system, so if you open a load test at full throughput, your p99 is a story about JIT compilation and empty caches.

Then someone using the platform filed a bug. Their script was coming back with 429s.

Their test plan had a thread group of a few hundred users with the ramp-up period set to zero, so every thread started in the same instant and arrived together. The limiter on the far side returned 429 to most of them. Nothing collapsed. The limiter was doing precisely its job, and the only thing being wasted was an afternoon.

But strip away forty years and a few layers of abstraction and the shape is the one Jacobson described: open at full speed into a capacity you never measured, get told no, and answer by sending more. The fix turns out to be the same from either end, because a client that paces itself and a server that paces its callers are running the same algorithm in opposite directions.

Ramp-up periods had been going past me fifty times a day for two years, and I had never once turned the idea around. Production traffic extends no such courtesy.

Real traffic arrives at whatever rate it happens to arrive, and a service that restarted thirty seconds ago has no way of asking it to wait. The gap is widest right after a deploy, when the caches are empty, the connection pool is unfilled and nothing has been JIT-compiled yet. A limiter configured for a thousand requests a second will hand over a thousand requests a second to a process that can currently serve a hundred.

So the requests pile up, responses get slower, and the health check times out along with everything else. The orchestrator reads that timeout as a dead instance and restarts it, which throws away the caches that had finally warmed and starts the whole problem again on a fresh process. Google's [SRE book](https://www.oreilly.com/library/view/site-reliability-engineering/9781491929117/ch22.html) gives this shape a chapter and calls it a cascading failure. Every component is behaving correctly. The behaviour of all of them together is the outage.

The uncomfortable part is that the standard tool makes it worse. A token bucket accumulates capacity while it sits idle, which is the whole point of a token bucket and a good property against a warm system. But it also means an idle bucket is a *full* bucket, so the moment of restart is the moment the limiter is at its most permissive. Which is the exact opposite of what RFC 5681 decided about idle connections.

---

## The algorithm already existed

Java had solved this years earlier, and I had walked past it more than once without looking properly. Guava's `RateLimiter` has a mode called [`SmoothRateLimiter.SmoothWarmingUp`](https://github.com/google/guava/blob/master/guava/src/com/google/common/util/concurrent/SmoothRateLimiter.java): after an idle period it opens at a fraction of its configured rate and climbs to full over a window you choose.

The phrase people reach for is "a token bucket run backwards", which gets the outcome right and the machinery wrong. Idling does leave you throttled rather than free to burst, but nothing is reversed. The accumulation is identical: the pot still fills while idle, at a steady rate, capped at a maximum, exactly as a bucket does. What changes is the question being answered. A bucket answers admission, is there a token or not. This answers price, how long the caller waits for the one it is taking, and the price depends on how many permits are sitting in the pot:

```
intervalAt(x) = stableInterval                             if x ≤ thresholdPermits
              = stableInterval + (x − threshold) × slope   if x > thresholdPermits
```

A permit drawn from a nearly full pot costs `coldInterval`, which with a cold factor of 3 is three times the steady-state interval. At or below the threshold it costs `stableInterval`, which is the full configured rate.

So a full pot is a slow pot, and that single inversion is the whole algorithm. The limiter warms up by being used: every request drains permits, and draining them lowers the price of the next one. There is no timer counting up to full rate and no schedule bolted on top. The ramp is a side effect of how the limiter charges.

What falls out of the sliding price is that the wait for a batch of permits is the area under that line rather than a multiplication. Drain the whole sloped section and the area comes to exactly the warm-up window you configured, which is where the number in your config actually lives.

Two consequences I had to sit with.

**Going idle makes you cold again.** Time that passes without traffic is converted back into stored permits, capped at the maximum, so a quiet service refills its own pot and raises its own prices. This is RFC 5681's conclusion about congestion windows, reached independently, for a resource that has nothing to do with networks.

**Each caller pays the last caller's bill.** A caller is let through at the time already on the clock, and only then is the cost of its permits added. The first request after an idle period therefore waits nothing at all and hands its bill to whoever arrives next. The debt runs one caller behind the whole way, which makes the ramp track real demand rather than the timing of any single arrival.

Alibaba's [Sentinel](https://github.com/alibaba/Sentinel/blob/master/sentinel-core/src/main/java/com/alibaba/csp/sentinel/slots/block/flow/controller/WarmUpController.java) later adapted the algorithm into QPS admission control and made the cold factor configurable. Node, meanwhile, has mostly settled on token buckets. So I implemented it in TypeScript from the published equations and released it on npm as [`slow-start`](https://www.npmjs.com/package/slow-start).

One number makes the difference concrete. Fire 400 requests at once at a limiter set to 100 a second. A token bucket with the same 300-permit stored capacity admits all 400 inside the first second. From cold, `slow-start` admits 37.

---

## Writing it was the short part

Then came the problem I had not budgeted for, which was that I had no idea whether any of it was right.

An algorithm implemented from equations is exactly the kind of thing that can be quietly, confidently wrong. And the obvious way to test it is a trap. Run the implementation, look at the output, turn the output into assertions. That suite will pass forever, because every misreading you made is already sitting in the expectations with a label on it saying "correct behaviour". Drop the `0.5` from `thresholdPermits = 0.5 × warmupPeriod / stableInterval` and every derived value in the system shifts together, consistently, and nothing ever goes red.

What you need is an [**oracle**]{Expected values produced by something that is not your code}. I ended up with three, each catching a different kind of mistake.

- **Hand derivation from the equations.** Twelve acquisitions, picked to hit [every branch]{Cold start. Resync firing. Resync deliberately *not* firing, because the timeline had already run ahead of the clock. The threshold crossing. An idle period longer than the whole warm-up window. A request for more permits than the pot can hold. A fully drained pot.}. I worked them out in a spreadsheet with live formulas rather than typed-in results, so the parameters stay editable and every number recomputes.

- **Self-consistency against the geometry.** The constants come from a handful of properties, so those properties have to hold. Draining the sloped region must cost exactly the warm-up period. Draining the flat region must cost exactly half of it. `intervalAt(maxPermits)` must equal `coldInterval`. A wrong constant breaks at least one of them.

- **Guava itself.** This was the layer that mattered, because the first two share a failure mode. Both of them come from my reading of the same equations, so if the reading is wrong they agree with each other and are wrong together. Only a genuinely independent implementation breaks that.

---

## A small Java harness

Comparing against Guava meant running Guava, and that took most of an evening for reasons that were all plumbing.

The problem is that Guava's limiter does its waiting by actually sleeping. Ask it for a permit it cannot give you yet and the thread stops for a while, so a run takes real time and no two runs produce quite the same numbers. Useless for a comparison. What I needed was a clock I controlled, so I could say "it is now exactly 200 milliseconds in" and read the answer off.

Guava's own test suite does precisely this, with a fake stopwatch that moves only when told. It is not part of the public API, so my file had to declare itself a member of Guava's internal package to reach it, a trick that feels illegal and is merely ugly.

The rest was finding the right door in. The public `acquire()` method sleeps and then reports how long it slept, which is not the number I wanted. One level below it there is a method that returns the time a caller would be granted without waiting for it, and that is the one a comparison needs. Of the three values I wanted to read afterwards, two were reachable and the third was private, and had to come out through a query method that exists for a different purpose entirely.

Then twelve rows in, twelve rows out, and a diff.

---

## One microsecond

They agreed. The largest divergence across all twelve steps was **1.0000 µs**.

The interesting part was not the size of the gap. It was where the gap wasn't.

Steps 6, 7 and 8 matched exactly. Every digit, on grant time and stored permits and next-free ticket alike. Those happen to be the three steps whose costs land on whole microseconds, so there is nothing there for Guava to round.

That is the control, and I did not plan it. Where there is no rounding to do, the two implementations agree perfectly. Which means the gaps everywhere else come from how the two languages store numbers, and not from the two of us disagreeing about the algorithm. That was the entire question I set out to answer, and it turned up on its own in the middle of the data.

The rounding also leaked somewhere I had not expected, which is into the state itself. At step 3, Guava rounded a timestamp down to 89,399 rather than 89,400. One microsecond. But the next step works out how long the limiter has been idle by subtracting that timestamp, so it saw a gap one microsecond longer than the real one, bought a slightly larger fraction of a permit with it, and ended the step holding 297.0601 permits where exact arithmetic holds 297.0600. A rounding error in one acquisition had quietly become a different starting position for the next.

It stays small and it always leans the same way. Guava's internal clock runs up to a microsecond behind the exact value on every acquisition, so it releases callers a fraction early rather than a fraction late. Against intervals of 10,000 microseconds that is a rate error under 0.01%, always slightly generous and never slightly strict.

---

## Deciding not to match

Having found the divergence, the obvious move is to reproduce it. But I decided not to.

Guava floors because a Java `long` cannot hold a fraction of a microsecond. That is a constraint of the language, compiled into the reference implementation. It is not a decision anyone made about rate limiting. TypeScript numbers are doubles, so reproducing the truncation would mean writing extra code to import another runtime's arithmetic limitation, and being marginally less accurate for the trouble.

So the implementation keeps exact arithmetic, is not bit-identical to Guava, and says so in its README along with the bound and the direction.

Fidelity to a reference implementation and correctness are not the same property. Most of the time they point the same way. It is worth noticing the cases where they don't, so that you can say which one you actually bought.

---

## Where the analogy runs out

I have leaned on the TCP parallel for most of this post. Here is where it gives out.

TCP listens. That is the whole of it. The congestion window grows while acknowledgements keep arriving and shrinks when packets start disappearing, so the network reports back continuously and the sender adjusts to what it hears. The measurement never stops.

My limiter listens to nothing. The curve is fixed in advance: it infers coldness from how long the pot has been refilling and warmth from how much of it has been spent, and neither of those is a measurement of the service. If the caches warm up in two hundred milliseconds it holds the rate down for the full window anyway and wastes the capacity. If they take thirty seconds it opens on schedule and hands full traffic to a process that is not ready. The right shape of answer, applied blind.

The listening version does exist. Netflix's [concurrency-limits](https://github.com/Netflix/concurrency-limits) watches response latency and infers from it how much the downstream service can currently take, which is much closer to what Jacobson was doing. Node even has a signal the JVM lacks: `perf_hooks.monitorEventLoopDelay` reports directly when the event loop is falling behind, which is about as honest an overload signal as a Node process can give you.

The reason I did not build it is that it stops being the same library. Following a rate somebody configured and deciding the rate yourself are different jobs, and the second one brings in metrics collection, container-aware CPU accounting, and the question of how to stop the limiter oscillating once it over-corrects. So I left it out, and that is a decision rather than a gap.

---

## The thing that transferred

Jacobson's lesson in 1988 was not really about packets. It was that capacity is not a number you can write down in advance. It is a measurement, it goes stale, and the only honest way to find it is to start below what you think it is and climb.

The version I needed, forty years later and several layers up, was that same sentence with one noun changed. You do not know how much a process that started thirty seconds ago can take. So do not open at the rate on its config card.

What I keep turning over is why this has to be learned again at every layer. I think it is because the number always arrives from the wrong direction. Somebody has to put a value in a config file, and a config file is where guesses go to look like facts. A thousand requests a second is a claim about the system at its best, not about the system thirty seconds after a restart, and nothing in the file records the difference.

Which is the small thing a warm-up limiter actually fixes. Not the capacity, which it still cannot measure. Just the assumption that the configured number was true the whole time.

The 429 in that bug report was a client finding this out the expensive way, by being refused. Most of the time nobody files a bug. The deploy goes out, the first thirty seconds are bad, somebody blames the network, and the shape stays invisible for another forty years.

---

**`slow-start`** · [npm](https://www.npmjs.com/package/slow-start) · [GitHub](https://github.com/srivathsav01/slow-start)

The twelve golden vectors, the spreadsheet, the raw Guava output and the full write-up are committed in the repository under `verification/`.
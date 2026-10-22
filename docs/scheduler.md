# Platform Atlas — Scheduler

Status: proposed, not yet implemented

## The one rule that matters

**Compute the due set from persisted state. Never mutate during render.**

The naive implementation recomputes "today's list" inside the component body, so
every render re-rolls what is due. Items vanish when you tab away, and the list
changes shape mid-session. Compute once from stored state, treat it as derived
data, and write only when the user actually answers.

This is the same rule as lifting state in React, applied to time.

## Due calculation

```
due = user_product.due_at <= startOfToday()
```

`startOfToday()` is computed once per app load and held constant for the session.
Recomputing it per render is how you get an item that flips to due at 00:00:01
while you are mid-answer.

Scope filter: only products in the active core set. Unseen products in the core
set are always due, because they have no history and a default `due_at` of now.

## Intervals

Fixed ladder, not SM-2. SM-2 is well-understood but its behaviour is opaque and it
is hard to explain in a portfolio walkthrough. A fixed ladder is predictable,
debuggable, and you can defend it in an interview.

```
again      -> 0 days   (re-queue today)
hard       -> 1 day
good       -> 3 days
easy       -> 7 days
mastered   -> 30 days, then 90
```

The first pass is 1d / 3d / 7d / 14d / 30d, matching your existing vault cadence,
then it decays toward 90 days for items you keep getting right.

## Skip is not free

Skipping an item must advance its `due_at` and log a `review` row with
`quality = 0` and `answer = null`. Otherwise the item is silently rescheduled
forever and you never notice you are avoiding it.

The visible consequence: skipping an item you did not know is worse than answering
it wrong. That is the correct incentive.

## Determinism

The same persisted state must always produce the same today list. No randomness,
no "shuffle for variety", no time-dependent ordering. If you want variety, order
by `due_at` ascending, then by `product_id`. Stable and reproducible.

## Property tests, not just unit tests

The due-date math looks right and drifts by a day. Assert:

- Each quality value maps to the expected next `due_at` from a known date.
- A skipped item still advances.
- The same state produces the same list on repeated calls.
- Day boundaries: an item due at 23:59 is not due at 00:01 the same day.
- Clock skew: the scheduler uses the server date, never the client date.

The last one is a security property, not a convenience one. If the client supplies
the date, you can mark anything as reviewed and never be shown it again.

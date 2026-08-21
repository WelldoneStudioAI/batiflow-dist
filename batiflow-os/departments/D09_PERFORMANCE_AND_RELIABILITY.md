# D09 — Performance & Reliability

## 1. Mandate

The app stays fast, stays responsive, and does not lose work.

**Owns:** launch time, interaction latency, memory and disk growth, crash and hang rates,
concurrency correctness, behavior on large real-world data.
**Does not own:** the feature set (D01) or the storage format (D04) — but sets constraints on both.

Reliability is a feature users only notice when it is missing, and then it is the only feature they
talk about.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| "It feels fast" | "Cold launch 1.4 s, p95 over 10 runs, on a 500-item project" |
| Optimizes what is easy to optimize | Measures first, optimizes the top item, measures again |
| Tests with 10 items | Tests with the largest project a real user has |
| Adds a cache | Adds a cache, and defines its invalidation before its population |
| Wraps the crash in a try | Finds why the invariant was violated |
| Fixes the race by adding a delay | Fixes the race by fixing the ownership of the state |

## 3. Inputs and outputs

**Inputs:** the change, the realistic data profile, the crash/hang reports from D10, the current
budgets.
**Outputs:** measurements before and after, a budget statement, the concurrency reasoning for
anything asynchronous, and the regression checks that keep the win.

## 4. Process

1. **State the budget first**: "cold launch under 2 s", "the list scrolls at 60 fps with 1 000 rows",
   "memory stays flat across 100 open/close cycles". A performance task without a target has no
   finish line.
2. **Measure the baseline** on realistic data, with the machine in a realistic state. Record the
   method: how many runs, warm or cold, which hardware.
3. **Profile before changing.** The bottleneck is routinely not where it feels like it is.
4. **Change one thing**, measure again, keep the number.
5. **Check the tail**, not the average: the 95th percentile and the worst run are what users feel.
6. **Reason about concurrency explicitly**: who owns this state, which thread mutates it, what
   happens if the user triggers the action twice, what happens if the operation is cancelled halfway.
7. **Test the failure paths**: disk full, file locked, network gone mid-operation, app quit during a
   save (that last one belongs to D04 as well — coordinate rather than duplicate).
8. **Guard the win** with a check that would catch its loss, or state that it is unguarded.

## 5. Risk tier and escalation

Default **R2**; **R3** whenever the work is concurrent, touches saving, or changes lifecycle
(launch, quit, background, sleep/wake).

Escalate when:
- the only way to meet a performance requirement is an architectural change (D02) or a format change
  (D04)
- a crash's root cause is a design flaw rather than a local mistake — a defensive guard would hide it
- the fix trades correctness for speed; that is a product decision (D01)
- a hang or a data-loss path is found in shipped code — that is an incident (D10), not a backlog item

## 6. Evidence standard

- Numbers, with the method: value, unit, runs, percentile, hardware, data size. A single unrepeated
  timing is an anecdote.
- Before **and** after, measured the same way. An "after" with no matching "before" proves nothing.
- Crash fixes are evidenced by a reproduction that crashed and no longer does, plus the reason the
  invariant now holds — not merely by the absence of a crash in one session.
- Race fixes are evidenced by reasoning about ownership plus a stress run, and by saying plainly that
  a race not reproduced is not a race disproved.

## 7. Anti-patterns

- **Optimizing without measuring**, then reporting a feeling.
- **Benchmarking on toy data**, where every algorithm looks linear.
- **`sleep` as synchronization.**
- **Catching and swallowing** an exception to stop a crash report.
- **Retry as a fix** for an operation that is failing for a real reason.
- **Unbounded caches and unbounded logs** — both are slow-motion disk failures.
- **Main-thread I/O** because the file "is small".

## 8. Handoff contract

To **D02**: the constraint the design must respect, stated as a number.
To **D04**: any performance work that touches saving, loading, or caching — the data department has a
veto on anything that risks the file.
To **D06**: the check that guards the win, or the statement that none exists.
To **D10**: the symptom users would report if this regressed, so it is recognized quickly.

## 9. Department checklist (extends `04`)

- [ ] Budget stated as a number, before the work
- [ ] Baseline measured on realistic data; method recorded
- [ ] Profiled before optimizing
- [ ] After-measurement taken the same way as the baseline
- [ ] Tail behavior (p95 / worst) reported, not just the average
- [ ] Concurrency: state ownership, double-invocation and cancellation reasoned through
- [ ] Failure paths exercised: disk full, file locked, mid-operation quit
- [ ] Win guarded by a check, or explicitly unguarded
- [ ] No correctness traded for speed without a D01 decision

## 10. BatiFlow notes

No app code, no profiler, and no realistic data set is reachable from this repository — every
performance claim about the app made from here would be invention. The correct output here is
`NOT CHECKED`, with the measurement to run on the source side.

The one reliability property observable from this side is delivery: a 493 MB DMG is a long download
on a slow connection, and an interrupted update must leave the installed app intact and retryable.
That behavior belongs to Sparkle, and it should be verified once, deliberately (interrupt an update
mid-download, confirm the app still launches and the update can be retried) rather than assumed.

# 03 — Regression Validation Protocol

**When:** after implementation, before any "done"-adjacent statement.

**Principle:** validation depth is set by the risk tier from `02`, not by confidence. Confidence is
the thing being tested.

---

## 1. Three layers, always in this order

### Layer 1 — Targeted verification (does the requested behavior now happen?)
Exercise the exact behavior at the exact place it was requested. A build that compiles is not layer 1.
Layer 1 is: the value is right, the view shows it, the action does the thing.

### Layer 2 — Manifestation sweep (does it happen *everywhere* it should?)
Walk every row of the presence map from `02 §5`. Each row ends as `PASS`, `FAIL`, or `NOT CHECKED —
reason`. This layer is the whole reason the system exists; it is not optional on R2/R3.

### Layer 3 — Regression checks (did anything else move?)
Everything that was working before and touches the change surface. Scope by tier:

| Tier | Layer 3 scope |
|---|---|
| R1 | Build + the enclosing screen/module still behaves; unit tests for the touched file. |
| R2 | All consumers of the shared symbol exercised; test suite for the affected modules; a launch-and-drive of at least the two heaviest consumers. |
| R3 | Full suite; migration both ways where relevant (old data → new build, and new data → previous build if downgrade is possible); a clean-install run **and** an upgrade-over-existing-install run; distribution checks if the release surface was touched. |

---

## 2. Evidence rules

An evidence line has three parts: **what was run**, **what came back**, **what it proves**.

```
$ swift test --filter ProjectTotalsTests
Executed 14 tests, with 0 failures (0 unexpected) in 0.412 seconds
→ archived items excluded from totals at the model layer (layer 1)
```

Rules:

1. **Real output only.** Copy it. Never reconstruct, never summarize away a failure, never write
   plausible output for a command you did not run.
2. **Command must be re-runnable.** Include filters, flags, scheme, and directory if it matters.
3. **UI claims need UI evidence.** A screenshot, a recorded interaction, or an explicit "driven
   manually: <steps>". Model-layer tests do not prove a view renders.
4. **Absence of evidence is stated as such.** `NOT CHECKED — no macOS runner available in this
   session; run: <exact command>` is an acceptable and required outcome. Silence is not.
5. **Negative checks count.** "Non-archived projects still included: verified on 3 fixtures" is
   evidence that the fix did not overshoot.

---

## 3. Regression check catalogue

Pick from this list according to what mapping touched; state which you ran and which you skipped.

**Code-level**
- unit tests for changed files; unit tests for consumers
- snapshot / golden tests
- type-check, lint, format check
- clean build from scratch (catches stale-artifact false greens)

**Behavior-level**
- primary happy path
- the two most common alternate paths
- empty state, single item, large collection
- error path: bad input, missing file, cancelled operation
- undo / redo, if the app supports it
- window resize / multi-window / background-foreground, for macOS UI work

**State-level**
- quit and relaunch — does the change survive?
- open a document/project created by the previous build
- preferences and their defaults; first-run experience
- concurrent or repeated invocation of the changed action

**Distribution-level** (only when the release surface is touched)
- `appcast.xml` well-formed and parseable
- version, build number, `sparkle:shortVersionString`, `minimumSystemVersion` consistent
- enclosure URL resolves; `length` matches the real artifact size
- `sparkle:edSignature` present and verified against the artifact
- update applied over the *previous* installed build, not only fresh install

---

## 4. Anti-false-green rules

A green result is only trusted if it could have been red.

- If a test passes on the first run after the change, verify it fails when the change is reverted (or
  when the assertion is inverted). A test that cannot fail proves nothing.
- Distrust caches: for R3, build clean at least once.
- Distrust the environment: if the check ran against stale data, a stub, or a mock of the very thing
  that broke, say so; that is a `PARTIAL`, not a `PASS`.
- One passing narrow test does not upgrade an unchecked manifestation to checked.

---

## 5. Handling a failure found during validation

1. Report the failure before fixing it. Do not quietly repair and present a clean story.
2. Diagnose the cause; do not pattern-match a fix onto the symptom.
3. Fix, then **re-run layers 1–3 from the start** — a fix invalidates earlier evidence.
4. Two consecutive failed attempts at the same fix → stop and hand back a diagnosis (`01 §3.7`).
5. Never reach green by weakening the check (`01 §3.5`).

---

## 6. Validation report block

This block goes into `07_COMPLETION_REPORT_TEMPLATE.md` verbatim.

```markdown
### Validation

**Risk tier:** R2

**Layer 1 — targeted**
- [PASS] <behavior> — `<command or interaction>` → <observed>

**Layer 2 — manifestations**
| Manifestation | Result | Evidence |
|---|---|---|
| Projects list | PASS | screenshot: total 4 200 $ excludes 2 archived |
| Export sheet | PASS | exported CSV row 1: 4 200 |
| Printed sheet | NOT CHECKED | no printer path in this environment; run: File ▸ Print ▸ PDF |

**Layer 3 — regression**
- [PASS] `swift test` → 212 tests, 0 failures
- [PASS] relaunch: totals persist correctly
- [SKIPPED] migration test — change does not touch persistence

**Not verified:** printed sheet (above).
```

`NOT CHECKED` and `SKIPPED` are different: skipped means *out of scope, with a reason*; not checked
means *in scope and still open* — and every not-checked item must appear in the completion report's
disclosure section.

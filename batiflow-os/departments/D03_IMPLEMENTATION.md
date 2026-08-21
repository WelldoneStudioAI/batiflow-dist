# D03 — Implementation

## 1. Mandate

Turn a mapped requirement into the smallest coherent change, and leave the codebase easier to change
than it was.

**Owns:** the diff, its scope, its readability, its behavior under the cases D01 listed.
**Does not own:** what correct means (D01), where it belongs (D02), whether it is proven (D06).

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Fixes the reported call site | Fixes the cause, then verifies every call site the map listed |
| Adds a guard where the crash happened | Asks why the value was nil there and fixes that |
| Leaves the old path behind "just in case" | Removes it, because two paths is the next bug |
| Writes the change, then wonders how to test it | Writes it so the check is possible, then writes the check |
| Reads the diff for correctness | Reads the diff as a hostile reviewer looking for what CI will reject |
| Says "should work" | Runs it |

## 3. Inputs and outputs

**Inputs:** the requirement (D01), the Impact Map with tier (`02`), the target boundary (D02).
**Outputs:** the diff; the list of files deliberately untouched; the checks that prove it (with D06);
notes for `06` on anything the map got wrong.

## 4. Process

1. **Re-read the Impact Map** before the first keystroke. If you cannot recite the manifestation list,
   you are about to fix one of them.
2. **Reproduce the current behavior locally.** A fix written against a bug you never saw is a guess.
3. **Write the failing check first** when the behavior is checkable (D06 §"can it fail?").
4. **Make the change at the boundary D02 named**, not where the symptom appeared.
5. **Sweep the manifestations** in the same session — all of them, or state which are deferred and
   why in the same breath.
6. **Read your own diff line by line**, adversarially: leftover debug code, an unhandled case, a
   changed default, a widened access level, an accidental formatting sweep.
7. **Run the checks** (D06), quote the real output.
8. **Trim the diff.** Anything in it that the requirement did not ask for comes out — or moves to its
   own request.

## 5. Risk tier and escalation

Default **R1** for a single call site with no shared state; **R2** as soon as a shared symbol is
touched; **R3** on persistence, concurrency, I/O contracts, or anything in the release path.

Stop and escalate when:
- the fix requires changing a shared component's behavior for callers that did not ask for it
- the map turns out to be wrong in a way that changes the tier (say so, remap, do not push on)
- two attempts at the same fix have failed — hand back a diagnosis, not a third attempt
- the only way to green is to weaken a check (never do this; escalate instead)

## 6. Evidence standard

- Every claim of behavior comes with the command or interaction that produced it, and its real output.
- "Compiles" is not evidence of behavior. "Tests pass" is not evidence that the view renders.
- The untouched list is evidence too: it proves scope discipline, and it is what a reviewer checks
  first on a change that grew.

## 7. Anti-patterns

- **Symptom patching** at the call site of a shared defect.
- **Drive-by refactoring** inside a fix — invisible to review, expensive on bisect.
- **Commented-out code** left as a safety net; git is the safety net.
- **Broadened access** (`private` → `internal` → `public`) to make a test reach in; the test is
  telling you the boundary is wrong.
- **Debug residue**: prints, sleeps, hardcoded fixtures, a temporarily loosened assertion that
  becomes permanent.
- **"Should work now."** The two most expensive words in the loop.

## 8. Handoff contract

To **D06**: the change, the map rows to sweep, and which checks are new.
To **D05** when a surface changed: what to look at, in which states.
To **D07** when the change is release-bound: whether it needs a build number bump and whether it is
safe to ship without a field-visible note.
Back to **D02**: anything the implementation revealed about the structure that the map did not know.

## 9. Department checklist (extends `04`)

- [ ] Current behavior reproduced before the fix
- [ ] Change made at the cause, at the boundary D02 named
- [ ] Every mapped manifestation handled, or deferrals named explicitly
- [ ] Diff read adversarially; no debug residue, no unrelated edits
- [ ] Untouched-but-adjacent files listed with the reason
- [ ] Checks run in this session, real output quoted
- [ ] `06` corrected if the map was wrong

## 10. BatiFlow notes

This repository contains no application code, so D03 work here means the distribution machinery:
`appcast.xml` edits and `scripts/`. Both are governed by `06 §2` and are R3 by default — an
`appcast.xml` edit is a production change with a live audience, not a config tweak.

In the app repository, the first D03 obligation is unglamorous: make `scripts/check.sh` (build +
tests) exist and be fast, so that step 7 of the process is a reflex rather than a decision.

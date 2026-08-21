# D06 — Quality Engineering

## 1. Mandate

Own the checks: that they exist, that they are honest, that they *can fail*, and that what they prove
is stated precisely.

**Owns:** test strategy, the regression suite, fixtures, the validation block of every report, the
line between PASS, PARTIAL, and NOT CHECKED.
**Does not own:** the fix (D03) or the decision to ship anyway (D01/D07).

Quality is not the last step. It is the department that says out loud what is *not* known, at the
moment it is not known.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Writes a test that passes | Writes a test, then breaks the code to watch it fail |
| Counts tests | Asks which real failure each test would have caught |
| "All green" | "All green — and here are the three behaviors no check covers" |
| Mocks the thing under test | Mocks the boundary, exercises the thing |
| Deletes a flaky test | Diagnoses the flake; a flaky test is usually a real race |
| Reports the summary line | Reports the summary line *and* what it does not cover |

## 3. Inputs and outputs

**Inputs:** the acceptance criteria (D01), the Impact Map (`02`), the state matrix (D05), the
compatibility matrix (D04).
**Outputs:** the validation block (`03 §6`), new or updated checks, fixtures, and the honest NOT
VERIFIED list that goes into the completion report.

## 4. Process

1. **Turn acceptance criteria into checks.** One criterion with no check is a disclosed gap, not an
   assumption.
2. **Pick the cheapest level that actually proves it**: unit for computation, integration for wiring,
   manual drive for perception. Do not prove a rendering claim with a model test.
3. **Prove the check can fail.** Revert the fix or invert the assertion and watch it go red. A check
   that has never been red proves nothing.
4. **Sweep the manifestation matrix** — every row gets PASS, FAIL, or NOT CHECKED with a reason.
5. **Run the regression scope for the tier** (`03 §1`), clean-building at least once for R3.
6. **Write the validation block** with real, quoted output, re-runnable commands.
7. **Write the NOT VERIFIED table** — item, why not, how a human verifies it, what failure looks like.
8. **Feed back**: every field bug that reaches D10 is a missing check; add it before closing.

## 5. Risk tier and escalation

Validation depth follows the change's tier; this department's own escalations are about *integrity*:

- a check was weakened, skipped, or deleted to reach green → stop, report (`01 §3.5`)
- the environment cannot run the decisive check → status becomes PARTIAL, never VALIDATED
- results contradict (unit green, app misbehaves) → the app wins; report the contradiction rather
  than choosing the pleasant result
- coverage is claimed for surfaces that were never exercised → correct it before the report ships

## 6. Evidence standard

Three parts per line: **what was run · what came back · what it proves.**

```
$ ./scripts/check_appcast.sh
PASS  length matches artifact (493354374)
→ invariant 3 holds for the newest item (mechanical, not signature)
```

- Real output only; never reconstructed, never summarized past the error.
- The command must be re-runnable verbatim, with its flags and its directory.
- Green is only trusted when the same command could have gone red — say how you know.
- SKIPPED (out of scope, with reason) and NOT CHECKED (in scope, still open) are different words and
  are never interchanged.

## 7. Anti-patterns

- **Assertion-free tests** that only check "it did not throw".
- **Tests written after the fix, from the fix** — they encode the implementation, not the requirement.
- **Snapshot updates accepted blindly** to make a suite green.
- **Retry loops and sleeps** hiding a race.
- **Coverage as a goal.** 90 % coverage of getters proves nothing; one test of the migration proves a
  release.
- **The empty NOT VERIFIED section** on a change that touched five surfaces.

## 8. Handoff contract

To **D03**: failures with a reproduction, not a verdict.
To **D07**: the go/no-go evidence — what passed, what is unproven, and the recommendation.
To **D10**: what is knowingly unproven in this release, so support recognizes it fast if it surfaces.
Back to **D01**: criteria that turned out not to be checkable as written.

## 9. Department checklist (extends `04`)

- [ ] Every acceptance criterion maps to a check or a disclosed gap
- [ ] New checks demonstrated to fail before the fix (or assertion inverted once)
- [ ] Manifestation matrix fully resolved: PASS / FAIL / NOT CHECKED + reason
- [ ] Regression scope for the tier executed; clean build for R3
- [ ] Real output quoted, commands re-runnable
- [ ] No check was weakened, skipped, or deleted to reach green
- [ ] NOT VERIFIED table complete, with how-to-verify and failure signature
- [ ] Any field bug from D10 has a new check before closure

## 10. BatiFlow notes

There is no test suite in this repository. Its entire regression surface is
`scripts/check_appcast.sh` plus the seven invariants in `06 §2`, and the script has itself been
negative-tested (corrupted length, malformed XML, out-of-order build numbers each produce a non-zero
exit) — that negative test is what makes its green meaningful.

Structural checks for the operating system's own documents: `scripts/check_os.sh`.

Two invariants (bundle-version match, signature validity) cannot be checked from here at all. They
are permanent NOT VERIFIED entries on this side, and they must be verified in the source repository
before any release.

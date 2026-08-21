# 07 — Completion Report Template

**When:** at the end of every iteration that changed anything. No report, no completion — the report
*is* the deliverable's receipt.

Length follows risk: an R1 change fits in the short form and eight lines. Do not pad; do not skip.

---

## Short form (R1)

```markdown
**Status:** VALIDATED
**Change:** <one line> — `<file>:<line>`
**Evidence:** `<command>` → <real output, trimmed but not paraphrased>
**Manifestations:** single call site (confirmed by `grep -rn "<symbol>"` → 1 hit)
**Not verified:** none
```

---

## Full form (R2 / R3)

```markdown
# Completion Report — <CR id / title>

**Status:** VALIDATED | VALIDATED (PARTIAL) | IMPLEMENTED — NOT VALIDATED | BLOCKED
**Risk tier:** R1 | R2 | R3
**Date:** <YYYY-MM-DD>
**Commits:** <sha — message>

---

## 1. Requested behavior
<Observable, one or two sentences. Assumptions made, if any.>

## 2. Change surface
**Changed**
| File | What changed | Why |
|---|---|---|

**Deliberately not changed**
| File / area | Why left alone |
|---|---|

## 3. Implementation summary
<Plain language. What the code now does differently, and the one design choice worth knowing about.>

## 4. Validation

**Layer 1 — targeted**
- [PASS] <behavior> — `<command / interaction>` → <observed>

**Layer 2 — manifestations**
| Manifestation | Expected | Result | Evidence |
|---|---|---|---|

**Layer 3 — regression**
- [PASS] <check> → <output>
- [SKIPPED] <check> — <why it is out of scope>

## 5. NOT VERIFIED
| Item | Why not | How to verify | What a failure would look like |
|---|---|---|---|

<If genuinely empty: "Nothing outstanding." — and expect to defend it.>

## 6. Risks introduced
| Risk | Likelihood | Impact | Mitigation / tripwire |
|---|---|---|---|

## 7. Living app map delta
- Added: <relationship>
- Corrected: <entry — was X, is Y>
- No new relationships discovered. <only if true>

## 8. Follow-ups (not done, not implied)
- <item> — why it is separate, and what it would cost
```

---

## Rules

1. **Status first.** It is the only line some readers will read; it must be the most accurate line in
   the document.
2. **Section 5 is the point of the whole file.** A report with a suspiciously empty §5 is treated as
   an unfinished report, not a perfect one.
3. **Evidence is quoted, never described.** "Tests passed" fails. `Executed 212 tests, with 0
   failures` passes.
4. **No forward-looking claims.** "This will also fix the export" is a hypothesis; either verify it
   and move it to §4, or put it in §5.
5. **Follow-ups are not a discount.** Listing something in §8 does not let §5 omit it if it was in
   scope.
6. **The report is written last and read once more before sending**, against `04 §6`.

---

## Worked example (release change, R3)

```markdown
# Completion Report — Publish Mac 1.0 build 15

**Status:** VALIDATED (PARTIAL)
**Risk tier:** R3 — touches the Sparkle feed consumed by every installed copy.
**Date:** 2026-08-21
**Commits:** abc1234 — Appcast — BatiFlow Mac 1.0 (15)

## 2. Change surface
**Changed**
| File | What changed | Why |
|---|---|---|
| `appcast.xml` | New `<item>` for build 15; enclosure, length, edSignature | Publish 1.0b15 |

**Deliberately not changed**
| File / area | Why left alone |
|---|---|
| build 14 `<item>` | Kept so machines mid-upgrade still resolve a known good build |

## 4. Validation
**Layer 1**
- [PASS] feed parses — `xmllint --noout appcast.xml` → (no output, exit 0)

**Layer 2 — manifestations**
| Manifestation | Expected | Result | Evidence |
|---|---|---|---|
| `sparkle:version` ordering | 15 > 14 | PASS | `grep sparkle:version appcast.xml` → 15, 14 |
| Enclosure reachable | HTTP 200 | PASS | `curl -sIL <url>` → 200, content-length 496 112 908 |
| `length` matches artifact | equal | PASS | 496 112 908 == content-length above |

**Layer 3**
- [PASS] update applied over installed 1.0b14 on macOS 14.6 — Sparkle accepted the signature
- [NOT CHECKED] clean install of 1.0b15 on macOS 14.0 (minimum supported)

## 5. NOT VERIFIED
| Item | Why not | How to verify | What a failure would look like |
|---|---|---|---|
| Clean install on macOS 14.0 | No 14.0 machine available | Fresh VM, mount DMG, launch | App refuses to launch / missing symbol |
```

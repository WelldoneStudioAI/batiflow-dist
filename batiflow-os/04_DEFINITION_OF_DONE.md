# 04 — Definition of Done

**Rule:** the words *done*, *fixed*, *complete*, *working*, *resolved*, and *should work now* are
locked behind these gates. Until every applicable gate passes, the accurate status is
**IMPLEMENTED — NOT VALIDATED**.

---

## 1. The gates

| # | Gate | Passes when |
|---|---|---|
| **G1** | **Understood** | The requested behavior is restated as an observable, and any assumption is written down. |
| **G2** | **Mapped** | An Impact Map (`02`) exists for this change, with a risk tier and a stated change surface. |
| **G3** | **Implemented** | The change is the smallest coherent one; nothing unrelated was touched; the code builds. |
| **G4** | **Targeted validation** | Layer 1 of `03` passed with real evidence. |
| **G5** | **Manifestation coverage** | Every row of the presence map is PASS, or is explicitly disclosed as not checked. No row is silently dropped. |
| **G6** | **Regression** | Layer 3 checks for the risk tier ran, with real output. |
| **G7** | **No weakened checks** | Nothing was skipped, deleted, loosened, or swallowed to reach green. |
| **G8** | **Evidence recorded** | Every claim maps to a re-runnable command, a screenshot, or a described interaction. |
| **G9** | **Gaps disclosed** | The "not verified" list is complete and honest; each item says what a human must run. |
| **G10** | **Map updated** | `06_LIVING_APP_MAP.md` reflects any relationship discovered, or the report states none were. |

---

## 2. Gate applicability by tier

| Gate | R1 | R2 | R3 |
|---|---|---|---|
| G1 Understood | ✅ | ✅ | ✅ |
| G2 Mapped | ✅ (short form) | ✅ | ✅ + presence map |
| G3 Implemented | ✅ | ✅ | ✅ |
| G4 Targeted | ✅ | ✅ | ✅ |
| G5 Manifestations | n/a (single site — state it) | ✅ | ✅ |
| G6 Regression | build + local tests | consumer suite | full suite + install/upgrade + migration |
| G7 No weakened checks | ✅ | ✅ | ✅ |
| G8 Evidence | ✅ | ✅ | ✅ |
| G9 Disclosure | ✅ | ✅ | ✅ |
| G10 Map updated | if new relationship | ✅ | ✅ |

R1 never means "no gates". It means the gates are cheap.

---

## 3. Status vocabulary

Use exactly one of these; they are not interchangeable.

- **IMPLEMENTED — NOT VALIDATED** — code changed, gates G4+ not passed. Default state after editing.
- **VALIDATED (PARTIAL)** — G4 passed, G5 or G6 has disclosed open items. State them inline.
- **VALIDATED** — every applicable gate passed with evidence. This is the only status that may be
  called *done*.
- **BLOCKED** — cannot proceed or cannot validate; names the blocker and what is needed.
- **DIAGNOSED, NOT FIXED** — investigation produced a cause and a proposal, no change was made.

A message that reports **VALIDATED** without an evidence section is invalid on its face.

---

## 4. Environment-limited validation

When the session genuinely cannot run the check (no macOS host, no simulator, no signing identity, no
network, sandbox restriction):

1. Status is **VALIDATED (PARTIAL)** or **IMPLEMENTED — NOT VALIDATED**. Never **VALIDATED**.
2. Name the missing capability precisely.
3. Give the exact commands or click-path a human must run.
4. State what result would confirm success and what result would mean the change is wrong.

This is an acceptable outcome. Claiming the check passed anyway is not, ever.

---

## 5. Done-ness is per manifestation, not per request

A request is done when *every mapped manifestation* is done. Four screens showing the behavior means
four PASS rows, not one PASS and three assumptions. If only some are handled, the status is
**VALIDATED (PARTIAL)** with the remainder named — not "done, with minor follow-ups".

---

## 6. Final self-check (copy into your reasoning, not into the answer)

- [ ] Did I run everything I claim, in this session?
- [ ] Is every number, name, and output in my report copied from real output?
- [ ] Is there any manifestation I am hoping is fine?
- [ ] Did anything get easier to pass because I made it weaker?
- [ ] Could a reviewer reproduce my evidence in under five minutes from what I wrote?
- [ ] Am I using the word "done" because it is true, or because the conversation wants it?

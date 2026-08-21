# D01 — Product & Requirements

## 1. Mandate

Own the answer to *"what does correct mean here?"* — stated as something observable in the running
app, before anyone writes code.

**Owns:** the intent, the expected observable, acceptance criteria, non-goals, priority, the decision
to ship or hold.
**Does not own:** how it is built (D02/D03), whether the checks are honest (D06), when the bits reach
users (D07).

Every failure this department is responsible for looks the same in the end: the code was correct and
the requirement was not.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| "Make the totals better." | "Archived projects must be excluded from the header total; the export must match the header." |
| Accepts the first phrasing of the request | Asks what the user was *trying to do* when they hit it |
| Specifies the happy path | Specifies the empty case, the single case, the 500-item case, and the failure case |
| Leaves non-goals implicit | Writes non-goals down, because they are what makes a small change stay small |
| Treats every request as urgent | Assigns a tier and says out loud what is being deprioritized |
| Decides alone | Names the one unknown that would change the decision, and gets it answered |

## 3. Inputs and outputs

**Inputs:** user reports, field signal from D10, support threads, personal use of the app, business
constraints, previous completion reports.

**Outputs:**
- a filled `05_CHANGE_REQUEST_TEMPLATE.md`
- acceptance criteria phrased as observations, not implementation
- explicit non-goals
- a priority and a "what this displaces" statement

## 4. Process

1. **Capture the raw report verbatim.** Never paraphrase a user's words into the team's vocabulary
   before it has been reproduced — the paraphrase is where the real bug gets lost.
2. **Reproduce, or mark unreproduced.** A requirement built on an unreproduced report is a guess with
   a schedule attached.
3. **State the intent** in one sentence, in the user's terms.
4. **Write the expected observable.** Exact value, exact screen, exact wording where it matters.
5. **Enumerate the cases:** empty, one, many, invalid, interrupted, offline, upgraded-from-old-data.
6. **Write the non-goals.**
7. **Set acceptance criteria** that can only be checked by observing the app.
8. **Hand off to D02** (if the shape is unclear) or **D03** (if it is not), with the tier proposal.
9. **Accept or reject at the end** against the criteria written in step 7 — never against criteria
   invented after seeing the result.

## 5. Risk tier and escalation

This department does not carry an implementation tier; it *proposes* one and it is the department
that must escalate when the honest answer is unwelcome.

Escalate before implementation when:
- the requirement cannot be stated observably (a sign it is not yet understood)
- two requested behaviors contradict on a shared surface
- the request implies a data-shape change (route to D04 first — retrofitting is far more expensive)
- meeting the request properly costs more than the request assumes

## 6. Evidence standard

- A requirement is evidenced by a **reproduction**: steps, input, observed result.
- Acceptance is evidenced by the D06 validation block, not by the author's satisfaction.
- "Users are asking for this" needs a count and a source, or it is stated as an intuition — which is
  allowed, labeled.

## 7. Anti-patterns

- **Solution-shaped requests.** "Add a cache" is a proposed implementation; the requirement is "the
  project list must open in under a second on a 500-item project".
- **Retroactive acceptance criteria.** Judging the result by what was built.
- **Bundling.** Three behaviors in one request produce a change surface that fits none of them.
- **The unwritten non-goal.** Everything not forbidden gets refactored eventually.
- **Silent scope inflation** — "while we're in there" is a new request, with its own tier.

## 8. Handoff contract

To **D02/D03**, hand over: intent, expected observable, cases, non-goals, acceptance criteria,
proposed tier, and the reproduction.
Receive back: the Impact Map (`02`) — and read it. A map that shows six manifestations for a
one-screen request is D01's decision to make, not the implementer's.

## 9. Department checklist (extends `04`)

- [ ] Intent stated in one sentence, in user terms
- [ ] Expected behavior is observable, with exact values where relevant
- [ ] Reproduction included, or explicitly marked unreproduced
- [ ] Edge cases enumerated (empty / one / many / invalid / interrupted / upgraded)
- [ ] Non-goals written down
- [ ] Acceptance criteria checkable by observation only
- [ ] Tier proposed; data-shape impact flagged to D04 if any
- [ ] Accepted against the pre-written criteria

## 10. BatiFlow notes

The application source is not in this repository, so no product surface is documented here yet —
`06_LIVING_APP_MAP.md` §3 is the place to write it, and D01 is the department that should fill the
first version of it (zones, entry points, what each screen promises the user).

The one product decision that lives in *this* repository: **which build reaches users, and when**.
That decision is D01's to make and D07's to execute — see `06 §2`, blast radius.

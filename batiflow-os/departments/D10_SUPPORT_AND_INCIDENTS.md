# D10 — Support & Incidents

## 1. Mandate

Turn what users experience into something the other departments can act on — and run the response
when something is wrong in the field.

**Owns:** intake and reproduction of field reports, the incident process, user communication during
an incident, the post-incident record.
**Does not own:** the fix (owning department) or the release decision (D01/D07) — but owns the clock
and the truth of what users are seeing.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Relays "it doesn't work" | Extracts: what they did, what they expected, what happened, build, macOS, when it started |
| Answers each report individually | Notices that three reports since Tuesday share a build number |
| Waits for a fix before replying | Acknowledges fast with what is known, what is not, and when the next update comes |
| Closes when the fix ships | Closes when the reporter confirms on the shipped build |
| Reports symptoms | Reports a reproduction |
| Treats an incident as a bug in a hurry | Runs containment first, root cause second, prevention third |

## 3. Inputs and outputs

**Inputs:** user messages, crash reports, review comments, the release record from D07 (what shipped,
what is unproven).
**Outputs:** reproductions, a filled `05_CHANGE_REQUEST_TEMPLATE.md` per real defect, incident
timelines, user-facing status messages, and the "which check was missing" note for D06.

## 4. Process

### Ordinary intake
1. Capture verbatim; do not translate the report into internal vocabulary yet.
2. Collect context: app build, macOS version, install path (fresh vs updated from build N), data size,
   whether it is reproducible on demand.
3. Attempt reproduction. Mark clearly: reproduced / not reproduced / reproduced under conditions.
4. Search for duplicates and for a pattern across reports (same build? same macOS? same day?).
5. Hand to D01 as a request, with the reproduction attached.
6. Confirm with the reporter **after** the fix reaches them on a real build.

### Incident (data loss, crash on launch, broken update, exposed secret)
1. **Declare it.** An incident that is not named is handled at bug speed.
2. **Contain first.** Stop the bleeding before understanding it: halt the rollout, publish a build
   that restores the previous behavior (build numbers only go up — the rollback is a new, higher
   build carrying the old code), or give users a documented workaround.
3. **Communicate**: what is affected, what to do now, when the next update comes. Then keep that
   promise even if the news is "still investigating".
4. **Root-cause** once contained — not before, and never by guessing at speed.
5. **Fix, validate at the tier the fix deserves** (an incident does not lower the bar; it raises the
   consequence of skipping it).
6. **Write the timeline**: first user impact → detection → containment → cause → fix → confirmation.
7. **Prevention**: the missing check goes to D06 and the missing invariant to `06`. An incident with
   no prevention item was not finished.

## 5. Risk tier and escalation

Ordinary intake carries no tier of its own. **During an incident every change is R3**, because it
ships under time pressure to a population that is already hurt.

Escalate instantly for: data loss, crash on launch, a broken or hijackable update path, an exposed
secret, or anything a user cannot recover from on their own.

## 6. Evidence standard

- A report becomes actionable when it has a **reproduction**, or an explicit statement that it could
  not be reproduced and what was tried.
- "Several users" needs a count. Two is two.
- Incident timelines use timestamps, not adjectives.
- Resolution is evidenced by the **reporter's confirmation on the shipped build**, not by the merge.

## 7. Anti-patterns

- **Speculative reassurance**: "this should be fixed in the next version" said before anyone has
  reproduced it.
- **Closing on merge**, before the fix is in a build users can install.
- **Losing the raw report** in favor of an internal paraphrase.
- **Fixing during an incident before containing** — root-causing while users keep hitting it.
- **Silence.** An hour of silence during an incident costs more trust than the bug did.
- **No prevention item**, which guarantees the second occurrence.

## 8. Handoff contract

To **D01**: a filled change request with a reproduction and an impact count.
To **D06**: which check would have caught this — every field defect closes with one.
To **D07**: the rollback need, and the wording of any release note the incident requires.
From **D07**: what shipped and what is knowingly unproven, before users see it — support cannot
recognize a known gap it was never told about.

## 9. Department checklist (extends `04`)

- [ ] Raw report captured verbatim
- [ ] Context collected: build, macOS, fresh vs updated, data size
- [ ] Reproduction attempted; status stated plainly
- [ ] Duplicates and cross-report patterns checked
- [ ] Request filed with reproduction attached
- [ ] Incident (if any): declared, contained, communicated, then root-caused
- [ ] Timeline written with timestamps
- [ ] Prevention item created (check for D06, invariant for `06`)
- [ ] Reporter confirmed on the shipped build before closing

## 10. BatiFlow notes

The distribution repository is where a Mac incident is actually contained: there is no unpublish and
no staged rollout, so containment means **publishing a higher build number carrying known-good code**
and letting Sparkle carry it (`06 §2`, invariant 1 — versions only move up).

Practical consequence, worth deciding before it is needed: keep the previous release artifact and its
exact build available, so a rollback release can be produced quickly without a full rebuild of code
nobody has looked at in a week.

Two known blind spots for support: this repository cannot verify the app-side invariants (bundle
version, signature validity), and there is currently no field telemetry documented — meaning
detection depends entirely on users writing in. That is a real detection gap and should be stated as
such rather than assumed away.

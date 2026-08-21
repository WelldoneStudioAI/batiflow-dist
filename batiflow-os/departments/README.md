# Departments — senior development processes

`01`–`08` define *how any change is handled*. This folder defines *how each function of the
engineering organization works when it is run at a senior level*, and where each one plugs into the
gates of `04_DEFINITION_OF_DONE.md`.

One person may hold several of these hats — that is the normal case for BatiFlow. Wearing a hat still
means running that department's process, not skipping it because the room is small.

---

## The departments

| # | Department | Owns | Default tier |
|---|---|---|---|
| [D01](D01_PRODUCT_AND_REQUIREMENTS.md) | Product & Requirements | What we build and why; the observable definition of correct | — |
| [D02](D02_ARCHITECTURE.md) | Architecture | Boundaries, contracts, where change is allowed to land | R2 |
| [D03](D03_IMPLEMENTATION.md) | Implementation | The change itself, at the smallest coherent size | R1–R2 |
| [D04](D04_DATA_AND_PERSISTENCE.md) | Data & Persistence | Anything that survives a relaunch or lives on a user's disk | R3 |
| [D05](D05_UI_ENGINEERING.md) | UI Engineering | Every surface a human sees or drives | R2 |
| [D06](D06_QUALITY_ENGINEERING.md) | Quality Engineering | The checks, their honesty, and their ability to fail | R2 |
| [D07](D07_RELEASE_AND_DISTRIBUTION.md) | Release & Distribution | Build, sign, notarize, appcast, rollout | R3 |
| [D08](D08_SECURITY_AND_PRIVACY.md) | Security & Privacy | Keys, entitlements, user data, supply chain | R3 |
| [D09](D09_PERFORMANCE_AND_RELIABILITY.md) | Performance & Reliability | Speed, memory, crashes, hangs, data loss | R2–R3 |
| [D10](D10_SUPPORT_AND_INCIDENTS.md) | Support & Incidents | Field signal in, incident response out | R3 during an incident |

---

## Routing — which department owns a request

| The request sounds like | Lead | Consulted |
|---|---|---|
| "this number / label / behavior is wrong" | D03 | D01 (what is correct), D06 |
| "add a feature" | D01 | D02, D03, D05, D06 |
| "the file won't open / data disappeared" | D04 | D09, D10 |
| "the layout is broken on this screen" | D05 | D03 |
| "ship 1.0 build N" | D07 | D06, D08 |
| "users report X since the update" | D10 | D07 (rollback path), owning department |
| "it's slow / it beachballs" | D09 | D02, D04 |
| "is this safe to store / send?" | D08 | D01, D04 |

The lead department runs its process. Consulted departments supply constraints **before**
implementation, not objections after.

---

## Common shape

Every department file has the same ten sections, so the agent can be pointed at any one of them mid
task and know where to look:

1. Mandate · 2. Seniority bar · 3. Inputs and outputs · 4. Process · 5. Risk tier and escalation ·
6. Evidence standard · 7. Anti-patterns · 8. Handoff contract · 9. Department checklist ·
10. BatiFlow notes

Section 9 is an **extension** of `04_DEFINITION_OF_DONE.md`, never a replacement: the ten global
gates always apply, and the department checklist adds what that function specifically must prove.

---

## What "senior" means here

Not years, not tooling. Four behaviors, and every department file makes them concrete for its own
work:

1. **Changes the right size.** Not the smallest possible edit, not the refactor it wanted an excuse
   for — the smallest change that leaves the system coherent.
2. **Reasons about the second-order effect.** Who else reads this value, what is already on disk in
   the old shape, what happens on the fourteenth run.
3. **Produces evidence a stranger can re-run.** Not "I tested it".
4. **Says the uncomfortable thing early.** "This request needs a schema change" on day one costs a
   conversation; on release day it costs a release.

Structural check for this folder: `scripts/check_os.sh`.

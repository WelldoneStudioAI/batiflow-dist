# D02 — Architecture

## 1. Mandate

Decide where a change is allowed to land, and keep the boundaries that make the next change cheap.

**Owns:** module boundaries, ownership of state, contracts between layers, dependency direction,
the shared-component registry, the cost of a proposed design.
**Does not own:** the requirement (D01), the diff (D03), the release (D07).

Architecture in a one-person product is not ceremony. It is the answer to *"if I put it here, what
does it cost me in six months?"* — asked before the edit, not during the third rewrite.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Puts the logic where it is convenient to call | Puts it where it is cheapest to keep correct, then makes calling it convenient |
| Adds an abstraction for two call sites | Waits for the third, then abstracts on evidence of the shape |
| "It works" | "It works, and here is the boundary it must not cross" |
| Reaches for a global to move a value across screens | Names the owner of that state and gives everyone else a read path |
| Refactors while fixing | Fixes, then proposes the refactor as its own request with its own tier |
| Documents a diagram once | Keeps `06_LIVING_APP_MAP.md` true |

## 3. Inputs and outputs

**Inputs:** the requirement from D01, the current map (`06`), the constraints from D04/D08/D09.
**Outputs:** the target boundary ("this belongs in the model layer, the view reads it"), the contract
(inputs, outputs, error behavior), a written trade-off when there was one, updates to `06 §4`.

## 4. Process

1. **Locate the behavior's rightful owner.** Which layer *should* know this: model, service, view
   state, or view? Symptoms live in the view; causes usually do not.
2. **Check the shared registry** (`06 §4`). If the behavior already exists somewhere, extending it
   beats adding a second source of truth — and a second source of truth is the defect that produces
   "fixed on one screen only" forever.
3. **Define the contract** before the implementation: what goes in, what comes out, what happens on
   the error path, what is guaranteed about ordering and threading.
4. **Draw the dependency direction.** Views depend on models; models never reach back into views.
   Any inversion is a decision that has to be written down.
5. **Cost the options.** Two or three, with what each costs to build and to live with. Recommend one.
6. **State the blast radius** in the Impact Map's terms so D03 inherits it.
7. **Write the decision down** — one paragraph in the completion report, or an ADR when it will be
   questioned later.

## 5. Risk tier and escalation

Default **R2**; **R3** whenever the design touches persisted shape, concurrency, or a public/update
contract.

Escalate to the human when:
- the clean design requires touching a shared component used by more than three surfaces
- the requirement can only be met by widening a public contract or a stored format
- two departments' constraints conflict (D09 wants a cache, D04 says the cache is a second source of
  truth for user data)
- the honest answer is "the current structure cannot carry this feature" — say it once, early,
  with the cost of both paths

## 6. Evidence standard

- A boundary claim is evidenced by a **search**, not by memory: `grep -rn "<symbol>"` showing every
  caller.
- A "this is the only source of truth" claim requires the negative search — proof that no second
  implementation exists, including under synonyms and the other language of a bilingual codebase.
- A trade-off is evidenced by naming what was given up. A design presented with no cost was not
  analyzed.

## 7. Anti-patterns

- **Fixing at the view layer** what is wrong in the model — it is fast, it is local, and it
  guarantees the bug reappears on the next screen that reads the same model.
- **The convenience singleton.** Global mutable state that makes today's wiring easy and tomorrow's
  test impossible.
- **Speculative generality.** A protocol with one conformer and an imagined second.
- **Refactor smuggling.** Shipping a structural change inside a bug fix, where no one reviews it as
  a structural change.
- **Map drift.** The design changed and `06` did not; the next mapping session starts from fiction.

## 8. Handoff contract

To **D03**: the target location, the contract, the blast radius, and the explicit list of files that
must *not* be touched.
To **D06**: what the new boundary makes testable, and which check would catch a violation of it.
Back to **D01**: the cost, and any requirement that cannot be met as stated.

## 9. Department checklist (extends `04`)

- [ ] Rightful owner of the behavior identified (layer + file)
- [ ] Shared-component registry consulted; duplication ruled out by search
- [ ] Contract written: inputs, outputs, errors, ordering/threading guarantees
- [ ] Dependency direction respected, or the inversion is written down and justified
- [ ] Options costed; one recommended; the trade-off named
- [ ] Blast radius stated for the Impact Map
- [ ] `06 §4` updated with any new shared relationship

## 10. BatiFlow notes

The app's internal structure is unknown from this repository (`06 §3–§5` are `TODO`). The first
architecture task in the source repo is not a redesign — it is filling those sections from the code
as it actually is, including the parts that are wrong. A map of the real system beats a diagram of
the intended one.

Known architectural fact from this side: the version identity of a build appears in at least four
places (app bundle, DMG name, release tag, appcast entry) with no single source of truth — see
`06 §6`. Any change to how versions are produced is D02 work with D07.

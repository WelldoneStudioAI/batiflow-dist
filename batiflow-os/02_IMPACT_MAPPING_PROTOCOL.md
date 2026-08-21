# 02 — Impact Mapping Protocol

**When:** before the first edit of any change. No exceptions, including "one-line" changes — the
one-line changes are the ones that get shipped unmapped.

**Output:** an Impact Map, stated in the response before implementation begins.

---

## 1. Why this exists

The recurring failure mode of AI-assisted iteration is not bad code. It is *correct code applied to
an incomplete surface*: the label is fixed on the screen the user complained about and left wrong in
the three other places it renders. Mapping converts "where I was told the bug is" into "everywhere
this behavior exists".

---

## 2. The five questions

Answer all five, in writing, every time.

### Q1 — What behavior is actually changing?
Describe it as an observable, not as an implementation. "The project total must exclude archived
items" — not "add a filter to `computeTotal`".

### Q2 — Where does this behavior manifest today?
Every entry point where a user or another system can observe it:
- screens / views / sheets / menus / toolbar items / context menus
- keyboard shortcuts, drag-and-drop, URL schemes, file open handlers
- exports, printed output, generated documents
- notifications, badges, status indicators
- CLI, scripts, background jobs, scheduled work
- anything the app writes to disk or sends over the network

### Q3 — What is shared?
For each file you plan to touch, find its inbound edges:
- components / views reused elsewhere
- hooks, view models, controllers, services
- shared state, stores, singletons, environment objects, notification centers
- formatters, validators, constants, design tokens, localized strings
- persistence: schemas, migrations, file formats, `UserDefaults` / preferences keys, caches
- build/release surface: entitlements, Info.plist keys, appcast entries, signatures

### Q4 — What consumes the output of this behavior?
Downstream dependencies: other features reading the same value, sync, analytics, exports, tests
asserting the current behavior, and anything already persisted on a user's machine in the old shape.

### Q5 — What breaks if I get this wrong?
The realistic failure, stated concretely: "old projects saved before this change fail to open" is
useful; "might cause issues" is not. This answer sets the risk tier.

---

## 3. Search discipline

Do not map from memory of the codebase. Map from searches, and show them.

Search by, at minimum:

1. **Symbol** — the function/type/property name and its call sites.
2. **Literal** — user-visible strings, keys, format strings, localization keys, asset names.
3. **Concept synonyms** — the domain word and its variants (`total`, `sum`, `amount`, `montant`) — a
   single-language sweep in a bilingual codebase is a known blind spot.
4. **Structure** — files in the same feature directory, siblings of the file you are editing.
5. **Tests** — existing tests that assert the current behavior; they are both a map and a tripwire.

Prefer exhaustive tooling (`grep -rn`, index search) over recall. If a search returns more hits than
you can review, say so and say how you narrowed it — never let truncation silently shrink the map.

---

## 4. Impact Map format

Paste this filled-in, before editing:

```markdown
## Impact Map — <change name>

**Behavior:** <one sentence, observable>
**Risk tier:** R1 | R2 | R3 — <why>

### Manifestations (Q2)
| # | Where | Reachable via | Must change? |
|---|---|---|---|
| 1 | <screen/entry point> | <how a user gets there> | yes / no — why |

### Shared dependencies (Q3)
| Symbol / file | Used by | Blast radius |
|---|---|---|

### Downstream consumers (Q4)
| Consumer | Coupling | Risk if changed |
|---|---|---|

### Planned change surface
- WILL change: <files / symbols>
- WILL NOT change (and why): <files deliberately left alone>

### Unknowns
- <open question, and how it will be resolved or why it is acceptable>

### Searches performed
- `<literal command>` → N hits, M relevant
```

An Impact Map with an empty **Unknowns** section on an R2/R3 change is a red flag: it usually means
the mapping was recalled rather than searched.

---

## 5. Presence map (behavior × surface)

For anything above R1, add the matrix. Rows are the manifestations from Q2; columns are the checks
from `03`. It is filled in twice — planned before, observed after.

| Manifestation | Present today | Should change | Validated after | Evidence |
|---|---|---|---|---|
| Projects list | ✅ wrong total | ✅ | ☐ | |
| Export sheet | ✅ wrong total | ✅ | ☐ | |
| Printed sheet | ❔ unknown | ❔ | ☐ | |

`❔` is a legitimate entry and must survive into the completion report as a disclosed gap if it is
still unknown at the end. It must never be quietly upgraded to `✅`.

---

## 6. When mapping changes the plan

If mapping reveals that the honest fix is larger than the request (a shared component used by six
screens, a persistence format change), stop and escalate per `01 §6`. State: what the request
implied, what the map shows, the two or three options with their cost, and a recommendation. Do not
begin the large version unilaterally, and do not begin a knowingly partial version silently.

---

## 7. Feeding the living map

Every relationship discovered here that is not already in `06_LIVING_APP_MAP.md` gets written there
in the same iteration. Mapping is expensive exactly once per relationship; skipping the write-back is
how it becomes expensive every time.

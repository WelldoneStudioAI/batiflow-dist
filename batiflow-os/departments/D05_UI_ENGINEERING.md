# D05 — UI Engineering

## 1. Mandate

Every surface a human sees or drives: windows, views, sheets, menus, toolbars, shortcuts, drag
targets, printed and exported output.

**Owns:** correctness of what is displayed, state handling in the view layer, accessibility,
localization, behavior across window sizes and system settings.
**Does not own:** the value being displayed (D03/D04) or whether it should be displayed (D01).

The department where "fixed on one screen only" is born, and therefore the department that owes the
manifestation sweep the most.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Fixes the screen in the bug report | Finds every view that renders the same value and fixes the source |
| Checks the happy state | Checks empty, loading, one item, many items, error, and too-long text |
| Tests at the window size on their screen | Resizes, tests the smallest supported window, and the widest |
| Hardcodes the string | Routes it through localization, and checks the other language's length |
| Ships the light appearance | Checks dark mode and increased-contrast |
| "Looks right to me" | Screenshot in the report, with the state named |

## 3. Inputs and outputs

**Inputs:** the expected observable (D01), the value contract (D02/D03), design intent if any.
**Outputs:** the surface change, screenshots per state, the manifestation sweep rows for the
validation block, notes for `06 §3` on entry points discovered.

## 4. Process

1. **Enumerate the surfaces** that show this behavior — from the map, plus a fresh search on the
   literal string and the symbol. Include non-screen surfaces: export, print, clipboard, tooltips,
   window titles, notifications.
2. **Enumerate the states** for each: empty, single, many, loading, error, disabled, selected,
   truncated/very long text, and the "just relaunched" state.
3. **Change the source, not the display**, when the value is wrong; change the display when the
   *presentation* is wrong. Confusing the two is what produces divergent screens.
4. **Drive it manually.** Click through, keyboard through, resize. A view test is not a substitute
   for having seen it.
5. **Capture evidence per state** — a screenshot labeled with the state, or a described interaction
   when capture is impossible.
6. **Check the system dimensions**: appearance (light/dark), text size, language, reduced motion,
   and the minimum supported OS version.

## 5. Risk tier and escalation

Default **R2** — view code is shared far more than it looks. **R3** when the surface writes user data
(a form that saves, an editable field) or when a shared component changes for all callers.

Escalate when:
- the same value is rendered from two different computations (that is a D02 problem, and patching the
  view hides it)
- meeting the request on one screen would make it inconsistent with another
- the change requires a new shared component (registry entry in `06 §4`, tier goes up)

## 6. Evidence standard

- **UI claims need UI evidence.** A screenshot, a recording, or an explicit "driven manually:
  <steps>". Model-layer tests never prove a view.
- One screenshot per changed state, not one screenshot per change.
- If no display is available in the session (headless agent, CI), the honest output is `NOT CHECKED —
  no UI session; run: <click path>` with the expected observation spelled out.
- Layout claims ("nothing clips") are made per window size actually tested, and the sizes are named.

## 7. Anti-patterns

- **Per-screen formatting.** Three views formatting the same number three ways; the fourth will be a
  fourth way.
- **Business logic in the view.** It cannot be tested and it will be duplicated.
- **State fixed by re-rendering.** If a refresh makes it correct, the state is wrong, not the render.
- **Magic constants** for spacing copied between files.
- **English-only truncation checks.** French labels are routinely 20–30 % longer; a bilingual app
  that was only eyeballed in one language has untested layouts.
- **Screenshot of the fixed screen only**, presented as coverage of a five-screen behavior.

## 8. Handoff contract

To **D06**: the state matrix (surface × state) to be swept, and which states are automatable.
To **D01**: any place where the request would create inconsistency between surfaces — that is a
product decision, not an implementation detail.
To **D09**: any view that renders large collections; scrolling performance is a real requirement.

## 9. Department checklist (extends `04`)

- [ ] All surfaces rendering this behavior enumerated (including export/print/clipboard)
- [ ] States covered: empty / single / many / loading / error / long text / post-relaunch
- [ ] Value fixed at the source, not per view
- [ ] Driven manually; screenshots per changed state, states labeled
- [ ] Light and dark appearance checked
- [ ] Localization checked in both languages, including truncation
- [ ] Minimum supported OS version considered
- [ ] Keyboard path and accessibility labels intact
- [ ] `06 §3` updated with any newly discovered entry point

## 10. BatiFlow notes

No UI code is present in this repository, and no UI session is available to an agent working here —
so any UI claim made from this side is, by definition, `NOT CHECKED`. That is the correct output,
not a reason to soften the claim.

The app targets macOS 14.0 and up (`sparkle:minimumSystemVersion` in `appcast.xml`, `06 §2`). That
number is the floor for every API and every appearance check; raising it is a product decision (D01)
with a distribution consequence (D07), never an incidental consequence of a UI change.

# 05 — Change Request Template

Every iteration starts from a filled request. A request that skips the observable/expected pair is
the root cause of most "fixed the wrong thing" rounds.

Copy the short form for small changes, the full form for anything that touches shared code, data, or
the release pipeline. If the human supplies only a sentence, the agent fills the template from that
sentence and **shows its filled version back** before implementing — a wrong assumption caught here
costs nothing.

---

## Short form

```markdown
## CR — <title>

**Observed:** <what happens today, where, with what input>
**Expected:** <what should happen instead, observably>
**Where seen:** <screen / entry point / file>
**Scope:** just this place | everywhere this behavior appears (default: everywhere)
**Out of scope:** <what must not change>
```

---

## Full form

```markdown
## CR-<id> — <title>

### 1. Intent
<One paragraph: what the user of the app should be able to do afterwards.>

### 2. Observed behavior
- Where: <screen, menu, export…>
- Steps: 1. … 2. … 3. …
- Input / data: <fixture, project file, account state>
- Result: <exact text, number, screenshot, log>
- Frequency: always | intermittent | once

### 3. Expected behavior
<Observable, testable. Include the exact expected value where possible.>

### 4. Known manifestations
<Every place the requester already knows this behavior appears. The agent will still map for more.>

### 5. Explicit non-goals
<Things that look adjacent and must stay untouched. Prevents scope drift in both directions.>

### 6. Constraints
- Compatibility: <must open files from build N? must not break the appcast? minimum macOS?>
- Data: <existing user data that must survive>
- Deadline / release: <if this is going into a specific build>

### 7. Acceptance criteria
- [ ] <criterion 1, phrased so it can only be checked by observing the app>
- [ ] <criterion 2>
- [ ] No regression in <named adjacent behavior>

### 8. Environment
- App version / build: <e.g. 1.0 (14)>
- macOS: <e.g. 14.6>
- Install type: fresh install | updated via Sparkle from build N

### 9. Evidence attached
<screenshots, sample project, crash log, console output>
```

---

## Filling rules

1. **Observed and Expected are both mandatory.** "Improve the totals" is not a request; it is a mood.
2. **Expected is observable.** Prefer "the total shows 4 200 $" to "the total is correct".
3. **Scope defaults to everywhere.** If the requester wants only one screen changed, that is an
   unusual choice and must be written down, because it creates deliberate divergence.
4. **Non-goals are worth more than they look.** They are what lets the agent refactor confidently or
   refuse to.
5. **One behavior per request.** Three bugs in one CR produce one Impact Map that fits none of them.

---

## Agent-side handling

On receiving a request, the agent:

1. Fills or normalizes this template and echoes it back (one compact block).
2. Flags any field it had to guess, in a single line: *Assumed: …*
3. Proceeds to `02_IMPACT_MAPPING_PROTOCOL.md` — it does not wait for confirmation on R1, and does
   wait when an assumption would change the change surface (`01 §2.1`).

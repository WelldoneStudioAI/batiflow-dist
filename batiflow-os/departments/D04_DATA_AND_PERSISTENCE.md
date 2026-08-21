# D04 — Data & Persistence

## 1. Mandate

Protect everything that survives a relaunch. User documents, preferences, caches, license state,
anything written to disk or to a server.

**Owns:** stored shapes, migrations, read/write paths, backward and forward compatibility, data-loss
prevention.
**Does not own:** what the data means to the user (D01), how it is displayed (D05).

This is the only department whose mistakes cannot be fixed by shipping another build: the user's
file is already broken.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Adds a field to the stored shape | Adds a field *and* decides what the previous build does when it meets it |
| Tests with fresh data | Tests with a document created by the last shipped build |
| Migrates on read | Migrates on read, atomically, and keeps the original until the new one is safely written |
| "It saved fine" | "It saved, relaunched, reopened, and matched — here is the byte-level diff" |
| Fixes corrupted files by hand | Writes the repair path, then asks how the corruption got written |
| Treats a cache as harmless | Knows a cache becomes a second source of truth the day it disagrees |

## 3. Inputs and outputs

**Inputs:** the requirement, the current stored shapes (`06 §5`), the shipped-version history.
**Outputs:** the migration, the compatibility statement (which builds can read what), fixtures of
old-format data, updates to `06 §5`.

## 4. Process

1. **Name every store the change touches**: document format, preferences keys, caches, keychain
   items, temp files, anything on a server.
2. **Write the compatibility matrix** before the change:

   | | old data | new data |
   |---|---|---|
   | old build | works today | ← what happens? |
   | new build | ← must work | must work |

   The top-right cell is the one everyone forgets: a user on the new build creates a document, then
   opens it on a machine still running the previous build. Decide the behavior — read it, ignore the
   unknown parts, or refuse cleanly with a message. Never crash, never silently drop the extra data
   on a re-save.
3. **Make writes atomic.** Write to a temp file, fsync, replace. A crash mid-write must leave the
   previous good file intact.
4. **Version the format** explicitly. A stored shape with no version field costs one migration to add
   and unbounded guesswork forever if it is missing.
5. **Migrate forward only, once, and record it.** Migrations that run twice must be harmless.
6. **Keep fixtures** of every shipped format version, in the repo, used by tests.
7. **Verify with real round trips**: create → quit → relaunch → open → compare; then open with the
   previous build.

## 5. Risk tier and escalation

**R3 by default. There is no R1 in this department.**

Escalate when:
- a change would make documents unreadable by the currently shipped build
- data must be deleted or rewritten in place on users' machines
- a fix requires a destructive repair step (always requires explicit human approval — `01 §3.6`)
- the requirement implies losing information the user entered

## 6. Evidence standard

- Round-trip evidence: the exact file before, the exact file after, and what compared equal.
- Migration evidence: a fixture from the previous shipped version, opened by the new build, with the
  observed result quoted.
- Downgrade evidence: new-format file opened by the previously shipped build, with the observed
  result quoted — or an explicit "not tested, here is how" in the report's NOT VERIFIED section.
- Never accept "the test suite passes" as data-safety evidence; unit tests use fresh fixtures, and
  fresh fixtures are exactly the case that never breaks.

## 7. Anti-patterns

- **Schema change without a version bump.**
- **In-place rewrite without a backup**, in code that has never crashed *yet*.
- **Silent field drop** on re-save by an older build — the user loses work and no one gets an error.
- **Migration in the view layer**, run when a screen happens to appear.
- **Cache as truth**: displaying the cache while the store says otherwise, then persisting the cache.
- **Fixing corruption by deleting the file** — that is data loss with a friendly message.

## 8. Handoff contract

To **D06**: the fixtures and the compatibility matrix; every cell must map to a check or a disclosed
gap.
To **D07**: whether this release can be safely downgraded from, and whether the appcast note needs a
warning.
To **D10**: the recovery procedure for a user who already hit the bad path, written before the
release, not during the incident.

## 9. Department checklist (extends `04`)

- [ ] Every touched store named (documents, prefs, caches, keychain, server)
- [ ] Compatibility matrix filled, all four cells decided
- [ ] Format version present and bumped if the shape changed
- [ ] Writes atomic; crash mid-write leaves the previous file intact
- [ ] Migration idempotent, and recorded so it does not re-run
- [ ] Fixture of the previous shipped format exists and is exercised
- [ ] Round trip verified: create → relaunch → reopen → compare
- [ ] Downgrade behavior verified or disclosed
- [ ] `06 §5` updated

## 10. BatiFlow notes

`06 §5` is empty: the app's stores are undocumented from here. Filling it is the highest-value
mapping work available in the source repository, because it is the table that decides the tier of
every future change.

The one persisted thing visible from this repository is the Sparkle updater's own state on the user's
machine (last-checked version, skipped versions) — which is why a build number that goes *backwards*
in `appcast.xml` does not simply "not update": it can leave clients in a state where the newest build
is never offered. See `06 §2` invariant 1.

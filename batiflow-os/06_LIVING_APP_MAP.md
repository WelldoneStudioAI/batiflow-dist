# 06 — Living App Map

**Nature:** this file is *state*, not documentation. It is expected to be edited in the same commit
as the change that taught it something. A map that has not changed in twenty iterations is either a
perfect map or an abandoned one — assume the second.

**Rule:** every relationship discovered during `02_IMPACT_MAPPING_PROTOCOL.md` that is not already
here gets written here before the iteration is reported done (`04` G10).

---

## 0. How to use this file

- **Before mapping:** read the relevant zone; it is a head start, never a substitute for searching.
- **After mapping:** add new manifestations, shared components, and downstream consumers.
- **Confidence tags** on every entry: `[verified <date>]` (observed in this repo/session),
  `[reported]` (told to us, not confirmed), `[assumed]` (inference — treat as unknown).
- Never delete an entry that turned out to be wrong: correct it and keep a line in §7 saying what
  changed. The corrections log is the most valuable part of this file.

---

## 1. Product surface

BatiFlow is a macOS application distributed outside the App Store, updated via Sparkle. Two
repositories are involved:

| Repository | Role | Visibility |
|---|---|---|
| `WelldoneStudioAI/batiflow-dist` | Public distribution: Sparkle appcast + release binaries (`.dmg`). | public `[verified 2026-08-21]` |
| BatiFlow app source | Application code. Not present in this checkout. | private `[reported]` |

Anything below marked `[assumed]` or left as `TODO` describes the app repository and must be filled
in by the first iteration that works there.

---

## 2. Distribution zone `[verified 2026-08-21]`

The only zone this repository actually contains. Treat every change here as **R3** — it reaches every
installed copy of the app.

### Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| Sparkle feed | `appcast.xml` | Update feed polled by installed apps. |
| Release binaries | GitHub Releases, tag `mac-v<version>b<build>` | `.dmg` referenced by the feed's `<enclosure>`. |
| Repo readme | `README.md` | States that the source lives elsewhere. |
| This system | `batiflow-os/` | Operating policy and protocols. |

### `appcast.xml` structure

```
rss ▸ channel ▸ title = "BatiFlow"
             ▸ item ▸ title                            e.g. "1.0"
                    ▸ pubDate                          RFC 822
                    ▸ sparkle:version                  build number, e.g. 14
                    ▸ sparkle:shortVersionString       marketing version, e.g. 1.0
                    ▸ sparkle:minimumSystemVersion     e.g. 14.0
                    ▸ enclosure url / length / type / sparkle:edSignature
```

Current head of the feed: version `1.0`, build `14`, minimum macOS `14.0`, enclosure
`mac-v1.0b14/BatiFlow-1.0b14.dmg` `[verified 2026-08-21]`.

### Invariants — check every one on any release change

1. `sparkle:version` (build) is **strictly increasing** across published items. Sparkle compares this,
   not the display title.
2. `sparkle:shortVersionString` matches the app's `CFBundleShortVersionString`; `sparkle:version`
   matches `CFBundleVersion`. A mismatch produces update loops on users' machines.
3. `enclosure length` equals the real byte size of the `.dmg`.
4. `sparkle:edSignature` is the EdDSA signature of *that exact* artifact, produced by the release
   signing key.
5. The enclosure URL is publicly reachable without authentication.
6. `minimumSystemVersion` never silently rises — raising it strands users on older macOS with no
   notice.
7. The XML stays well-formed; the feed is parsed by machines with no tolerance for a stray character.

### Mechanical checks

`scripts/check_appcast.sh` (repository root) verifies invariants 1, 3, 5 and 7 and reports
invariants 2, 4 and 6 as gaps. It exits non-zero on any failure. Run it before committing any
appcast change; quote its output as evidence. `[verified 2026-08-21]`

### Blast radius

Every installed copy of BatiFlow, immediately, with no rollback path other than publishing another
build. There is no staged rollout. A bad appcast is a production incident.

### Known consumers

| Consumer | Coupling |
|---|---|
| Sparkle updater inside the shipped app | Parses `appcast.xml` on its schedule; enforces signature. |
| The release process in the private source repo | Produces the `.dmg`, tag, size, and signature that this feed must match. `[assumed]` |

---

## 3. Application zones `TODO — fill on first iteration in the app repository`

Template for each zone; duplicate per feature area.

```markdown
### Zone: <name>

**Purpose:** <what the user does here>
**Entry points:** <window, menu item, shortcut, drag target, URL scheme>
**Owns:** <files / types>
**Reads:** <state, services>
**Writes:** <state, files, defaults>
**Shared with:** <other zones>
**Default risk tier:** R1 | R2 | R3
```

Suggested first zones to document: document/project model, project editing UI, computation &
totals, export/print, preferences, licensing/activation, update & onboarding.

---

## 4. Shared component registry `TODO`

The highest-value table in this file: anything used by two or more zones. Every entry here turns a
future "one-line fix" into a correctly scoped one.

| Component / symbol | Kind | Used by | Change tier | Notes |
|---|---|---|---|---|
| _(empty — populate from the app repo)_ | | | | |

---

## 5. State & persistence registry `TODO`

| Store | Shape | Written by | Read by | Migration risk |
|---|---|---|---|---|
| _(empty)_ | | | | |

Anything in this table is R3 by default: it exists on users' machines and predates the change.

---

## 6. Cross-cutting behaviors

Behaviors that appear in more than one zone and are therefore the classic incomplete-fix traps.
Fill as discovered.

| Behavior | Manifestations | Single source of truth? |
|---|---|---|
| Version / build display | About window, appcast, DMG name, release tag | ❌ — four places, must be kept in sync `[assumed]` |
| _(add as discovered)_ | | |

---

## 7. Corrections log

Append when the map was wrong. Never rewrite history here.

| Date | Entry | Was | Actually | Found during |
|---|---|---|---|---|
| 2026-08-21 | — | — | Map seeded; distribution zone verified from repository contents, application zones unknown. | initial authoring |
| 2026-08-21 | §2 enclosure checks | Assumed a `HEAD` request could confirm artifact size | GitHub redirects release assets to a signed object store that answers `HEAD` with 401; the size must be read from `Content-Range` on a ranged `GET` | building `scripts/check_appcast.sh` |

---

## 8. Known blind spots

Stated openly so they are not mistaken for coverage.

- The application source is not present in this checkout; §3–§5 are empty and any claim about app
  internals in this session would be invention.
- The application source is out of reach from here, so `scripts/check_appcast.sh` cannot check
  invariant 2 (feed version vs. `CFBundleVersion` / `CFBundleShortVersionString`) or invariant 4
  (EdDSA signature validity — it only checks the field is present). Both must be verified on the
  source side and disclosed as gaps in any release completion report written here.
- Invariant 6 (`minimumSystemVersion` never silently rising) is a policy check, not a mechanical one:
  it needs a human decision, not a script.
- No test suite exists in this repository; "regression" here means the invariant list in §2 plus
  `scripts/check_appcast.sh`.

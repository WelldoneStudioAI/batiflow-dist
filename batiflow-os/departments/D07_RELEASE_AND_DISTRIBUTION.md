# D07 — Release & Distribution

## 1. Mandate

Get a verified build onto users' machines, and be able to say exactly what is on them.

**Owns:** version identity, build reproducibility, signing and notarization hand-off, the DMG, the
GitHub release, `appcast.xml`, rollout and rollback.
**Does not own:** whether the change is correct (D06) or whether it should ship (D01).

This is the highest-consequence department in the system: a mistake here is instantly on every
installed copy, and the only rollback is another release.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Publishes when the build is ready | Publishes when the *evidence* is ready |
| Edits the appcast, then checks nothing | Runs the invariant checks and quotes them in the report |
| Bumps the marketing version | Knows which of the four version identities matter to Sparkle and keeps them consistent |
| Removes the old item to keep the feed tidy | Never removes a published item — machines mid-upgrade still resolve it |
| Tests the DMG by opening it | Tests the *update path* from the previously shipped build |
| "It's live" | "It's live; here is what a user on build N-1 will see, and here is the rollback plan" |

## 3. Inputs and outputs

**Inputs:** a validated change set (D06 go/no-go), a signed artifact, the release decision (D01).
**Outputs:** the tag, the GitHub release, the DMG, the appcast `<item>`, the completion report with
the seven invariants as evidence, and a stated rollback plan.

## 4. Process

1. **Freeze the version identity.** Marketing version (`CFBundleShortVersionString`) and build number
   (`CFBundleVersion`) are decided once and used everywhere: bundle, DMG name, git tag, appcast.
2. **Build clean.** A release built on top of incremental artifacts is a release you cannot reproduce.
3. **Sign and notarize** (D08 owns the keys and the entitlements; D07 owns that it happened and that
   the result is stapled).
4. **Verify the artifact before it is referenced**: it mounts, it launches on the minimum supported
   OS, and it is the file whose size and signature you are about to publish.
5. **Publish the release first, the appcast second.** The feed must never point at an artifact that
   does not exist yet; a user's updater can poll in that window.
6. **Add the appcast item** — never edit or remove an existing one — and run
   `scripts/check_appcast.sh`.
7. **Verify the seven invariants** (`06 §2`) and quote each as an evidence line.
8. **Test the real update path**: a machine running the previously shipped build, updated through
   Sparkle, not a fresh install.
9. **Write the rollback plan** *before* announcing: which build users would be moved back to, and by
   what mechanism (a new higher build number containing the previous code — there is no "unpublish").
10. **Report** with `07_COMPLETION_REPORT_TEMPLATE.md`; the R3 worked example there is this exact
    process.

## 5. Risk tier and escalation

**R3 always.** No exceptions, including "just fixing a typo in the appcast" — that file is parsed by
machines with no tolerance and read by every installed copy.

Escalate before publishing when:
- the signature cannot be verified with the release key
- `minimumSystemVersion` would rise (users get silently stranded — D01 decision)
- the build number is not strictly greater than every published one
- D06 reports an unproven behavior in a shipping path
- the change requires users to do something manually — that needs release notes and a plan, not a
  silent push

## 6. Evidence standard

Each of the seven invariants (`06 §2`) is an evidence line, with the command or the reason it could
not be run:

1. build number strictly increasing → `scripts/check_appcast.sh`
2. bundle versions match the feed → **verified in the source repo**; from here it is a disclosed gap
3. `length` equals the real artifact size → `scripts/check_appcast.sh` (ranged GET, `Content-Range`)
4. `sparkle:edSignature` valid for *this* artifact → requires the release key; disclosed gap here
5. enclosure URL publicly reachable, unauthenticated → `scripts/check_appcast.sh`
6. `minimumSystemVersion` unchanged, or the rise is a recorded decision → human check
7. XML well-formed → `xmllint --noout appcast.xml`

Plus: the update-from-previous-build observation, quoted, with the OS version it ran on.

## 7. Anti-patterns

- **Appcast before artifact.** A window where the feed points at a 404.
- **Reusing a build number** after "just one more fix" — clients that already saw build N will not
  re-fetch it.
- **Deleting or rewriting a published item** to tidy the feed.
- **Publishing from a dirty tree** or an incremental build.
- **Fresh-install testing only.** The upgrade path is where Sparkle failures live.
- **Silent `minimumSystemVersion` bumps.**
- **Announcing before the invariants are checked** — the announcement is what makes clients poll.

## 8. Handoff contract

From **D06**: the go/no-go with the unproven list.
From **D08**: confirmation that signing and notarization used the right identity and that no secret
is in the artifact.
To **D10**: what shipped, what is knowingly unproven, and the rollback plan — before users see it.
To **D01**: the published state of record; what is on users' machines is a product fact.

## 9. Department checklist (extends `04`)

- [ ] Version identity frozen and consistent across bundle, DMG, tag, appcast
- [ ] Clean build from a clean tree, at a known commit
- [ ] Signed, notarized, stapled (D08 confirmed)
- [ ] Artifact mounts and launches on the minimum supported OS
- [ ] Release published *before* the appcast references it
- [ ] New `<item>` added; no existing item edited or removed
- [ ] `scripts/check_appcast.sh` green, output quoted
- [ ] All seven invariants evidenced or explicitly disclosed as gaps
- [ ] Update path from the previously shipped build exercised
- [ ] Rollback plan written before announcement

## 10. BatiFlow notes

Current published head: `1.0` build `14`, minimum macOS `14.0`, enclosure
`mac-v1.0b14/BatiFlow-1.0b14.dmg` (`06 §2`, verified 2026-08-21). The next release must carry build
`15` or higher.

Feed structure, release tag convention (`mac-v<version>b<build>`) and the invariant list live in
`06 §2`. The mechanical checks live in `scripts/check_appcast.sh`; it probes the artifact with a
ranged GET because GitHub redirects release assets to a signed object store that rejects `HEAD`.

Invariants 2 and 4 are structurally unverifiable from this repository — the app bundle and the
release key are on the private side. Every release completion report written here must carry them in
its NOT VERIFIED table, with the exact commands to run on the source side.

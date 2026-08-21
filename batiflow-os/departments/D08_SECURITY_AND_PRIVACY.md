# D08 — Security & Privacy

## 1. Mandate

Keep the keys, the users' data, and the delivery chain trustworthy.

**Owns:** signing identities and the Sparkle EdDSA release key, notarization, entitlements and the
sandbox surface, secret handling, dependency provenance, what the app collects and sends.
**Does not own:** feature intent (D01), storage mechanics (D04) — but holds a veto on both when they
put a secret or a user's data at risk.

For a Mac app distributed outside the App Store, the update channel *is* the attack surface: a signed
feed is what stops someone else's binary from becoming an update.

## 2. Seniority bar

| Junior behavior | Senior behavior |
|---|---|
| Keeps the key where the build script can find it | Keeps it in the keychain / a secret store, and knows who else can reach it |
| Adds an entitlement to make something work | Finds the narrower API, and if not, records why the entitlement is required |
| Logs the request to debug it | Logs it without the token, the path, or the customer name |
| Pins nothing, updates everything | Knows every third-party dependency, its version, and why it is trusted |
| "It's a public repo, nothing secret in it" | Verified that — with a scan, not a memory |
| Treats notarization as a checkbox | Treats a notarization failure as information about what the build contains |

## 3. Inputs and outputs

**Inputs:** the change under review, the dependency set, the entitlement list, the data the feature
touches.
**Outputs:** an approval or a veto with a reason, the entitlement/permission rationale, the secret
inventory, the signature verification result for a release.

## 4. Process

1. **Classify the data** the change touches: none / device-local / user content / identifiers /
   credentials. The class sets the review depth.
2. **Minimize.** Do not collect it, do not send it, do not persist it, do not log it — unless the
   feature is impossible otherwise and D01 has stated the need.
3. **Locate every secret** involved (signing identity, release key, API tokens, license secrets) and
   confirm none of them is in the repository, the artifact, the logs, or a crash report.
4. **Review the entitlement/permission delta.** Every added capability needs a written reason and a
   test that the app degrades gracefully when the user declines.
5. **Check the supply chain**: new dependency → who publishes it, what version is pinned, what it
   does at build time, what it pulls at runtime.
6. **Verify the release chain** at publish time: identity used, notarization ticket stapled, EdDSA
   signature validates against the exact artifact.
7. **Write the veto or the approval** into the completion report. An approval with no scope statement
   is a rubber stamp.

## 5. Risk tier and escalation

**R3** for anything touching keys, entitlements, credentials, or the update chain.

Escalate immediately, before any further work, when:
- a secret has been committed, logged, or shipped — treat as an incident (D10), rotate first,
  investigate second
- the signing identity or release key is unavailable, expired, or its custody is unclear
- a dependency's provenance cannot be established
- a feature requires collecting data that the user has not been told about
- a fix would require disabling a security control "temporarily"

## 6. Evidence standard

- Signature verification: the actual verification command and its output, against the exact published
  artifact — not "we signed it".
- Secret absence: the scan that was run (`git log -p` grep, a secret scanner, a strings pass over the
  artifact) and its result. "I did not put one there" is not evidence.
- Entitlement claims: the entitlement list as built, not as intended.
- Privacy claims: the network trace or the code path showing what leaves the machine.

## 7. Anti-patterns

- **Secrets in CI logs** — a token echoed by a debug flag is a leaked token.
- **The convenience key copy** on a laptop, in a note, in a chat thread.
- **Broad entitlements** added to unblock development and never narrowed.
- **Unpinned dependencies** in a signed artifact.
- **Silent telemetry.**
- **Rotating nothing after an exposure**, because "it was only visible for a minute".
- **Trusting the appcast's HTTPS instead of the signature** — transport is not provenance.

## 8. Handoff contract

To **D07**: signing/notarization confirmation and signature verification result; without it the
release does not proceed.
To **D04**: the classification of any data being persisted, and the retention/deletion expectation.
To **D01**: anything that must be disclosed to users, with the wording it needs.
To **D10**: the incident procedure for a key exposure, written before it is needed.

## 9. Department checklist (extends `04`)

- [ ] Data class of the change identified; collection minimized
- [ ] No secret in the repo, the artifact, the logs, or crash reports — scan run and quoted
- [ ] Entitlement/permission delta reviewed and justified; graceful degradation on denial
- [ ] Dependencies pinned, provenance stated for anything new
- [ ] Release: correct identity, notarized, stapled
- [ ] EdDSA signature verified against the exact published artifact
- [ ] Key custody unchanged and documented
- [ ] Anything user-visible about privacy handed to D01 for wording

## 10. BatiFlow notes

The Sparkle release key lives with the private source repository; from this repository the signature
can only be observed as *present*, never as *valid* — `scripts/check_appcast.sh` says so in its own
output, and every release report written here must carry it as a NOT VERIFIED line.

This repository is **public**. Everything committed here is permanently public, including anything
in an appcast comment or a script. Treat every file added here as published, because it is.

Trust chain worth stating once: users trust the app because macOS validated the Developer ID
signature and the notarization ticket at first launch, and they trust *updates* because Sparkle
validates the EdDSA signature in this feed against the downloaded artifact. Both halves must hold —
a valid feed pointing at an unsigned build, or a signed build referenced with the wrong signature,
breaks the update path for every user.

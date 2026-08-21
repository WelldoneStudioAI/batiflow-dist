# 08 — Adoption Guide

How to make this system *active* rather than aspirational. A policy the agent has to be reminded of
is not a policy; it has to be in the context by default.

---

## 1. Installation in a repository (Claude Code)

### Step 1 — Vendor the system

Copy the `batiflow-os/` folder into the target repository (the private app source, and any other
repo the agent works in). Keep the filenames — the policy cross-references them by name.

```bash
cp -R path/to/batiflow-dist/batiflow-os <target-repo>/batiflow-os
```

Keeping a copy per repository (rather than a submodule) is deliberate: the living app map in `06` is
repository-specific and must diverge. The `departments/` folder travels with it — the processes are
the same everywhere; only their §10 (BatiFlow notes) is repository-specific and should be rewritten
for the target repo.

`scripts/check_os.sh` verifies the system's own structure (files present, the ten canonical sections
in every department file, links and cross-references resolving). Copy it too, and run it after any
edit to `batiflow-os/`.

### Step 2 — Bind it in `CLAUDE.md`

`CLAUDE.md` at the repository root is loaded into every Claude Code session automatically. Add:

```markdown
## Operating system (mandatory)

This repository is governed by `batiflow-os/`. Before any code change, read and follow:

- `batiflow-os/01_AGENT_OPERATING_POLICY.md` — behavior contract (read this first, every session)
- `batiflow-os/02_IMPACT_MAPPING_PROTOCOL.md` — before the first edit
- `batiflow-os/03_REGRESSION_VALIDATION_PROTOCOL.md` — after implementing
- `batiflow-os/04_DEFINITION_OF_DONE.md` — before saying "done"
- `batiflow-os/06_LIVING_APP_MAP.md` — read the relevant zone; update it when you learn something

Never report a change as done, fixed, or working until `04` passes. Until then the status is
"IMPLEMENTED — NOT VALIDATED". Never claim a command's output you did not observe in this session.
```

Keep this block short. A long `CLAUDE.md` is skimmed; a five-line one with pointers is followed.

### Step 3 — Add the slash commands

`.claude/commands/` — each file becomes `/<name>`.

`.claude/commands/impact.md`:
```markdown
Run batiflow-os/02_IMPACT_MAPPING_PROTOCOL.md for: $ARGUMENTS
Output the Impact Map block. Do not edit any file in this turn.
```

`.claude/commands/validate.md`:
```markdown
Run batiflow-os/03_REGRESSION_VALIDATION_PROTOCOL.md for the change currently in the working tree
(`git diff`). Run the checks for the risk tier, quote real output, and produce the Validation block.
```

`.claude/commands/done.md`:
```markdown
Audit the current change against batiflow-os/04_DEFINITION_OF_DONE.md.
For each gate: PASS / FAIL / N-A with one line of justification. If any gate fails, state the status
as IMPLEMENTED — NOT VALIDATED and list what remains. Then produce the completion report from
batiflow-os/07_COMPLETION_REPORT_TEMPLATE.md.
```

`.claude/commands/dept.md`:
```markdown
Identify the lead department for this request using batiflow-os/departments/README.md, then run that
department's process (sections 4, 6 and 9 of its file) on top of the global gates in
batiflow-os/04_DEFINITION_OF_DONE.md. Name the lead and the consulted departments first.
Request: $ARGUMENTS
```

`.claude/commands/cr.md`:
```markdown
Normalize the following into batiflow-os/05_CHANGE_REQUEST_TEMPLATE.md and echo it back, flagging
every field you had to assume. Then proceed to /impact. Request: $ARGUMENTS
```

### Step 4 — Optional: a skill

If you prefer skill-based invocation, create `.claude/skills/batiflow-os/SKILL.md` with frontmatter
describing when it triggers (any code change in a BatiFlow repository) and a body that points at the
same files. Skills load on demand; `CLAUDE.md` loads always. Use both: `CLAUDE.md` for the
non-negotiables, the skill for the detailed protocols.

### Step 5 — Make the gates cheap

The protocols are only followed if running them is fast. In the app repository, add a single script
the agent can call:

```bash
# scripts/check.sh — the "layer 3, R1/R2" button
set -euo pipefail
swift build            # or xcodebuild -scheme BatiFlow build
swift test             # or xcodebuild test -scheme BatiFlow
```

In this distribution repository, the equivalent is an appcast validator (see §4).

---

## 2. Working agreement for the human side

The system fails from the human side in two specific ways:

1. **Requests without an Expected.** Fill `05`, even in one line. The agent will echo its
   interpretation back; read that echo — it is the cheapest bug catch in the loop.
2. **Accepting "done" without §5.** If a completion report has no NOT VERIFIED section, ask for it.
   Asking once trains the loop; accepting once un-trains it.

Useful human-side phrases:

- *"Map first, don't edit yet."* → forces `02` before code.
- *"Status per `04`?"* → forces the honest vocabulary.
- *"What did you actually run?"* → collapses invented evidence immediately.
- *"Which manifestations did you not check?"* → the single highest-yield question in the system.

---

## 3. Rollout order

1. **Week 1 — vocabulary.** `CLAUDE.md` block + `/done`. Nothing else. Get "IMPLEMENTED — NOT
   VALIDATED" into normal use.
2. **Week 2 — mapping.** Add `/impact`. Expect the first maps to be thin; the corrections log in `06`
   §7 fills in fast.
3. **Week 3 — evidence.** Add `/validate` and the check script. Refuse reports without quoted output.
4. **Week 4 — memory.** Enforce `06` updates in the same commit as the change. This is the step that
   compounds.

Do not install all four at once. A system introduced wholesale is followed for three days.

---

## 4. Repository-specific note — `batiflow-dist`

This repository contains no application code, so "regression testing" here means the appcast
invariants in `06 §2`. Until an automated validator exists, every release change must list those
seven invariants as explicit evidence lines in its completion report.

`scripts/check_appcast.sh` in this repository covers the mechanical invariants (1, 3, 5, 7) and
reports the rest as explicit gaps:

```
$ ./scripts/check_appcast.sh
PASS  well-formed XML
      builds in feed: 14
PASS  build numbers strictly ordered
      enclosure: https://github.com/.../BatiFlow-1.0b14.dmg
      declared length: 493354374
PASS  enclosure reachable (HTTP 206)
PASS  length matches artifact (493354374)
PASS  edSignature present (NOT verified here — needs the release key)
```

It probes the artifact with a ranged GET rather than `HEAD`, because GitHub redirects release assets
to a signed object store that rejects `HEAD`; the real size arrives in `Content-Range`. A network
failure is reported as unreachable — re-run before concluding the release is broken.

Signature verification (invariant 4) requires Sparkle's `sign_update` tooling and the release key,
which lives with the private source repository — so on this side it is always a disclosed gap unless
performed there.

---

## 5. Success criteria for the system itself

The system is working when:

- The phrase "IMPLEMENTED — NOT VALIDATED" appears regularly. If it never appears, the gates are
  being skipped, not passed.
- Completion reports have non-empty NOT VERIFIED sections.
- `06_LIVING_APP_MAP.md` changes most weeks, and its corrections log has entries.
- The number of "you said it was fixed but nothing changed" rounds trends to zero.

The system is being gamed when reports are long, confident, evidence-free, and the map never moves.

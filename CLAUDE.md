# BatiFlow — distribution repository

Public Mac distribution: Sparkle appcast (`appcast.xml`) + release binaries published as GitHub
Releases. The application source is private and lives elsewhere.

## Operating system (mandatory)

This repository is governed by `batiflow-os/`. Before any change, read and follow:

- `batiflow-os/01_AGENT_OPERATING_POLICY.md` — behavior contract (read first, every session)
- `batiflow-os/02_IMPACT_MAPPING_PROTOCOL.md` — before the first edit
- `batiflow-os/03_REGRESSION_VALIDATION_PROTOCOL.md` — after implementing
- `batiflow-os/04_DEFINITION_OF_DONE.md` — before saying "done"
- `batiflow-os/06_LIVING_APP_MAP.md` — read the relevant zone; update it when you learn something
- `batiflow-os/departments/README.md` — route the request to a lead department, then follow that
  department's process (sections 4, 6, 9) on top of the global gates

Never report a change as done, fixed, or working until `04` passes. Until then the status is
**IMPLEMENTED — NOT VALIDATED**. Never claim output from a command you did not run in this session.

## Repository-specific rules

- Any change to `appcast.xml` or to a published release is **R3**: it reaches every installed copy of
  BatiFlow immediately and cannot be rolled back except by publishing another build. Check all seven
  invariants in `batiflow-os/06_LIVING_APP_MAP.md` §2 and list them as evidence.
- Run `scripts/check_appcast.sh` before committing an appcast change. It covers the mechanical
  invariants only; signature verification requires the release key held with the private source repo
  and must be disclosed as a gap here.
- Never remove a previously published `<item>` — machines mid-upgrade still resolve it.
- Release work is `batiflow-os/departments/D07_RELEASE_AND_DISTRIBUTION.md`; run its §9 checklist.
- Run `scripts/check_os.sh` after editing anything under `batiflow-os/`.

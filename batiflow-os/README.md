# BatiFlow — AI Engineering Operating System

**Version:** 1.0
**Purpose:** make AI-assisted iterations safer, traceable, and evidence-based.

## Non-negotiable operating rule

No change is considered complete because code was written. It is complete only when its impact
surface has been mapped, required paths have been validated, regression checks pass, and evidence
is recorded.

## Files

- `01_AGENT_OPERATING_POLICY.md` — mandatory behavior for the coding agent.
- `02_IMPACT_MAPPING_PROTOCOL.md` — pre-change impact analysis and presence map.
- `03_REGRESSION_VALIDATION_PROTOCOL.md` — risk-based regression testing.
- `04_DEFINITION_OF_DONE.md` — evidence gates before saying "done".
- `05_CHANGE_REQUEST_TEMPLATE.md` — template for every iteration request.
- `06_LIVING_APP_MAP.md` — living architecture / UI / flow coverage map.
- `07_COMPLETION_REPORT_TEMPLATE.md` — required post-change report.
- `08_ADOPTION_GUIDE.md` — how to install this system in Claude Code.
- `departments/` — one senior development process per engineering function (D01–D10), each plugging
  into the gates of `04`. Start at `departments/README.md` for the routing table.

## Core loop

1. Understand the requested behavior.
2. Map every known entry point and manifestation of that behavior.
3. Identify shared components, state, services, persistence, and downstream dependencies.
4. State the planned change surface before editing.
5. Implement the smallest coherent change.
6. Run targeted checks plus regression checks proportional to risk.
7. Validate every mapped manifestation, not only the screen where the request originated.
8. Report evidence and explicitly disclose anything not verified.
9. Update the living app map when new relationships are discovered.

## Prime directive

Never optimize for appearing finished. Optimize for being verifiably correct.

## How the pieces fit

```
Change request (05)
        │
        ▼
Impact mapping (02) ──────► updates ──────► Living app map (06)
        │                                          ▲
        ▼                                          │
Implementation (01: smallest coherent change)      │
        │                                          │
        ▼                                          │
Regression validation (03) ────────────────────────┘
        │
        ▼
Definition of done (04) ──► gate passed? ──► Completion report (07)
                                 │
                                 └── no ──► back to implementation, never to "done"
```

`01` is the standing behavior contract; `02`, `03`, `04` are the protocols it invokes; `05` and `07`
are the input and output artifacts of a single iteration; `06` is the memory that survives across
iterations; `08` explains how to make all of it active inside Claude Code.

`departments/` is the second axis. `01`–`08` say *how any change is handled*; `departments/D01`–`D10`
say *how each function is run at a senior level* — what it owns, where its evidence comes from, what
it hands to the next department, and what it adds to the checklist of `04`. Route the request to a
lead department, run its process, keep the global gates.

## Scope of this repository

`batiflow-dist` is the public Mac distribution repository (Sparkle appcast + release binaries). The
application source lives in a separate private repository. This operating system is authored here so
it is versioned in the open, but it governs **any** BatiFlow repository the agent works in — see
`08_ADOPTION_GUIDE.md` for installing it in the source repo.

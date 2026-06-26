# Neon Ronin Agent Handoff

## Active Scope

This repository is now governed by `ART_LOCK_GOAL.md`.

The current objective is a reference-driven Art Lock build, not the prior Stage 1 vertical slice. Do not claim Stage 1 is complete while this goal is active.

## Required Reference Package

Use this package as the visual authority:

```text
art/references/neon_ronin_art_refs_impl_ready/
```

It contains A-H Markdown/PNG references. The PNGs are specification sheets only. Never paste the reference sheets into runtime.

## Current Gate State

- Gate A: pending explicit human approval.
- Gate B: not started.

Gate A evidence currently includes:

- `art/TOOL_CAPABILITY_REPORT.md`
- `art/REFERENCE_ANALYSIS.md`
- `art/REFERENCE_COMPLIANCE_MATRIX.md`
- `art/ART_BIBLE.md`
- `art/reviews/candidates/`
- `art/reviews/gate-a/representative-composite-960x540.png`
- `art/approvals/GATE_A_REQUEST.md`
- `art/approvals/GATE_A_STATUS.json`
- `art/reviews/gate-a/gate-a-viewer-960x540.png`
- `art/reviews/gate-a/gate-a-package-report.md`

## Commands

Use `npm.cmd` on Windows PowerShell.

Current Gate A commands:

```bash
npm.cmd run art:refs
npm.cmd run art:process
npm.cmd run art:contact-sheets
npm.cmd run art:gate-status
npm.cmd run art:gate-a-smoke
npm.cmd run art:review-report
npm.cmd run art:all
```

Final Art Lock commands from `ART_LOCK_GOAL.md` must not be reported passing until they inspect real final assets, screenshots, revision rounds, scorecards, and approvals.

## Handoff Rules

- Treat `AGENTS.md` as a live operations log.
- Keep Gate A/Gate B approval state explicit.
- Do not weaken validators to make progress appear complete.
- Do not use plain Phaser primitive programmer art as final visual implementation.
- Do not keep misleading Stage 1/campaign claims in docs.
- If a required visual-production/browser capability is unavailable, report the concrete blocker.

## Next Step

Request explicit Gate A approval using the exact phrase `Approve Gate A`. If approved, build the production Art Lock runtime, asset pipeline, validators, screenshots, review rounds, and Gate B package.

Legacy Stage 1 runtime, tests, scripts, and `artifacts/qa` evidence have already been removed from the runnable source tree. The current runtime is only `BootScene -> GateAReviewScene`.

# Neon Ronin: Shadow Courier - Art Lock Build

This repository is currently being reworked under `ART_LOCK_GOAL.md`.

The current target is not a complete Stage 1. The active scope is a reference-driven visual lock: title direction, Art Lab direction, player/enemy/environment/UI/VFX style systems, deterministic art evidence, validators, review rounds, and explicit human approval gates.

## Authoritative References

The visual specification lives in:

```text
art/references/neon_ronin_art_refs_impl_ready/
```

It contains A-H reference PNG/Markdown pairs for ink treatment, rainy lighting, signage density, player identity, seven-layer parallax, UI/mobile controls, slash VFX, and enemy telegraphs. The sheets are specifications only and must not be pasted into runtime.

## Current Gate

Gate A package is prepared for human review:

- `art/TOOL_CAPABILITY_REPORT.md`
- `art/REFERENCE_ANALYSIS.md`
- `art/REFERENCE_COMPLIANCE_MATRIX.md`
- `art/ART_BIBLE.md`
- `art/palette.png`
- `art/value-study.png`
- `art/shape-language.png`
- `art/player-silhouette-study.png`
- `art/environment-material-study.png`
- `art/ui-style-study.png`
- `art/vfx-style-study.png`
- `art/telegraph-style-study.png`
- `art/reviews/candidates/`
- `art/reviews/gate-a/representative-composite-960x540.png`
- `art/approvals/GATE_A_REQUEST.md`
- `art/approvals/GATE_A_STATUS.json`
- `art/reviews/gate-a/gate-a-package-report.md`

Gate A is not approved until the user explicitly approves it.

## Commands

Use `npm.cmd` on this Windows/PowerShell setup.

```bash
npm.cmd run art:refs
npm.cmd run art:process
npm.cmd run art:contact-sheets
npm.cmd run art:gate-status
npm.cmd run art:gate-a-smoke
npm.cmd run art:review-report
npm.cmd run art:all
```

Production validators are intentionally not passable before Gate A approval:

```bash
npm.cmd run art:atlas
npm.cmd run art:validate-assets
npm.cmd run art:validate-sign-density
npm.cmd run art:validate-animations
npm.cmd run art:validate-vfx
npm.cmd run art:validate-telegraphs
npm.cmd run art:screenshots
```

Those commands will be implemented after Gate A approval and final production asset work.

## Current Limitations

- The old Stage 1 runtime, Stage 1 QA scripts, tests, and generated QA artifacts have been removed from the runnable source tree.
- The current browser runtime is a Gate A review viewer only. It is not the final title screen or ArtLabScene.
- Final TitleScene and ArtLabScene are not implemented yet.
- Final player/enemy/UI/environment/VFX atlases are not implemented yet.
- Three revision rounds, independent scorecards, Gate B artifacts, and final approval are not complete.

## Next Step

Review the Gate A package and explicitly approve or reject the style lock. To approve, reply with `Approve Gate A`. After approval, production asset implementation can proceed without changing the approved art bible.

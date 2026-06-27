# Neon Ronin Agent Handoff

## Active Scope

This repository is now governed by the Stage 1 playable vertical slice objective.

The current runtime objective is Stage 1 only: `Neon Alley: First Delivery`, using the frozen Gate B v2 art assets. Do not implement or claim Stage 2+, world map, final boss, dash/projectile/charged slash/ultimate, or broad campaign systems while this scope is active.

## Required Reference Package

Use this package as the visual authority:

```text
art/references/neon_ronin_art_refs_impl_ready/
```

It contains A-H Markdown/PNG references. The PNGs are specification sheets only. Never paste the reference sheets into runtime.

## Current Gate State

- Gate A: approved by explicit human phrase `Approve Gate A` on 2026-06-26.
- Gate B v1: rejected as visually below product level.
- Gate B v2: approved by explicit human input `ゲートBを承認します` on 2026-06-27.
- Latest visual revision: enemy/friendly accent groups are separated. Player/friendly keeps cyan/magenta; enemy eyes, cores, and telegraphs use amber/vermilion. `art:validate-assets` now checks enemy runtime assets for zero player-hue residue.
- Art Lock freeze: Gate B v2 core art is frozen. Runtime production assets are normalized under `src/assets/approved-art/` and indexed by `src/data/approvedArtManifest.ts`.

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

Current Art Lock commands:

```bash
npm.cmd run art:validate-freeze
npm.cmd run art:refs
npm.cmd run art:process
npm.cmd run art:atlas
npm.cmd run art:contact-sheets
npm.cmd run art:gate-status
npm.cmd run art:validate-assets
npm.cmd run art:validate-sign-density
npm.cmd run art:validate-animations
npm.cmd run art:validate-vfx
npm.cmd run art:validate-telegraphs
npm.cmd run art:screenshots
npm.cmd run art:review-report
npm.cmd run art:all
```

After freeze, use `art:validate-freeze` for normal Stage1 asset checks. Do not run `art:process` unless a new explicit art-change gate authorizes regeneration/reprocessing.

Current Stage1 commands:

```bash
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run qa:stage1
npm.cmd run qa:assets-stage1
npm.cmd run e2e
npm.cmd run qa:screenshots-stage1
npm.cmd run qa:all-stage1
```

## Handoff Rules

- Treat `AGENTS.md` as a live operations log.
- Keep Gate A/Gate B approval state explicit.
- Do not weaken validators to make progress appear complete.
- Do not use plain Phaser primitive programmer art as final visual implementation.
- Keep Stage1 claims limited to the playable vertical slice.
- Keep Stage2+, world map, final boss, and campaign claims out of docs/runtime unless a new explicit scope is approved.
- If a required visual-production/browser capability is unavailable, report the concrete blocker.

## Next Step

Gate B v2 is approved and frozen. Stage1 integration must consume the approved asset manifest rather than direct `art/final-v2/assets/` paths.

Current runtime is `BootScene -> PreloadScene -> TitleScene`, with playable flow `TitleScene -> Stage1Scene -> StageClearScene`. Deterministic `ArtLabScene` review states remain available via `?scene=artlab&state=...`.

Runtime animation note: Stage1 character animation uses derived, fixed-cell sprite sheets under `src/assets/runtime/`. They are cut from frozen approved art by `npm.cmd run art:runtime-sheets` so each runtime frame contains one character/enemy only. Do not point gameplay directly back at the generated contact-sheet layouts in `player-spritesheet`, `enemy-spritesheet`, or `kite-wraith-preview`, because those sheets can expose adjacent poses and make actors appear split.

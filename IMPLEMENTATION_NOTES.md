# Implementation Notes - Stage 1 Vertical Slice

## Scope

The active runtime scope is Stage 1 only: `Neon Alley: First Delivery`, implemented with frozen Gate B v2 art.

This repo now preserves v1 evidence while building Gate B v2 from native image-generated source art:

- `art/final/` is old Gate B v1 evidence.
- `art/generated/` contains raw native `image_gen` outputs and logs.
- `art/source/` contains selected/refined v2 source assets.
- `art/final-v2/` contains v2 runtime screenshots, reports, and processed assets.
- `src/assets/approved-art/` contains frozen production copies of the approved runtime PNGs.
- `src/data/approvedArtManifest.ts` is the Stage1 runtime asset contract.
- `src/data/stage1Content.json` and `src/data/stage1.ts` own the Stage1 layout/content rules.
- `src/data/stageValidation.ts` validates the Stage1 acceptance content.

## Runtime

- `BootScene -> PreloadScene -> TitleScene` by default.
- Playable flow is `TitleScene -> Stage1Scene -> StageClearScene`.
- Supporting screens are `ControlsScene`, `SettingsScene`, and `CreditsScene`.
- `?scene=artlab&state=<state>` boots deterministic `ArtLabScene` review stations.
- Runtime assets are loaded from `src/assets/approved-art/`.
- The QA bridge is `window.__NEON_RONIN_ART_LOCK__`.
- Stage1 E2E telemetry is `window.__NEON_RONIN_STAGE1__`.

## Stage1 Architecture

- `Stage1Scene` orchestrates stage flow, checkpoints, pickups, hazards, miniboss clear, pause, retry, and QA telemetry.
- `Player` owns movement state, coyote time, jump buffer, wall slide/kick, slash phases, hurt state, knockback, invulnerability, and checkpoint respawn.
- `InkCrawler`, `KiteWraith`, and `LanternWarden` own enemy behavior.
- `InputSystem` unifies keyboard and touch input.
- `TouchControls` renders approved Gate B v2 mobile control art and routes touches through `InputSystem`.
- `Hud` owns HP, scroll count, timer, objective, checkpoint feedback, and Lantern Warden health text.
- `CameraController`, `CombatSystem`, `SaveSystem`, and `rank` keep shared logic out of the scene.

## Image Generation Route

- Route used: native Codex `image_gen` via the `imagegen` skill.
- Model/seed IDs: not exposed by the native tool.
- Raw outputs are preserved under `art/generated/**/raw/`.
- Capability report: `art/IMAGE_GENERATION_CAPABILITY_REPORT.md`.
- Full generation log: `art/generated/GENERATION_LOG.md` and `.json`.

## Asset Pipeline

- `scripts/process-generated-v2.mjs` processes recovered native image outputs into `art/source/` and `art/final-v2/assets/`.
- `scripts/build-art-atlases.mjs` writes `art/final-v2/atlas-manifest.json`.
- `scripts/generate-art-contact-sheets.mjs` verifies final-v2 contact sheets.
- `scripts/validate-approved-art-freeze.mjs` verifies that frozen production copies match approved `art/final-v2/assets/` byte-for-byte and map back to `art/source/` or `art/final-v2/`.
- Runtime manifests remain `art/asset-manifest.json`, `art/animation-manifest.json`, `art/vfx-manifest.json`, `art/telegraph-manifest.json`, and `art/sign-density-scenes.json`.

## Validation

- `qa:stage1` validates the 10 named sections, vertical sections, optional routes, checkpoints, exactly 3 scrolls, pickups, hazards, enemies, Lantern Warden, safe first screen, safe pre-boss rest, Moon Gate, and target-duration metadata.
- `qa:assets-stage1` validates approved art usage, frozen copies, runtime lineage, no old v1 runtime art, no reference-sheet runtime use, no remote runtime assets, and required texture/animation keys.
- `e2e` runs Playwright-driven named tests: `title-flow`, `stage1-keyboard-clear`, `mobile-controls`, and `checkpoint-retry`.
- `qa:screenshots-stage1` writes the required `artifacts/stage1/*.png`, `console-report.json`, and keeps the console clean.
- `qa:all-stage1` runs final Stage1 validation and writes `artifacts/stage1/stage1-acceptance-report.md`.
- `art:validate-generated` checks raw generated candidates, logs, source assets, selected masters, final-v2 assets, and v2 approval state.
- `art:validate-assets` checks manifests, runtime assets, screenshots, revision rounds, approvals, and scene asset usage.
- `art:screenshots` captures `art/final-v2/` plus `art/reviews/gate-b-v2/round-01..03/`.
- `art:review-report` writes concrete v2 review files and `art/reviews/gate-b-v2/final-scorecard.*`.
- `art:audit` verifies Gate B v2 approval as part of final Art Lock completion.
- `art:validate-freeze` is the normal post-approval check for Stage1 integration.

Do not run `art:process` for normal Stage1 integration after freeze. It is reserved for a new explicit art-change gate.

## Gate Status

- Gate A: approved.
- Gate B v1: rejected.
- Gate B v2: approved by explicit human input on 2026-06-27.

The approved Gate B v2 visual system is now the runtime art basis for Stage 1.

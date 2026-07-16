# Implementation Notes - Neon Ronin Runtime

## Scope

The active runtime scope includes Stage 1, `Neon Alley: First Delivery`, implemented with frozen Gate B v2 art, and the explicitly requested Stage 2 gameplay route, `Neon Drain: Signal Ascent`.

Stage 2 scope covers the dynamic vertical route, Kage-Ito shadow-thread slash, Relay Keeper miniboss, and Signal Gate clear. It does not approve world map, final boss, player projectile, charged slash, ultimate, broad campaign systems, or a distinct Stage2 final-art gate.

This repo now preserves v1 evidence while building Gate B v2 from native image-generated source art:

- `art/final/` is old Gate B v1 evidence.
- `art/generated/` contains raw native `image_gen` outputs and logs.
- `art/source/` contains selected/refined v2 source assets.
- `art/final-v2/` contains v2 runtime screenshots, reports, and processed assets.
- `art/final-v3-animation/` records the scoped Animation Expansion Gate manifest.
- `src/assets/approved-art/` contains frozen production copies of the approved runtime PNGs.
- `src/data/approvedArtManifest.ts` is the Stage1 runtime asset contract.
- `src/data/stage1Content.json` and `src/data/stage1.ts` own the Stage1 layout/content rules.
- `src/data/stage2.ts` owns the Stage2 layout/content rules and `validateStage2`.
- `src/data/stageValidation.ts` validates the Stage1 acceptance content.

## Runtime

- `BootScene -> PreloadScene -> TitleScene` by default.
- Playable flows are `TitleScene -> Stage1Scene -> StageClearScene` and `TitleScene -> Stage2Scene -> StageClearScene`.
- Supporting screens are `ControlsScene`, `SettingsScene`, and `CreditsScene`.
- `?scene=artlab&state=<state>` boots deterministic `ArtLabScene` review stations.
- Frozen approved assets are loaded from `src/assets/approved-art/`; gameplay consumes safe derived Stage1 runtime cutouts from `src/assets/runtime/`.
- The QA bridge is `window.__NEON_RONIN_ART_LOCK__`.
- Stage1 E2E telemetry is `window.__NEON_RONIN_STAGE1__`; Stage2 runtime telemetry is `window.__NEON_RONIN_STAGE2__`.

## Stage1 Architecture

- `Stage1Scene` orchestrates stage flow, checkpoints, pickups, hazards, miniboss clear, pause, retry, and QA telemetry.
- `Player` owns movement state, coyote time, jump buffer, wall slide/kick, slash phases, hurt state, knockback, invulnerability, and checkpoint respawn.
- `Player` also owns runtime visual pose selection. It chooses small jump on early jump release, big jump rise for normal rising jumps, speed flip jump when horizontal speed is near max, and separate ground/air slash visuals based on whether the slash started grounded.
- `InkCrawler`, `KiteWraith`, and `LanternWarden` own enemy behavior. Lantern Warden includes Stage1 melee attacks plus a scoped spark-drop ranged projectile.
- `InputSystem` unifies keyboard and touch input.
- `TouchControls` renders derived single-frame mobile control art and routes touches through `InputSystem`.
- `Hud` owns HP, seal count, timer, objective, checkpoint feedback, and Lantern Warden health text.
- `CameraController`, `CombatSystem`, `SaveSystem`, and `rank` keep shared logic out of the scene.

## Stage2 Architecture

- `Stage2Scene` orchestrates the taller vertical route, wall-gap shaft geometry, diagonal billboard slope, thread anchors, crosswind/updraft gimmicks, checkpoints, collectibles, Relay Keeper clear, pause, retry, and QA telemetry.
- Stage2 gameplay colliders remain rectangular for deterministic traversal, but the runtime view dresses those shapes with approved runtime sprites: platform lips, brush caps, wall trims, back-wall crowns, slope fascia, and endpoint seam blends.
- `Player` now accepts per-stage world bounds and owns Kage-Ito state: target pull, short slash impact, upward launch, charge consumption, recharge on landing, and explicit recharge when Stage2 confirms an enemy hit. It also resolves Stage2 slope surfaces so the billboard descent plays as a true diagonal downhill path instead of stair-stepped platforms.
- `InputSystem` adds `K`/`X` and touch `THREAD` technique input without changing Stage1 slash controls.
- `TouchControls` adds a `THREAD` button while keeping multi-pointer movement/jump/attack support.
- `CameraController` accepts per-stage bounds so Stage2 can use a taller world without Stage1 camera regressions.
- `SaveSystem` tracks Stage2 clear progress separately from Stage1.

## Image Generation Route

- Route used: native Codex `image_gen` via the `imagegen` skill.
- Model/seed IDs: not exposed by the native tool.
- Raw outputs are preserved under `art/generated/**/raw/`.
- Capability report: `art/IMAGE_GENERATION_CAPABILITY_REPORT.md`.
- Full generation log: `art/generated/GENERATION_LOG.md` and `.json`.

## Asset Pipeline

- `scripts/process-generated-v2.mjs` processes recovered native image outputs into `art/source/` and `art/final-v2/assets/`.
- `scripts/build-runtime-sprite-sheets.mjs` derives safe Stage1 runtime sheets/layers from frozen approved art and scoped Animation Expansion Gate sources, including character/enemy frames, VFX, cleaned parallax layers, ground/platform tiles, Moon Gate, item icons, and touch controls.
- Player runtime extraction is component-row driven from `art/source/player/player-animation-master-sheet.png` so each runtime frame contains one actor pose. Slash runtime extraction masks `art/source/vfx/slash-flipbook.png` into separate ground and air VFX sequences and removes source review labels.
- `scripts/build-art-atlases.mjs` writes `art/final-v2/atlas-manifest.json`.
- `scripts/generate-art-contact-sheets.mjs` verifies final-v2 contact sheets.
- `scripts/validate-approved-art-freeze.mjs` verifies that frozen production copies match approved `art/final-v2/assets/` byte-for-byte and map back to `art/source/` or `art/final-v2/`.
- Runtime manifests remain `art/asset-manifest.json`, `art/animation-manifest.json`, `art/vfx-manifest.json`, `art/telegraph-manifest.json`, and `art/sign-density-scenes.json`.

## Validation

- `qa:stage1` validates the compact 5-section one-way route, no optional branches, no hidden scroll routes, checkpoints, seal pickups, hazards, enemies, the single updraft gimmick, Lantern Warden, safe first screen, safe pre-boss rest, Moon Gate, and target-duration metadata.
- `qa:assets-stage1` validates approved art usage, frozen copies, runtime lineage, no old v1 runtime art, no reference-sheet runtime use, no remote runtime assets, required texture/animation keys, and runtime pixel audits for edge cuts plus paper-background residue.
- `test:smoke` runs one short Playwright Test for title/menu flow, Stage1 boot, and real rightward movement; `e2e` remains a compatibility alias for the CI-oriented `test:e2e` regression runner.
- `test:e2e` runs the Playwright-driven named regression tests `audio-director`, `title-flow`, `stage1-keyboard-clear`, `mobile-controls`, and `checkpoint-retry`, with failure screenshots and traces under `test-results/regression/`.
- `test:visual` (`qa:screenshots-stage1` compatibility alias) writes the required `artifacts/stage1/*.png`, `console-report.json`, and keeps the console clean.
- `qa:all-stage1` runs final Stage1 validation and writes `artifacts/stage1/stage1-acceptance-report.md`.
- `validateStage2` is covered by `npm.cmd run test` and checks six dynamic sections, continuous route coverage, large vertical range, wall-gap shaft geometry, diagonal slope geometry, high/low platform density, Kage-Ito anchor coverage, airborne enemy lanes, and Relay Keeper as a miniboss.
- `art:validate-generated` checks raw generated candidates, logs, source assets, selected masters, final-v2 assets, and v2 approval state.
- `art:validate-assets` checks manifests, runtime assets, screenshots, revision rounds, approvals, and scene asset usage.
- `art:screenshots` captures `art/final-v2/` plus `art/reviews/gate-b-v2/round-01..03/`.
- `art:review-report` writes concrete v2 review files and `art/reviews/gate-b-v2/final-scorecard.*`.
- `art:audit` verifies Gate B v2 approval as part of final Art Lock completion.
- `art:validate-freeze` is the normal post-approval check for Stage1 integration.

Do not run `art:process` for normal Stage1 integration after freeze. It is reserved for a new explicit art-change gate.

`art:runtime-sheets` is allowed for the Animation Expansion Gate because it regenerates derived runtime sheets only; it does not regenerate or overwrite frozen approved core art.

## Gate Status

- Gate A: approved.
- Gate B v1: rejected.
- Gate B v2: approved by explicit human input on 2026-06-27.
- Animation Expansion Gate: scoped approval on 2026-06-28 for Stage1 player/slash runtime animation expansion only.

The approved Gate B v2 visual system is now the runtime art basis for Stage 1.

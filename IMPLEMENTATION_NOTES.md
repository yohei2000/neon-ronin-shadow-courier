# Implementation Notes

## Replaced Scope

The previous broad direction was removed. The repository now targets one Stage 1 vertical slice only.

Deleted or replaced:

- Five-stage level data and validation
- Campaign unlock assumptions
- Unused abilities such as dash, projectile, charged slash, and ultimate art
- Unused regular enemies and final boss code
- Old world-selection flow
- Old README claims about a larger campaign
- Tests that validated the old multi-stage DSL instead of the playable Stage 1 product

## Architecture

Runtime flow:

`BootScene -> PreloadScene -> TitleScene -> Stage1Scene -> StageClearScene`

Supporting screens:

- `ControlsScene`
- `SettingsScene`
- `PauseScene`
- `GameOverScene`
- `CreditsScene`

Stage 1 data lives in `src/data/stage1.json` and is checked by `scripts/qa-level.mjs`. Player, enemy, save, input, audio, touch controls, and FX logic are split into entity/system files so `Stage1Scene` orchestrates rather than owning every behavior.

Latest quality passes added:

- `CameraController` so camera lead/follow tuning is no longer embedded directly in `Stage1Scene`.
- `StageHud` so HUD, objective, section-title, and boss-bar rendering are isolated from `Stage1Scene`.
- `StageWorld` so background, parallax/rain, platform visuals/colliders, high-contrast outlines, and decor are isolated from `Stage1Scene`.
- `StageCombat` so enemy spawning, miniboss state, gate/barrier handling, and slash hit resolution are isolated from `Stage1Scene`.
- `StageCollectibles` so seal, health, energy, scroll, and miniboss scroll-reward state are isolated from `Stage1Scene`.
- `StageHazards` so hazard sprite creation, contrast tinting, and damage overlaps are isolated from `Stage1Scene`.
- `StageProgression` so checkpoints, tutorial markers, fall rescue, respawn, and current section lookup are isolated from `Stage1Scene`.
- `src/utils/combat.ts` so damage cooldown gating can be unit-tested without Phaser.
- `src/utils/touchLayout.ts` so mobile virtual-control placement is shared by rendering, QA state, and Vitest coverage without depending on Phaser.
- `npm run qa:flow` so Credits and Game Over support-scene round trips are verified in a real browser.
- `npm run qa:save` so browser localStorage recovery, settings persistence, and Stage Clear save persistence are covered outside unit tests.
- `.github/workflows/deploy.yml` uses current Node 24-era GitHub Actions majors for Pages deployment.

## GitHub Reference Pass

The quality pass inspected these public GitHub projects for structure and workflow patterns only:

- `remarkablegames/phaser-platformer`: recent Phaser platformer template with AGENTS.md, typed organization, and explicit command conventions.
- `rootasjey/phaser3-platformer`: Phaser platformer example used as a scene/sprite separation reference.
- `iwantantra/vite-phaser-ts`: Vite + Phaser + TypeScript starter reference.
- `phaserjs/template-vite-ts`: official Phaser template reference for Vite organization; not copied because the current upstream template targets Phaser 4 while this repo must remain Phaser 3.90.x.
- `danipeck/squishroom`: small Phaser/TypeScript platformer reference for separating gameplay code from scene setup.

Applied changes from that pass:

- Added root `AGENTS.md` with repo-specific standards and next-agent handoff notes.
- Isolated camera follow/lead behavior in `src/systems/CameraController.ts`.
- Added `FXSystem.hitPause()` and wired it into enemy/miniboss hit feedback.
- Made high contrast mode visibly affect Stage 1 platform outlines and hazard tint.
- Extended E2E to toggle and verify persisted high contrast settings.
- Split HUD rendering into `StageHud`, following the scene/sprite/system separation seen in the reference projects.
- Split world/background/platform/decor setup into `StageWorld`.
- Split enemy/miniboss/gate orchestration and slash hit resolution into `StageCombat`.
- Split collectibles and hazards into `StageCollectibles` and `StageHazards` so Stage1Scene owns less item/hazard state.
- Split Phaser into a dedicated `vendor-phaser` build chunk and added `npm run qa:bundle` to verify app chunk size.
- Split checkpoints, tutorial marker rendering, fall rescue, respawn, and section lookup into `StageProgression`.
- Added pure progression helper tests, following the small gameplay-helper test pattern seen in `danipeck/squishroom`.
- Updated the Pages deployment workflow to `checkout@v7`, `setup-node@v6`, `configure-pages@v6`, `upload-pages-artifact@v5`, and `deploy-pages@v5`, following the current action generation used by `remarkablegames/phaser-platformer`.
- Added combat utility tests for damage cooldown behavior.
- Moved mobile pause away from jump/attack buttons for better portrait ergonomics.
- Added pure touch-layout helper tests and exposed the virtual-control layout through read-only QA state.
- Added Playwright checks for the seven-button mobile layout, left/right cluster separation, action gap, and upper-right pause safe area.
- Added Playwright save QA for corrupted-save recovery, high-contrast setting persistence after reload, and Stage Clear result persistence.
- Added Playwright flow QA for Title -> Credits -> Title and real-damage Stage 1 -> GameOver -> Title support-scene transitions.
- Tuned the automated Lantern Warden route to retreat during boss lunge windows before attacking, reducing route flakiness in E2E and save QA.
- Added Playwright E2E coverage for Pause -> Retry Checkpoint and Pause -> Restart Stage using real menu input.
- Added Playwright canvas pixel sampling so high contrast mode is verified as a visible Stage 1 rendering change.
- Stabilized the automated Lantern Warden route so screenshot capture does not leave the player facing away during attacks.
- Moved the miniboss screenshot trigger to the pre-fight encounter view to avoid pausing input during active combat.

## Player Feel

Current movement tuning:

- Coyote time: 115ms
- Jump buffer: 120ms
- Variable jump cut multiplier: 0.46
- Wall slide speed: 92
- Wall kick push: 280 horizontal, 430 vertical
- Slash timing: startup, active, and recovery windows
- Hurt invulnerability: 1000ms
- Max HP: 6

The E2E route exercises run, jump, wall kick, slash, damage, checkpoints, pause retry/restart, visible high contrast rendering, miniboss defeat, gate clear, and mobile input probes.

## Stage 1 Room Breakdown

- Rain Lantern Start: safe movement and jump introduction
- First Slash Alley: first Ink Crawler and attack spacing
- Wall-Kick Sign Shaft: generous wall slide/kick climb with paint marker
- Rooftop Gap Line: guided jump route and seal trail
- Hidden Scroll Route A: wall-route scroll
- Hidden Scroll Route B: exploration/combat scroll
- Checkpoint Shrine Plaza: safe checkpoint and pacing reset
- Neon Thorn Run: thorns, sparks, falling sign, and recovery before the elite fight
- Lantern Warden Encounter: miniboss with health bar and telegraphed lunges
- Moon Gate Finish: gate activates after miniboss defeat and transitions to Stage Clear

## Enemies And Miniboss

- Ink Crawler: ground patrol, low HP, contact damage, hurt flash, defeat burst
- Kite Wraith: slow floating motion, contact damage, air-slash/avoidance teaching
- Lantern Warden: elite encounter with start telegraph, lunge windows, hurt feedback, health bar, and Moon Gate activation on defeat

The Lantern Warden has 6 HP and takes 2 damage per slash so the first-stage fight remains readable and short enough for a stable optimized route.

## Asset Pipeline

No remote assets are used. `PreloadScene` generates all textures with layered Phaser graphics:

- 12 player states, including 4 run frames and 3 slash frames
- 4 enemy/miniboss textures
- 12 tile/decor textures
- UI icons and mobile control textures
- Pickup, checkpoint, hazard, and gate textures

Audio is generated with WebAudio through `AudioSystem`; required SFX keys are tracked in `src/data/assetManifest.json` and verified by `npm run qa:assets`.

## QA And E2E Design

Scripts:

- `npm run e2e`: Playwright title flow, visible high contrast pixel assertion, pause retry/restart, keyboard Stage 1 clear, route-health thresholds, Stage Clear assertion, mobile virtual-control layout validation, and mobile input probes
- `npm run qa:level`: stage data quality and coarse route checks
- `npm run qa:assets`: texture/state/SFX manifest checks, plus screenshot presence when requested
- `npm run qa:bundle`: production bundle chunk checks after `npm run build`
- `npm run qa:dist`: built `dist/` smoke test that serves emitted assets and verifies Title -> Stage 1 boot; CI reruns it with the GitHub Pages base path after the Pages build
- `npm run qa:flow`: browser flow checks for Credits and Game Over support-scene round trips
- `npm run qa:save`: browser save-system checks for corrupted localStorage recovery, settings reload persistence, and Stage Clear result persistence
- `npm run qa:screenshots`: automated screenshot capture for required scenes
- `npm run qa:playtest`: evidence-backed tuning note generated from route-health, level, dist, flow, save, and screenshot reports
- `npm run qa:all`: final gate runner

Read-only browser QA state is exposed through `window.__NEON_RONIN_QA__` and `window.__NEON_RONIN_CLEAR__`, including the current mobile virtual-control layout. Tests do not teleport, mutate stage state, or call hidden clear functions.

## Commands Run

Current verified commands during implementation:

- `npm run typecheck`: PASS
- `npm run test`: PASS
- `npm run build`: PASS
- `npm run e2e`: PASS
- `npm run qa:level`: PASS
- `npm run qa:assets`: PASS
- `npm run qa:dist`: PASS
- `npm run qa:flow`: PASS
- `npm run qa:save`: PASS
- `npm run qa:screenshots`: PASS
- `npm run qa:playtest`: PASS
- `npm run qa:all`: PASS

The latest `npm run qa:all` reran typecheck, tests, build, bundle QA, production dist smoke, E2E, flow QA, save QA, level QA, screenshot QA, asset QA, and playtest-note generation successfully.

## Reviewer Passes

- Producer / Scope Controller: removed broad campaign scope and kept the repository Stage 1 only.
- Gameplay Feel Reviewer: required respawn fix, checkpoint stability, easier Lantern Warden tuning, and mobile input correction.
- Latest Gameplay Feel Review: added hit pause and separated camera lead tuning.
- Latest Gameplay Feel Review: added pure damage cooldown coverage and moved mobile pause away from the attack cluster.
- Latest Gameplay Feel Review: split combat orchestration into `StageCombat` while preserving hit pause, miniboss reward, and gate clear behavior.
- Level Designer Reviewer: kept safe start, ordered tutorial beats, optional scroll sections, fair hazard introduction, and a rest checkpoint before the miniboss.
- Art/UI Director Reviewer: required layered procedural art, title treatment, parallax/rain, HUD readability, panelized menus, and mobile visual controls.
- Latest Art/UI Review: made high contrast mode produce visible in-stage outlines.
- Latest Art/UI Review: separated HUD rendering into `StageHud`.
- Latest Art/UI Review: split world/background/decor construction into `StageWorld`.
- Latest Level Architecture Review: split checkpoints, tutorials, fall rescue, respawn, and section lookup into `StageProgression`.
- Latest Art/UI Review: high contrast is now verified by sampling Stage 1 canvas pixels in E2E.
- QA Automation Reviewer: required real Playwright browser evidence, screenshot artifacts, console reports, and keyboard clear proof.
- Latest QA Automation Review: high contrast toggle is now asserted in Playwright E2E.
- Latest QA Automation Review: high contrast stage pixels are now asserted in Playwright E2E.
- Latest QA Automation Review: pause menu Retry Checkpoint and Restart Stage are now asserted through real menu input.
- Latest QA Automation Review: support-scene flow QA now verifies Credits and Game Over round trips in `artifacts/qa/flow-report.json`.
- Latest QA Automation Review: route-health thresholds are now recorded in `e2e-report.json`.
- Latest QA Automation Review: screenshot capture route now forces the player to face the Lantern Warden before automated boss attacks.
- Latest QA Automation Review: miniboss screenshot capture now occurs before active combat timing starts.
- Latest QA Automation Review: production `dist/` output is now served and smoke-tested locally and with the Pages base path in CI.
- Latest QA Automation Review: mobile virtual controls now expose layout metrics and fail E2E if the seven-button layout, lower control band, action spacing, or upper-right pause placement regresses.
- Latest QA Automation Review: browser save QA now verifies corrupted localStorage recovery, settings persistence after reload, and Stage Clear persistence in `artifacts/qa/save-report.json`.
- Latest QA Automation Review: the keyboard boss route now retreats during Lantern Warden lunge windows before attacking, improving QA repeatability without changing game balance.
- Latest Playtest Review: generated `playtest-tuning.md` from route-health, level, dist, and screenshot evidence; current tuning stays stable and next human check is physical-phone HUD/input ergonomics plus optional-scroll discoverability.
- Latest Build Review: Phaser now builds as `vendor-phaser` and `qa:bundle` verifies app chunk size.
- Latest Code Quality Review: progression helpers are covered by Vitest so checkpoint advancement and section lookup are no longer browser-only behavior.
- Latest CI Review: Pages deployment now reads `.nvmrc` with Node 24 and uses current major GitHub Actions versions.
- Build Fixer: resolved TypeScript/test failures, E2E route failures, fall rescue bug, gate overlap issue, and touch control hit detection.

## Tradeoffs

- Procedural art is intentionally local and reproducible; it is not a substitute for final authored art.
- The mobile portrait view uses the 960x540 game canvas scaled into a 390x844 viewport. Controls are visible, layout-checked, and input-tested, but real-device ergonomic tuning should continue.
- The automated route prioritizes proof of clearability; it does not collect all scrolls.
- Music is omitted to keep the slice focused on input, combat, layout, and QA evidence.

## Next Recommended Step

Do a short human playtest pass on Stage 1 only, then tune enemy spacing, pickup placement, and mobile button ergonomics before considering any new stage work. If code structure work continues first, keep shared menu/settings behavior and the GitHub Pages workflow under the same QA/deploy gate.

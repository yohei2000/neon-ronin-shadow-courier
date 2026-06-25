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
- `src/utils/combat.ts` so damage cooldown gating can be unit-tested without Phaser.

## GitHub Reference Pass

The quality pass inspected these public GitHub projects for structure and workflow patterns only:

- `remarkablegames/phaser-platformer`: recent Phaser platformer template with AGENTS.md, typed organization, and explicit command conventions.
- `rootasjey/phaser3-platformer`: Phaser platformer example used as a scene/sprite separation reference.
- `iwantantra/vite-phaser-ts`: Vite + Phaser + TypeScript starter reference.
- `phaserjs/template-vite-ts`: official Phaser template reference for Vite organization; not copied because the current upstream template targets Phaser 4 while this repo must remain Phaser 3.90.x.

Applied changes from that pass:

- Added root `AGENTS.md` with repo-specific standards and next-agent handoff notes.
- Isolated camera follow/lead behavior in `src/systems/CameraController.ts`.
- Added `FXSystem.hitPause()` and wired it into enemy/miniboss hit feedback.
- Made high contrast mode visibly affect Stage 1 platform outlines and hazard tint.
- Extended E2E to toggle and verify persisted high contrast settings.
- Split HUD rendering into `StageHud`, following the scene/sprite/system separation seen in the reference projects.
- Added combat utility tests for damage cooldown behavior.
- Moved mobile pause away from jump/attack buttons for better portrait ergonomics.

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

The E2E route exercises run, jump, wall kick, slash, damage, checkpoints, miniboss defeat, gate clear, and mobile input probes.

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

- `npm run e2e`: Playwright title flow, keyboard Stage 1 clear, Stage Clear assertion, and mobile virtual control probes
- `npm run qa:level`: stage data quality and coarse route checks
- `npm run qa:assets`: texture/state/SFX manifest checks, plus screenshot presence when requested
- `npm run qa:screenshots`: automated screenshot capture for required scenes
- `npm run qa:all`: final gate runner

Read-only browser QA state is exposed through `window.__NEON_RONIN_QA__` and `window.__NEON_RONIN_CLEAR__`. Tests do not teleport, mutate stage state, or call hidden clear functions.

## Commands Run

Current verified commands during implementation:

- `npm run typecheck`: PASS
- `npm run test`: PASS
- `npm run build`: PASS
- `npm run e2e`: PASS
- `npm run qa:level`: PASS
- `npm run qa:assets`: PASS
- `npm run qa:screenshots`: PASS
- `npm run qa:all`: PASS

The latest `npm run qa:all` reran typecheck, tests, build, E2E, level QA, screenshot QA, and asset QA successfully.

## Reviewer Passes

- Producer / Scope Controller: removed broad campaign scope and kept the repository Stage 1 only.
- Gameplay Feel Reviewer: required respawn fix, checkpoint stability, easier Lantern Warden tuning, and mobile input correction.
- Latest Gameplay Feel Review: added hit pause and separated camera lead tuning.
- Latest Gameplay Feel Review: added pure damage cooldown coverage and moved mobile pause away from the attack cluster.
- Level Designer Reviewer: kept safe start, ordered tutorial beats, optional scroll sections, fair hazard introduction, and a rest checkpoint before the miniboss.
- Art/UI Director Reviewer: required layered procedural art, title treatment, parallax/rain, HUD readability, panelized menus, and mobile visual controls.
- Latest Art/UI Review: made high contrast mode produce visible in-stage outlines.
- Latest Art/UI Review: separated HUD rendering into `StageHud`.
- QA Automation Reviewer: required real Playwright browser evidence, screenshot artifacts, console reports, and keyboard clear proof.
- Latest QA Automation Review: high contrast toggle is now asserted in Playwright E2E.
- Build Fixer: resolved TypeScript/test failures, E2E route failures, fall rescue bug, gate overlap issue, and touch control hit detection.

## Tradeoffs

- Procedural art is intentionally local and reproducible; it is not a substitute for final authored art.
- The mobile portrait view uses the 960x540 game canvas scaled into a 390x844 viewport. Controls are visible and tested, but real-device ergonomic tuning should continue.
- The automated route prioritizes proof of clearability; it does not collect all scrolls.
- Music is omitted to keep the slice focused on input, combat, layout, and QA evidence.

## Next Recommended Step

Do a short human playtest pass on Stage 1 only, then tune enemy spacing, pickup placement, and mobile button ergonomics before considering any new stage work.

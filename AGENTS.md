# Neon Ronin Agent Handoff

## Active Scope

This repository is governed by the Stage 1 playable vertical slice objective plus the explicitly requested Stage 2 gameplay implementation.

Stage 1 remains `Neon Alley: First Delivery`, using the frozen Gate B v2 art assets. Stage 2 implementation scope was explicitly requested by the user on 2026-07-03 as a dynamic vertical stage with a new player technique, not a broad campaign expansion.

Do not implement or claim world map, final boss, player projectile, charged slash, ultimate, or broad campaign systems while this scope is active. Stage 2 currently reuses the frozen Stage1 runtime asset families for playable implementation; a distinct Stage2 final-art gate is still not approved.

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
- Animation Expansion Gate: scoped approval on 2026-06-28 for Stage1 player/slash runtime animation expansion only. Do not treat this as approval for world map, final boss, player projectile/charged slash/ultimate, broad campaign systems, or a Stage2 final-art gate.
- Stage 2 gameplay scope: explicitly requested by the user on 2026-07-03. It authorizes `Neon Drain: Signal Ascent`, a dynamic vertical Stage2 route, and the new `Kage-Ito` / shadow-thread slash technique only.
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

Current Stage2 validation commands:

```bash
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

## Handoff Rules

- Treat `AGENTS.md` as a live operations log.
- Keep Gate A/Gate B approval state explicit.
- Do not weaken validators to make progress appear complete.
- Do not use plain Phaser primitive programmer art as final visual implementation.
- Keep Stage1 claims limited to the playable vertical slice.
- Keep Stage2 claims limited to `Neon Drain: Signal Ascent`, Kage-Ito traversal/combat, Relay Keeper miniboss, and Signal Gate clear.
- Keep world map, final boss, player projectile, charged slash, ultimate, and campaign claims out of docs/runtime unless a new explicit scope is approved.
- If a required visual-production/browser capability is unavailable, report the concrete blocker.

## Next Step

Gate B v2 is approved and frozen. Stage1 integration must consume the approved asset manifest rather than direct `art/final-v2/assets/` paths.

Current runtime is `BootScene -> PreloadScene -> TitleScene`, with playable flows `TitleScene -> Stage1Scene -> StageClearScene` and `TitleScene -> Stage2Scene -> StageClearScene`. Deterministic `ArtLabScene` review states remain available via `?scene=artlab&state=...`. Direct boot supports `?scene=stage1` and `?scene=stage2`.

Runtime asset note: Stage1 character, slash, telegraph, Lantern Warden, background, ground/platform, Moon Gate, item icons, HUD panels, and mobile controls use derived assets under `src/assets/runtime/`. They are cut from frozen approved art and scoped Animation Expansion Gate sources by `npm.cmd run art:runtime-sheets` so each runtime frame contains one actor/effect/icon/layer only. Do not point gameplay directly back at generated contact-sheet layouts such as `player-spritesheet`, `enemy-spritesheet`, `kite-wraith-preview`, `slash-flipbook`, `telegraph-flipbook`, `lantern-warden-spritesheet`, `ui-kit`, `mobile-controls-kit`, or paper-backed `layer-*` environment sheets, because those sheets can expose adjacent poses, white paper backgrounds, UI kit fragments, or half-cut frames.

Runtime stage composition note: Playable stages must not look like raw geometric rectangles or floating boards. Collision rectangles may remain data-only, but visible terrain must be assembled from approved sprite/tile assets, with support/facade masses, edge caps, side blending, and background-integrated seams connecting floors, ledges, walls, and lower ground. Avoid Phaser primitive graphics/rectangles/polygons/circles for runtime stage geometry and hazards; use runtime sprite sheets, environment tiles, telegraph sprites, and layered sprite dressing instead.

Runtime image-first terrain note: Stage1 visible terrain is now authored as five generated runtime PNG plates under `src/assets/runtime/stage1-terrain-*.png`, listed in `stage1Content.json` as `visualTerrain.plates`. Keep `Stage1Data.platforms` as collision-only data matched to those plates; do not drive Stage1 terrain drawing directly from platform rectangles. Rebuild the plates with `npm.cmd run art:stage1-terrain` when the Stage1 route geometry or approved runtime terrain sources change.

Runtime animation note: Player runtime animation now uses idle 6, run 8, small jump 4, big jump rise 5, speed flip jump 8, apex 2, fall 3, wall slide 4, wall kick 4, ground slash 8, air slash 6, hurt 3, and checkpoint respawn 6 frames. Slash runtime animation uses separate ground 8 and air 6 frame sequences. The implementation is documented in `ANIMATION_EXPANSION_GATE.md` and `art/final-v3-animation/animation-expansion-manifest.json`.

Runtime cutout note: `npm.cmd run art:runtime-sheets` applies a deterministic white/gray matte cleanup pass to player, Ink Crawler, Kite Wraith, and Lantern Warden runtime sprite sheets. Keep this in the runtime derivation step rather than editing frozen approved core art directly.

Runtime movement note: Stage1 player movement now uses stronger acceleration/deceleration tuning in `Stage1Tuning` and `src/systems/horizontalMotion.ts` rather than direct velocity snapping. Opposite-direction input must brake the current horizontal velocity to zero before accelerating the other way. Player top speed is 1.5x the earlier Stage1 tuning while acceleration remains unchanged, so time-to-top-speed is 1.5x longer. Speed flip jumps keep jump height while top-speed distance scales with the new top speed; attacking during an active speed flip keeps the flip pose and uses a broad red circular spinning slash hitbox/effect. Normal slash range and forward VFX reach are 1.5x. Player, Ink Crawler, and Lantern Warden sprites have explicit visual ground offsets so frozen runtime cutouts visually contact platform tops while collision bodies stay aligned to gameplay geometry.

Runtime boss note: Lantern Warden is the Stage1 miniboss, not the campaign final boss. The scoped Stage1 boss kit includes melee attacks plus a spark-drop ranged projectile; this does not authorize player projectile systems or broader campaign combat systems.

Runtime audio note: Stage1 SFX are generated WAV assets under `src/assets/audio/`, indexed by `src/data/audioAssets.ts`, loaded in `PreloadScene`, and routed through `src/systems/Stage1Audio.ts`. Keep audio additions scoped to Stage1 actions unless a new scope is approved; current timing covers jump, wall kick, slash/spin slash, player hurt, enemy defeat, pickups, checkpoints, Lantern Warden attack/projectile, and Stage1 clear. Current SFX tuning favors heavier low-frequency impacts, longer tails, and restrained high-frequency chimes.

Runtime item/UI note: Stage1 seal collectibles are rendered as koban coins in the derived `stage1-item-icons` runtime sheet. The sheet still contains the makimono scroll frame for asset compatibility, but the current linear Stage1 route has no hidden scroll routes. The mobile jump button is authored in the derived `stage1-touch-controls` sheet so the visual button and hit zone share a center. Keep these fixes in `npm.cmd run art:runtime-sheets`; do not edit frozen approved core art for this.

Runtime enemy/hazard note: Ink Crawler and Kite Wraith runtime sheets now derive patrol/drift 8, hit 4, and defeat 6 frame sequences from frozen approved enemy art. Defeated small enemies play their defeat sequence and fade out instead of disappearing immediately. Player damage uses source-aware knockback with a short control lock, and the timed-spark fire hitbox is lower than the visual so a clean jump route can pass without fire damage.

Runtime revision note: Stage1 is now a 1.5x-length one-way vertical slice based on the approved linear structure concept: rain-lantern slash tutorial, tall neon sign lift, elevated rooftop hazard line, tall cyan updraft through the Neon Thorn climb, a clear descent, and a small Lantern Warden arena leading directly to the Moon Gate. Damage knockback distance/control lock is reduced to half of the prior tuning. Speed-flip spinning slash no longer uses a Phaser primitive ring; it uses derived flame-ring frames appended to `src/assets/runtime/slash-runtime-spritesheet.png`.

Runtime mobile-control note: Stage1 touch controls must support simultaneous movement and jump/attack input. Keep Phaser configured with multiple active pointers and keep touch-button state keyed by pointer id so releasing one finger does not clear another held control.

`npm.cmd run qa:assets-stage1` includes runtime pixel auditing for edge cuts and paper-background residue. Keep this audit strict; fix the derived runtime asset or crop coordinates instead of weakening the validator.

Runtime layout note: Stage1's route is intentionally linear while now carrying roughly 1.5x the former route length. `qa:stage1` and `validateStage1` check 5 contiguous sections, no optional branches, no hidden scroll routes, compact platform variety, collectible clearance, and two readable updraft moments instead of multi-branch neon runs.

Runtime verticality note: Stage1 still needs strong vertical motion, but only as a first-stage one-way sequence: tall sign-shaft lift plus one tall updraft-assisted Neon Thorn climb, followed by a readable descent into the Warden approach. Keep `compact-vertical-route` and `two-updraft-gimmicks` validation strict so future edits do not flatten the route or reintroduce multi-branch complexity.

Runtime Stage2 note: Stage2 is implemented as `Neon Drain: Signal Ascent`, a taller dynamic vertical route with Moon Gate drop, a left/right wall-gap drain shaft, hanging market switchbacks, a diagonal billboard downhill descent, signal spire climb, and a Relay Keeper arena. Stage2 introduces the new `Kage-Ito` shadow-thread slash technique on `K`/`X` and mobile `THREAD`: it targets nearby anchors or enemies, pulls the player into a slash, launches upward, and recharges on enemy hit or landing. Keep `validateStage2` strict for vertical range, anchor count, wall-gap shaft geometry, diagonal slope geometry, high/low platform density, airborne enemy lanes, and the fact that Relay Keeper is a miniboss, not a final boss. Stage2 may use rectangular gameplay colliders, but the runtime presentation should hide raw rectangle silhouettes with approved runtime sprite dressing, edge caps, trim, fascia, and seam-blending overlays.

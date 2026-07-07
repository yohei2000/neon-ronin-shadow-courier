# Animation Expansion Gate

Date: 2026-06-28

Supplemental scope: 2026-07-07 user request to expand player and enemy runtime sprite animation frame counts for smoother motion. This supplement does not unlock world map, final boss, player projectile, charged slash, ultimate, broad campaign systems, or a Stage2 final-art gate.

This gate unlocks only the Stage 1 player and slash runtime animation pass. Gate B v2 core art remains the visual base, but runtime animation may derive additional player frames from `art/source/player/player-animation-master-sheet.png` and additional slash runtime frames from `art/source/vfx/slash-flipbook.png`.

## Scope

- Player runtime spritesheet: replace unstable connected-component extraction with explicit master-sheet frame extraction.
- Player animation states: idle 12, run 32, small jump 16, big jump rise 20, speed flip jump 32, apex 8, fall 12, wall slide 16, wall kick 16, ground slash 32, air slash 24, hurt 6, checkpoint respawn 12.
- Enemy runtime states: Ink Crawler patrol 32, hit 8, defeat 24; Kite Wraith drift 32, hit 8, defeat 24; Lantern Warden idle/telegraph/attack/recovery/defeat 4 frames each.
- Slash runtime spritesheet: split into ground slash 8 frames and air slash 6 frames.
- Runtime behavior: choose jump pose from input duration and horizontal speed; choose slash pose from whether the slash started grounded or airborne; apply lightweight runtime sub-frame float, squash/stretch, and player afterimages during fast motion.

## Non-Scope

- No Stage 2+ implementation.
- No world map, final boss, dash, projectile, charged slash, ultimate, or broad campaign system.
- No changes to enemy faction color grouping, Stage 1 physics hitboxes, save data schema, level layout, or UI control mapping unless needed to preserve existing tests.

## Validation

- `npm.cmd run art:runtime-sheets`
- `npm.cmd run art:validate-animations`
- `npm.cmd run qa:assets-stage1`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run qa:all-stage1`

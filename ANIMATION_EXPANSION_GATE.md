# Animation Expansion Gate

Date: 2026-06-28

Supplemental scope: 2026-07-07 user request to double player and enemy runtime sprite animation frame counts. This supplement does not unlock world map, final boss, player projectile, charged slash, ultimate, broad campaign systems, or a Stage2 final-art gate.

This gate unlocks only the Stage 1 player and slash runtime animation pass. Gate B v2 core art remains the visual base, but runtime animation may derive additional player frames from `art/source/player/player-animation-master-sheet.png` and additional slash runtime frames from `art/source/vfx/slash-flipbook.png`.

## Scope

- Player runtime spritesheet: replace unstable connected-component extraction with explicit master-sheet frame extraction.
- Player animation states: idle 12, run 16, small jump 8, big jump rise 10, speed flip jump 16, apex 4, fall 6, wall slide 8, wall kick 8, ground slash 16, air slash 12, hurt 6, checkpoint respawn 12.
- Enemy runtime states: Ink Crawler patrol 16, hit 8, defeat 12; Kite Wraith drift 16, hit 8, defeat 12; Lantern Warden idle/telegraph/attack/recovery/defeat 2 frames each.
- Slash runtime spritesheet: split into ground slash 8 frames and air slash 6 frames.
- Runtime behavior: choose jump pose from input duration and horizontal speed; choose slash pose from whether the slash started grounded or airborne.

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

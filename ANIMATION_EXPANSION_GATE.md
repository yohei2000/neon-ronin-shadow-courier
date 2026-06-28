# Animation Expansion Gate

Date: 2026-06-28

This gate unlocks only the Stage 1 player and slash runtime animation pass. Gate B v2 core art remains the visual base, but runtime animation may derive additional player frames from `art/source/player/player-animation-master-sheet.png` and additional slash runtime frames from `art/source/vfx/slash-flipbook.png`.

## Scope

- Player runtime spritesheet: replace unstable connected-component extraction with explicit master-sheet frame extraction.
- Player animation states: idle 6, run 8, small jump 4, big jump rise 5, speed flip jump 8, apex 2, fall 3, wall slide 4, wall kick 4, ground slash 8, air slash 6, hurt 3, checkpoint respawn 6.
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

# Neon Ronin Stage 1 Plan

This repository now targets one product-quality Stage 1 vertical slice:

**Neon Ronin: Shadow Courier — Stage 1: Neon Alley: First Delivery**

## Scope

Build and maintain only the first playable stage. The accepted runtime flow is:

`Boot -> Preload -> Title -> Stage 1 -> Stage Clear`

Allowed support screens:

- Controls
- Settings
- Pause
- Game Over
- Credits/About

Do not add broad campaign structures, later-stage menus, unused abilities, unused enemies, or unused boss systems.

## Required Stage 1 Experience

The player must:

- Start from a title screen that presents the neon courier fantasy.
- Learn movement and jump in a safe first screen.
- Learn slash timing against Ink Crawler.
- Use wall slide and wall kick in Wall-Kick Sign Shaft.
- Cross Rooftop Gap Line and Neon Thorn Run.
- Activate checkpoints and retry from checkpoint.
- Collect seals and exactly three hidden scrolls.
- Defeat Lantern Warden before the Moon Gate opens.
- Reach Stage Clear with time, rank, scroll count, damage taken, and retry/title options.

## Stage Data Requirements

`src/data/stage1.json` must include:

- Named sections and critical path metadata
- Player spawn and goal
- Platforms
- Hazards
- Pickups
- Exactly 3 scrolls
- Enemy spawns
- Checkpoints
- Miniboss trigger
- Tutorial markers

`npm run qa:level` must fail if the stage becomes too small, unsafe at start, out of order, missing pickups, missing checkpoints, missing scrolls, missing hazards, missing enemy encounters, or missing a coarse route to the goal.

## Technical Requirements

- Phaser 3.90.x
- Vite
- TypeScript strict
- npm
- Vitest
- Playwright
- No React/Vue/Svelte
- No runtime network assets
- Local procedural art/audio unless a committed permissive asset is documented

Required scripts:

- `npm run dev`
- `npm run preview`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run e2e`
- `npm run qa:level`
- `npm run qa:assets`
- `npm run qa:bundle`
- `npm run qa:screenshots`
- `npm run qa:all`

## Required QA Artifacts

Generated under `artifacts/qa/`:

- `title.png`
- `controls.png`
- `settings.png`
- `stage-start.png`
- `movement-tutorial.png`
- `combat-encounter.png`
- `wall-kick-shaft.png`
- `checkpoint.png`
- `miniboss.png`
- `stage-clear.png`
- `mobile-controls-390x844.png`
- `console-report.json`
- `e2e-report.json`
- `stage1-acceptance-report.md`

## Completion Gate

Completion requires all commands below to pass in the current worktree:

```bash
npm run typecheck
npm run test
npm run build
npm run e2e
npm run qa:level
npm run qa:assets
npm run qa:bundle
npm run qa:screenshots
npm run qa:all
```

No completion claim is valid without browser E2E proof, screenshot artifacts, a clean console report, updated README, and updated implementation notes.

# Neon Ronin Agent Handoff

## Current Product Scope

This repository is a Stage 1-only Phaser/Vite/TypeScript browser game:

- Title: `Neon Ronin: Shadow Courier`
- Stage: `Stage 1 - Neon Alley: First Delivery`
- Runtime flow: `Boot -> Preload -> Title -> Stage1 -> StageClear`
- Support scenes: Controls, Settings, Pause, GameOver, Credits

Do not reintroduce a world map, campaign save structure, final boss, Stage 2-5 content, unused abilities, or unused enemies.

## Reference Repositories Used

These public GitHub repositories were inspected for structure and workflow patterns only. Do not copy code or assets from them.

- `https://github.com/remarkablegames/phaser-platformer`
  - Recent Phaser platformer template with `AGENTS.md`, script discipline, typed structure, and explicit conventions.
- `https://github.com/rootasjey/phaser3-platformer`
  - Phaser platformer example for scene/sprite separation context.
- `https://github.com/iwantantra/vite-phaser-ts`
  - Vite + Phaser + TypeScript starter structure.
- `https://github.com/phaserjs/template-vite-ts`
  - Official Phaser template reference for Vite/TypeScript project organization. Note: current upstream uses Phaser 4; this project must remain Phaser 3.90.x.
- `https://github.com/danipeck/squishroom`
  - Small Phaser/TypeScript platformer reference for keeping gameplay code outside the main scene where practical.

## Current Quality Baseline

Last full local gate:

```bash
npm run qa:all
```

Status from the last completed cycle: PASS.

Required artifacts are committed under `artifacts/qa/`, including:

- title, controls, settings, stage-start, movement-tutorial, combat-encounter, wall-kick-shaft, checkpoint, miniboss, stage-clear, mobile-controls screenshots
- `console-report.json`
- `e2e-report.json`
- `bundle-report.json`
- `dist-report.json`
- `playtest-tuning.md`
- `stage1-acceptance-report.md`

GitHub Pages is deployed from `main` using `.github/workflows/deploy.yml`.

## Development Rules

- Preserve Stage 1-only scope.
- Keep TypeScript strict.
- Use npm scripts already defined in `package.json`.
- Use Playwright evidence for browser-visible claims.
- When improving quality, prefer one complete vertical improvement cycle over broad partial changes.
- Update screenshots and QA reports after any visual, gameplay, or input change.
- Keep README and IMPLEMENTATION_NOTES honest with current evidence.

## High-Value Next Improvements

Recommended next cycle:

1. Run a physical-device human playtest focused on mobile HUD scale, input reach, boss readability, and optional scroll discoverability. The automated mobile layout checks are now a baseline, not a substitute for hand testing.
2. Keep pause/retry, high-contrast pixel, boss-route, dist-smoke, and playtest-note coverage stable if menu labels, layout, palette, or combat timing changes.
3. Keep `StageProgression` as the owner of checkpoints, tutorials, section lookup, and fall rescue if progression behavior changes.
4. Keep route-health thresholds honest if playtest tuning changes damage, time, or seal collection.
5. Keep `qa:dist` and `qa:playtest` wired into local `qa:all`; keep `qa:dist` wired into the Pages workflow if deployment/build paths change.

## Handoff Notes From Latest Cycle

Latest cycle improvements:

- Added `src/utils/touchLayout.ts` so virtual-control positions, labels, radii, hit radii, and clusters are shared by rendering and QA.
- Added `tests/touchLayout.test.ts` to protect the seven-button layout, lower control band, action gap, and upper-right pause safe area.
- Exposed `touchControls` through `window.__NEON_RONIN_QA__` and extended E2E mobile checks to validate layout before input probes.
- Updated `qa:playtest` output to include mobile layout evidence from `artifacts/qa/e2e-report.json`.
- Added `npm run qa:playtest` to generate `artifacts/qa/playtest-tuning.md` from current route-health, level, dist, and screenshot evidence.
- Captured current tuning decisions: keep enemy spacing/hazard damage/boss HP stable, avoid tuning optional scrolls from the optimized route alone, and make mobile HUD/input ergonomics the next physical-phone check.
- Added `npm run qa:dist` to serve built `dist/` output and verify production Title -> Stage 1 boot from emitted assets.
- Added `artifacts/qa/dist-report.json` and an acceptance-report row for production dist smoke coverage.
- Added a Pages post-build smoke step with `QA_DIST_BASE=/${{ github.event.repository.name }}/`, following the production page-test pattern seen in `remarkablegames/phaser-platformer`.
- Updated GitHub Pages deployment to current Node 24-era action majors: `checkout@v7`, `setup-node@v6`, `configure-pages@v6`, `upload-pages-artifact@v5`, and `deploy-pages@v5`.
- Added `.nvmrc` with Node 24 and switched the workflow to `node-version-file`.
- Set Pages workflow concurrency to cancel stale in-progress deploys after a newer push.
- Split checkpoint activation, tutorial marker rendering, fall rescue, respawn, and current section lookup into `StageProgression`.
- Added `tests/stageProgression.test.ts` for pure checkpoint and section progression helpers, following the gameplay-helper test pattern seen in `danipeck/squishroom`.
- Split Phaser into a dedicated `vendor-phaser` build chunk and added `npm run qa:bundle`.
- Added `artifacts/qa/bundle-report.json` to record chunk counts and largest app chunk size.
- Split background, platform, high-contrast outlines, rain/parallax, and decor setup out of `Stage1Scene` into `StageWorld`.
- Added `stage1-route-health` to E2E with route duration, damage, rank, seal count, and thresholds in `artifacts/qa/e2e-report.json`.
- Moved the miniboss screenshot trigger to the pre-fight encounter view so screenshot capture does not stall combat timing.
- Split enemy, miniboss, gate, boss barrier, and slash-hit orchestration out of `Stage1Scene` into `StageCombat`.
- Reduced `Stage1Scene` to scene flow, stage setup, player/checkpoint state, HUD, and clear/game-over transitions.
- Split collectibles and hazards out of `Stage1Scene` into `StageCollectibles` and `StageHazards`.
- Added Playwright canvas pixel sampling to verify high contrast mode affects visible Stage 1 pixels.
- Stabilized the automated Lantern Warden route so screenshot capture does not leave the player facing away during attacks.
- Added Playwright E2E coverage for Pause -> Retry Checkpoint and Pause -> Restart Stage using real menu input.
- Updated the acceptance report to verify the pause/retry test from `artifacts/qa/e2e-report.json`.
- Added `StageHud` to move HUD/objective/section/boss-bar responsibilities out of `Stage1Scene`.
- Added pure combat helpers and `tests/combat.test.ts` for damage cooldown behavior.
- Moved the mobile pause button away from the attack cluster to the upper-right safe area.
- Previous cycle added `CameraController`, hit pause, high contrast stage outlines, and stable Lantern Warden tuning.

Before handing off again:

1. Run `npm run qa:all`.
2. Commit all changes.
3. Push to `origin/main`.
4. Verify GitHub Actions Pages deploy.
5. Update this file with the latest cycle summary and next recommended step.

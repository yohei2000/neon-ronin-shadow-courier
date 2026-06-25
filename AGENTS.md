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

1. Add a small pure test around combat/damage cooldown or rank/clear result edge cases.
2. Improve mobile portrait ergonomics by moving the pause button away from the attack cluster.
3. Add a settings-flow E2E check that toggles high contrast and verifies it changes gameplay visuals.
4. Add a short human-playtest tuning note after checking Stage 1 manually.
5. Consider splitting `Stage1Scene` further into HUD, collectibles, and hazards if it grows.

## Handoff Notes From Latest Cycle

Latest cycle improvements:

- Added `CameraController` to isolate camera follow/lead logic from `Stage1Scene`.
- Added physics hit pause on enemy/miniboss hit through `FXSystem.hitPause`.
- Made high contrast visibly affect Stage 1 platform outlines and hazard tint.
- Added this `AGENTS.md` so the next context-reset agent can resume without reading prior chat.
- Tuned Lantern Warden HP to keep screenshot/E2E clear routes stable while preserving a readable elite fight.

Before handing off again:

1. Run `npm run qa:all`.
2. Commit all changes.
3. Push to `origin/main`.
4. Verify GitHub Actions Pages deploy.
5. Update this file with the latest cycle summary and next recommended step.

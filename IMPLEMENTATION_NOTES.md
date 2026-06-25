# Implementation Notes

## Implemented

Neon Ronin: Shadow Courier is implemented as a complete Phaser 3.90 + Vite + strict TypeScript browser game. It boots from title to world map, supports settings/controls, plays through 5 stages, persists progress, and reaches an ending after the 3-phase final boss.

Core features include:

- 5 hand-authored stages with exactly 3 hidden scrolls each
- World map unlock flow and localStorage save data
- Mobile virtual controls sharing the same `InputSystem` state as keyboard input
- Player movement, dash, wall kick, projectile art, charged slash, ultimate art
- 5 enemy types plus boss patterns, minion summons, and boss health UI
- Checkpoints, hazards, pickups, moving/falling platforms, wind zones, stage gates
- Pause, retry checkpoint, restart stage, game over, stage clear, settings, controls, ending
- Procedural textures, particles, shake, and WebAudio SFX
- Vitest coverage for level validation, save logic, and pure utilities

## Main Systems

- `src/scenes/GameScene.ts`: stage runtime, collision wiring, HUD, boss trigger, clear/game-over flow
- `src/entities/Player.ts`: movement, jump polish, dash, combat intent, damage, respawn
- `src/entities/Enemy.ts`: all 5 enemy behaviors
- `src/entities/Boss.ts`: Aogane no Onmyo-Core, 3 phases, projectile/minion patterns
- `src/systems/InputSystem.ts`: keyboard/touch input merging
- `src/systems/TouchControls.ts`: mobile D-pad and Jump/Attack/Dash/Art overlay
- `src/systems/SaveSystem.ts`: schema defaults, migration, corrupted-save fallback, stage completion
- `src/utils/levelValidation.ts`: level and stage-order validation
- `src/scenes/PreloadScene.ts`: generated textures for all visuals
- `src/systems/AudioSystem.ts`: generated WebAudio SFX

## Level DSL

Levels live in `src/data/levels.ts`. Each stage is defined as a typed draft with:

- dimensions and theme
- platform rectangles that generate tile rows
- player spawn, goal, checkpoints
- scrolls, pickups, hazards, enemies, moving platforms, falling platforms, wind zones
- required abilities and stage unlock ability
- optional boss definition

The public `LevelDefinition` still contains concrete tile rows, so validation can check unknown symbols, dimensions, goal markers, boss triggers, bounds, scroll count, and ability gate ordering.

## Save Schema

`SaveData` includes:

- `schemaVersion`
- `unlockedStages`
- `unlockedAbilities`
- per-stage best time, best rank, scroll IDs, clear count
- settings and assist flags
- `hasClearedGame`
- aggregate completion stats

`normalizeSave` merges missing or old fields safely, clamps numeric settings, and falls back to defaults for corrupted JSON.

## Validation Status

Validated commands:

- `npm run typecheck`
- `npm run test`
- `npm run build`

The test script uses Vitest's Node API with `config: false` because CLI config loading in this Windows path failed before tests could run.

## Tuning Notes

- Assist fall rescue is enabled by default to support fair first-time clears.
- Stage ability unlocks occur at stage start so each stage can immediately teach its new mechanic.
- Replay keeps later abilities available in earlier stages.
- GearSentinel blocks weak frontal hits and is easier to handle with projectiles or charged slash.
- Ultimate Art spends high energy, clears hostile projectiles, damages nearby enemies, and chunks the boss.

## Simplifications

- Stages are shorter than the 4-7 minute target but each is completable and includes its required mechanics.
- Procedural audio is SFX-only, not a music system.
- One-way platforms are represented as thin solid platforms for implementation stability.
- High contrast is saved and affects UI intent, but core generated texture palette remains the same after preload.

## Add a Stage

1. Add a `makeLevel` draft to `src/data/levels.ts`.
2. Use a new `StageId` only after extending `StageId`, `StageIds`, and save stats.
3. Place exactly 3 scrolls.
4. Add checkpoint and goal coordinates.
5. Add required abilities that are available before the stage.
6. Run `npm run test` to verify `validateAllLevels`.

## Add an Enemy

1. Extend `EnemyType` in `src/types/game.ts`.
2. Add balance values in `src/data/balance.ts`.
3. Add a texture key and generated texture in `PreloadScene`.
4. Add behavior in `src/entities/Enemy.ts`.
5. Use the type in a level spawn.

## Known Risks

- Phaser Arcade moving platforms are intentionally simple and may not handle every edge case of high-speed player collision.
- Browser audio starts only after user gesture, by platform policy.
- The game is designed for product-complete local play, not for advanced code splitting; Phaser keeps the JS bundle large.

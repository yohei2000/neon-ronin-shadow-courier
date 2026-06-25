# PLAN.md — Neon Ronin: Shadow Courier

## Mission

Implement a complete, production-quality browser game from scratch in this repository.

Build **Neon Ronin: Shadow Courier**, a 2D side-scrolling ninja-themed action platformer using **Vite + Phaser 3.90.x + TypeScript strict**. The game must be playable from title screen to ending, include 5 stages, a world map, mobile virtual controls, save/settings, procedural visuals/audio, tests, README, and a passing build.

This is not a prototype shell. Implement the full playable product.

## Fixed User Choices

- Engine: Phaser 3.90.x, not Phaser 4.
- Bundler: Vite.
- Language: TypeScript strict.
- Package manager: npm.
- Visual style: sumi-e ink painting + neon.
- Input: PC keyboard + mobile virtual controls.
- Mobile control layout: left D-pad + right 4 buttons: Jump, Attack, Dash, Art.
- Difficulty: fair first-time 30-minute clear.
- Structure: 5 stages + final boss.
- Level implementation: hand-written typed DSL, no external Tiled files.
- Assets: no external assets; generate textures/audio procedurally.
- Progression: ability unlock sequence.
- Boss: yokai/sorcerer style, 3 phases.
- Assist: configurable assist options required.
- Tests: Vitest for pure logic, level validation, save logic.
- Resolution: 960x540 base, responsive scale.
- Deployment: add GitHub Pages workflow.
- Priority: product feel first: UI, settings, polish, README, implementation notes.
- Codex style: strict checklist, self-correction loop, use/simulate subagents when helpful.

## Product Summary

**Title:** Neon Ronin: Shadow Courier  
**Genre:** 2D side-scrolling action platformer  
**Target clear time:** about 30 minutes for a first-time player  
**Tone:** original non-graphic fantasy ninja action, ink shadows, neon city, yokai, clockwork, data-shrine motifs  
**Player fantasy:** fast ninja movement, wall kicks, dash, slash, projectile art, charged slash, ultimate art  
**Platforms:** desktop browser and mobile browser  
**Base resolution:** 960x540  
**Rendering:** crisp stylized generated pixel/ink assets  
**Violence style:** non-graphic, stylized sparks/ink/energy only; no gore, no realistic injury detail

## Reference Policy

Use references only for architecture, API usage, project structure, abstract mechanics, and high-level patterns. Do not copy assets, code wholesale, level layouts, names, characters, audio, sprites, UI, or proprietary/trademarked ideas.

Reference inspiration only:

- `phaserjs/template-vite-ts`: Vite + TypeScript + Phaser project shape.
- `phaserjs/template-vite`: Phaser + Vite shape.
- `TorresjDev/TS-Phaser-Game-Jumper`: playable Phaser 3 + TypeScript platformer structure.
- `ubershmekel/vite-phaser-ts-starter`: Vite + Phaser + TypeScript menu/bootstrap structure.
- Ourcade side-scrolling platformer material: platformer camera/physics/level patterns.
- Phaser official examples: API usage only.

All game identity, writing, art, level data, generated sprites, generated SFX, UI, naming, and layouts must be original.

## Hard Requirements

- Use Phaser `~3.90.0`.
- Do not use Phaser 4.
- Use TypeScript strict mode.
- Do not disable strictness to pass build.
- No implicit `any`.
- Use Vite.
- Use npm.
- Do not add React, Vue, Svelte, or other frontend framework.
- Do not use external images, audio, fonts, spritesheets, tilemaps, or remote assets.
- Generate all textures and audio procedurally in code.
- Game must boot with `npm run dev`.
- `npm run typecheck` must pass.
- `npm run test` must pass.
- `npm run build` must pass.
- Add `npm run lint` if feasible; if added, it must pass.
- Add README.md.
- Add IMPLEMENTATION_NOTES.md.
- Add GitHub Pages deployment workflow.
- Do not leave TODO-only stubs for core gameplay.
- Do not fake test/build results.
- If scope must be simplified, implement a working minimal version and document the simplification.

## Definition of Done

The task is done only when all are true:

- `npm install` works.
- `npm run dev` boots the game.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` passes.
- Game is playable from title screen to ending.
- World map exists.
- Stage unlocks persist.
- 5 stages exist.
- Each stage is completable.
- Stage 5 contains final boss.
- Final boss has 3 phases and can be defeated.
- Ending scene and credits appear after final boss.
- Keyboard controls work.
- Mobile virtual D-pad and 4 action buttons work.
- Touch controls feed into the same input abstraction as keyboard.
- Player has run, jump, variable jump, coyote time, jump buffer, wall slide, wall jump, dash, attack, projectile/art, charged slash, ultimate art.
- Ability unlock sequence works.
- At least 5 enemy types exist.
- Hazards, pickups, checkpoints, stage gates, hidden scrolls exist.
- Exactly 3 hidden scrolls per stage.
- HUD shows HP, energy, seals/scrolls, stage, timer.
- Pause, retry checkpoint, retry stage, game over, stage clear, settings, controls, world map, ending flows work.
- Save/localStorage persists settings, unlocked stages, unlocked abilities, best times, ranks, scrolls, clear state.
- Corrupted save data does not crash the game.
- Assist settings exist and affect gameplay.
- Procedural visuals exist.
- Procedural SFX exist.
- Reduced FX and reduced shake settings exist.
- Level validation exists and is tested.
- Save logic is tested.
- Pure utilities are tested.
- README and IMPLEMENTATION_NOTES explain setup, controls, architecture, features, limitations.
- No external copyrighted/proprietary assets are included.

## Subagent Orchestration

You may spawn subagents if the Codex environment supports it. Use subagents aggressively but responsibly for parallel planning, implementation, review, and validation. If true subagents are unavailable, simulate the same roles as sequential internal passes before editing.

### Architect Agent

Owns:

- Project structure.
- Scene lifecycle.
- TypeScript boundaries.
- Dependency choices.
- Shared interfaces.
- Integration order.
- Preventing the codebase from collapsing into one giant GameScene.

Must produce a concise implementation map before large edits.

### Gameplay Agent

Owns:

- Player.
- InputSystem.
- Movement.
- Combat.
- Ability unlocks.
- Enemies.
- Boss mechanics.
- Hazards.
- Assist modifiers.

Must ensure gameplay is actually playable from Stage 1 through final boss.

### Level Design Agent

Owns:

- Level DSL.
- 5 stage layouts.
- Checkpoints.
- Scroll placement.
- Pacing.
- Validation rules.
- Stage unlock flow.
- Ability gates.

Must ensure every stage is completable with the abilities available at that point and total first-time clear time targets about 30 minutes.

### UI/UX Agent

Owns:

- Title.
- World map.
- HUD.
- Pause.
- Settings.
- Controls.
- Stage clear.
- Ending.
- Mobile virtual controls.
- Responsive layout.
- Assist/accessibility UI.

Must ensure mobile D-pad + Jump/Attack/Dash/Art buttons work through the same InputSystem as keyboard.

### Procedural Assets/FX/Audio Agent

Owns:

- Generated textures.
- Animation frames.
- Particles.
- Parallax backgrounds.
- Palette.
- Procedural SFX.
- Reduced-FX behavior.

Must not introduce external images, audio, fonts, or copyrighted assets.

### Persistence/Test Agent

Owns:

- SaveSystem.
- localStorage schema and migration.
- Corrupted-save fallback.
- Vitest tests.
- Level validation tests.
- Utility tests.

Must keep tests pure and fast.

### QA/Build-Fixer Agent

Owns final validation:

- Run commands.
- Fix TypeScript errors.
- Fix test failures.
- Fix build failures.
- Audit likely runtime bugs.
- Simplify non-essential polish if required to make the product playable and green.

QA/Build-Fixer has final authority to simplify optional polish, but not core requirements.

### Coordination Rules

- Define shared contracts early:
  - `SceneKey`
  - `TextureKey`
  - `AudioKey`
  - `InputState`
  - `AbilityId`
  - `SaveData`
  - `LevelDefinition`
  - `TileSymbol`
  - `EnemyDefinition`
  - `DamageSource`
  - `AssistSettings`
- Prefer additive modular files and typed interfaces.
- Do not let subagents produce disconnected prototypes.
- Every contribution must integrate into the running game.
- If multiple subagents modify the same area, Architect Agent reconciles final design.
- Do not stop at reports. Apply code changes, run commands, fix errors, and deliver the finished repository.

## Recommended Project Structure

Use this structure or an equivalent modular structure. Do not collapse everything into one file.

```txt
src/
  main.ts
  config/
    gameConfig.ts
    controls.ts
    palette.ts
    keys.ts
  scenes/
    BootScene.ts
    PreloadScene.ts
    TitleScene.ts
    ControlsScene.ts
    SettingsScene.ts
    WorldMapScene.ts
    GameScene.ts
    PauseScene.ts
    GameOverScene.ts
    StageClearScene.ts
    EndingScene.ts
  entities/
    Player.ts
    Enemy.ts
    Boss.ts
    Projectile.ts
    Pickup.ts
    Checkpoint.ts
    Hazard.ts
    MovingPlatform.ts
    enemies/
      ShadowCrawler.ts
      KiteWraith.ts
      GearSentinel.ts
      NeonArcher.ts
      PulseJumper.ts
  systems/
    InputSystem.ts
    TouchControls.ts
    CombatSystem.ts
    CameraSystem.ts
    LevelSystem.ts
    SaveSystem.ts
    AudioSystem.ts
    FXSystem.ts
    UISystem.ts
    AssistSystem.ts
  data/
    balance.ts
    levels.ts
    abilities.ts
    copy.ts
  types/
    game.ts
    levels.ts
    save.ts
    input.ts
    combat.ts
  utils/
    math.ts
    assertions.ts
    levelValidation.ts
    storage.ts
    time.ts
  tests/
    levelValidation.test.ts
    saveSystem.test.ts
    math.test.ts
```

## Package and Scripts

Use minimal dependencies.

Required runtime dependency:

- `phaser@~3.90.0`

Required dev dependencies:

- `vite`
- `typescript`
- `vitest`

Optional dev dependencies if feasible:

- `eslint`
- `typescript-eslint`

Required package scripts:

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

Add `lint` if real ESLint is configured and green.

## Game Config

- Base width: 960.
- Base height: 540.
- Scale mode: fit or resize-safe equivalent.
- Pixel art / crisp rendering where appropriate.
- Arcade Physics preferred for implementation stability.
- Physics debug off by default.
- Centralize constants in `gameConfig.ts` and `balance.ts`.
- Mobile/touch detection must not be fragile; allow touch UI to be forced in settings.

## Scene Requirements

### BootScene

- Initialize save/settings.
- Register global defaults.
- Route to PreloadScene.

### PreloadScene

- Generate all textures procedurally.
- Generate player/enemy/tile/UI textures.
- Generate animation frame variants.
- Initialize procedural audio system.
- No external asset loads.

### TitleScene

Required menu items:

- New Game.
- Continue.
- World Map.
- Settings.
- Controls.
- Credits.

### ControlsScene

Show:

- Keyboard controls.
- Mobile controls.
- Ability summary.
- Assist explanation.

### SettingsScene

Must include:

- Master volume.
- SFX volume.
- Reduced screen shake.
- Reduced particles.
- High contrast.
- Touch UI enabled/auto.
- Touch UI opacity.
- Assist toggles:
  - longer invulnerability.
  - reduced damage.
  - fall rescue.
  - easier checkpoints or checkpoint heal if cheap.

### WorldMapScene

Must include:

- Stage cards for 5 stages.
- Locked/unlocked states.
- Stage best time.
- Rank.
- Scroll count.
- Start selected stage.
- Return to title.

### GameScene

Must include:

- Level load by stage id.
- Player spawn.
- Terrain/collisions.
- Hazards.
- Pickups.
- Enemies.
- Checkpoints.
- Boss trigger in Stage 5.
- Stage clear.
- Pause.
- Game over.
- Checkpoint restart.
- Stage restart.

### PauseScene

Must include:

- Resume.
- Retry checkpoint.
- Restart stage.
- Settings.
- Title/world map.

### GameOverScene

Must include:

- Retry checkpoint.
- Retry stage.
- Return to world map.
- Return to title.

### StageClearScene

Must include:

- Clear time.
- Scroll count.
- Damage or defeat count.
- Rank.
- Unlock next stage.
- Return to world map.
- Next stage.

### EndingScene

Must include:

- Ending text.
- Credits.
- Final stats.
- Return to title/world map.

## Controls

### Keyboard

- Move left/right: `A/D` or `ArrowLeft/ArrowRight`.
- Jump: `W`, `Space`, or `ArrowUp`.
- Dash: `Shift` or `L`.
- Attack: `J` or `Z`.
- Art/projectile: `K` or `X`.
- Confirm: `Enter`.
- Pause: `Esc` or `P`.

### Mobile

Virtual controls:

- Left D-pad:
  - Left.
  - Right.
  - Up optional/jump duplicate.
  - Down optional/drop/crouch/future hook.
- Right buttons:
  - Jump.
  - Attack.
  - Dash.
  - Art.

Requirements:

- Buttons visible on touch-capable/narrow screens or when forced in settings.
- Buttons have pressed/active visual state.
- Button opacity respects setting.
- Touch controls integrate into `InputSystem`.
- Touch overlay must not block menus incorrectly.
- Pause/menu interactions must still work on mobile.

## Player Mechanics

Implement robust platformer movement:

- Run.
- Variable-height jump.
- Coyote time.
- Jump buffer.
- Wall slide.
- Wall jump.
- Dash.
- Attack.
- Projectile/art.
- Charged slash.
- Ultimate art.
- Hurt state.
- Death/respawn.
- Facing direction.
- Hit pause.
- Knockback.
- Invulnerability frames.

Suggested state names:

- `idle`
- `run`
- `jump`
- `fall`
- `wallSlide`
- `dash`
- `attack`
- `hurt`
- `dead`

Movement constants belong in `balance.ts`.

Do not hardcode tuning values throughout entity code.

## Ability Unlock Sequence

Abilities unlock by stage progress:

1. Stage 1: wall kick.
2. Stage 2: dash.
3. Stage 3: shuriken / energy projectile.
4. Stage 4: charged slash.
5. Stage 5: ultimate art before final boss.

Rules:

- Stage design must teach each new ability after unlock.
- Stage must be completable with abilities available at that point.
- Replay may allow later abilities in earlier stages unless this breaks validation; document chosen behavior.
- Ability flags must persist in save data.

## Combat

### Player Melee Slash

- Temporary overlap hitbox based on facing direction.
- Short active window.
- Cooldown.
- Hit each enemy once per slash.
- Apply damage.
- Apply knockback/stun.
- Spawn neon ink trail/particles.
- Add short hit pause.

### Projectile / Art

- Costs energy.
- Cooldown.
- Travels forward.
- Despawns on collision, enemy hit, or lifetime.
- Can damage enemies.
- Used for Stage 3 tutorial and later encounters.

### Charged Slash

- Unlocked Stage 4.
- Hold attack to charge.
- Release for stronger slash.
- Useful against shielded enemies or certain obstacles.

### Ultimate Art

- Unlocked Stage 5.
- Consumes full energy or uses a significant cooldown.
- Clears nearby hostile projectiles/minions.
- Damages boss moderately.
- Visually impressive but not performance-heavy.

## Enemies

Implement at least 5 enemy types.

### ShadowCrawler

- Ground patroller.
- Simple edge/obstacle turn behavior.
- Contact damage.
- Low HP.

### KiteWraith

- Flying enemy.
- Horizontal drift or sine motion.
- Contact damage.
- Teaches air threat handling.

### GearSentinel

- Shielded guard.
- Frontal resistance.
- Vulnerable from behind, charged slash, or projectile timing.
- Clear shield visual.

### NeonArcher

- Ranged spirit.
- Telegraphs before firing.
- Projectile has clear travel.
- Cooldown.

### PulseJumper

- Jumping ambusher.
- Telegraph crouch/pulse before jump.
- Contact damage.

Enemy shared requirements:

- Typed config.
- HP.
- Damage.
- Stun time.
- Knockback.
- Contact/projectile damage.
- Telegraphs before dangerous actions.
- Defeat particles.
- Drop chances for seals, health, energy.
- No gore.

Optional only after core is green:

- LanternDrone.
- MiniYokaiCaster.

## Boss

Final boss appears in Stage 5.

Suggested original name:

- `Aogane no Onmyo-Core`

Requirements:

- 3 phases.
- Boss health bar.
- Checkpoint immediately before boss.
- Boss arena locks during fight.
- Defeating boss triggers EndingScene.
- Patterns must be readable and fair.

### Phase 1

- Slow projectiles.
- Teleport repositioning.
- Clear safe windows.

### Phase 2

- Summoned minions.
- Floor glyph hazards.
- Faster projectile arcs.

### Phase 3

- Arena pattern attack.
- Requires dash, wall jump, projectile, charged slash, or ultimate art usage.
- Strong visual/audio phase transition.

## Hazards and Platforms

Implement:

- Solid tiles.
- Optional one-way platforms if feasible.
- Neon thorn / ink trap hazard.
- Falling platforms.
- Moving platforms.
- Wind/current zones or conveyor-like zones.
- Checkpoint shrines.
- Stage exit gates.
- Boss trigger gate.

Fall behavior:

- If assist fall rescue is enabled: rescue to last safe/checkpoint position with HP/energy penalty or no penalty depending setting.
- If disabled: respawn at checkpoint with HP penalty or death depending current HP.

## Collectibles and Progression

Implement:

- Seals as score/currency-like collectible.
- Health orbs.
- Energy orbs.
- Hidden scrolls.
- Exactly 3 hidden scrolls per stage.
- Stage completion percentage.
- Best time.
- Rank.

Rank formula can be simple but deterministic:

- Time.
- Scrolls collected.
- Damage taken or defeats.
- Optional seal collection.

Ranks:

- S
- A
- B
- C

## Stages

5 independent stages, selectable from world map after unlock.

Each stage should take roughly 4–7 minutes on first play. Total target clear time about 30 minutes.

### Stage 1 — Neon Alley Tutorial

Purpose:

- Movement.
- Jump.
- Wall kick tutorial.
- Low-risk enemies.
- Basic checkpoints.

Required:

- Unlock wall kick.
- 3 hidden scrolls.
- Stage exit.
- Tutorial prompts.

### Stage 2 — Rain-Slick Rooftops

Purpose:

- Dash tutorial.
- Rooftop gaps.
- Moving platforms.
- Flying enemies.

Required:

- Unlock dash.
- 3 hidden scrolls.
- More vertical movement.
- Checkpoints.

### Stage 3 — Bamboo Circuit Shrine

Purpose:

- Projectile/art tutorial.
- Shield enemies.
- Wind lanes.

Required:

- Unlock shuriken/energy projectile.
- 3 hidden scrolls.
- GearSentinel introduced.
- NeonArcher introduced.

### Stage 4 — Clockwork Castle Wall

Purpose:

- Charged slash tutorial.
- Heavier enemy mixes.
- Hazards and moving/falling platforms.

Required:

- Unlock charged slash.
- 3 hidden scrolls.
- More complex platforming.
- Checkpoints.

### Stage 5 — Inner Data Keep

Purpose:

- Ultimate art.
- Mixed gauntlet.
- Boss.

Required:

- Unlock ultimate art before final boss.
- 3 hidden scrolls.
- Checkpoint immediately before boss.
- Final boss.
- Ending transition.

## Level DSL

Use a hand-written typed DSL. Do not use external Tiled files.

Acceptable approach:

- String grids for terrain.
- Typed spawn arrays for entities.
- Typed metadata for stage id, name, unlocks, parallax theme, ability requirements.

Example conceptual shape:

```ts
type TileSymbol = "." | "#" | "^" | "=" | "M" | "F" | "W" | "G" | "C" | "S";

interface LevelDefinition {
  id: StageId;
  name: string;
  theme: StageTheme;
  width: number;
  height: number;
  tiles: readonly string[];
  playerSpawn: GridPoint;
  goal: GridPoint;
  checkpoints: readonly GridPoint[];
  scrolls: readonly ScrollDefinition[];
  enemies: readonly EnemySpawnDefinition[];
  hazards: readonly HazardDefinition[];
  movingPlatforms: readonly MovingPlatformDefinition[];
  pickups: readonly PickupDefinition[];
  unlockAbility?: AbilityId;
  requiredAbilities: readonly AbilityId[];
  boss?: BossDefinition;
}
```

You may choose different names, but preserve strong typing and validation.

## Level Validation

Implement `validateLevel` and tests.

Validation must check:

- Player spawn exists.
- Goal exists.
- Width/height match tile rows.
- No unknown tile symbols.
- Checkpoints inside bounds.
- Checkpoints valid order if ordering is meaningful.
- Enemies inside bounds.
- Hazards inside bounds.
- Pickups inside bounds.
- Moving platforms inside bounds.
- Scrolls inside bounds.
- Exactly 3 hidden scrolls per stage.
- Ability gates are valid for stage progression.
- Boss stage has boss trigger/boss definition.
- Non-boss stages do not accidentally require boss.
- Stage ids are unique.
- Stage order is valid.

## Procedural Visuals

No image files.

Generate via Phaser Graphics, CanvasTexture, or RenderTexture.

Required generated visuals:

- Player silhouette with neon scarf.
- Player animation frame variants:
  - idle.
  - run.
  - jump.
  - fall.
  - wall slide.
  - dash.
  - attack.
  - hurt.
- Enemy silhouettes with distinct shapes.
- Boss sprites/parts.
- Tile textures:
  - ink brick.
  - neon roof.
  - bamboo circuit.
  - castle gear.
  - inner keep.
- Backgrounds:
  - moon.
  - rain.
  - neon haze.
  - bamboo shadows.
  - castle silhouettes.
  - data shrine glyphs.
- Pickups:
  - seal.
  - health orb.
  - energy orb.
  - hidden scroll.
- UI icons:
  - HP.
  - energy.
  - scroll.
  - stage.
  - settings.
- Mobile buttons.
- Checkpoint shrine.
- Stage gate.

Palette:

- Dark ink base.
- Neon cyan.
- Neon magenta.
- Gold accent.
- Soft moonlight.
- High contrast alternative.

Centralize palette constants.

## FX

Implement:

- Dash afterimage.
- Hit sparks.
- Slash trail.
- Projectile trail.
- Pickup glow.
- Checkpoint burst.
- Boss phase burst.
- Stage clear burst.
- Screen shake.

Reduced FX setting must lower particles and screen shake.

## Procedural Audio

No audio files.

Use WebAudio or Phaser-compatible generated sound approach.

Required SFX:

- Confirm.
- Cancel.
- Jump.
- Wall jump.
- Dash.
- Slash.
- Charged slash.
- Projectile.
- Enemy hit.
- Enemy defeat.
- Player hurt.
- Pickup.
- Checkpoint.
- Stage clear.
- Boss phase.
- Victory.

Requirements:

- Master volume.
- SFX volume.
- Mute.
- Mobile browser audio resume after user gesture.
- No crash if AudioContext cannot start immediately.

## Save System

Use localStorage.

Save schema must include:

- Schema version.
- Unlocked stages.
- Unlocked abilities.
- Best times per stage.
- Best ranks.
- Scrolls collected per stage.
- Settings.
- Assist flags.
- Has cleared game.
- Completion stats.

Requirements:

- Default save creation.
- Corrupted JSON fallback.
- Schema migration/default handling.
- No crash on missing fields.
- Tests for save defaults, corrupted fallback, stage unlock persistence.

## Assist and Accessibility

Required settings:

- Longer invulnerability.
- Reduced damage.
- Fall rescue.
- Reduced screen shake.
- Reduced particles.
- High contrast.
- Touch UI opacity.
- Touch UI force enable/disable/auto.
- Volume controls.

Assist should modify gameplay but not break progression.

## UI/HUD

HUD must show:

- HP.
- Energy.
- Current stage.
- Timer.
- Seals or score.
- Scroll count.
- Ability unlock indicator.
- Boss health bar when boss active.

UI must be legible at 960x540 and on mobile.

## Tests

Use Vitest.

Required tests:

### `levelValidation.test.ts`

- Every real stage passes validation.
- Unknown tile fails.
- Missing spawn fails.
- Missing goal fails.
- Invalid scroll count fails.
- Out-of-bounds enemy fails.
- Boss stage validation works.

### `saveSystem.test.ts`

- Default save is valid.
- Corrupted JSON falls back safely.
- Stage unlock persists.
- Settings merge/migration works.

### `math.test.ts`

Test pure helpers such as:

- clamp.
- lerp.
- sign.
- time formatting.
- rank calculation if pure.

Keep tests pure and fast. Do not require Phaser runtime for tests unless absolutely necessary.

## GitHub Pages

Add `.github/workflows/deploy.yml`.

Workflow should:

- Checkout.
- Setup Node.
- Install dependencies with npm.
- Run typecheck.
- Run test.
- Build.
- Upload artifact.
- Deploy to GitHub Pages.

Vite base path must be configurable.

Suggested approach:

- Use `VITE_BASE` environment variable.
- Default to `/`.
- Document GitHub Pages base usage in README.

## README.md Requirements

README must include:

- Title.
- Pitch.
- Screenshot placeholder note if no real screenshot.
- Setup commands.
- Development commands.
- Build/preview commands.
- Controls.
- Mobile controls.
- Gameplay features.
- Stage list.
- Assist/accessibility settings.
- Architecture overview.
- Scripts.
- Deployment notes.
- Asset policy.
- Testing.
- Known limitations.
- Future work.

Asset policy wording must state:

- All visuals/audio are original code-generated placeholders/assets.
- No external image/audio/font files are required.
- Reference repositories were used only for architectural/API inspiration.

## IMPLEMENTATION_NOTES.md Requirements

Include:

- What was implemented.
- Main systems/files.
- Level DSL summary.
- Save schema summary.
- Test/validation status.
- Tuning notes.
- Simplifications, if any.
- How to add a new stage.
- How to add a new enemy.
- Known risks.

## Implementation Strategy

Follow this sequence.

1. Inspect repository.
2. If empty, scaffold Vite TypeScript app.
3. Install dependencies:
   - Phaser 3.90.x.
   - Vite.
   - TypeScript.
   - Vitest.
   - ESLint only if feasible.
4. Architect pass:
   - Define file structure.
   - Define shared types.
   - Define scene keys.
   - Define texture/audio key constants.
   - Define level DSL.
   - Define save schema.
   - Define input abstraction.
5. Implement foundational scenes:
   - BootScene.
   - PreloadScene.
   - TitleScene.
   - WorldMapScene.
   - GameScene.
   - StageClearScene.
   - EndingScene.
6. Implement procedural texture generation.
7. Implement InputSystem:
   - Keyboard.
   - Mobile touch controls.
   - Unified InputState.
8. Implement Player:
   - Movement.
   - Jump polish.
   - Wall movement.
   - Dash.
   - Combat.
   - Abilities.
9. Implement Level DSL and validator.
10. Implement Stage 1 fully playable.
11. Generalize systems after Stage 1 works.
12. Add Stages 2–5.
13. Add enemies.
14. Add hazards.
15. Add pickups.
16. Add checkpoints.
17. Add ability unlocks.
18. Add boss.
19. Add save/settings/assist.
20. Add HUD/UI polish.
21. Add procedural audio.
22. Add tests.
23. Add README.
24. Add IMPLEMENTATION_NOTES.
25. Add GitHub Pages workflow.
26. Run validation commands.
27. Fix all failures.
28. Rerun validation until green.
29. Perform manual code audit.
30. Final response with results.

## Validation Commands

Run these before final response:

```bash
npm run typecheck
npm run test
npm run build
```

If `lint` exists:

```bash
npm run lint
```

Fix failures and rerun until green.

## Manual Runtime Audit

Before final response, inspect code for likely runtime issues:

- Missing texture keys.
- Missing scene keys.
- Missing animation keys.
- Missing audio keys.
- Undefined save fields.
- Broken checkpoint restart.
- Broken stage clear transition.
- Broken world map unlock.
- Broken boss defeat transition.
- Touch overlay blocking menu interactions.
- Physics groups not cleaned up on scene restart.
- Player body assumptions during scene transitions.
- Corrupted localStorage crash.
- Boss arena softlock.
- Stage impossible before required ability unlock.
- Tests passing while real levels invalid.
- External asset dependency accidentally introduced.

## Scope Simplification Rules

If the full spec risks failing build/test/playability, simplify in this order:

1. Reduce optional enemy variants, but keep 5 required enemy types.
2. Simplify procedural audio, but keep required SFX keys functional.
3. Simplify particle counts, but keep visible feedback.
4. Simplify level length, but keep 5 completable stages and 3 scrolls each.
5. Simplify GitHub Pages config, but keep workflow file and documentation.
6. Simplify boss visuals, but keep 3 distinct phases.
7. Simplify rank formula, but keep deterministic ranks.

Do not simplify away:

- 5 stages.
- Final boss.
- Mobile controls.
- Save/settings.
- Ability unlocks.
- Tests.
- Typecheck/build passing.
- Procedural asset policy.
- World map.
- Stage clear/ending flow.

## Non-Negotiables

- Do not stop after scaffolding.
- Do not deliver only a prototype shell.
- Do not leave core gameplay as TODO.
- Do not use Phaser 4.
- Do not use remote assets.
- Do not use external images/audio/fonts.
- Do not copy assets or layouts from references.
- Do not remove TypeScript strictness.
- Do not fake command results.
- Do not ignore failing tests/build/typecheck.
- Do not produce disconnected subagent reports without integrated code.
- Do not ask for clarification unless a true hard blocker prevents any reasonable implementation.

## Final Response Format

When finished, respond with:

1. Summary of implementation.
2. Commands run and results.
3. Important files created/changed.
4. Feature checklist.
5. Known simplifications or limitations.
6. How to run locally.

The final response must be honest. If any command failed or any requirement was simplified, say exactly what happened.

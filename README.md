# Neon Ronin: Shadow Courier

Neon Ronin: Shadow Courier is a 2D side-scrolling ninja action platformer built with Vite, Phaser 3.90, and strict TypeScript. The game uses a sumi-e ink plus neon look, generated entirely in code: no image, audio, font, tilemap, or remote assets are required.

Screenshot placeholder: run the game locally with `npm run dev` and capture the title or world map from the browser.

## Setup

```bash
npm install
npm run dev
```

The dev server prints a local URL. Open it in a desktop or mobile browser.

## Commands

```bash
npm run dev
npm run typecheck
npm run test
npm run build
npm run preview
```

`dev`, `build`, and `preview` use Vite's Node API with `configFile: false`. This avoids a Windows path/config-loader issue in this workspace while still using Vite for serving and bundling.

## Controls

Keyboard:

- Move: `A/D` or arrow keys
- Jump: `W`, `Space`, or `ArrowUp`
- Dash: `Shift` or `L`
- Attack: `J` or `Z`
- Art: `K` or `X`
- Pause: `Esc` or `P`

Mobile:

- Left virtual D-pad: left, right, up, down
- Right virtual buttons: Jump, Attack, Dash, Art
- Touch UI appears automatically on touch/narrow screens and can be forced on/off in settings.

## Features

- Title, controls, settings, world map, pause, game over, stage clear, and ending flows
- 5 selectable stages with persistent unlocks
- Stage 5 final boss, Aogane no Onmyo-Core, with 3 phases
- Player movement: run, variable jump, coyote time, jump buffer, wall slide, wall jump, dash
- Combat: melee slash, projectile art, charged slash, ultimate art, hurt/knockback/invulnerability
- Enemy types: ShadowCrawler, KiteWraith, GearSentinel, NeonArcher, PulseJumper
- Hazards, checkpoints, moving platforms, falling platforms, wind zones, seals, health, energy, hidden scrolls
- Exactly 3 hidden scrolls per stage
- HUD for HP, energy, stage, timer, seals, scrolls, assist status, and boss health
- Procedural textures, particles, screen shake, and WebAudio SFX
- Save/settings persistence with corrupted-save fallback
- Assist/accessibility settings for longer invulnerability, reduced damage, fall rescue, checkpoint heal, reduced shake, reduced particles, high contrast, touch opacity, and volume

## Stage List

1. Neon Alley Tutorial: movement, wall kick, basic combat
2. Rain-Slick Rooftops: dash, rooftops, moving platforms, flying threats
3. Bamboo Circuit Shrine: projectile art, shield enemies, wind lanes
4. Clockwork Castle Wall: charged slash, heavier enemy mixes, falling platforms
5. Inner Data Keep: ultimate art, mixed gauntlet, final boss

## Architecture

- `src/config`: dimensions, keys, palette, controls, Phaser game config
- `src/data`: levels, ability copy, balance constants
- `src/types`: shared contracts for stages, saves, input, levels, scene flow
- `src/systems`: save, input, touch controls, audio, FX, menu, registry helpers
- `src/entities`: player, enemy, boss, projectile
- `src/scenes`: boot/preload/title/UI/gameplay flow
- `tests`: Vitest tests for level validation, save migration, and pure utilities

Levels are hand-authored as typed DSL drafts in `src/data/levels.ts`, then converted into validated tile rows and entity metadata.

## Deployment

GitHub Pages deployment is defined in `.github/workflows/deploy.yml`.

For a repository page, set `VITE_BASE` to the repository path:

```bash
VITE_BASE=/your-repo-name/ npm run build
```

The workflow sets this automatically from the repository name, then runs typecheck, tests, and build before deploying.

## Asset Policy

All visuals and audio are original code-generated placeholders/assets. No external image/audio/font files are included or required. Reference repositories were used only for architectural and API inspiration, not for copied assets, names, code, layouts, or proprietary/trademarked material.

## Testing

The test suite covers:

- Real level validation and failure cases
- Save defaults, corrupted save fallback, unlock persistence, settings migration
- Pure math/time/rank helpers

## Known Limitations

- The implemented stages are compact browser-game stages rather than full 4-7 minute commercial-length levels.
- Procedural SFX are intentionally lightweight oscillator tones.
- Art is generated placeholder-style pixel/ink geometry, not hand-drawn production art.

## Future Work

- Longer alternate routes and optional challenge rooms
- More boss telegraphs and arena decorations
- Expanded music layer using procedural sequencing
- Screenshot automation for README imagery

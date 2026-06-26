# Reference Analysis

Authority: `art/references/neon_ronin_art_refs_impl_ready/`.

The A-H reference package was read from Markdown and visually inspected from PNG sheets. The `.md` files are treated as implementation rules; PNGs are visual examples, not runtime assets.

Gate B v1 is rejected as visually below product level. Gate B v2 uses native image-generated source assets preserved under `art/generated/`, selected/refined source assets under `art/source/`, and browser evidence under `art/final-v2/`.

## A - Ink, Brush, Paper

The runtime visual language must start from strong closed silhouettes, then add dry-brush fray only on selected edges. Paper grain is a low-opacity material layer, not global noise. Splatter is short-lived impact/checkpoint/landing language and must not become gore or permanent clutter.

Gate A evidence: `art/shape-language.png`, `art/value-study.png`, `art/representative-composite-960x540.png`.

## B - Rainy-Night Lighting

The lighting system needs three presets: `moonlight-lantern-gold`, `cyan-magenta-neon`, and `warm-cool-alley`. The shared baseline is low ambient, local glow, readable silhouettes, broken wet reflections, and fog that adds depth without hiding gameplay.

Gate A evidence: `art/environment-material-study.png`, `art/representative-composite-960x540.png`, `art/art-style.json`.

## C - Signage Density

Each 960x540 camera view should contain one hero sign or landmark, three to five medium signs, and five to eight dim small signs. Signs communicate through shape, emission color, scale, and placement rather than tiny readable text.

Gate A evidence: `art/reviews/candidates/environment.png`, `art/reviews/candidates/moon-gate-hero-sign.png`, `art/representative-composite-960x540.png`.

## D - Player: Shadow Courier

The player identity is a black side-view courier silhouette with magenta scarf/sash, cyan eye, and cyan satchel emblem. It must hold at 64px, 48px, and 32px and remain readable on white, gray, dark, black, and busy scenes.

Gate B v2 selected direction: generated player candidate P02, refined twice into `art/source/player/player-master.png`, with animation-sheet evidence in `art/generated/player-animation/raw/player-animation-sheet-raw-001.png`.

Gate A evidence: `art/reviews/candidates/player.png`, `art/player-silhouette-study.png`, `art/value-study.png`.

## E - Seven-Layer Parallax

The environment must separate far sky, distant skyline, mid roofs/signs, gameplay layer, near props, near props front, and foreground occlusion. The gameplay layer remains clean and collision-readable.

Selected direction: environment Candidate 1.

Gate A evidence: `art/environment-material-study.png`, `art/reviews/candidates/environment.png`, `art/art-style.json`.

## F - UI And Mobile Controls

The UI material families are black lacquer, worn paper, ink wash, cyan glow, and magenta glow. Cyan is information/utility/mobility; magenta is combat/action/damage. Menus may not be raw text lists.

Selected direction: UI Candidate 3 for paper readability, with semantic cyan discipline from Candidate 2.

Gate A evidence: `art/reviews/candidates/ui.png`, `art/ui-style-study.png`.

## G - Slash VFX

Slash VFX must be short-lived and four phase: anticipation, active arc, breakup, fade. It uses a magenta core ribbon, black ink-brush edge, cyan sparks, magenta shards, and restrained soft glow. Total duration remains at or below 0.40s.

Gate A evidence: `art/vfx-style-study.png`, `art/representative-composite-960x540.png`.

## H - Enemy Telegraph Language

Enemy attacks must expose `glow-up -> aiming pose -> ground/range warning -> wind-up silhouette -> release -> recover`. Magenta means heavy melee danger; cyan means mobility/range/fast threat. Recover windows are mandatory.

Gate A evidence: `art/telegraph-style-study.png`, `art/reviews/candidates/lantern-warden.png`, `art/reviews/candidates/kite-wraith.png`, `art/reviews/candidates/ink-crawler.png`.

## Gate A Direction Summary

- Title/landmark: Moon Gate Candidate 1.
- Player: Candidate 2 body consistency.
- Environment: Candidate 1 seven-layer rainy alley.
- Ink Crawler: Candidate 1 low readable crawler.
- Kite Wraith: Candidate 3 forward-motion silhouette.
- Lantern Warden: Candidate 2 readable vertical warden, with Candidate 3 mass restrained.
- UI: Candidate 3 paper legibility plus stricter cyan/magenta semantics.

This analysis does not approve Gate A. Explicit human approval is still required.

# Neon Ronin Art Bible

Status: Gate A style language remains binding. Gate B v1 was rejected as visually below product level. Gate B v2 implements the same style language through native image-generated source assets rather than procedural/SVG programmer art.

## Core Identity

Neon Ronin combines bold ink silhouettes, selective dry-brush edges, restrained paper grain, rainy-night atmosphere, player cyan/magenta neon accents, enemy amber/vermilion warning accents, sparse lantern gold, wet reflection streaks, and strong negative space.

The image must not become a saturated cyberpunk wash. Ink, value hierarchy, and silhouette readability carry the frame. Neon is a focal accent.

## Palette

Canonical palette lives in `art/palette.json`.

- `#00E5FF` neon cyan: player eye/core, information, utility, friendly focus.
- `#FF2E7A` neon magenta: player scarf/action identity and player slash impact.
- `#FFB12E` enemy amber: enemy eyes/cores, fast warning, hostile charge.
- `#FF5A24` enemy vermilion: heavy enemy danger, release, hostile telegraph.
- Lantern gold: safety, lanterns, objectives, checkpoints, rewards.
- Ink black and deep indigo: silhouettes, collision structure, foreground framing.
- Warm paper: readable UI/menu/objective surfaces.

Player/friendly accents and enemy/hostile accents must stay in separate color groups wherever possible. Enemy eyes, cores, and telegraphs should not reuse the player's cyan eye/core or magenta scarf/action identity.

No new accent color is allowed without updating `art/palette.json`, this bible, validators, and review evidence.

## Value Hierarchy

1. Player silhouette and active attack.
2. Enemy silhouette and attack telegraph.
3. Hazards and collision edges.
4. Pickups/objectives.
5. Near environment.
6. Middle environment.
7. Distant background and atmospheric detail.

## Binding Rules A-H

### A - Ink, Brush, Paper

Start with closed readable silhouettes. Use brush fray at selected edges only. Paper grain remains low opacity. Splatter is short-lived and non-gory. Gate B v2 runtime evidence: `art/final-v2/reference-a-brush-contact-sheet.png`.

### B - Rainy-Night Lighting

Use `moonlight-lantern-gold`, `cyan-magenta-neon`, and `warm-cool-alley`. Prefer baked glows and reflection strips over expensive dynamic lighting. Runtime evidence: `art/final/reference-b-lighting-presets.png`.

### C - Signage Density

One hero sign or landmark per camera view. Medium and small signs guide depth without filling the whole frame. Avoid tiny text dependence and real brand names. Runtime evidence: `art/final/reference-c-sign-density.png` and `art/sign-density-scenes.json`.

### D - Shadow Courier

Player identity is black courier silhouette, magenta scarf, cyan eye, and cyan satchel emblem. Animation preserves body proportions, satchel placement, scarf role, and facing direction. Runtime evidence: `art/final/player-animation-contact-sheet.png`.

### E - Seven-Layer Parallax

Every final environment preserves seven depth roles: far sky, distant skyline, mid roofs/signs, gameplay layer, near props, near props front, foreground occlusion. Runtime evidence: `art/final/reference-e-seven-layer-parallax.png`.

### F - UI And Mobile Controls

UI materials are black lacquer, worn paper, ink wash, cyan glow, and magenta glow. Menus use authored panels/buttons and states, not raw text lists. Runtime evidence: `art/final/ui-desktop-contact-sheet.png` and `art/final/ui-mobile-390x844.png`.

### G - Slash VFX

Slash is four phase and at most 0.40s: anticipation, active arc, breakup, fade. Magenta core, black ink edge, cyan sparks, and restrained glow are mandatory. Runtime evidence: `art/final/reference-g-slash-timeline.png`.

### H - Telegraph Language

Enemy attacks show glow-up, aim, ground/range warning, wind-up, release, and recover. Enemy amber means fast warning/hostile charge; enemy vermilion means heavy danger/release. Player cyan/magenta remains reserved for the Shadow Courier and player slash. Runtime evidence: `art/final-v2/lantern-warden-telegraph-contact-sheet.png`.

## Gate A Selection

- Title and landmark: Moon Gate Candidate 1.
- Player: Candidate 2 consistency, with Candidate 3 hat silhouette only if animation remains stable.
- Environment: Candidate 1.
- Ink Crawler: Candidate 1.
- Kite Wraith: Candidate 3.
- Lantern Warden: Candidate 2 plus restrained weight from Candidate 3.
- UI: Candidate 3 paper readability plus Candidate 2 cyan discipline.

## Runtime Asset Rule

Runtime assets under `art/final/assets/` are project-owned PNGs generated from authored SVG source. The A-H reference sheets are never loaded into Phaser.

## Remaining Approval

Gate B is pending. Do not claim final Art Lock approval until the user replies with `Approve Gate B`.

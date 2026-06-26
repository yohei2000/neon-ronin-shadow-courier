# Neon Ronin Art Bible

Status: Gate A draft. This bible is not frozen until explicit Gate A approval.

## Core Identity

Neon Ronin combines bold sumi-e-inspired ink silhouettes, frayed dry-brush edges, restrained paper grain, rainy-night atmosphere, cyan/magenta neon accents, sparse lantern gold, wet reflection streaks, and strong negative space.

The style must not become generic saturated cyberpunk. Neon is a focal accent; ink and value control carry the image.

## Palette

Canonical palette lives in `art/palette.json`.

- `#00E5FF` neon cyan: information, utility, mobility, range, focus.
- `#FF2E7A` neon magenta: combat, danger, impact, action.
- Lantern gold: safety, lanterns, objectives, checkpoints, rewards.
- Ink black and deep indigo: silhouettes, collision structure, foreground framing.
- Warm paper: readable UI/menu/objective surfaces.

No arbitrary accent color should be introduced without updating this bible and `art/palette.json`.

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

Start with closed readable silhouettes. Use brush fray at selected edges only. Paper grain remains low opacity. Splatter is short-lived and non-gory.

### B - Rainy-Night Lighting

Use the three preset family names from `art/art-style.json`: `moonlight-lantern-gold`, `cyan-magenta-neon`, and `warm-cool-alley`. Prefer baked-looking glows and reflection strips over expensive dynamic lighting.

### C - Signage Density

One hero sign or landmark per camera view. Medium and small signs must guide depth without filling the whole frame. Avoid tiny text dependence and real brand names.

### D - Shadow Courier

Player identity is black courier silhouette, magenta scarf, cyan eye, and cyan satchel emblem. Animation must preserve body proportions, satchel placement, scarf role, and facing direction.

### E - Seven-Layer Parallax

Every final environment must preserve seven depth roles: far sky, distant skyline, mid roofs/signs, gameplay layer, near props, near props front, foreground occlusion.

### F - UI And Mobile Controls

UI materials are black lacquer, worn paper, ink wash, cyan glow, and magenta glow. Menus use authored panels/buttons and states, not raw text lists.

### G - Slash VFX

Slash is four phase and at most 0.40s: anticipation, active arc, breakup, fade. Magenta core, black ink edge, cyan sparks, and restrained glow are mandatory.

### H - Telegraph Language

Enemy attacks must show glow-up, aim, ground/range warning, wind-up, release, and recover. Magenta means heavy danger; cyan means mobility/range.

## Gate A Selection

- Title and landmark: Moon Gate Candidate 1.
- Player: Candidate 2 consistency, with Candidate 3 hat silhouette only if animation remains stable.
- Environment: Candidate 1.
- Ink Crawler: Candidate 1.
- Kite Wraith: Candidate 3.
- Lantern Warden: Candidate 2 plus restrained weight from Candidate 3.
- UI: Candidate 3 paper readability plus Candidate 2 cyan discipline.

## Intentional Deviations

- Gate A studies use generated contact sheets and deterministic SVG/Playwright studies. They are not final runtime assets.
- Some generated candidate sheets contain decorative pseudo text. Production runtime signs must replace this with abstract marks, controlled symbols, or verified local typography.
- The current representative composite is an art-direction proof, not a final browser screenshot.

## Freeze Rule

After explicit Gate A approval, this bible becomes the style lock. Later inconsistency must be fixed in assets and implementation, not excused by broadening the bible.

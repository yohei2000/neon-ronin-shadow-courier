# Stage 1 v7 Collision Authoring

Status: approved runtime source. The user authorized v7 terrain and collision deployment on 2026-07-15.

## Recommended import

Import `stage1-v7-collision-builder-project.json` into `stage-collision-builder`.

That project contains:

- one embedded JPEG preview of the `10050x900` continuous v7 master;
- 24 editable collision surfaces;
- 6 solid ground surfaces;
- 6 staircase/slope surfaces;
- 10 one-way floors and galleries;
- 2 vertical climb walls;
- a player probe at the opening street.

Use `stage1-v7-collision-builder-project.external-image.json` when the editor can resolve `images/stage1-v7-continuous-background.png` directly. `stage1-v7-collision-candidate.json` is the compact enabled runtime-shaped source.

## Review

- `stage1-v7-collision-surface-review.png`: full-resolution collision overlay.
- `stage1-v7-collision-surface-contact-sheet.png`: ten review slices.
- `surface-review-slices/`: full-resolution local review crops.
- `stage1-v7-collision-validation.json`: schema, dimensions, bounds, source hash, and storage-size checks.

Overlay colors are review-only: cyan is solid ground, green is slope/stair, gold is one-way, and magenta is wall. These colors are not added to the v7 background.

The project is imported into `src/data/stage1CollisionTrial.json` as the full-width Stage1 collision source. The legacy filename remains the stable import boundary, but no legacy collider tail is active while coverage is `0-10050`.

# Stage 1 Continuous Background v7

Status: approved runtime terrain and collision source. Deployment was authorized on 2026-07-15.

## Direction

v7 replaces luminous route highlighting with the side-view cutaway language commonly used by 2D action platformers. A traversable boundary is understandable because it is visibly the top of a physical mass:

- wet paving over a deep retaining wall;
- tiled roof over rafters, fascia, attic, and rooms;
- timber gallery over beams and columns;
- stone stairs joined to masonry landings;
- high bridge carried by arches and piers;
- drainage tower with interior floors;
- arena terrace over buttresses, drainage openings, and foundations.

Neon remains in distant signs, windows, rain haze, and reflected ambience. It does not trace collision or form a line under the player.

## Generation

The built-in ImageGen tool was used for one full-stage cutaway panorama and five high-resolution sequential strips. Each new strip guide inherited the previous normalized strip's exact 862 px tail. The final five deliverable plates are exact crops from one composed `10050x900` master.

## Review files

- `stage1-master-layout.png`: full-resolution continuous master.
- `stage1-continuous-background-overview.png`: master and five world-positioned plates.
- `stage1-continuous-background-join-review.png`: four usable-boundary crops.
- `stage1-gameplay-readability-review.png`: nine gameplay-scale crops.
- `stage1-v6-v7-cutaway-comparison.png`: previous material-edge approach versus the new cutaway construction.
- `stage1-continuous-background-validation.json`: overlap, rolling-seam, and route-boundary measurements.
- `collision-authoring/stage1-v7-collision-builder-project.json`: adopted v7-aligned collision-builder project.
- `collision-authoring/stage1-v7-collision-surface-contact-sheet.png`: collision placement review.

The five runtime terrain plates are copied byte-for-byte from this package.

The earlier partial collision trial is retained only as historical route input. v7 does not paint collider guides onto the image.

The 24-surface v7-aligned project under `collision-authoring/` is imported as the enabled full-width runtime collision source.

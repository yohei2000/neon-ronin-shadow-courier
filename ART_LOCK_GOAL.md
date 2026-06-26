# ART_LOCK_GOAL.md — Neon Ronin Reference-Driven Visual Production Lock

## 0. Mission

Rebuild the visual foundation of **Neon Ronin: Shadow Courier** from a clean slate and lock a production-quality art direction before implementing the full Stage 1.

This goal is intentionally narrow. Build only a polished visual vertical slice consisting of:

- a production-quality animated title screen;
- a dedicated `ArtLabScene` for visual review;
- the final player visual system and animation set;
- the final Ink Crawler visual system;
- the final Lantern Warden elite/miniboss visual system and telegraphs;
- one Kite Wraith visual study/preview for future integration;
- the final Neon Alley environment kit;
- the final HUD, menu, and mobile-control kit;
- the final lighting, rain, reflection, fog, VFX, and post-processing treatment;
- a reproducible local asset pipeline, atlases, manifests, validators, browser screenshots, and review reports.

Do **not** build the full Stage 1 in this goal. Do **not** rebuild the five-stage campaign. The output of this goal is the approved visual system that the later Stage 1 integration goal must use without changing style.

Target runtime:

- Vite;
- Phaser `~3.90.0`;
- TypeScript strict;
- npm;
- desktop browser and mobile browser;
- logical gameplay resolution `960x540`;
- required mobile review viewport `390x844`.

The primary optimization target is **actual rendered visual quality**, not feature count, implementation speed, short token usage, file count, or superficial checklist completion.

## 1. Authoritative Reference Package

The repository must contain the user-created reference package at one of these locations:

- preferred: `art/references/neon_ronin_art_refs_impl_ready/`;
- accepted fallback: another location discovered by searching for `index.md`, `a.png` through `h.png`, and `a.md` through `h.md`.

Expected files:

- `index.md`;
- `a.png`, `a.md` — ink outline, dry-brush edges, paper texture;
- `b.png`, `b.md` — rainy-night lighting, fog, reflections, glow;
- `c.png`, `c.md` — signage density and modular sign kit;
- `d.png`, `d.md` — player silhouette, scarf, cyan/magenta accents;
- `e.png`, `e.md` — seven-layer Phaser parallax composition;
- `f.png`, `f.md` — HUD, panels, buttons, materials, mobile controls;
- `g.png`, `g.md` — four-phase slash VFX;
- `h.png`, `h.md` — enemy telegraph language and recover windows.

At task start:

1. locate and read every `.md` file;
2. inspect every `.png` visually;
3. create `art/REFERENCE_ANALYSIS.md`;
4. create `art/REFERENCE_COMPLIANCE_MATRIX.md` mapping every A–H requirement to implementation files, runtime states, screenshots, automated checks, and review evidence.

Rules:

- These images are implementation specification sheets, not final runtime assets.
- Do not crop, trace wholesale, or paste the specification sheets into the game.
- Do not merely reproduce their layout as a static mockup.
- Extract their design rules and implement an original, coherent runtime asset system.
- When an image and its paired `.md` differ, prioritize the `.md`, gameplay readability, and target-device performance.
- The reference package is authoritative for visual language. Do not replace it with a generic cyberpunk moodboard.
- Do not imitate a named artist, named game, trademarked character, or recognizable proprietary design.

## 2. Retrospective Constraints

The previous implementation failed because broad feature coverage substituted for quality. This goal must explicitly avoid these failure modes:

- no plain Phaser rectangles, circles, or triangles as final character/environment/UI artwork;
- no raw monospace text-list menus;
- no single-color tile grids presented as finished scenery;
- no generic AI concept image pasted as a non-interactive background;
- no “asset exists” acceptance without screenshots and animation evidence;
- no code-only review of visual quality;
- no completion based solely on `typecheck`, unit tests, or build success;
- no self-awarded “production quality” without independent review and human approval;
- no weakening validators or screenshot tests to make them pass;
- no full-stage feature work before the art direction is locked.

A requirement is complete only when it is visible in the running build, captured in QA evidence, mapped to its source reference, and accepted by the relevant quality gates.

## 3. Tool and Capability Audit

Before art production, inspect the actual environment and write `art/TOOL_CAPABILITY_REPORT.md` covering:

- image-generation capability;
- image-editing/inpainting capability;
- OpenAI image API or equivalent integration availability;
- Codex Browser availability;
- Playwright and browser-install availability;
- local raster tools such as `sharp`, ImageMagick, or Canvas;
- local vector/render tools such as SVG, `resvg`, or equivalent;
- texture-atlas tooling;
- font availability and licensing;
- GPU/WebGL constraints;
- repository asset licenses.

Preferred asset-production order:

1. use available image-generation/editing tools for high-quality source concepts and consistent asset families;
2. use image editing/inpainting and a selected master image to preserve character and environment consistency;
3. use local raster/vector processing to clean, separate, recolor, resize, pad, atlas, and validate assets;
4. use authored complex SVG/raster source assets when generation tools are unavailable;
5. use runtime Phaser Graphics only for masks, transient particles, debug overlays, light geometry, and transitions.

A “procedural fallback” made from plain runtime primitives is forbidden.

If no image-generation/editing tool exists, continue only if a credible local raster/vector authoring pipeline can produce layered, textured, production-quality assets. If neither path exists, report a hard blocker rather than silently creating programmer art.

## 4. Clean-Slate Repository Requirement

Inspect the existing repository. It may contain a previous failed five-stage implementation.

Remove or replace anything that conflicts with this narrow art-lock goal, including:

- five-stage data and campaign claims;
- unused world-map/final-boss systems;
- old primitive player/enemy/tile generation;
- misleading README claims;
- raw text-list UI presented as final;
- unused placeholder assets;
- dead code and future-feature stubs.

Keep only infrastructure that genuinely supports the Art Lab and future Stage 1 integration.

The final repository should feel intentionally constructed for visual production review, not like a failed campaign with most files hidden.

## 5. Visual Identity Contract

### 5.1 Core identity

Create an original visual identity combining:

- bold sumi-e-inspired ink silhouettes;
- frayed dry-brush edges;
- tapered calligraphic motion marks;
- restrained paper grain;
- rainy night atmosphere;
- limited cyan and magenta neon accents;
- sparse warm lantern gold;
- wet-ground reflection streaks;
- strong negative space;
- readable 2D side-scrolling collision silhouettes.

This must not become generic full-screen cyberpunk saturation. Neon is a focal accent, not the base color of every object.

### 5.2 Limited palette

Use a central palette manifest and CSS/TypeScript exports.

Mandatory anchor colors from Reference D:

- neon cyan: `#00E5FF`;
- neon magenta: `#FF2E7A`.

Also define a restrained set for:

- ink black;
- deep indigo;
- dark blue-gray;
- warm paper;
- pale moon mist;
- lantern gold/orange;
- danger coral/red;
- desaturated neutral gray.

Rules:

- no arbitrary per-file color constants;
- no new accent color without updating the art bible and palette manifest;
- cyan communicates information, utility, mobility, range, or focus;
- magenta communicates combat, danger, impact, or action;
- warm gold communicates safety, checkpoints, lanterns, objectives, or rewards;
- collision surfaces remain readable even after grayscale conversion.

### 5.3 Value hierarchy

Enforce this visual priority:

1. player silhouette and active attack;
2. enemy silhouette and attack telegraph;
3. hazards and collision edges;
4. pickups/objectives;
5. near environment;
6. middle environment;
7. distant background and atmospheric detail.

The player must remain identifiable:

- on white, light gray, dark gray, dark blue, and black test backgrounds;
- over the busy Neon Alley test scene;
- at 64px, 48px, and 32px display heights;
- in grayscale;
- under rain, fog, signs, particles, and local glow.

## 6. Binding Reference A — Ink, Brush, and Paper

Implement Reference A as a reusable asset family, not a one-off filter.

Required source/runtime assets:

- at least 4 thick ink-outline masks;
- at least 6 dry-brush edge variants;
- at least 6 tapered brush-end variants;
- at least 6 non-graphic ink-splatter impact decals;
- at least 3 tileable rough-paper texture variants;
- at least 4 brush-border segments suitable for 9-slice-like panels;
- at least 4 roof/platform edge overlays;
- at least 3 hazard-edge brush treatments;
- at least 3 slash-edge brush textures.

Usage rules:

- start with a large readable silhouette, then apply fraying only at selected edges;
- do not cover collision boundaries with noisy brush texture;
- paper grain must stay low opacity and never reduce UI readability;
- splatter is for short ink-impact, landing, checkpoint, or defeat effects only;
- do not depict blood or gore;
- do not fill the entire frame with brush noise;
- use transparent pre-baked source textures rather than per-frame random drawing.

Required evidence:

- `art/final/reference-a-brush-contact-sheet.png`;
- `art/final/reference-a-game-scale-test.png`;
- corresponding rows in `REFERENCE_COMPLIANCE_MATRIX.md`.

## 7. Binding Reference B — Rainy-Night Lighting

Use three named lighting presets derived from Reference B:

1. `moonlight-lantern-gold` — calm, clear silhouettes, cool moonlight plus warm safe lights;
2. `cyan-magenta-neon` — high-contrast urban action/accent preset;
3. `warm-cool-alley` — balanced practical-light preset and primary Neon Alley baseline.

The Art Lab must switch among all three at runtime.

Starting ranges, to be tuned by screenshots:

- ambient intensity: `0.20–0.35`;
- direct/practical light intensity: `0.60–1.00`;
- additive glow intensity: `0.50–1.50`;
- fake wet-reflection strength: `0.35–0.60`;
- normalized fog start: `0.35–0.60`;
- normalized fog end: `1.00`;
- visible local dynamic/practical light count: normally `2–4` per camera view;
- pooled rain streak target: approximately `200–400` at full FX, materially lower in reduced-FX mode.

Implementation rules:

- prefer baked-looking light sprites, emission masks, and additive glows over many dynamic lights;
- wet reflection uses vertical, broken reflection strips, not expensive true reflection;
- fog adds depth but may not hide gameplay silhouettes;
- avoid crushed blacks and blown highlights;
- rain may not create a white visual veil;
- bloom must be local and restrained;
- reflections must be visible but not compete with the player;
- use back/mid/front light depth separation.

Required evidence:

- one fixed Art Lab composition rendered in all three presets;
- dark-background and bright-background player readability tests;
- wet-reflection contact sheet;
- fog-depth contact sheet;
- reduced-FX comparison;
- `art/final/reference-b-lighting-presets.png`.

## 8. Binding Reference C — Signage Density

Implement modular signage and enforce camera-view density.

For each representative `960x540` camera view:

- hero sign: target `1`, hard maximum `1`;
- medium signs: target `3–5`, hard maximum `5`;
- small signs: target `5–8`, hard maximum `8`;
- lanterns and cable focal clusters: only a few, intentionally placed;
- preserve negative space around the player, hazards, and enemy telegraphs.

Required modular kit:

- at least 3 hero-sign designs/campaign variants, with only one active per view;
- at least 8 medium-sign modules;
- at least 12 small-sign modules;
- at least 4 banner modules;
- at least 6 lantern modules;
- at least 8 cable/pipe/hardware modules;
- at least 4 shutter/window modules.

Do not rely on tiny readable text. Signs must work through shape, emission color, size, border, and placement. Avoid accidental real-world brand names, copyrighted logos, or nonsensical high-density text walls.

Create data-driven scene metadata and `npm run art:validate-sign-density` that fails when a captured review camera exceeds hard limits or places a hero sign inside the protected readability zone around the player.

Required evidence:

- sign atlas contact sheet;
- one annotated camera view showing counted hero/medium/small signs;
- one reduced-density mobile view;
- `art/final/reference-c-sign-density.png`.

## 9. Binding Reference D — Player: Shadow Courier

Create one final original player design at gameplay scale.

Mandatory design cues:

- silhouette-first black courier outfit;
- distinct head shape and readable limbs;
- flowing magenta scarf/sash using `#FF2E7A`;
- one cyan eye/focal accent using `#00E5FF`;
- sealed-message satchel with a small cyan emblem;
- compact side-view proportions;
- recognizable facing direction;
- scarf visibly communicates speed and direction;
- no excessive costume detail that disappears at 64px;
- no realistic gore or injury detail.

Target display height:

- normal gameplay: approximately `64px`;
- must remain readable at `48px`;
- must remain recognizable at `32px`.

Preferred pipeline:

- create a high-resolution master design;
- use the same approved master as the reference for every pose/frame;
- separate scarf as a controlled secondary-motion layer when beneficial;
- preserve body proportions, satchel placement, eye accent, and costume shapes across all frames;
- author at 2x or higher source resolution, then downsample cleanly for runtime.

Required animation states and minimum frames:

- idle: 6 frames;
- run: 8 frames;
- jump rise: 3 frames;
- apex: 2 frames;
- fall: 2 frames;
- wall slide: 4 frames;
- wall kick: 4 frames;
- ground slash: 8 frames;
- air slash: 6 frames;
- hurt: 3 frames;
- checkpoint/respawn: 6 frames.

Animation quality rules:

- stable scale and origin;
- no costume drift;
- no changing limb count or anatomy;
- no satchel teleporting between frames;
- clear anticipation, action, follow-through, and recovery;
- scarf secondary motion follows velocity and action timing;
- feet do not visibly slide during planted poses;
- no transparent empty frames;
- no frame popping at target speed.

Required evidence:

- `art/final/player-master.png`;
- `art/final/player-animation-contact-sheet.png`;
- `art/final/player-five-core-poses.png` showing idle, run, jump, wall slide, slash;
- `art/final/player-background-contrast-test.png`;
- `art/final/player-grayscale-test.png`;
- `art/final/player-64-48-32-test.png`;
- browser-captured animation states in the Art Lab.

## 10. Binding Reference E — Seven-Layer Parallax

Implement the seven-layer composition from Reference E.

Required layers and initial scroll factors:

1. `far-sky` — moon, stars, clouds — `0.10`;
2. `distant-skyline` — faded pagodas, mountains, mist — `0.20`;
3. `mid-roofs-signs` — closer roofs, flags, distant lantern lines — `0.40`;
4. `gameplay-layer` — collision walls, platforms, ground — `1.00`;
5. `near-props` — barrels, crates, lanterns, posts, cables — `1.30`;
6. `near-props-front` — front-hanging lanterns/cables — `1.60`;
7. `foreground-occlusion` — frame silhouettes/foliage/cables — `2.00`.

Factors may be tuned slightly after screenshot review, but the seven distinct depth roles are mandatory.

Rules:

- no single layer may attempt to carry the entire finished image;
- collision layer boundaries remain clean;
- foreground occlusion cannot hide the player, hazard, or telegraph for more than a brief intentional moment;
- repeating strips must hide seams;
- layer density must decrease with distance;
- mobile crop must preserve composition and gameplay readability.

Required evidence:

- Art Lab layer toggles;
- debug-labeled screenshot with all seven layers;
- individual layer strip contact sheet;
- combined desktop and mobile screenshots;
- `art/final/reference-e-seven-layer-parallax.png`.

## 11. Binding Reference F — UI and Mobile Controls

Use these five material families:

- black lacquer;
- worn paper;
- ink wash;
- cyan glow;
- magenta glow.

Color semantics:

- cyan = information, utility, timer, navigation, focus, mobility;
- magenta = combat, action, damage, selected attack control;
- warm paper = readable objective/menu surfaces;
- black lacquer/ink wash = structural panels and frames.

Required final UI kit:

- HP frame, fill, icon, and damage state;
- timer panel and icon;
- scroll counter and icon;
- objective panel;
- checkpoint notification;
- Lantern Warden health bar;
- pause menu panel;
- title menu buttons;
- settings controls;
- keyboard focus state;
- pointer hover state;
- pressed state;
- disabled state;
- mobile D-pad/left-right controls;
- mobile jump button;
- mobile slash button;
- mobile pause/focus button as needed;
- core icon strip.

Rules:

- no raw text-list final UI;
- use authored panels, 9-slice assets, icons, spacing, and selection hierarchy;
- keep decoration restrained on mobile;
- visible mobile-control decoration may be smaller than its touch hit area;
- minimum mobile touch target: `56 CSS px` in the `390x844` viewport;
- respect safe-area insets;
- touch opacity is configurable;
- HUD and touch controls may not obstruct critical gameplay regions;
- normal text contrast must meet or exceed `4.5:1`; large text/decorative controls must meet or exceed `3:1`.

Required evidence:

- `art/final/ui-desktop-contact-sheet.png`;
- `art/final/ui-material-swatches.png`;
- `art/final/ui-state-contact-sheet.png`;
- `art/final/ui-mobile-390x844.png`;
- automated contrast report.

## 12. Binding Reference G — Slash VFX

Implement a readable, short-lived four-phase slash effect.

Required timeline:

1. anticipation: `0.00–0.06s`;
2. active arc: `0.06–0.20s`;
3. breakup: `0.20–0.32s`;
4. fade out: `0.32–0.40s`.

Hard total-duration maximum: `0.40s`, excluding an optional very faint final ember below gameplay significance.

Required layers:

- magenta core ribbon/arc;
- thick black ink-brush edge;
- cyan accent sparks;
- magenta breakup shards;
- restrained soft glow.

Performance targets:

- pooled effects;
- approximately 80 particles maximum at full FX for one slash, normally fewer;
- lower shard/spark count in reduced-FX mode;
- no unbounded emitters;
- no per-frame texture creation;
- texture memory for the core slash flipbook/atlas should remain mobile-safe, target below roughly `512 KB` where practical;
- keep draw calls low and batch-friendly.

Readability rules:

- same arc thickness/shape language across frames;
- clear anticipation but no false hitbox cue;
- active arc aligns with actual attack timing;
- effect works over dark and bright backgrounds;
- effect does not hide enemy telegraphs or platform edges;
- breakup moves away from the swing path;
- auto-despawn and pool return are mandatory.

Required evidence:

- four-phase contact sheet;
- dark-background screenshot;
- bright/paper-background screenshot;
- reduced-FX comparison;
- timing manifest verified by automated test;
- `art/final/reference-g-slash-timeline.png`.

## 13. Binding Reference H — Enemy Telegraph Language

Every meaningful enemy attack must follow:

`glow-up -> aiming pose -> ground/range warning -> wind-up silhouette -> release -> recover`.

Semantic language:

- magenta glow = heavy melee danger/impact;
- cyan glow = mobility, dash, fast/range attack;
- body pose = attack intent;
- ground line/circle = where the attack will hit;
- release flash = attack is active now;
- recover pose = punish window.

For the Art Lab, implement and demonstrate:

### Standard/heavy telegraph sequence

Initial timing ranges derived from Reference H:

- glow-up: `0.6–1.0s`;
- aiming pose: `0.5–0.8s`;
- ground warning: `0.8–1.0s`;
- wind-up silhouette: `0.4–0.7s`;
- release: approximately `0.1s`;
- recover: `0.6–1.2s`.

### Fast/mobile elite telegraph sequence

- glow-up: `0.4–0.7s`;
- aiming pose: `0.3–0.6s`;
- line/range warning: `0.6–0.9s`;
- wind-up silhouette: `0.2–0.4s`;
- release: approximately `0.1s`;
- recover: `0.5–0.9s`.

Rules:

- no meaningful attack without advance cue;
- same color and shape must retain the same meaning;
- warning marker must show both location/range and timing progression;
- attack must include a recover/punish window;
- floor markers and aim lines must remain visible over all lighting presets;
- telegraph must be understandable without explanatory text;
- actual hitbox timing must align with release evidence.

Required evidence:

- standard sequence contact sheet;
- fast sequence contact sheet;
- slowed review playback;
- real-time playback;
- state/timing manifest;
- screenshot over dark, bright, and busy backgrounds;
- `art/final/reference-h-telegraph-language.png`.

## 14. Character and Enemy Asset Scope

### 14.1 Ink Crawler

Required:

- low, horizontal silhouette distinct from player;
- cyan eye/core focus;
- dry-brush body edge;
- movement animation: at least 6 frames;
- alert/anticipation: at least 3 frames;
- hurt feedback: at least 3 frames or an equivalent layered treatment;
- defeat/ink-dissolve: at least 6 frames or a layered effect with equal visual quality;
- clear contact danger cue;
- readable at gameplay scale.

### 14.2 Kite Wraith

This goal requires a final visual study and polished Art Lab preview, not full Stage 1 AI.

Required:

- floating paper/cloth/kite silhouette;
- softer shape language than Ink Crawler;
- cyan mobility/range cue;
- readable facing/attack direction;
- distinct from signs and cables;
- at least idle/float, anticipation, attack-direction, hurt preview states.

### 14.3 Lantern Warden

Create the final Stage 1 elite/miniboss visual kit.

Required:

- clearly larger and heavier than the player;
- lantern core motif;
- armored/closed state;
- vulnerable/open state;
- magenta heavy-attack language;
- cyan movement/range language where used;
- three visually distinct attacks or telegraph previews;
- intro pose;
- recover pose;
- defeat presentation;
- authored health bar;
- grayscale-readable silhouette.

Do not count palette swaps as distinct states.

## 15. Neon Alley Environment Kit

Create a coherent modular environment kit that supports future Stage 1 production.

Minimum non-duplicate kit:

- 16 gameplay collision tile variants;
- 12 roof/wall edge and corner variants;
- 8 background architecture modules;
- 24 decorative prop modules;
- signage kit from Reference C;
- 6 lantern modules;
- 8 cable/pipe/hardware modules;
- 4 window/shutter modules;
- 4 wet-ground reflection strips;
- 3 checkpoint/shrine states;
- 3 non-graphic thorn/spark hazard variants;
- one Moon Gate kit;
- one wall-kick visual instruction motif;
- one secret-route gold-brush motif;
- 3 paper/ink surface decals;
- 6 wear/stain/drip overlays.

Variation rules:

- simple recolors do not count as unique modules;
- no identical featured tile may repeat more than 3 times consecutively in a final screenshot without an overlay/edge variation;
- avoid visible checkerboard or atlas repetition;
- decoration must not change perceived collision geometry;
- every major Art Lab view needs a recognizable landmark and controlled negative space.

## 16. Title Screen Quality Bar

Build a real animated title screen, not a menu test.

Required:

- original title/logo treatment;
- at least five of the seven depth layers;
- rain and fog;
- one hero sign or Moon Gate/story landmark;
- player silhouette or sealed-message motif;
- warm/cool light contrast;
- restrained neon animation;
- clear primary action;
- authored menu panels/buttons;
- keyboard, pointer, and touch interaction;
- hover/focus/pressed/disabled states;
- idle animation loop without visible seams;
- no console errors or missing assets.

The title must be visually compelling at both `960x540` and a `390x844` mobile crop.

## 17. Art Lab Scene

Create a dedicated `ArtLabScene` as a polished visual review environment.

It must provide deterministic states or query parameters for automated capture.

Required review stations:

1. player five-core-pose station;
2. player full animation station;
3. white/light-gray/dark-gray/dark-blue/black contrast station;
4. busy Neon Alley readability station;
5. 64/48/32px scale station;
6. Ink Crawler station;
7. Kite Wraith preview station;
8. Lantern Warden state/telegraph station;
9. seven-layer parallax station with toggles;
10. lighting-preset station;
11. sign-density station with counters/overlay;
12. environment tile/prop gallery;
13. HUD/menu gallery;
14. mobile-control preview;
15. slash four-phase station;
16. high-contrast comparison;
17. reduced-FX comparison;
18. grayscale review mode.

The Art Lab must be cleanly composed and usable as a production review tool. It must not look like an unstyled debug dump.

A read-only QA bridge may expose current scene, animation state, timestamps, asset keys, and entity bounds for Playwright assertions. It must not alter visual results or hide defects.

## 18. Asset Pipeline

Final runtime assets may use:

- transparent PNG;
- alpha WebP where safe;
- complex authored SVG rendered to raster;
- texture atlases;
- emission/mask textures;
- local shaders;
- pre-baked flipbooks;
- bitmap/vector icons.

Required scripts or equivalent:

- `scripts/process-art-assets.*`;
- `scripts/build-art-atlases.*`;
- `scripts/generate-art-contact-sheets.*`;
- `scripts/validate-art-assets.*`;
- `scripts/capture-art-screenshots.*`.

Required manifests:

- `art/art-style.json`;
- `art/palette.json`;
- `art/asset-manifest.json`;
- `art/animation-manifest.json`;
- `art/vfx-manifest.json`;
- `art/telegraph-manifest.json`;
- `art/sign-density-scenes.json`;
- `art/license-manifest.json`.

Processing requirements:

- author raster sources at 2x logical resolution when practical;
- never upscale visibly low-resolution source art at runtime;
- trim transparent margins consistently;
- stable pivots/origins;
- sufficient atlas padding/extrusion;
- no alpha halos;
- no texture bleeding;
- mobile-safe texture dimensions;
- deterministic builds;
- no remote runtime dependencies;
- every external source must have verified license/ownership documentation.

## 19. Image Generation and Consistency Workflow

When image generation/editing is available:

- create at least 3 materially different candidates for each key category:
  - player master;
  - title composition;
  - Neon Alley environment composition;
  - Ink Crawler;
  - Kite Wraith;
  - Lantern Warden;
  - HUD/menu treatment;
  - Moon Gate/hero sign;
- create contact sheets before selecting;
- never auto-select the first acceptable result;
- record prompts, tool, seed/reference metadata when available, date, selected/rejected status, and reasons under `art/generation-log/`;
- after a master is selected, use image references/editing rather than independent fresh generations for every frame;
- reject inconsistent proportions, anatomy, costume, satchel, scarf, lighting, perspective, or accidental text;
- remove generation artifacts before runtime use;
- avoid illegible synthetic text in signs; use authored symbols or controlled local typography instead.

Required candidate sheets:

- `art/reviews/candidates/player.png`;
- `art/reviews/candidates/title.png`;
- `art/reviews/candidates/environment.png`;
- `art/reviews/candidates/ink-crawler.png`;
- `art/reviews/candidates/kite-wraith.png`;
- `art/reviews/candidates/lantern-warden.png`;
- `art/reviews/candidates/ui.png`.

## 20. Art Bible and Design Tokens

Before final asset production, create:

- `art/ART_BIBLE.md`;
- `art/REFERENCE_ANALYSIS.md`;
- `art/REFERENCE_COMPLIANCE_MATRIX.md`;
- `art/art-style.json`;
- `art/palette.png`;
- `art/value-study.png`;
- `art/shape-language.png`;
- `art/player-silhouette-study.png`;
- `art/environment-material-study.png`;
- `art/ui-style-study.png`;
- `art/vfx-style-study.png`;
- `art/telegraph-style-study.png`.

The art bible must explicitly bind every Reference A–H rule and explain intentional deviations.

After Gate A approval, the bible is frozen. Later inconsistency must be fixed in assets, not excused by casually broadening the bible.

## 21. Human Approval Gates

This goal has two mandatory human approval gates.

### Gate A — Reference and Style Lock

Pause and request explicit approval after producing:

- tool capability report;
- reference analysis;
- compliance matrix draft;
- art bible;
- palette/value/shape studies;
- candidate contact sheets;
- recommended selected direction;
- one rough but representative `960x540` composite.

Do not proceed to full production assets without explicit approval.

### Gate B — Final Art Lock

Pause and request explicit approval after producing:

- final title screenshots;
- final Art Lab screenshots;
- player animation contact sheet;
- enemy/miniboss contact sheets;
- environment contact sheet;
- UI desktop/mobile contact sheets;
- slash timeline;
- telegraph timeline;
- final review scorecard;
- automated QA results;
- before/after revision comparison.

Do not infer approval from silence. Do not claim the art direction is locked until approval is explicit.

## 22. Mandatory Visual Revision Loop

After the first complete Art Lab render and Gate A approval, perform at least **three full revision rounds**.

The initial render does not count as a revision round.

Each round must:

1. build and run the game;
2. open it in Codex Browser or Playwright;
3. capture the complete required screenshot subset;
4. run independent review agents;
5. collect concrete screenshot-referenced criticisms;
6. update assets/code;
7. rebuild atlases;
8. recapture the same states;
9. document before/after differences;
10. rerun automated visual QA.

Store:

- `art/reviews/round-01/`;
- `art/reviews/round-02/`;
- `art/reviews/round-03/`;
- additional rounds until thresholds pass.

Each round must contain at least:

- `title-desktop.png`;
- `title-mobile.png`;
- `artlab-neutral.png`;
- `artlab-busy.png`;
- `player-motion.png`;
- `player-contrast.png`;
- `slash.png`;
- `enemy.png`;
- `warden-telegraph.png`;
- `parallax.png`;
- `hud.png`;
- `mobile-controls.png`;
- `review.md`;
- `changes.md`.

Reviewer comments must cite screenshot filename and the affected region/object. Generic praise is not sufficient.

## 23. Independent Review Agents

Use real subagents if available. Otherwise simulate independent passes with separate role prompts and preserve their reports.

Review agents are read/review-only. They must not edit files directly.

### 23.1 Reference Compliance Reviewer

Checks every A–H rule against runtime screenshots and manifests. Rejects undocumented deviations.

### 23.2 Art Director Reviewer

Scores:

- originality;
- silhouette language;
- palette discipline;
- brush/paper treatment;
- material cohesion;
- environment composition;
- title impact;
- overall product identity.

### 23.3 Gameplay Readability Reviewer

Scores:

- player visibility;
- enemy visibility;
- hazard/collision readability;
- telegraph clarity;
- VFX clarity;
- sign-density control;
- HUD legibility;
- mobile readability.

### 23.4 Animation Reviewer

Scores:

- pose clarity;
- frame consistency;
- anticipation;
- action timing;
- follow-through;
- scarf secondary motion;
- anchor stability;
- absence of popping.

### 23.5 UI/UX Art Reviewer

Scores:

- hierarchy;
- material treatment;
- control states;
- text contrast;
- mobile touch presentation;
- visual consistency with Reference F;
- absence of debug-menu appearance.

### 23.6 Technical Art Reviewer

Scores/checks:

- texture sizes;
- atlas padding;
- alpha quality;
- memory;
- batching/draw-call risk;
- particle pooling;
- deterministic loading;
- missing keys;
- reduced-FX behavior;
- mobile safety.

### 23.7 Adversarial Rejection Reviewer

Attempts to reject the work. Specifically searches for:

- programmer art;
- generic AI look;
- inconsistent character anatomy/costume;
- repeated tiles;
- empty or flat backgrounds;
- over-dense signs;
- crushed blacks;
- excessive bloom;
- unreadable player silhouette;
- VFX hiding gameplay;
- telegraphs inconsistent with Reference H;
- flat/raw UI;
- mobile overlap;
- screenshots selected only from flattering views;
- spec-sheet images pasted into the runtime;
- documentation claims unsupported by evidence.

## 24. Scoring and Escape-Proof Pass Rules

Every reviewer scores applicable categories from 1 to 5:

- 1 = broken, placeholder, or incoherent;
- 2 = functional programmer-art prototype;
- 3 = competent but generic prototype/demo;
- 4 = polished commercial-demo quality;
- 5 = distinctive, highly polished, production-ready work.

Pass rules:

- no category below `4.0`;
- overall median at least `4.3`;
- Reference A–H compliance at least `4.7`;
- player readability at least `4.7`;
- player consistency at least `4.5`;
- title impact at least `4.4`;
- environment depth/composition at least `4.4`;
- UI quality at least `4.3`;
- slash readability at least `4.5`;
- telegraph clarity at least `4.7`;
- mobile readability at least `4.3`;
- Technical Art Reviewer returns PASS;
- Adversarial Rejection Reviewer returns PASS;
- human Gate B approval is explicit.

Do not average away a failing category. Any score below threshold requires another revision round.

Create:

- `art/reviews/final-scorecard.md`;
- `art/reviews/final-scorecard.json`.

## 25. Automated Visual and Asset QA

Required npm scripts:

- `npm run art:refs`;
- `npm run art:process`;
- `npm run art:atlas`;
- `npm run art:contact-sheets`;
- `npm run art:validate-assets`;
- `npm run art:validate-sign-density`;
- `npm run art:validate-animations`;
- `npm run art:validate-vfx`;
- `npm run art:validate-telegraphs`;
- `npm run art:screenshots`;
- `npm run art:review-report`;
- `npm run art:all`.

Also retain:

- `npm run typecheck`;
- `npm run test`;
- `npm run build`.

Use Vitest for pure manifest/validation tests and Playwright for browser screenshots/runtime checks.

### `art:validate-assets` must fail for

- missing required asset keys;
- missing A–H evidence files;
- empty or fully transparent frames;
- visibly inconsistent frame dimensions/origins beyond configured tolerance;
- oversized textures beyond configured mobile-safe maximum;
- insufficient atlas padding/extrusion;
- missing source/generation/license metadata;
- forbidden remote URLs;
- final player/enemy/UI represented primarily by runtime primitive Graphics;
- missing UI states;
- missing high-contrast and reduced-FX variants;
- missing screenshot matrix;
- fewer than three completed revision rounds.

### `art:validate-animations` must fail for

- frame counts below this goal;
- missing animation states;
- unstable configured origins;
- invalid frame durations;
- slash animation not aligned with VFX active window;
- telegraph release not aligned with active hit timing.

### `art:validate-vfx` must fail for

- slash total duration above `0.40s`;
- missing anticipation/active/breakup/fade phases;
- missing core, ink edge, sparks, or breakup layers;
- unbounded particle configuration;
- no reduced-FX variant.

### `art:validate-telegraphs` must fail for

- missing one of six telegraph phases;
- invalid phase order;
- no recover window;
- missing range/location indicator;
- color-language mismatch;
- release/hit timing mismatch.

### `art:validate-sign-density` must fail for

- more than one hero sign in a review camera;
- more than five medium signs;
- more than eight small signs;
- hero sign overlapping protected player readability area;
- no negative-space zone around critical gameplay elements.

Validation scripts must inspect real manifests/files/runtime QA state. They may not simply print PASS.

## 26. Browser and Screenshot QA

Use Playwright and, when available, Codex Browser.

Required deterministic screenshot states:

- title desktop `960x540`;
- title large `1920x1080`;
- title mobile `390x844`;
- Art Lab neutral;
- Art Lab busy Neon Alley;
- three lighting presets;
- seven-layer parallax breakdown;
- sign-density annotated view;
- player idle/run/jump/wall-slide/slash;
- player 64/48/32 scale view;
- player grayscale/contrast view;
- Ink Crawler states;
- Kite Wraith preview states;
- Lantern Warden closed/open/three telegraphs/recover/defeat;
- UI desktop;
- UI mobile;
- slash four phases;
- slash on dark background;
- slash on bright background;
- standard telegraph sequence;
- fast telegraph sequence;
- high-contrast mode;
- reduced-FX mode.

Final files must be written under `art/final/` and review files under `art/reviews/`.

Playwright must fail on:

- uncaught exception;
- `console.error`;
- page error;
- failed local asset request;
- missing texture warning;
- missing animation warning;
- remote runtime request;
- broken mobile layout.

Create:

- `art/final/console-report.json`;
- `art/final/screenshot-report.json`;
- `art/final/performance-report.md`.

## 27. Performance Requirements

At logical `960x540`:

- no missing assets;
- no visible texture bleeding;
- no obvious alpha halos;
- no first-use hitch for slash or telegraph effects after preload;
- no per-frame texture generation;
- no unbounded particles or timers;
- no unbounded RenderTextures;
- stable lifecycle when switching title and Art Lab;
- reduced-FX materially lowers rain, breakup shards, fog overlays, and glow load;
- mobile viewport remains responsive;
- source assets and atlases stay within documented mobile-safe limits.

Do not chase exact FPS claims without reliable measurement. Report measured environment and evidence honestly.

## 28. Required Final Artifacts

At minimum, commit:

- `art/TOOL_CAPABILITY_REPORT.md`;
- `art/REFERENCE_ANALYSIS.md`;
- `art/REFERENCE_COMPLIANCE_MATRIX.md`;
- `art/ART_BIBLE.md`;
- all manifests;
- candidate sheets;
- three or more review-round folders;
- final scorecards;
- final screenshots;
- final contact sheets;
- console and screenshot reports;
- performance report;
- `README.md` rewritten for the Art Lock build;
- `IMPLEMENTATION_NOTES.md` rewritten for the Art Lock build.

README must not claim a complete Stage 1 or campaign. It must explain:

- purpose of the Art Lock build;
- reference package A–H;
- how to run Title and Art Lab;
- how to run every art QA command;
- final screenshots;
- asset licensing/ownership;
- known limitations;
- next step: Stage 1 integration after approval.

## 29. Implementation Order

Follow this order:

1. inspect repository and references;
2. clean out conflicting previous implementation;
3. audit visual/tool capabilities;
4. create reference analysis and compliance matrix;
5. create art bible and design tokens;
6. generate/author candidate families;
7. create candidate contact sheets;
8. produce one representative composite;
9. stop for Gate A approval;
10. build the local asset-processing/atlas pipeline;
11. implement TitleScene and ArtLabScene shell;
12. implement final player master and animation family;
13. implement environment kit and seven layers;
14. implement three lighting presets;
15. implement signage kit and density validator;
16. implement UI and mobile-control art kit;
17. implement Ink Crawler, Kite Wraith preview, Lantern Warden visuals;
18. implement slash VFX and telegraph language;
19. implement deterministic screenshot states;
20. run first complete Art Lab capture;
21. perform revision round 1;
22. perform revision round 2;
23. perform revision round 3;
24. continue rounds until all thresholds pass;
25. run all validators, tests, browser checks, and build;
26. create final artifacts and scorecards;
27. stop for Gate B approval;
28. after approval, freeze art bible/manifests and report completion.

Do not spend most of the task writing documentation before rendering the first representative composite. Do not skip the documentation and evidence at the end.

## 30. Hard Rejection Rules

The goal is incomplete if any of these remain:

- final player, enemy, title, environment, or UI primarily uses plain Phaser primitives;
- raw text-list menu remains as final presentation;
- title is text over a flat background;
- specification-sheet images are used directly as runtime art;
- environment lacks seven distinct depth roles;
- sign density exceeds Reference C limits;
- player is unreadable at 48px or in the busy-scene test;
- magenta scarf/cyan eye-and-satchel identity is inconsistent;
- player proportions/costume drift between animation frames;
- slash lacks any Reference G phase/layer;
- telegraph lacks any Reference H phase or recover window;
- VFX obscure hazards or player silhouette;
- black levels are crushed or glow is globally overexposed;
- mobile controls look unrelated to the UI kit or cover critical content;
- fewer than three revision rounds exist;
- reviewers report prototype quality;
- any scoring threshold fails;
- required browser screenshots are missing;
- runtime has console/page/missing-asset errors;
- human approval gate is missing;
- documentation claims unsupported quality.

## 31. Required Completion Commands

Before Gate B, run and pass:

```bash
npm run typecheck
npm run test
npm run build
npm run art:refs
npm run art:process
npm run art:atlas
npm run art:contact-sheets
npm run art:validate-assets
npm run art:validate-sign-density
npm run art:validate-animations
npm run art:validate-vfx
npm run art:validate-telegraphs
npm run art:screenshots
npm run art:review-report
npm run art:all
```

If a command fails, fix the underlying issue and rerun it. Do not remove or weaken the check.

## 32. Definition of Done

This goal is complete only when:

- every A–H reference is implemented and evidenced;
- Gate A and Gate B receive explicit human approval;
- the art bible and manifests are frozen;
- the title screen meets the stated quality bar;
- the Art Lab is polished and functional;
- player master and all required animation states pass review;
- Ink Crawler passes review;
- Kite Wraith visual preview passes review;
- Lantern Warden and telegraphs pass review;
- environment/signage/parallax/lighting kits pass review;
- UI and mobile kit pass review;
- slash VFX passes timing, readability, and performance checks;
- all required screenshots and contact sheets exist;
- at least three complete revision rounds are documented;
- all reviewer thresholds pass;
- all required commands pass;
- runtime browser QA contains no blocking errors;
- no programmer-art fallback remains;
- README and implementation notes honestly describe the Art Lock build.

## 33. Final Response Format

When complete, report:

1. repository cleanup performed;
2. reference files analyzed;
3. tools/capabilities used;
4. candidate counts and selection rationale;
5. asset families produced;
6. revision rounds and major changes;
7. reviewer scores;
8. Gate A and Gate B approval status;
9. commands run and exact results;
10. final screenshot/contact-sheet paths;
11. known visual limitations;
12. exact next step for Stage 1 integration.

Do not claim production quality without the required evidence. Be explicit about any unmet gate or failed command.

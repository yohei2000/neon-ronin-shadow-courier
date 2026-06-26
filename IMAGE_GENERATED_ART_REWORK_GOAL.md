# IMAGE_GENERATED_ART_REWORK_GOAL.md — Gate B v2 Image-Generated Art Rework

## Mission

The current Gate B v1 art package is NOT approved.

The current package has useful structure, QA scripts, references, reports, and screenshot infrastructure, but the actual visual quality is below product level. Rework the art lock by using a real image-generation/editing pipeline to create production-quality game assets.

This goal must produce **Gate B v2**, not patch the existing low-quality procedural/prototype art.

Primary objective:

- reject current Gate B v1 as final art;
- preserve its useful QA pipeline and reference analysis where valid;
- use actual image generation/editing to create high-quality source assets;
- integrate selected/generated assets into the Phaser runtime;
- capture real browser screenshots;
- produce contact sheets, raw generation archives, refinement logs, scorecards, and a new human approval request;
- stop only when Gate B v2 is ready for explicit human approval.

Do not build full Stage 1 gameplay yet. This remains an Art Lock / Art Lab / Title / runtime visual package goal.

## Current Situation

The repository is currently at a Gate B approval-request state.

Treat the following as facts:

- Current Gate B v1 is pending human approval.
- Current Gate B v1 must be rejected for insufficient actual art quality.
- Existing scripts, manifests, screenshot capture, reports, and reference package may be reused if they remain useful.
- Existing final art PNGs are not approved as final production art.
- Existing final art may be used only as negative examples, layout placeholders, QA pipeline test targets, or composition references.
- Existing final art must not be reused as the final Gate B v2 production asset unless it is substantially replaced by image-generated or image-edited source art.

Create:

- `art/approvals/GATE_B_V1_REJECTION.md`
- `art/approvals/GATE_B_V2_REQUEST.md`
- `art/approvals/GATE_B_V2_STATUS.json`

Do not write “Approve Gate B” or mark Gate B approved.

The new human approval phrase must be:

`Approve Gate B v2`

## Non-Negotiable Change

The previous approach relied too much on procedural/programmer art and validation files. That is forbidden for final art.

Gate B v2 final production assets must come from a real image-generation/editing pipeline or explicitly provided high-quality source assets.

Final character, enemy, miniboss, UI, environment, title, Moon Gate, and key VFX art must not be primarily made from:

- Phaser Graphics primitives;
- simple SVG primitives;
- CSS gradients;
- plain rectangles/circles/triangles;
- procedural placeholder PNGs;
- code-generated low-density geometry;
- old Gate B v1 final PNGs without substantial image-generation rework.

Runtime procedural drawing is allowed only for:

- particles;
- masks;
- dynamic lighting;
- debug overlays;
- simple non-final helper effects;
- transient gameplay effects layered over authored/generated art.

## Image Generation Requirement

You must use an actual image-generation or image-editing route.

At the start, detect and document available routes in this order:

1. Native Codex image-generation skill/tool, if available.
2. OpenAI Responses API image_generation tool via `OPENAI_API_KEY`, if available.
3. MCP image-generation server, if configured.
4. User-provided generated source images under `art/source/`, if present.
5. Other local approved image-generation/editing integration, if explicitly available.

Create:

- `art/IMAGE_GENERATION_CAPABILITY_REPORT.md`

It must include:

- route used;
- exact tool/model name if exposed;
- whether text-to-image works;
- whether image-to-image/edit works;
- whether transparent background works;
- whether batch generation works;
- whether generated images can be written to `art/generated/`;
- whether generated images can be iteratively edited/refined;
- whether reference images A–H can be used as visual inputs;
- whether source image consistency can be maintained across frames;
- blockers and limitations.

If no real image-generation/editing route works, stop as a hard blocker.

Do not downgrade to procedural art.

Do not fake image-generation logs.

Do not create placeholder art and pretend it is generated production art.

## Reference Inputs

Use the existing reference package:

- `art/references/neon_ronin_art_refs_impl_ready/index.md`
- `art/references/neon_ronin_art_refs_impl_ready/a.png`
- `art/references/neon_ronin_art_refs_impl_ready/a.md`
- `art/references/neon_ronin_art_refs_impl_ready/b.png`
- `art/references/neon_ronin_art_refs_impl_ready/b.md`
- `art/references/neon_ronin_art_refs_impl_ready/c.png`
- `art/references/neon_ronin_art_refs_impl_ready/c.md`
- `art/references/neon_ronin_art_refs_impl_ready/d.png`
- `art/references/neon_ronin_art_refs_impl_ready/d.md`
- `art/references/neon_ronin_art_refs_impl_ready/e.png`
- `art/references/neon_ronin_art_refs_impl_ready/e.md`
- `art/references/neon_ronin_art_refs_impl_ready/f.png`
- `art/references/neon_ronin_art_refs_impl_ready/f.md`
- `art/references/neon_ronin_art_refs_impl_ready/g.png`
- `art/references/neon_ronin_art_refs_impl_ready/g.md`
- `art/references/neon_ronin_art_refs_impl_ready/h.png`
- `art/references/neon_ronin_art_refs_impl_ready/h.md`

Do not paste the reference sheets into runtime art.

Extract abstract visual rules only:

- A: ink brush outlines, dry-brush texture, splatter, paper grain.
- B: lighting presets, rain, fog, reflections, warm/cool balance.
- C: sign-density discipline, protected player readability zone.
- D: player readability, cyan/magenta identity, 64/48/32px silhouette.
- E: seven-layer parallax and depth roles.
- F: UI material, panel hierarchy, mobile touch affordances.
- G: slash VFX timing, four phases, ink breakup and neon core.
- H: enemy telegraph language, warning → wind-up → release → recovery.

Update:

- `art/REFERENCE_ANALYSIS.md`
- `art/REFERENCE_COMPLIANCE_MATRIX.md`
- `art/ART_BIBLE.md`
- `art/art-style.json`

The updated art bible must explicitly state that Gate B v2 uses image-generated/authored assets, not procedural primitives.

## Gate B v1 Rejection

Create `art/approvals/GATE_B_V1_REJECTION.md`.

It must say:

- Gate B v1 is rejected.
- Reason: structurally complete but visually below product level.
- Existing QA pipeline may be reused.
- Existing art assets are not approved as final.
- Existing screenshots may be used as negative/diagnostic references only.
- Gate B v2 requires real image-generated or image-edited production assets.
- Gate B v2 requires new screenshots, contact sheets, scorecards, and human approval.

If `art/approvals/GATE_B_STATUS.json` exists, do not mark it approved. Either leave it pending with a superseded note or create `GATE_B_V2_STATUS.json` as the active approval state.

## Required Generated Asset Families

Generate or image-edit production source assets for these families.

Each family must have:

- raw generated candidates;
- prompt log;
- metadata log if available;
- rejection notes;
- selected master;
- at least two refinement passes;
- final source files;
- runtime processed files;
- contact sheet;
- Phaser integration proof screenshot.

### Family 1 — Player Master

Goal:

Create the final ninja courier design.

Required visual identity:

- compact dark courier outfit;
- readable head/hat/hood shape;
- magenta scarf or sash;
- cyan eye/core/accent;
- small sealed-message satchel or courier mark;
- strong side-facing silhouette;
- original design;
- non-graphic;
- not an existing IP lookalike;
- readable at 64px, 48px, and 32px display heights.

Generate:

- at least 12 player master candidates;
- at least 4 side-view/action-compatible candidates;
- contact sheet with candidate IDs;
- grayscale comparison;
- busy-background readability comparison;
- 64/48/32px scale comparison.

Select:

- one primary player master;
- one fallback simplified master if animation consistency fails.

Required files:

- `art/generated/player/raw/`
- `art/generated/player/prompts.md`
- `art/generated/player/rejections.md`
- `art/generated/player/player-master-candidates.png`
- `art/source/player/player-master.png`
- `art/source/player/player-master-readability.png`

### Family 2 — Player Animation Sheets

Do not generate animation frames independently from scratch.

Use the approved player master as image reference for all animation generations/edits.

Required animation sheets:

- idle: at least 6 frames;
- run: at least 8 frames;
- jump rise: at least 3 frames;
- fall: at least 2 frames;
- wall slide: at least 4 frames;
- wall kick: at least 4 frames;
- ground slash: at least 8 frames;
- air slash: at least 6 frames;
- hurt: at least 3 frames.

Requirements:

- stable costume;
- stable head size;
- stable scarf attachment;
- stable cyan accent;
- stable magenta scarf;
- no frame-to-frame identity drift;
- no anatomy/limb defects;
- consistent anchor/origin;
- transparent background if possible;
- consistent lighting.

If consistency fails twice, simplify the character design and regenerate.

Required files:

- `art/generated/player-animation/raw/`
- `art/generated/player-animation/prompts.md`
- `art/generated/player-animation/consistency-failures.md`
- `art/source/player/player-idle-sheet.png`
- `art/source/player/player-run-sheet.png`
- `art/source/player/player-jump-sheet.png`
- `art/source/player/player-fall-sheet.png`
- `art/source/player/player-wall-slide-sheet.png`
- `art/source/player/player-wall-kick-sheet.png`
- `art/source/player/player-ground-slash-sheet.png`
- `art/source/player/player-air-slash-sheet.png`
- `art/source/player/player-hurt-sheet.png`
- `art/final/player-animation-contact-sheet.png`
- `art/final/player-scale.png`
- `art/final/player-grayscale-contrast.png`

### Family 3 — Ink Crawler

Generate a polished standard enemy.

Required:

- low horizontal ink creature;
- distinct from player;
- cyan eye/core;
- readable at gameplay scale;
- 6 movement frames;
- 3 hurt frames or equivalent treatment;
- 6 defeat/dissolve frames or equivalent effect;
- contact warning/pose.

Generate at least 8 candidates.

Required files:

- `art/generated/ink-crawler/raw/`
- `art/source/enemies/ink-crawler-sheet.png`
- `art/final/ink-crawler-states.png`

### Family 4 — Kite Wraith

Generate a polished future-integration enemy visual.

Required:

- floating paper-kite / cloth-wraith silhouette;
- soft movement language;
- clear directionality;
- distinct from background signs;
- at least one animation preview sheet.

Generate at least 8 candidates.

Required files:

- `art/generated/kite-wraith/raw/`
- `art/source/enemies/kite-wraith-preview-sheet.png`
- `art/final/kite-wraith-preview.png`

### Family 5 — Lantern Warden

Generate the elite/miniboss visual.

Required:

- larger than player;
- lantern-core motif;
- readable closed/armored state;
- readable open/weak state;
- three attack telegraphs;
- recovery state;
- defeat or dissolve treatment;
- health-bar visual pairing.

Generate at least 12 candidates.

Required files:

- `art/generated/lantern-warden/raw/`
- `art/source/enemies/lantern-warden-sheet.png`
- `art/source/enemies/lantern-warden-telegraph-sheet.png`
- `art/final/lantern-warden-states.png`
- `art/final/lantern-warden-telegraph-contact-sheet.png`

### Family 6 — Neon Alley Key Art

Generate a 960x540 key composition.

Required:

- sumi-e ink + restrained neon;
- rain;
- fog;
- wet reflective ground;
- protected player readability zone;
- one hero sign maximum;
- medium/small sign density controlled;
- Moon Gate or alley landmark visible;
- 7-layer parallax plan possible;
- no pasted reference art;
- no illegible fake text.

Generate at least 12 candidates.

Required files:

- `art/generated/environment-key/raw/`
- `art/generated/environment-key/environment-key-candidates.png`
- `art/source/environment/neon-alley-key-art.png`

### Family 7 — Parallax Layer Set

Use the selected Neon Alley key art as style reference.

Generate or edit into separated layers:

1. far sky/fog;
2. distant skyline;
3. mid buildings/signs;
4. gameplay architecture;
5. near props;
6. foreground occlusion;
7. rain/fog/light overlays.

Requirements:

- horizontally extendable enough for Art Lab and later Stage 1;
- consistent lighting;
- no flattened single background as only runtime layer;
- no foreground element hides player for long;
- sign density follows Reference C;
- each layer has a role and scroll factor.

Required files:

- `art/source/environment/layer-far-sky.png`
- `art/source/environment/layer-distant-skyline.png`
- `art/source/environment/layer-mid-buildings-signs.png`
- `art/source/environment/layer-gameplay-architecture.png`
- `art/source/environment/layer-near-props.png`
- `art/source/environment/layer-foreground-occlusion.png`
- `art/source/environment/layer-rain-fog-light.png`
- `art/final/seven-layer-parallax-breakdown.png`
- `art/final/reference-e-seven-layer-parallax.png`

### Family 8 — Tileset and Props

Generate a modular Neon Alley kit.

Required minimum:

- 16 collision tile variants;
- 12 edge/corner variants;
- 8 background architecture modules;
- 24 decorative props;
- 6 sign variants;
- 6 lantern variants;
- 6 cable/pipe variants;
- 4 window variants;
- 4 wet reflection variants;
- 3 checkpoint/shrine states;
- 3 hazard variants;
- 1 Moon Gate kit;
- 1 wall-kick instruction motif;
- 1 secret-route visual motif.

Do not count pure color swaps as distinct assets.

Required files:

- `art/generated/environment-kit/raw/`
- `art/source/environment/tileset-neon-alley.png`
- `art/source/environment/props-atlas.png`
- `art/source/environment/sign-atlas.png`
- `art/source/environment/moon-gate-kit.png`
- `art/final/environment-contact-sheet.png`
- `art/final/reference-c-sign-density.png`
- `art/final/wet-reflection-contact-sheet.png`
- `art/final/fog-depth-contact-sheet.png`

### Family 9 — UI / HUD Kit

Use image generation/editing for UI materials and icons.

Do not bake normal UI labels into images, except for logo/title mark.

Generate:

- title logo treatment;
- menu panel;
- HUD frame;
- HP icon;
- scroll icon;
- timer panel;
- objective panel;
- miniboss health bar frame;
- button idle/focus/pressed/disabled states;
- settings/control panel materials;
- mobile control visual kit.

Required visual style:

- ink paper panels;
- neon cyan semantic focus;
- magenta accent only for danger/action;
- gold for reward/scroll/checkpoint;
- no raw debug text-list UI.

Required files:

- `art/generated/ui/raw/`
- `art/source/ui/title-logo.png`
- `art/source/ui/ui-kit.png`
- `art/source/ui/mobile-controls-kit.png`
- `art/source/ui/icons.png`
- `art/final/ui-desktop-contact-sheet.png`
- `art/final/ui-mobile-390x844.png`
- `art/final/ui-material-swatches.png`
- `art/final/ui-state-contact-sheet.png`

### Family 10 — Slash VFX

Generate or image-edit a flipbook for Reference G slash.

Required four phases:

1. anticipation;
2. active neon core / brush arc;
3. ink breakup;
4. fade.

Timing target:

- total visual cycle around 0.40 seconds;
- active hit clarity;
- visible over dark and bright backgrounds;
- does not obscure enemy telegraph.

Generate at least 8 candidates.

Required files:

- `art/generated/vfx-slash/raw/`
- `art/source/vfx/slash-flipbook.png`
- `art/final/reference-g-slash-timeline.png`
- `art/final/slash-four-phases.png`
- `art/final/slash-dark.png`
- `art/final/slash-bright.png`

### Family 11 — Impact / Pickup / Checkpoint VFX

Generate:

- hit spark;
- enemy ink dissolve;
- wall-kick dust/ink;
- jump/landing dust;
- scroll pickup;
- checkpoint pulse;
- stage clear burst.

Required files:

- `art/source/vfx/hit-spark-flipbook.png`
- `art/source/vfx/ink-dissolve-flipbook.png`
- `art/source/vfx/wall-kick-burst.png`
- `art/source/vfx/pickup-flash.png`
- `art/source/vfx/checkpoint-pulse.png`
- `art/source/vfx/stage-clear-burst.png`

### Family 12 — Enemy Telegraph VFX

Generate Reference H telegraph visual language.

Required phases:

1. idle/neutral;
2. early warning;
3. attack area preview;
4. wind-up;
5. release;
6. recovery / punish window.

Required files:

- `art/generated/telegraph/raw/`
- `art/source/vfx/telegraph-flipbook.png`
- `art/final/telegraph-standard.png`
- `art/final/telegraph-fast.png`
- `art/final/lantern-warden-telegraph-contact-sheet.png`

## Generation Logging

For every generation call or image-edit call, log:

- timestamp;
- asset family;
- candidate ID;
- prompt;
- negative prompt / rejection constraints if supported;
- image references used;
- output path;
- tool/model name if available;
- size;
- transparency setting if available;
- whether the candidate was selected or rejected;
- rejection reason.

Create:

- `art/generated/GENERATION_LOG.md`
- `art/generated/GENERATION_LOG.json`

Do not fabricate metadata. If a tool does not expose seeds or IDs, write `not exposed by tool`.

## Prompting Rules for Image Generation

Use explicit art direction.

Do not prompt for a named game or named living artist style.

Do not ask for copyrighted characters.

Use abstract visual terms:

- sumi-e ink;
- dry brush;
- paper grain;
- restrained neon;
- wet alley reflections;
- cyan/magenta semantic lighting;
- dark negative space;
- readable side-scroller silhouette;
- transparent background for sprites;
- sprite sheet consistency;
- same character, same costume, same proportions;
- game asset, not poster art;
- no text unless generating title logo;
- no watermark;
- no logo from real brands;
- no gore;
- no realistic violence.

Every prompt must mention:

- original game asset;
- side-scrolling 2D game;
- consistent readable silhouette;
- no copyrighted characters;
- no text/watermark unless intentionally generating title logo.

## Selection and Rejection

For each family:

1. Generate candidates.
2. Build contact sheet.
3. Score candidates from 1–5:
   - reference compliance;
   - originality;
   - readability;
   - production usability;
   - consistency;
   - animation/integration viability.
4. Reject candidates with:
   - generic AI concept art look;
   - unreadable silhouette;
   - inconsistent costume;
   - bad hands/limbs/anatomy;
   - fake unreadable text that draws attention;
   - too much detail for gameplay scale;
   - weak alpha/background separation;
   - inconsistent perspective;
   - incoherent lighting;
   - too close to existing IP;
   - unsuitable for animation;
   - poor mobile readability.
5. Select one primary and one fallback where useful.
6. Refine selected masters with at least two image-edit passes.
7. Create final source assets.
8. Integrate into runtime.
9. Capture screenshots.
10. Request human review.

Do not automatically select the first acceptable candidate.

Do not hide rejected candidates.

## Contact Sheets

Required contact sheets:

- `art/generated/player/player-master-candidates.png`
- `art/generated/environment-key/environment-key-candidates.png`
- `art/generated/ink-crawler/ink-crawler-candidates.png`
- `art/generated/kite-wraith/kite-wraith-candidates.png`
- `art/generated/lantern-warden/lantern-warden-candidates.png`
- `art/generated/ui/ui-candidates.png`
- `art/generated/vfx-slash/slash-candidates.png`
- `art/generated/telegraph/telegraph-candidates.png`
- `art/final/player-animation-contact-sheet.png`
- `art/final/enemy-contact-sheet.png`
- `art/final/environment-contact-sheet.png`
- `art/final/ui-desktop-contact-sheet.png`
- `art/final/ui-mobile-390x844.png`
- `art/final/reference-g-slash-timeline.png`
- `art/final/lantern-warden-telegraph-contact-sheet.png`

Every contact sheet must include:

- candidate IDs;
- selected/rejected label;
- scale preview;
- grayscale preview where relevant;
- busy-background preview where relevant;
- short reason text.

## Runtime Integration

Integrate Gate B v2 final assets into Phaser.

Required runtime states:

- TitleScene using image-generated title logo, title composition, UI panels.
- ArtLabScene using final player sheets, enemies, miniboss, VFX, UI, parallax layers.
- Mobile controls using generated UI art.
- High contrast state.
- Reduced FX state.
- Slash dark/bright readability states.
- Telegraph states.
- Lighting preset states.
- Seven-layer parallax state.
- Sign-density annotated state.

Do not show old Gate B v1 assets in final screenshots unless explicitly labeled as “rejected v1 comparison”.

Do not paste reference sheets into runtime.

Do not paste candidate sheets into runtime except in ArtLab review panels if clearly labeled.

## Asset Processing

Create or update asset processing scripts:

- `npm run art:generate` if possible;
- `npm run art:process`;
- `npm run art:atlas`;
- `npm run art:contact-sheets`;
- `npm run art:validate-assets`;
- `npm run art:validate-animations`;
- `npm run art:validate-vfx`;
- `npm run art:validate-telegraphs`;
- `npm run art:validate-generated`;
- `npm run art:screenshots`;
- `npm run art:review-report`;
- `npm run art:audit`;
- `npm run art:all`.

If image generation cannot be fully scripted through npm because the native Codex skill is interactive, still create source files and logs, then make `art:generate` validate generation evidence rather than regenerate everything.

`art:validate-generated` must fail if:

- raw generated outputs are missing;
- generation logs are missing;
- fewer than required candidates exist;
- selected masters are missing;
- refinement passes are missing;
- old Gate B v1 assets are used as final source without replacement;
- final source files do not exist under `art/source/`;
- final runtime files do not map back to `art/source/`;
- contact sheets are missing;
- human review package is missing.

## Automated Validation

Update validators so they inspect actual evidence.

Validation must check:

- source assets exist under `art/source/`;
- generated raw candidates exist under `art/generated/`;
- required candidate counts are met;
- selected masters exist;
- rejection notes exist;
- final runtime assets exist;
- player animation sheets exist;
- player animation frame counts meet requirements;
- enemy/miniboss sheets exist;
- slash VFX has four phases;
- telegraph VFX has six phases;
- UI states exist;
- mobile control art exists;
- parallax layer count is at least seven;
- sign-density report exists;
- screenshots exist;
- console report has no errors;
- no runtime loading of A–H reference sheets;
- old rejected Gate B v1 files are not final runtime assets unless explicitly regenerated/replaced;
- all approval states are consistent.

## Screenshot Matrix

Generate a new Gate B v2 screenshot matrix.

Output to:

- `art/final-v2/`

Required screenshots:

- `title-desktop.png`
- `title-large.png`
- `title-mobile.png`
- `artlab-neutral.png`
- `artlab-busy.png`
- `player-animation-contact-sheet.png`
- `enemy-contact-sheet.png`
- `environment-contact-sheet.png`
- `ui-desktop-contact-sheet.png`
- `ui-mobile-390x844.png`
- `reference-g-slash-timeline.png`
- `lantern-warden-telegraph-contact-sheet.png`
- `lighting-moonlight-lantern-gold.png`
- `lighting-cyan-magenta-neon.png`
- `lighting-warm-cool-alley.png`
- `seven-layer-parallax-breakdown.png`
- `sign-density-annotated.png`
- `player-idle.png`
- `player-run.png`
- `player-jump-wall-slash.png`
- `player-scale.png`
- `player-grayscale-contrast.png`
- `ink-crawler-states.png`
- `kite-wraith-preview.png`
- `lantern-warden-states.png`
- `ui-desktop.png`
- `ui-mobile.png`
- `mobile-controls.png`
- `slash-four-phases.png`
- `slash-dark.png`
- `slash-bright.png`
- `telegraph-standard.png`
- `telegraph-fast.png`
- `high-contrast.png`
- `reduced-fx.png`

Create:

- `art/final-v2/screenshot-report.json`
- `art/final-v2/console-report.json`

Console report must show:

- zero console errors;
- zero page errors;
- zero failed runtime asset requests;
- zero remote runtime asset requests.

## Real Visual Review

Do not use simulated reviews.

The old review text that said “simulated independent review” is unacceptable for Gate B v2.

Create real image-specific review files:

- `art/reviews/gate-b-v2/title-review.md`
- `art/reviews/gate-b-v2/player-review.md`
- `art/reviews/gate-b-v2/environment-review.md`
- `art/reviews/gate-b-v2/enemy-review.md`
- `art/reviews/gate-b-v2/ui-review.md`
- `art/reviews/gate-b-v2/vfx-review.md`
- `art/reviews/gate-b-v2/mobile-review.md`
- `art/reviews/gate-b-v2/critical-rejection-review.md`

Each review must include:

- files inspected;
- concrete visual observations;
- what improved versus Gate B v1;
- what still looks weak;
- specific rejection risks;
- reference A–H compliance notes;
- PASS/FAIL decision;
- required edits if FAIL.

No generic “verify X” language.

No simulated independent review language.

## Revision Rounds

Run at least three real Gate B v2 visual revision rounds after first integration.

For each round:

- capture screenshots;
- inspect actual images;
- write concrete review notes;
- implement visual changes;
- regenerate atlases/assets as needed;
- recapture screenshots;
- document before/after differences.

Output:

- `art/reviews/gate-b-v2/round-01/`
- `art/reviews/gate-b-v2/round-02/`
- `art/reviews/gate-b-v2/round-03/`

Each round must contain:

- screenshots;
- `review.md`;
- `changes.md`;
- `before-after.md`.

`review.md` must include concrete visual observations, not a checklist template.

`changes.md` must describe actual edits made to images, assets, atlases, runtime composition, UI placement, lighting, or VFX.

## Human Selection Gate

Before final runtime integration, request human selection approval.

Create:

- `art/approvals/GATE_B_V2_SELECTION_REQUEST.md`

It must include:

- player candidates;
- environment key art candidates;
- UI candidates;
- enemy candidates;
- miniboss candidates;
- slash candidates;
- recommended selections;
- rejected candidate reasons;
- exact question for human.

Stop and ask for human selection approval unless the environment goal explicitly allows proceeding with best-effort selection.

If stopping is not allowed by the goal system, proceed with the highest-scoring candidates but mark:

- `humanSelectionApproval: "not provided, proceeded by score"`

in `art/approvals/GATE_B_V2_STATUS.json`.

## Final Human Approval Gate

After integration and all revisions, create:

- `art/approvals/GATE_B_V2_SCREENSHOT_LINKS.md`
- `art/approvals/GATE_B_V2_HUMAN_CHECKLIST.md`
- `art/approvals/GATE_B_V2_REQUEST.md`

The final request must say:

Gate B v2 approval requires explicit human review. Reply with exactly:

`Approve Gate B v2`

Do not set `approved: true` yourself.

`GATE_B_V2_HUMAN_CHECKLIST.md` must include PASS/FAIL boxes for:

- title impact;
- player identity;
- 64px readability;
- 48px readability;
- 32px readability;
- busy background readability;
- player animation consistency;
- UI not debug-like;
- mobile controls usable and visually integrated;
- Ink Crawler quality;
- Kite Wraith quality;
- Lantern Warden quality;
- slash four-phase clarity;
- Lantern Warden telegraph clarity;
- sign density discipline;
- seven-layer parallax;
- lighting preset quality;
- high contrast mode;
- reduced FX mode;
- reference A compliance;
- reference B compliance;
- reference C compliance;
- reference D compliance;
- reference E compliance;
- reference F compliance;
- reference G compliance;
- reference H compliance;
- no old Gate B v1 final art used as final;
- no procedural primitive final art;
- screenshots are from runtime;
- console report clean.

## Scorecard

Create:

- `art/reviews/gate-b-v2/final-scorecard.md`
- `art/reviews/gate-b-v2/final-scorecard.json`

Independent review roles:

1. Art Director Reviewer.
2. Gameplay Readability Reviewer.
3. Animation Consistency Reviewer.
4. Technical Art Reviewer.
5. UI/UX Art Reviewer.
6. Reference Compliance Reviewer.
7. Critical Rejection Reviewer.

Each reviewer must score 1–5 and write concrete reasons.

Passing thresholds:

- no category below 4.2;
- median at least 4.5;
- player readability at 64/48/32 at least 4.6;
- title impact at least 4.5;
- UI quality at least 4.4;
- mobile readability at least 4.3;
- animation consistency at least 4.2;
- reference compliance at least 4.5;
- Critical Rejection Reviewer must PASS.

Do not average away a failing category.

If a score fails, revise and rerun.

## Hard Rejection Rules

Gate B v2 is incomplete if any of these remain:

- no actual image generation route was used;
- no raw generated candidates are preserved;
- fewer than required candidates were generated;
- no refinement passes exist;
- final player is procedural/programmer art;
- final enemy is procedural/programmer art;
- final UI is raw text or debug-list style;
- final environment is mostly geometric placeholder art;
- old Gate B v1 art is reused as final without substantial image-generation replacement;
- reference sheets are pasted into runtime;
- generated candidate logs are missing;
- contact sheets are missing;
- final screenshots are missing;
- Playwright/browser screenshots were not taken;
- console report has errors;
- review text is generic or simulated;
- no concrete before/after revision notes exist;
- final score thresholds are not met;
- Gate B v2 approval request is missing;
- the system marks human approval without the user explicitly saying `Approve Gate B v2`.

## Commands

Before final response, run:

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run art:refs`
- `npm run art:process`
- `npm run art:atlas`
- `npm run art:contact-sheets`
- `npm run art:validate-assets`
- `npm run art:validate-animations`
- `npm run art:validate-vfx`
- `npm run art:validate-telegraphs`
- `npm run art:validate-generated`
- `npm run art:screenshots`
- `npm run art:review-report`
- `npm run art:audit`
- `npm run art:all`

If image generation is scriptable:

- `npm run art:generate`

If image generation is not scriptable but was performed through native Codex skill/tool, `art:validate-generated` must verify artifacts and logs.

All commands must pass except commands impossible due to environment limitations. If a command is impossible, report the blocker honestly and do not claim completion.

## Repository Hygiene

Organize files:

- `art/generated/` for raw/generated candidates.
- `art/source/` for selected/refined source assets.
- `art/final-v2/` for final Gate B v2 screenshots/reports.
- `art/reviews/gate-b-v2/` for reviews and scorecards.
- `art/approvals/` for approval/rejection states.
- `public/assets/` or equivalent for runtime optimized assets.
- `src/data/artAssets.ts` or equivalent for runtime asset manifest.

Do not delete Gate B v1 evidence unless it blocks build. It may be useful as comparison.

Clearly separate:

- `final/` = old v1 final artifacts;
- `final-v2/` = new image-generated Gate B v2 artifacts.

## Runtime Quality

The final runtime must show the new image-generated assets in:

- TitleScene;
- ArtLabScene;
- mobile UI state;
- slash state;
- telegraph state;
- parallax state;
- lighting states.

Runtime screenshots must prove the assets are loaded from local files.

Do not rely on network images.

No remote runtime asset requests.

No missing texture warnings.

No blurry upscaled sprites.

No texture bleeding.

No huge unoptimized files that break mobile viewport.

## Final Response Format

When complete, respond with:

1. Gate B v1 rejection summary.
2. Image generation route used.
3. Asset families generated.
4. Candidate counts per family.
5. Selected masters.
6. Refinement passes completed.
7. Runtime integration summary.
8. New screenshot paths.
9. Commands run and results.
10. Review score summary.
11. Remaining visual risks.
12. Exact next human action:
    - review `art/approvals/GATE_B_V2_SCREENSHOT_LINKS.md`;
    - reply `Approve Gate B v2` only if visually acceptable.

Be honest. Do not claim approval. Do not claim product quality without evidence.
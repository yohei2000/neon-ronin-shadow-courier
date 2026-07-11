# Stage 1 Continuous Background v4 - ImageGen Prompt Set

## Final method

- Tool: built-in `image_gen`
- Runtime status: adopted for Stage1 runtime on 2026-07-11
- First create one full-stage low-resolution panorama containing all five sections in route order.
- Normalize that panorama into a 10050x900 route guide.
- Generate five high-resolution strips sequentially from left to right.
- Every strip after the first receives the previous strip's exact 862-pixel tail as its left context.
- Stage section transitions are rendered inside a generated strip. They are not created by joining independent stage panels.
- Assemble the rolling strips inside their inherited overlaps with a minimum-difference seam and a maximum two-pixel antialias feather.
- Crop all five deliverable plates from the resulting single master.

## Global panorama

Input references:

1. v2 `stage1-panorama-anchor-imagegen.png`: style and camera authority.
2. v3 `stage1-master-layout.png`: route-order reference only.

Prompt summary:

> Paint Stage 1 as one uninterrupted continuous side-on panorama. Progress from rainy lantern alley, through attached neon sign towers and sign bridge, into covered market rooftops, down into a cyan thorn-covered drainage wall, then through attached descending galleries to one broad amber-lit Moon Gate forecourt. Use one camera, one horizon, one rain direction, continuous stone and roof materials, no panels, no dividers, no scene resets, and no duplicate or translucent structures. Confine the entire route to a narrow central corridor so it can become an ultra-wide master.

Output: `sources/stage1-v4-single-panorama-imagegen.png`

## Rolling strip 01

World range: `0-2700`

Prompt summary:

> Render the first continuous high-resolution strip from the rainy lantern alley through magenta sign towers into cyan sign-gate roof access. Preserve the single-master guide's ground, roofs, stairs, skyline, and edge landmarks. Keep the far-right area as continuation context. One fixed side-on camera, opaque supported architecture, no panels or redesign.

Output: `rolling-strips/strip-01-imagegen.png`

## Rolling strip 02

World range: `1838-4538`; inherited context: `1838-2700`

Prompt summary:

> Continue from strip 01's exact cyan sign-gate tail through the supported neon sign bridge into the long covered market rooftop route. Repaint the guide junction as one attached building complex. Match strip 01's camera, horizon, rain, structure scale, exposure, wet-stone level, and distant perspective. Preserve broad left and right continuation context.

Output: `rolling-strips/strip-02-imagegen.png`

## Rolling strip 03

World range: `3676-6376`; inherited context: `3676-4538`

Prompt summary:

> Continue from strip 02's descending market roofs through attached tiled roofs, stone stairs, gutters, and drainage masonry into the cyan thorn-covered drain structure. Render the entire roof-to-drain connection within this image. Warm market lanterns must fade gradually into cyan drain light, with no duplicate roofs or alternate stairs.

Output: `rolling-strips/strip-03-imagegen.png`

## Rolling strip 04

World range: `5514-8214`; inherited context: `5514-6376`

Prompt summary:

> Continue from strip 03's cyan drain wall through attached high galleries, supported stone terraces, and long descending stairs toward the gate district. Keep the same camera, horizon, rain, stone scale, and skyline. Fade localized cyan light into warm amber gallery lighting without a scene reset.

Output: `rolling-strips/strip-04-imagegen.png`

## Rolling strip 05

World range: `7350-10050`; inherited context: `7350-8214`

Prompt summary:

> Continue from strip 04's descending amber terraces into one broad wet-stone Lantern Warden forecourt and exactly one circular Moon Gate complex, followed by a short grounded end terrace. Merge all guide gate fragments into the same single gate. Preserve the inherited left context and keep the plaza structurally supported.

Output: `rolling-strips/strip-05-imagegen.png`

## Negative constraints shared by all strips

- No independent self-contained panels.
- No visible internal divider or hard vertical seam.
- No camera, horizon, rain, scale, exposure, or perspective reset.
- No duplicate, translucent, or alternate roof/wall/stair structures.
- No floating boards, rectangular platform slabs, characters, UI, labels, or watermark.

## Rejected experiment

A frequency-only detail-transfer experiment preserved continuity but remained too soft at original size. Increasing the transferred frequency range introduced thin duplicate edges. That experiment is not used by `compose_v4_rolling_master.py` and is not part of the final manifest.

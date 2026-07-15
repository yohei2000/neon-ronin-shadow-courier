# Stage 1 Continuous Background v7 - ImageGen Prompt Set

## Tool And Method

- Tool: built-in `image_gen`
- Use case: `stylized-concept`
- Output status: review candidate, not runtime integrated
- Geometry authority: `stage1-v7-cutaway-blueprint.png`
- Continuity method: one generated panorama, then five sequential strips with the previous strip's exact 862 px tail

## Global Panorama Prompt

Create one uninterrupted side-view environment painting for a polished 2D action platformer. Redesign Neon Ronin Stage 1 as a readable architectural cutaway/elevation, following the supplied structural blueprint exactly. Every walkable top boundary must sit on a visibly thick physical mass: wet stone street and retaining wall, tiled roof with rafters and attic, timber gallery with beams and columns, masonry stair, bridge arch, drainage tower, or gate terrace. Use strong value separation between the lighter top plane and the darker vertical face immediately below it. The player should appear to stand on stone, tile, wood, stairs, or earth, never on light itself. Keep rain and restrained cyan/magenta/amber neon in the distant background and windows only. No luminous outline on playable surfaces. One consistent side-on orthographic camera and horizon across the whole stage.

## Shared Strip Prompt

Re-render this exact Stage 1 interval as high-detail side-view 2D platformer environment art. Preserve every top boundary, stair, slope, opening, building mass, and inherited left-side continuation from the guide. Treat the scene like a theatrical architectural cutaway: foreground terrain and traversable structures have crisp silhouettes, thick visible side faces, roof understructure, masonry courses, beams, columns, arches, foundations, and dark interior voids. Make traversable top planes readable by shape, material edge, and value contrast rather than colored glow. Rain and neon may illuminate distant facades, windows, signs, and puddles, but must not trace the collision route. The right edge must remain structurally open for the next continuation.

## Shared Negative Constraints

- No glowing collision lines, luminous rails, laser-like edging, or light strips under the character.
- No floating boards, thin bars, isolated slabs, unsupported roofs, or rectangular programmer platforms.
- No three-quarter camera, deep perspective floor, camera reset, horizon reset, or self-contained panel.
- No playable surface whose physical material or support cannot be understood from the side view.
- No characters, enemies, UI, labels, guide colors, text, watermark, or duplicate Moon Gates.

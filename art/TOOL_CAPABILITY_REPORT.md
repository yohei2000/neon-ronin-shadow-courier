# Tool Capability Report

Status: Gate A audit complete.

## Findings

- Image generation: available through the built-in Codex `image_gen` tool. Outputs were recovered from `C:\Users\hitoa\.codex\generated_images\019efe9d-d65f-70d0-ba6a-be54dbdc5364` and copied into `art/reviews/candidates/` and `art/reviews/gate-a/`.
- Image editing/inpainting: no local image-editing API was exercised. Treat native inpainting as not proven for this repository until explicitly tested.
- OpenAI image API integration: no project-local `OPENAI_API_KEY` path is configured or required for the built-in tool. CLI/API fallback is not assumed.
- Codex Browser: browser-control skill is available in the session, but Gate A used Playwright for deterministic renders.
- Playwright: available and runnable. `npx.cmd playwright --version` returned `Version 1.61.1`.
- Browser/WebGL: Playwright Chromium launched headless and reported `webgl: true` with HeadlessChrome `149.0.7827.55`.
- Local raster tools: `sharp` and `canvas` Node modules are missing. Bundled Python has `PIL` available. Gate A avoids extra installs by using Playwright SVG rasterization and PNG header validation.
- Local vector/render tools: SVG is authored in repo scripts and rendered with Playwright screenshots.
- Texture-atlas tooling: not yet implemented. `npm run art:atlas` intentionally fails before Gate A approval and production asset implementation.
- Fonts: Windows system fonts are available, including Arial and Agency. Final font licensing must be locked before production runtime use.
- GPU/WebGL constraints: only headless browser availability is proven. Real device/mobile GPU performance is not claimed.
- Repository asset licenses: user-created A-H reference package is treated as implementation specification. Generated Gate A candidates are project-bound concept assets, not runtime assets. No third-party art assets were copied.

## Commands Used

```text
node --version -> v24.17.0
npm.cmd --version -> 11.13.0
npx.cmd playwright --version -> Version 1.61.1
node require.resolve checks -> @playwright/test, vite, typescript, vitest, phaser OK; sharp/canvas MISSING
bundled Python module check -> PIL OK; cairosvg MISSING
Playwright Chromium WebGL probe -> webgl true
```

## Production Pipeline Decision

Gate A uses two production-capable paths:

- AI-generated concept sheets for candidate exploration and direction selection.
- Deterministic repo-local SVG/Playwright rasterization for palette, value, shape, UI, VFX, telegraph, and 960x540 representative-composite evidence.

For final production assets after Gate A approval, use image-generation/editing for source concepts where it materially improves quality, then convert selected masters into deterministic PNG/atlas assets with local validation. Do not paste A-H reference sheets or candidate sheets into runtime.

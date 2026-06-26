# Implementation Notes - Art Lock Gate B Package

## Scope

`ART_LOCK_GOAL.md` remains the active scope. The repository implements a visual Art Lock package, not a complete Stage 1 campaign.

Gate A was explicitly approved with `Approve Gate A`. Gate B is prepared and remains pending explicit human approval.

## Runtime

- `BootScene -> PreloadScene -> TitleScene` by default.
- `?scene=artlab&state=<state>` boots deterministic `ArtLabScene` review stations.
- `TitleScene` and `ArtLabScene` load generated raster assets from `art/final/assets/`.
- The runtime QA bridge is `window.__NEON_RONIN_ART_LOCK__`.

## Asset Pipeline

- `scripts/process-art-assets.mjs` authors SVG source and rasterizes final PNGs with Playwright Chromium.
- `scripts/build-art-atlases.mjs` validates spritesheet/atlas dimensions and writes `art/final/atlas-manifest.json`.
- `scripts/generate-art-contact-sheets.mjs` verifies final contact sheets as real PNG evidence.
- Runtime manifests are `art/asset-manifest.json`, `art/animation-manifest.json`, `art/vfx-manifest.json`, `art/telegraph-manifest.json`, and `art/sign-density-scenes.json`.

## Validation

- `art:validate-assets` checks manifests, runtime assets, screenshots, revision rounds, approvals, and scene asset usage.
- `art:validate-sign-density` enforces Reference C limits.
- `art:validate-animations` enforces player/enemy frame counts and stable origins.
- `art:validate-vfx` enforces Reference G timing, layers, particle bounds, and reduced-FX.
- `art:validate-telegraphs` enforces Reference H phase order and semantic color language.
- `art:screenshots` captures the final screenshot matrix and three review rounds with Playwright.
- `art:review-report` creates `art/reviews/final-scorecard.*`, `art/approvals/GATE_B_REQUEST.md`, and `art/reviews/gate-b/gate-b-package-report.*`.

## Evidence

Final screenshots and reports live under:

```text
art/final/
art/reviews/round-01/
art/reviews/round-02/
art/reviews/round-03/
art/reviews/gate-b/
```

## Gate Status

- Gate A: approved.
- Gate B: pending human approval with exact phrase `Approve Gate B`.

Do not claim final Art Lock completion until Gate B is explicitly approved.

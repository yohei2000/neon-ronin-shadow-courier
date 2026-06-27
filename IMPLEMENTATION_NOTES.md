# Implementation Notes - Gate B v2 Image-Generated Art Lock

## Scope

`IMAGE_GENERATED_ART_REWORK_GOAL.md` is the active rework scope. Gate B v1 is rejected and must not be approved.

This repo now preserves v1 evidence while building Gate B v2 from native image-generated source art:

- `art/final/` is old Gate B v1 evidence.
- `art/generated/` contains raw native `image_gen` outputs and logs.
- `art/source/` contains selected/refined v2 source assets.
- `art/final-v2/` contains v2 runtime screenshots, reports, and processed assets.

## Runtime

- `BootScene -> PreloadScene -> TitleScene` by default.
- `?scene=artlab&state=<state>` boots deterministic `ArtLabScene` review stations.
- Runtime assets are loaded from `art/final-v2/assets/`.
- The QA bridge is `window.__NEON_RONIN_ART_LOCK__`.

## Image Generation Route

- Route used: native Codex `image_gen` via the `imagegen` skill.
- Model/seed IDs: not exposed by the native tool.
- Raw outputs are preserved under `art/generated/**/raw/`.
- Capability report: `art/IMAGE_GENERATION_CAPABILITY_REPORT.md`.
- Full generation log: `art/generated/GENERATION_LOG.md` and `.json`.

## Asset Pipeline

- `scripts/process-generated-v2.mjs` processes recovered native image outputs into `art/source/` and `art/final-v2/assets/`.
- `scripts/build-art-atlases.mjs` writes `art/final-v2/atlas-manifest.json`.
- `scripts/generate-art-contact-sheets.mjs` verifies final-v2 contact sheets.
- Runtime manifests remain `art/asset-manifest.json`, `art/animation-manifest.json`, `art/vfx-manifest.json`, `art/telegraph-manifest.json`, and `art/sign-density-scenes.json`.

## Validation

- `art:validate-generated` checks raw generated candidates, logs, source assets, selected masters, final-v2 assets, and v2 approval state.
- `art:validate-assets` checks manifests, runtime assets, screenshots, revision rounds, approvals, and scene asset usage.
- `art:screenshots` captures `art/final-v2/` plus `art/reviews/gate-b-v2/round-01..03/`.
- `art:review-report` writes concrete v2 review files and `art/reviews/gate-b-v2/final-scorecard.*`.
- `art:audit` verifies Gate B v2 approval as part of final Art Lock completion.

## Gate Status

- Gate A: approved.
- Gate B v1: rejected.
- Gate B v2: approved by explicit human input on 2026-06-27.

The approved Gate B v2 visual system is the reference for the next Stage 1 integration pass.

# Implementation Notes - Art Lock Transition

## Current State

`ART_LOCK_GOAL.md` supersedes the previous Stage 1 implementation plan. The repository is in Gate A preparation for a reference-driven visual lock.

Gate A artifacts have been produced from the A-H reference package:

- tool capability audit;
- reference analysis;
- compliance matrix draft;
- art bible draft;
- palette/value/shape/UI/VFX/telegraph studies;
- AI-generated candidate contact sheets;
- selected-direction representative composite;
- Gate A package report.

## Important Scope Correction

The previous broad Stage 1 implementation is no longer the product target. The runnable source tree has been cleaned down to a pre-approval Gate A review viewer.

Do not claim the game is a complete Stage 1 while this Art Lock goal is active.

## Implemented This Cycle

- Added `npm run art:refs` to validate all A-H reference Markdown/PNG files and write `art/reference-audit.json`.
- Added `npm run art:process` to generate deterministic Gate A style studies and a 960x540 representative composite.
- Added `npm run art:contact-sheets` to validate recovered candidate sheets.
- Added `npm run art:gate-status` to validate `art/approvals/GATE_A_REQUEST.md` and `art/approvals/GATE_A_STATUS.json`.
- Added `npm run art:review-report` to assemble Gate A approval evidence.
- Added `npm run art:all` for the current Gate A package.
- Added `npm run art:gate-a-smoke` to boot the Gate A review viewer in Playwright, assert the QA bridge, and capture `art/reviews/gate-a/gate-a-viewer-960x540.png`.
- Added placeholder final art scripts that fail before Gate A approval instead of silently passing incomplete validators.
- Removed legacy Stage 1 scenes, data, entities, systems, QA scripts, tests, and old `artifacts/qa` evidence.
- Updated GitHub Pages workflow to run `typecheck`, `test`, `art:all`, and `build` instead of old Stage 1 QA.
- Rewrote README/AGENTS/PLAN for Art Lock scope.

## Commands Verified

```text
npm.cmd run art:refs -> PASS
npm.cmd run art:process -> PASS
npm.cmd run art:contact-sheets -> PASS
npm.cmd run art:gate-status -> PASS
npm.cmd run art:gate-a-smoke -> PASS
npm.cmd run art:all -> PASS
npm.cmd run typecheck -> PASS
npm.cmd run test -> PASS
npm.cmd run build -> PASS
```

Final production validator commands are intentionally not passable yet.

## Gate Status

- Gate A: pending explicit human approval.
- Gate B: not started.

## Next Work After Gate A Approval

1. Build final asset-processing and atlas scripts.
2. Implement final TitleScene and ArtLabScene with generated/processed runtime assets, not Phaser primitive programmer art.
3. Implement final manifests and validators.
4. Capture deterministic browser screenshots.
5. Perform at least three complete revision rounds with independent scorecards.
6. Request Gate B approval only after every final command passes.

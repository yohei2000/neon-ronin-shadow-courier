# Stage1 Acceptance Report

Generated: 2026-07-07T00:21:46.100Z

## Command Results

- PASS npm run art:validate-freeze
- PASS npm run typecheck
- PASS npm run test
- PASS npm run build
- PASS npm run qa:stage1
- PASS npm run qa:assets-stage1
- PASS npm run e2e
- PASS npm run qa:screenshots-stage1

## Acceptance

- PASS Gate B v2 art used
- PASS no old v1 final runtime art
- PASS title flow works
- PASS Stage1 starts
- PASS player movement works
- PASS wall kick works
- PASS slash works
- PASS checkpoints work
- PASS enemies work
- PASS Lantern Warden works
- PASS Moon Gate clear works
- PASS StageClear works
- PASS mobile controls work
- PASS save works
- PASS E2E keyboard clear passes
- PASS console report clean
- PASS typecheck passes
- PASS tests pass
- PASS build passes
- PASS qa:stage1 passes
- PASS qa:assets-stage1 passes
- PASS qa:screenshots-stage1 passes

## E2E Report

- Playwright status: PASS
- Console report: PASS
- Screenshots present: PASS

## Scope Notes

- Stage 1 only: no Stage 2+, world map, final boss, player dash/projectile, charged slash, or ultimate systems.
- Runtime art path: src/assets/approved-art, traced through src/data/approvedArtManifest.ts.
- Core art regeneration intentionally excluded after Gate B v2 freeze.

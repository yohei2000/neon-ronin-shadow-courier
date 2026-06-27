# Art Lock Freeze

Status: Gate B v2 assets are frozen and approved.

Approved at: `2026-06-27T08:52:45.3607339+09:00`

Approval record:

- `art/approvals/GATE_B_V2_STATUS.json`
- `art/approvals/GATE_B_V2_APPROVAL.md`

## Freeze Rules

- Do not regenerate core art.
- Do not run `npm.cmd run art:process` for normal Stage1 integration work.
- Do not use old Gate B v1 assets from `art/final/` as approved final art.
- Do not edit files under `src/assets/approved-art/` by hand.
- If an approved asset must change, create a new explicit art-change gate instead of silently replacing the frozen asset.

## Stable Production Asset Path

Runtime production assets are normalized under:

```text
src/assets/approved-art/
```

These files are byte-for-byte copies of:

```text
art/final-v2/assets/
```

The active runtime loader must use `src/data/approvedArtManifest.ts` and `src/data/artAssets.ts`, not direct `new URL('../../art/final-v2/assets/...')` imports.

## Stage1 Runtime Contract

`src/data/approvedArtManifest.ts` is the Stage1 runtime asset contract. Every entry must:

- be marked `stage1Runtime: true`;
- load from `src/assets/approved-art/<asset>.png`;
- retain `approvedSourcePath` under `art/final-v2/assets/`;
- retain `lineagePath` under either `art/source/` or `art/final-v2/`;
- remain present in `art/asset-manifest.json`.

## Verification

Use this command for freeze verification:

```bash
npm.cmd run art:validate-freeze
```

The validator checks:

- production copies exist;
- production copies match `art/final-v2/assets/` byte-for-byte;
- runtime code no longer imports directly from `art/final-v2/assets/`;
- every approved Stage1 runtime asset maps back to `art/source/` or `art/final-v2/`.

Full non-regenerating CI verification also runs:

```bash
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run art:validate-freeze
npm.cmd run art:validate-generated
npm.cmd run art:validate-assets
npm.cmd run art:audit
```

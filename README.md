# Neon Ronin: Shadow Courier - Stage 1

This repository contains the playable Stage 1 vertical slice, `Neon Alley: First Delivery`, built on the frozen Gate B v2 art assets.

Gate B v1 has been rejected as structurally complete but visually below product level. Gate B v2 replaces the final art path with native image-generated source assets while preserving the useful QA infrastructure.

## References

Visual authority:

```text
art/references/neon_ronin_art_refs_impl_ready/
```

The A-H Markdown/PNG files define ink treatment, rainy lighting, sign density, player identity, seven-layer parallax, UI/mobile controls, slash VFX, and enemy telegraphs. They are specification sheets only and are not loaded into the runtime.

## Gate Status

- Gate A: approved via `Approve Gate A` on 2026-06-26.
- Gate B v1: rejected.
- Gate B v2: approved by explicit human input on 2026-06-27.

## Runtime

- Default route: title screen with `START STAGE 1`, controls, settings, credits/about, and Art Lab access.
- Stage flow: `TitleScene -> Stage1Scene -> StageClearScene`.
- Art Lab route: `?scene=artlab&state=neutral`
- Mobile controls review: `?scene=artlab&state=mobile-controls`
- Approved production assets: `src/assets/approved-art/`
- Approved runtime manifest: `src/data/approvedArtManifest.ts`

Stage 1 includes 10 named sections, checkpoints, exactly 3 hidden scrolls, 24 seal pickups, health/energy pickups, hazards, Ink Crawler and Kite Wraith encounters, a Lantern Warden miniboss, Moon Gate clear, settings, save data, pause, retry checkpoint, and mobile virtual controls.

Art Lab runtime states remain available for visual review: `busy`, `player-motion`, `player-contrast`, `player-scale`, `enemy`, `kite-wraith`, `warden-telegraph`, `slash`, `parallax`, `sign-density`, `ui-desktop`, `ui-mobile`, `lighting-moonlight`, `lighting-neon`, `lighting-warm`, `high-contrast`, `reduced-fx`, and `grayscale`.

## Commands

Use `npm.cmd` on Windows PowerShell.

```bash
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run qa:stage1
npm.cmd run qa:assets-stage1
npm.cmd run e2e
npm.cmd run qa:screenshots-stage1
npm.cmd run qa:all-stage1
npm.cmd run art:refs
npm.cmd run art:generate
npm.cmd run art:process
npm.cmd run art:atlas
npm.cmd run art:contact-sheets
npm.cmd run art:validate-assets
npm.cmd run art:validate-freeze
npm.cmd run art:validate-sign-density
npm.cmd run art:validate-animations
npm.cmd run art:validate-vfx
npm.cmd run art:validate-telegraphs
npm.cmd run art:validate-generated
npm.cmd run art:screenshots
npm.cmd run art:review-report
npm.cmd run art:audit
npm.cmd run art:all
```

`art:generate` validates native image-generation evidence. The actual native `image_gen` calls were performed through Codex and preserved under `art/generated/`.

After Gate B v2 freeze, do not regenerate core art for normal Stage1 work. Use `art:validate-freeze` to confirm `src/assets/approved-art/` remains byte-identical to `art/final-v2/assets/` and that every Stage1 runtime asset maps back to `art/source/` or `art/final-v2/`.

## Key Review Files

- `art/approvals/GATE_B_V1_REJECTION.md`
- `art/approvals/GATE_B_V2_REQUEST.md`
- `art/approvals/GATE_B_V2_SCREENSHOT_LINKS.md`
- `art/approvals/GATE_B_V2_HUMAN_CHECKLIST.md`
- `ART_LOCK_FREEZE.md`
- `artifacts/stage1/stage1-acceptance-report.md`
- `artifacts/stage1/e2e-report.json`
- `artifacts/stage1/console-report.json`
- `art/generated/GENERATION_LOG.md`
- `art/final-v2/title-desktop.png`
- `art/final-v2/title-mobile.png`
- `art/final-v2/artlab-busy.png`
- `art/final-v2/player-animation-contact-sheet.png`
- `art/final-v2/enemy-contact-sheet.png`
- `art/final-v2/lantern-warden-telegraph-contact-sheet.png`
- `art/final-v2/ui-mobile-390x844.png`
- `art/reviews/gate-b-v2/final-scorecard.md`

## Asset Ownership

Gate B v2 runtime assets under `art/final-v2/assets/` are project-owned outputs processed from native Codex `image_gen` results stored under `art/generated/` and selected/refined source files under `art/source/`.

Frozen production copies live under `src/assets/approved-art/` and are loaded through `src/data/approvedArtManifest.ts`.

The reference package is user-provided specification material and is not runtime art.

## Known Limitations

- Scope is intentionally Stage 1 only. Stage 2+, world map, final boss, dash, projectile, charged slash, and ultimate systems are not implemented.
- Lantern Warden is a Stage 1 miniboss, not the campaign final boss.
- Core art is frozen; future art changes require a new explicit art-change gate.

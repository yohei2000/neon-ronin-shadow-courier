# Neon Ronin: Shadow Courier - Gate B v2 Art Lock

This repository is an Art Lock build, not a complete Stage 1 campaign.

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

- Default route: image-generated Gate B v2 title screen.
- Art Lab route: `?scene=artlab&state=neutral`
- Mobile controls review: `?scene=artlab&state=mobile-controls`

Runtime states include `busy`, `player-motion`, `player-contrast`, `player-scale`, `enemy`, `kite-wraith`, `warden-telegraph`, `slash`, `parallax`, `sign-density`, `ui-desktop`, `ui-mobile`, `lighting-moonlight`, `lighting-neon`, `lighting-warm`, `high-contrast`, `reduced-fx`, and `grayscale`.

## Commands

Use `npm.cmd` on Windows PowerShell.

```bash
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run art:refs
npm.cmd run art:generate
npm.cmd run art:process
npm.cmd run art:atlas
npm.cmd run art:contact-sheets
npm.cmd run art:validate-assets
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

## Key Review Files

- `art/approvals/GATE_B_V1_REJECTION.md`
- `art/approvals/GATE_B_V2_REQUEST.md`
- `art/approvals/GATE_B_V2_SCREENSHOT_LINKS.md`
- `art/approvals/GATE_B_V2_HUMAN_CHECKLIST.md`
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

The reference package is user-provided specification material and is not runtime art.

## Known Limitations

- This remains an Art Lock package, not the five-stage game.
- Some generated sprite sheets still need future alpha/cutout cleanup before Stage 1 gameplay integration.
- Stage 1 integration should use the approved Gate B v2 visual system.

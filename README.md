# Neon Ronin: Shadow Courier - Art Lock Build

This repository is governed by `ART_LOCK_GOAL.md`.

It is not a complete Stage 1 campaign. The current deliverable is a reference-driven Art Lock build: a production-style title screen, a deterministic Art Lab review scene, final visual asset kits, manifests, validators, screenshots, three revision rounds, scorecards, and explicit human approval gates.

## References

The visual authority is:

```text
art/references/neon_ronin_art_refs_impl_ready/
```

The A-H PNG/Markdown files define ink treatment, rainy lighting, sign density, player identity, seven-layer parallax, UI/mobile controls, slash VFX, and enemy telegraphs. These sheets are specifications only. They are not loaded or pasted into the runtime.

## Gate Status

- Gate A: approved via the exact phrase `Approve Gate A` on 2026-06-26.
- Gate B: pending explicit human approval.

Gate B request:

```text
art/approvals/GATE_B_REQUEST.md
```

To approve the final Art Lock after review, reply with exactly `Approve Gate B`.

## Runtime

- Default route: final animated title screen.
- Art Lab route: `?scene=artlab&state=neutral`
- Deterministic states include `busy`, `player-motion`, `player-contrast`, `player-scale`, `enemy`, `kite-wraith`, `warden-telegraph`, `slash`, `parallax`, `sign-density`, `ui-desktop`, `ui-mobile`, `lighting-moonlight`, `lighting-neon`, `lighting-warm`, `high-contrast`, `reduced-fx`, and `grayscale`.

## Commands

Use `npm.cmd` on Windows PowerShell.

```bash
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run art:refs
npm.cmd run art:process
npm.cmd run art:atlas
npm.cmd run art:contact-sheets
npm.cmd run art:validate-assets
npm.cmd run art:validate-sign-density
npm.cmd run art:validate-animations
npm.cmd run art:validate-vfx
npm.cmd run art:validate-telegraphs
npm.cmd run art:screenshots
npm.cmd run art:review-report
npm.cmd run art:all
```

`art:all` regenerates final art assets, builds atlas/contact-sheet reports, captures screenshots/revision rounds, runs validators, and assembles the Gate B package.

## Key Review Files

- `art/final/title-desktop.png`
- `art/final/title-mobile.png`
- `art/final/artlab-neutral.png`
- `art/final/artlab-busy.png`
- `art/final/player-animation-contact-sheet.png`
- `art/final/enemy-contact-sheet.png`
- `art/final/lantern-warden-telegraph-contact-sheet.png`
- `art/final/ui-desktop-contact-sheet.png`
- `art/final/ui-mobile-390x844.png`
- `art/final/reference-g-slash-timeline.png`
- `art/reviews/final-scorecard.md`

## Asset Ownership

Runtime assets under `art/final/assets/` are project-owned PNGs generated from local authored SVG source through Playwright Chromium. The reference package is user-provided visual specification material and is not used as runtime art.

## Known Limitations

- This is an Art Lock build, not the five-stage game.
- Gate B is not approved yet.
- Stage 1 integration should start only after Gate B approval and should use this locked visual system without changing style.

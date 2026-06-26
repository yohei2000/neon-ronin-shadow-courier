# Reference Compliance Matrix

Status: Gate B package ready for explicit human review. Gate B is not approved yet.

| Ref | Requirement | Implementation Files | Runtime State / Screenshot | Automated Check | Status |
|---|---|---|---|---|---|
| A | Ink outlines, dry-brush edges, paper texture, brush kit | `art/final/assets/brush-kit.png`, `art/final/reference-a-brush-contact-sheet.png`, `art/final/reference-a-game-scale-test.png` | `art/final/artlab-neutral.png`, `art/final/artlab-busy.png` | `art:validate-assets` | Implemented |
| B | Three rainy-night lighting presets, rain/fog/reflections, reduced-FX | `art/final/assets/lighting-*.png`, `art/final/reference-b-lighting-presets.png`, `art/final/reduced-fx-comparison.png` | `art/final/lighting-moonlight-lantern-gold.png`, `art/final/lighting-cyan-magenta-neon.png`, `art/final/lighting-warm-cool-alley.png`, `art/final/reduced-fx.png` | `art:screenshots`, `art:validate-assets` | Implemented |
| C | Signage density and modular sign kit | `art/final/assets/sign-atlas.png`, `art/sign-density-scenes.json`, `art/final/reference-c-sign-density.png` | `art/final/sign-density-annotated.png` | `art:validate-sign-density` | Implemented |
| D | Shadow Courier identity and complete animation set | `art/final/assets/player-master.png`, `art/final/assets/player-spritesheet.png`, `art/animation-manifest.json` | `art/final/player-animation-contact-sheet.png`, `art/final/player-five-core-poses.png`, `art/final/player-scale.png`, `art/final/player-grayscale-contrast.png` | `art:validate-animations`, `art:validate-assets` | Implemented |
| E | Seven-layer parallax composition | `art/final/assets/layer-*.png`, `art/final/reference-e-seven-layer-parallax.png` | `art/final/seven-layer-parallax-breakdown.png` | `art:screenshots`, `art:validate-assets` | Implemented |
| F | HUD/menu/mobile-control material families and touch presentation | `art/final/assets/ui-kit.png`, `art/final/ui-desktop-contact-sheet.png`, `art/final/ui-mobile-390x844.png`, `art/final/contrast-report.json` | `art/final/ui-desktop.png`, `art/final/ui-mobile.png`, `art/final/mobile-controls.png` | `art:validate-assets` | Implemented |
| G | Four-phase slash with magenta core, ink edge, cyan sparks, bounded particles | `art/final/assets/slash-flipbook.png`, `art/vfx-manifest.json`, `art/final/reference-g-slash-timeline.png` | `art/final/slash-four-phases.png`, `art/final/slash-dark.png`, `art/final/slash-bright.png` | `art:validate-vfx` | Implemented |
| H | Six-phase heavy and fast enemy telegraphs with recover windows | `art/final/assets/telegraph-flipbook.png`, `art/telegraph-manifest.json`, `art/final/lantern-warden-telegraph-contact-sheet.png` | `art/final/telegraph-standard.png`, `art/final/telegraph-fast.png`, `art/final/lantern-warden-states.png` | `art:validate-telegraphs` | Implemented |

## Gate Evidence

- Gate A approval status: `art/approvals/GATE_A_STATUS.json`
- Gate B request: `art/approvals/GATE_B_REQUEST.md`
- Gate B package report: `art/reviews/gate-b/gate-b-package-report.md`
- Final scorecard: `art/reviews/final-scorecard.md`
- Screenshot matrix: `art/final/screenshot-report.json`
- Console report: `art/final/console-report.json`
- Revision rounds: `art/reviews/round-01/`, `art/reviews/round-02/`, `art/reviews/round-03/`

## Remaining Gate

Gate B requires explicit human approval with `Approve Gate B`. Until then, this is a completed review package, not an approved final Art Lock.

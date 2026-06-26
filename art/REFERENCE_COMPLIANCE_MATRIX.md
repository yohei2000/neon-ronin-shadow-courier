# Reference Compliance Matrix

Status: Gate B v1 rejected. Gate B v2 image-generated package is in progress/pending explicit human approval.

| Ref | Requirement | Gate B v2 Implementation Files | Runtime State / Screenshot | Automated Check | Status |
|---|---|---|---|---|---|
| A | Ink outlines, dry-brush edges, paper texture, brush impact language | `art/generated/impact-vfx/raw/impact-pickup-vfx-raw-001.png`, `art/final-v2/assets/brush-kit.png`, `art/final-v2/reference-a-brush-contact-sheet.png` | `art/final-v2/artlab-neutral.png`, `art/final-v2/artlab-busy.png` | `art:validate-generated`, `art:validate-assets` | Implemented for Gate B v2 review |
| B | Rain, fog, wet reflections, warm/cool lighting presets | `art/generated/environment-key/raw/environment-key-candidate-board-raw-001.png`, `art/generated/title/raw/title-composition-raw-001.png`, `art/final-v2/assets/lighting-*.png` | `art/final-v2/lighting-moonlight-lantern-gold.png`, `art/final-v2/lighting-cyan-magenta-neon.png`, `art/final-v2/lighting-warm-cool-alley.png` | `art:screenshots`, `art:validate-assets` | Implemented for Gate B v2 review |
| C | Sign-density discipline, one hero landmark, protected readability zone | `art/generated/environment-key/environment-key-candidates.png`, `art/generated/environment-kit/raw/environment-kit-raw-001.png`, `art/sign-density-scenes.json` | `art/final-v2/sign-density-annotated.png` | `art:validate-sign-density` | Implemented for Gate B v2 review |
| D | Shadow Courier identity, magenta scarf, cyan eye, satchel, scale readability, player-only cyan/magenta accent group | `art/generated/player/player-candidates.png`, `art/generated/player/raw/player-master-refinement-pass-02.png`, `art/source/player/player-master.png`, `art/final-v2/assets/player-spritesheet.png` | `art/final-v2/player-animation-contact-sheet.png`, `art/final-v2/player-scale.png`, `art/final-v2/player-grayscale-contrast.png` | `art:validate-generated`, `art:validate-animations` | Implemented for Gate B v2 review |
| E | Seven distinct parallax roles | `art/generated/parallax/raw/parallax-layer-sheet-raw-001.png`, `art/source/environment/layer-*.png`, `art/final-v2/assets/layer-*.png` | `art/final-v2/seven-layer-parallax-breakdown.png` | `art:screenshots`, `art:validate-assets` | Implemented for Gate B v2 review |
| F | HUD/menu/mobile-control material families | `art/generated/ui/raw/ui-candidate-board-raw-001.png`, `art/source/ui/ui-kit.png`, `art/source/ui/mobile-controls-kit.png`, `art/final-v2/assets/ui-kit.png`, `art/final-v2/assets/mobile-controls-kit.png` | `art/final-v2/ui-desktop.png`, `art/final-v2/ui-mobile.png`, `art/final-v2/mobile-controls.png` | `art:validate-generated`, `art:validate-assets` | Implemented for Gate B v2 review |
| G | Four-phase slash VFX | `art/generated/vfx-slash/raw/slash-candidate-board-raw-001.png`, `art/source/vfx/slash-flipbook.png`, `art/vfx-manifest.json` | `art/final-v2/reference-g-slash-timeline.png`, `art/final-v2/slash-four-phases.png`, `art/final-v2/slash-dark.png`, `art/final-v2/slash-bright.png` | `art:validate-vfx` | Implemented for Gate B v2 review |
| H | Six-phase enemy telegraph language, recovery windows, enemy amber/vermilion color group separated from player cyan/magenta | `art/generated/telegraph/raw/telegraph-candidate-board-raw-001.png`, `art/source/vfx/telegraph-flipbook.png`, `art/telegraph-manifest.json` | `art/final-v2/telegraph-standard.png`, `art/final-v2/telegraph-fast.png`, `art/final-v2/lantern-warden-telegraph-contact-sheet.png` | `art:validate-telegraphs`, `art:validate-assets` | Implemented for Gate B v2 review |

## Gate Evidence

- Gate B v1 rejection: `art/approvals/GATE_B_V1_REJECTION.md`
- Gate B v2 status: `art/approvals/GATE_B_V2_STATUS.json`
- Image generation capability: `art/IMAGE_GENERATION_CAPABILITY_REPORT.md`
- Generation log: `art/generated/GENERATION_LOG.md`
- Gate B v2 request: `art/approvals/GATE_B_V2_REQUEST.md`
- Gate B v2 screenshot links: `art/approvals/GATE_B_V2_SCREENSHOT_LINKS.md`
- Gate B v2 package report: `art/reviews/gate-b-v2/gate-b-v2-package-report.md`
- Final v2 scorecard: `art/reviews/gate-b-v2/final-scorecard.md`
- Screenshot matrix: `art/final-v2/screenshot-report.json`
- Console report: `art/final-v2/console-report.json`
- Revision rounds: `art/reviews/gate-b-v2/round-01/`, `round-02/`, `round-03/`

## Remaining Gate

Gate B v2 requires explicit human approval with `Approve Gate B v2`. Until then, this is a review package, not an approved final Art Lock.

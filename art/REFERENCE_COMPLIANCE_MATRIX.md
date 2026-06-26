# Reference Compliance Matrix

Status: Gate A draft. Final rows must be completed with runtime screenshots, validators, and review rounds after Gate A approval.

| Ref | Requirement | Current Implementation / File | Runtime State | Automated Check | Review Evidence | Status |
|---|---|---|---|---|---|---|
| A | Thick ink outlines, dry-brush edges, paper texture | `art/shape-language.png`, `art/value-study.png` | Not runtime final | `npm run art:process` generates evidence | Gate A review | Draft |
| A | Brush masks/splatter/borders/tile overlays final kit | Pending production asset kit | Pending | `art:validate-assets` intentionally unavailable before Gate A | Pending | Not started |
| B | Three lighting presets | `art/art-style.json` lighting preset tokens | Pending ArtLab | Pending final `art:screenshots` | `art/environment-material-study.png` | Draft |
| B | Rain, fog, wet reflections, reduced-FX comparison | Gate A composite shows direction | Pending ArtLab | Pending final screenshots | `art/representative-composite-960x540.png` | Draft |
| C | Hero/medium/small sign density | Candidate and composite direction | Pending ArtLab sign-density station | Pending final `art:validate-sign-density` | `art/reviews/candidates/environment.png` | Draft |
| C | Modular sign/lantern/cable/window kit | Pending production kit | Pending | Pending atlas/manifest validation | Pending | Not started |
| D | Player magenta scarf, cyan eye/satchel, scale readability | `art/player-silhouette-study.png`, `art/value-study.png` | Pending ArtLab player stations | Pending final animation validation | `art/reviews/candidates/player.png` | Draft |
| D | Full player animation set | Pending production sprites/manifest | Pending | Pending `art:validate-animations` | Pending | Not started |
| E | Seven parallax layers and factors | `art/art-style.json`, `art/environment-material-study.png` | Pending ArtLab parallax station | Pending final screenshot matrix | `art/reviews/candidates/environment.png` | Draft |
| F | HUD/menu/mobile-control material families | `art/ui-style-study.png`, `art/palette.json` | Pending ArtLab UI station | Pending contrast report | `art/reviews/candidates/ui.png` | Draft |
| F | Minimum touch targets and states | Pending final UI kit | Pending | Pending final browser layout checks | Pending | Not started |
| G | Four-phase slash timing and layers | `art/vfx-style-study.png` | Pending ArtLab VFX station | Pending `art:validate-vfx` | `art/representative-composite-960x540.png` | Draft |
| H | Six-phase telegraph sequence | `art/telegraph-style-study.png` | Pending ArtLab enemy stations | Pending `art:validate-telegraphs` | Enemy candidate sheets | Draft |
| H | Standard/heavy and fast/mobile variants | Draft visual study only | Pending | Pending final timing manifests | `art/telegraph-style-study.png` | Draft |

## Gate Evidence

- Gate A package report: `art/reviews/gate-a/gate-a-package-report.md`
- Reference audit: `art/reference-audit.json`
- Gate A approval request: `art/approvals/GATE_A_REQUEST.md`
- Gate A approval status: `art/approvals/GATE_A_STATUS.json`
- Gate status validator report: `art/reviews/gate-a/gate-status-report.json`
- Candidate contact-sheet audit: `art/reviews/gate-a/candidate-contact-sheet-report.json`
- Representative composite source: `art/reviews/gate-a/representative-composite-source.png`
- Representative composite 960x540: `art/reviews/gate-a/representative-composite-960x540.png`

## Known Non-Compliance Before Gate A Approval

- Production runtime asset kits are not implemented.
- Final ArtLabScene and final title screen are not implemented.
- Final validators are intentionally not passable yet.
- Gate A and Gate B are not approved.

These are blockers for final completion, not accepted deviations.

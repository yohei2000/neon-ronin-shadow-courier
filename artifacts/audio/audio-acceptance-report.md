# Neon Ronin Curated Audio Acceptance

Date: 2026-07-15 (JST)
Status: **PASS**

## Accepted scope

- Menu, Stage 1, Stage 2, pause/game-over, and stage-clear audio profiles.
- Action, movement, hit, defeat, pickup, checkpoint, boss, UI, Kage-Ito, and Relay Keeper feedback.
- Eleven source families explicitly published as CC0 1.0, with creator/source/license records and pinned download hashes.
- Offline deterministic rendering from committed curated source masters.

## Source and asset result

- 84/84 curated PCM masters match the integrity report and map to exactly one declared CC0 source family.
- The current runtime mix uses 81 masters and retains three audited alternates.
- 52/52 required runtime WAV files are present and byte-unique.
- All runtime files are 48 kHz, 16-bit integer PCM; validator issue count 0.
- Peak range: 0.48637349–0.93499756; RMS range: 0.07920088–0.23713740.
- Maximum absolute DC offset: 0.00006879; clipped full-scale samples: 0.
- Six music files contain zero isolated internal discontinuities.
- Ten loops: maximum seam value delta 0.00003052; maximum seam slope delta 0.00003065.
- Stage 1/2 base-combat correlations: 0.99751 / 0.99463; best bucket lag: 0 / 0.
- All stereo files pass low-band correlation and mono-fold safety checks.

Machine-readable evidence:

- `audio/curated-audio-sources.json`
- `artifacts/audio/curated-source-preparation-report.json`
- `artifacts/audio/audio-validation-report.json`

## Runtime result

- Persistent menu/stage/clear profiles with sample-aligned base-combat crossfades.
- Saved master/music/SFX controls, WebAudio limiter, priority voice cap, semantic variation, spatial attenuation/pan, and music ducking.
- Stereo-linked density mastering and per-role integrated RMS targets keep sourced material audible without transient-only peak normalization.
- Pause/game-over state, retry cleanup, movement loops, soft/heavy landings, spin hit, Kage-Ito, Relay Keeper, and hit/defeat separation remain wired to successful gameplay state changes.
- The browser audio-director scenario confirmed menu, Stage 1, and Stage 2 profiles, unlock recovery, limiter creation, pause mix, duck recovery, one-shot playback, and Kage-Ito playback.

## Final verification

| Command | Result |
|---|---|
| `npm.cmd run audio:generate` | PASS — 52 runtime assets from 81 curated masters |
| `npm.cmd run qa:audio` | PASS — 84 source masters + 52 runtime files, 0 missing, 0 duplicate, 0 issues |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run test` | PASS — 3 files, 36 tests |
| `npm.cmd run build` | PASS |
| `npm.cmd run qa:stage1` | PASS — 26 checks |
| `npm.cmd run qa:assets-stage1` | PASS — 21 checks |
| `npm.cmd run e2e` | PASS — 5/5 scenarios |

Final browser E2E report generated at `2026-07-15T00:17:09.277Z`:

- `audio-director` — 22,691 ms
- `title-flow` — 20,747 ms
- `stage1-keyboard-clear` — 165,211 ms
- `mobile-controls` — 18,249 ms
- `checkpoint-retry` — 95,798 ms

# Stage 1 Playtest Tuning Note

Generated: 2026-06-25T18:28:24.235Z
Status: PASS

## Method

Evidence-backed manual review of current QA screenshots plus automated route, level, production-dist, and save reports. This is not a substitute for a physical-device human playtest.

## Evidence

- `artifacts/qa/e2e-report.json`: title/settings flow, pause retry/restart, high-contrast pixels, keyboard clear, route health, and mobile input probes.
- `artifacts/qa/level-report.json`: stage size, checkpoints, optional routes, scrolls, hazards, enemies, and pickup counts.
- `artifacts/qa/dist-report.json`: production `dist/` boot from emitted assets.
- `artifacts/qa/save-report.json`: corrupted-save recovery, settings persistence, and Stage Clear result persistence.
- `artifacts/qa/stage-start.png`: reviewed.
- `artifacts/qa/combat-encounter.png`: reviewed.
- `artifacts/qa/miniboss.png`: reviewed.
- `artifacts/qa/mobile-controls-390x844.png`: reviewed.
- `artifacts/qa/stage-clear.png`: reviewed.

## Findings

- The automated clear route reaches Stage Clear in 26s with 5 damage, leaving 3 damage before the route-health cap.
- The route collects 10/22 seals (45%) without pursuing optional scroll routes, so critical-path pickup density is adequate for a first clear.
- Desktop screenshots show readable onboarding, first-combat spacing, Lantern Warden objective text, and Stage Clear results.
- Mobile controls are visible, expose 7 QA-tracked buttons, keep jump/attack separated by 21.9px, and pass input probes; HUD/control density on a 390x844 screenshot should still be checked on a physical phone before adding inputs or denser UI.
- Save QA passes corrupted-save recovery, settings reload persistence, and Stage Clear persistence, so tuning runs are not losing result data.

## Tuning Decisions

- Keep current enemy spacing, hazard damage, and Lantern Warden HP for this checkpoint; route damage and clear time remain inside thresholds.
- Do not tune optional scroll placement from the optimized clear route alone because the route intentionally skips optional exploration.
- Treat mobile HUD scale and optional-scroll discoverability as the next real-device human playtest questions.

## Next Manual Check

- Run a short physical-phone playtest focused on HUD scale, jump/attack/pause reach, boss readability, and optional scroll discoverability.
- If playtest tuning changes damage, pickup placement, boss HP, or route timing, rerun `npm run qa:all` and update route-health thresholds only with evidence.

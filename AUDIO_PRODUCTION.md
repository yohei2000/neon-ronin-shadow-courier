# Neon Ronin Audio Production

## Product direction

Neon Ronin uses a heavy, grounded neon-wafuu sound: body, floor contact, low drums, cloth, wood, and steel carry the action while bright electronic detail stays restrained. The runtime audio is built from carefully selected CC0 recordings, sound libraries, ambience, and music rather than placeholder synthesis.

The approved scope covers the existing menu, Stage 1, Stage 2, pause/game-over, and clear flows. It does not authorize additional campaign or gameplay systems.

## Source and license policy

- Every upstream source in this release is explicitly marked CC0 1.0 on its source page.
- `audio/THIRD_PARTY_AUDIO.md` records creators, source pages, purpose, and license links.
- `audio/curated-audio-sources.json` pins upstream download URLs and SHA-256 values.
- `artifacts/audio/curated-source-preparation-report.json` pins the per-file upstream and curated-master hashes.
- The committed 48 kHz/16-bit PCM masters under `audio/curated-sources/` make normal regeneration offline and deterministic.

The source catalog contains 84 masters. The current mix uses 81; `rpg-coins-1.wav`, `ui-select-6.wav`, and `water-pour.wav` are retained as audited alternates for the same approved source families.

## Runtime architecture

- `scripts/build-curated-audio.mjs` turns the curated masters into all 52 runtime WAV assets.
- `src/data/audioAssets.ts` owns keys, URLs, mix metadata, variation groups, and profiles.
- `src/systems/Stage1Audio.ts` exports the `GameAudio` director and the legacy-compatible `Stage1Audio` alias.
- `src/scenes/PreloadScene.ts` registers every rendered runtime asset.
- Gameplay scenes emit semantic successful-action events and pass live movement/boss state to the director.

The builder layers selected foley and effects, trims, filters, rate-shifts, pans, creates seamless loops, and applies stereo-linked density control. Integrated RMS targets keep attacks, ambience, UI, music, and boss cues consistently audible without peak-normalizing quiet material into transient spikes. Stage 1 and Stage 2 base/combat stems remain sample-aligned.

The director provides separate master, music, and SFX gain; a WebAudio output limiter; persistent profile transitions; synchronized base/combat stems; music ducking; listener-relative pan and attenuation; non-repeating variants; minimum gaps; priority-based voice limiting; and cleanup on scene shutdown. Mix fades and timed ducking use a monotonic wall clock, so pause states and low-frame-rate moments cannot freeze an envelope.

## Profiles

| Profile | Music | Ambience | Dynamic behavior |
|---|---|---|---|
| Menu | cyberpunk title loop | — | Persists across title, controls, and settings |
| Stage 1 | aligned base + combat stems | rain and neon-city bed | Combat layer rises near Lantern Warden |
| Stage 2 | aligned base + combat stems | industrial drain and machine bed | Combat layer rises near Relay Keeper |
| Clear | victory-result theme | — | Crossfades from the active stage profile |

## Gameplay feedback hierarchy

1. Player hurt, boss defeat, stage clear, and game over have the highest voice priority and strongest music duck.
2. Successful hits, heavy landings, checkpoints, and Kage-Ito impacts sit above attack whooshes.
3. Jumps, wall kicks, pickups, and UI confirmation remain clear without masking combat.
4. Footsteps and movement loops are lowest priority and yield first under voice pressure.

Attack sounds communicate the input; hit sounds communicate contact; defeat sounds communicate state change. Non-lethal hits and defeats do not reuse the same semantic event.

## Regeneration and quality gate

```text
npm.cmd run audio:generate
npm.cmd run audio:validate
```

`audio:generate` requires no network access. `audio:validate` first verifies that all 84 curated masters match the pinned source-integrity report, map to exactly one declared CC0 pack, and remain 48 kHz/16-bit PCM. It then validates all 52 runtime files for required coverage, byte uniqueness, format, duration, peak/RMS/DC/clipping, boundary clicks, isolated music discontinuities, loop seams, stereo low-band mono compatibility, and aligned base/combat pairs.

Do not hand-edit runtime WAV bytes or weaken the validator. Change source selection, layering, mastering, or mix metadata in the deterministic pipeline; regenerate; then run the audio gate, typecheck, tests, build, and browser verification.

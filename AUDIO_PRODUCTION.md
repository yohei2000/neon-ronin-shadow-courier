# Neon Ronin Audio Production

## Product direction

Neon Ronin uses a heavy, grounded neon-wafuu sound: body, floor contact, low drums, cloth, wood, and steel carry the action while bright electronic detail stays restrained. Every runtime sound is generated in-repository from deterministic synthesis; no external samples or third-party audio licenses are required.

The approved audio scope covers the existing menu, Stage 1, Stage 2, and clear flows. It does not authorize additional campaign systems.

## Runtime architecture

- `scripts/generate-stage1-sfx.mjs` authors all 52 WAV assets at 48 kHz / 16-bit PCM.
- `src/data/audioAssets.ts` owns keys, URLs, mix metadata, variation groups, and profiles.
- `src/systems/Stage1Audio.ts` exports the `GameAudio` director and the legacy-compatible `Stage1Audio` alias.
- `src/scenes/PreloadScene.ts` registers every generated asset.
- Gameplay scenes emit semantic successful-action events and pass live movement/boss state to the director.

The director provides separate master, music, and SFX gain; a WebAudio output limiter; persistent profile transitions; synchronized base/combat stems; music ducking; listener-relative pan and attenuation; non-repeating variants; minimum gaps; priority-based voice limiting; and cleanup on scene shutdown. Mix fades and timed ducking use a monotonic wall clock, so pause states and low-frame-rate moments cannot freeze an envelope. Movement audio covers speed-scaled footsteps, soft/heavy landings, wall sliding, and updraft contact.

## Profiles

| Profile | Music | Ambience | Dynamic behavior |
|---|---|---|---|
| Menu | neon-wafuu title loop | — | Persists across title, controls, and settings |
| Stage 1 | base + combat stem | rain/neon alley | Combat stem rises near Lantern Warden |
| Stage 2 | base + combat stem | drain/signal environment | Combat stem rises near Relay Keeper |
| Clear | clear-result theme | — | Crossfades from the active stage profile |

Stage 1 and Stage 2 base/combat pairs are each 16 seconds and match exactly in sample rate, channel count, frame count, tempo, key, and performance grid.

## Gameplay feedback hierarchy

1. Player hurt, boss defeat, stage clear, and game over have the highest voice priority and strongest music duck.
2. Successful hits, heavy landings, checkpoints, and Kage-Ito impacts sit above attack whooshes.
3. Jumps, wall kicks, pickups, and UI confirmation remain clear without masking combat.
4. Footsteps and movement loops are lowest priority and yield first under voice pressure.

Attack sounds communicate the input; hit sounds communicate contact; defeat sounds communicate state change. Non-lethal hits and defeats must never reuse the same semantic event.

## Regeneration and quality gate

```text
npm.cmd run audio:generate
npm.cmd run audio:validate
```

`audio:validate` writes `artifacts/audio/audio-validation-report.json` and fails on missing or duplicate assets, non-48 kHz PCM, silence, out-of-range peak, DC offset, clipping, boundary clicks, isolated music discontinuities, broken loop seams, unsafe stereo low-band mono fold, invalid durations, or insufficiently aligned base/combat pairs.

The accepted 2026-07-11 generation contains 52 unique 48 kHz / 16-bit WAV files with zero clipped samples and zero isolated discontinuities across all six music files. Measured peak is 0.67998291–0.92001099, maximum absolute DC offset is 0.00000605, maximum loop-seam value delta is 0.00003052, and maximum loop-seam slope delta is 0.00585955. Validator pair correlations are 0.55072 for Stage 1 and 0.61718 for Stage 2. An independent 8x, 64-tap sinc audit measured a maximum true peak of -0.62791 dBTP, direct pair correlations of 0.900740 / 0.891553, and best alignment lag of zero samples for both stage pairs.

Do not hand-edit generated WAV bytes. Change the deterministic synthesis or mix metadata, regenerate, run the audio quality gate, then run typecheck, tests, build, and browser verification.

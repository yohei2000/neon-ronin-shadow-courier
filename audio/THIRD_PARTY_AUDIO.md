# Third-party audio

Neon Ronin's runtime audio is built from the CC0 sources below. CC0 attribution is not required, but the project keeps creator, source-page, download, and SHA-256 records for auditability and to avoid implying that any creator endorses the game.

| Source | Creator | Runtime use | License |
|---|---|---|---|
| [RPG Audio](https://kenney.nl/assets/rpg-audio) | Kenney | blade draw/slice, cloth, footsteps, coins, metal UI layers | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Impact Sounds](https://kenney.nl/assets/impact-sounds) | Kenney | concrete, punch, and metal impact layers | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Interface Sounds](https://kenney.nl/assets/interface-sounds) | Kenney | menu, confirmation, error, glass, and pickup layers | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds) | Kenney | forcefields, lasers, explosions, engines, updraft, Stage 2 effects | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Music Jingles](https://kenney.nl/assets/music-jingles) | Kenney | checkpoint, clear, defeat, and respawn accent layers | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Fantasy Sound Effects (Tinysized SFX)](https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx) | Vehicle (Jan Schupke) | sword clashes, whooshes, boots, coins, water, metal scrape | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [T & T Free Cyberpunk Pack 2](https://opengameart.org/content/t-t-free-cyberpunk-pack-2) | Alexander Ehlers | menu, Stage 1, and Stage 2 music | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Victory! Victory! Victory!](https://opengameart.org/content/victory-victory-victory) | Spring Spring | result-screen music | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Rain (loopable)](https://opengameart.org/content/rain-loopable) | Ylmir | Stage 1 rain bed | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Scifi City - Ambient Loop](https://opengameart.org/content/scifi-city-ambient-loop) | TinyWorlds | Stage 1 neon-city bed | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| [Factory ambiance](https://opengameart.org/content/factory-ambiance) | yd | Stage 2 industrial/drain bed | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

The exact upstream download URLs and archive/file hashes are pinned in `audio/curated-audio-sources.json`. The selected, resampled 48 kHz/16-bit PCM masters and their upstream per-file hashes are recorded in `artifacts/audio/curated-source-preparation-report.json`.

`scripts/build-curated-audio.mjs` layers, filters, trims, loops, pans, and masters those sources into the 52 runtime WAV files. It does not synthesize replacements or fetch from the network. `npm.cmd run audio:validate` verifies both source provenance integrity and the final runtime audio gate.

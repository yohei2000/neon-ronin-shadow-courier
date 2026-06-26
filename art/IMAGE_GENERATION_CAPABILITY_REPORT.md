# Image Generation Capability Report

Generated: 2026-06-26
Updated: 2026-06-27

## Route Used

- Route: native Codex `image_gen` tool via the `imagegen` skill.
- Tool/model name exposed: built-in `image_gen`; underlying model name is not exposed by the tool.
- `OPENAI_API_KEY` required: no for the native route.
- Final Gate B v2 route: text-to-image generation plus local asset extraction, processing, contact-sheet generation, browser screenshot capture, and automated validation.

## Capability Checks

| Capability | Status | Evidence |
| --- | --- | --- |
| Text-to-image | Works | Preserved raw generated boards under `art/generated/**/raw/`, including player, enemies, UI, VFX, title, environment, parallax, and impact VFX. |
| Image-to-image/edit | Not exposed for arbitrary local files in this session | No direct file-path image-edit API was exposed. Gate B v2 uses real text-to-image outputs, then local extraction/processing. |
| Transparent background | Limited | Native route does not expose a true transparent-background argument. Runtime sprites were extracted from generated opaque sheets where practical; remaining cutout risk is documented in reviews and scorecards. |
| Batch generation | Works by repeated native calls and multi-candidate boards | Candidate boards preserve the required candidate families and counts in `art/generated/GENERATION_LOG.json`. |
| Write generated images to `art/generated/` | Works | Generated outputs were recovered from `C:\Users\hitoa\.codex\generated_images\019efe9d-d65f-70d0-ba6a-be54dbdc5364` and copied into `art/generated/**/raw/`. |
| Iterative refinement | Works as successive generation passes | Player master refinement pass 01 and pass 02 are preserved under `art/generated/player/raw/`; additional title/environment/player-animation generations were used for final-v2 integration. |
| A-H visual references as inputs | Limited | Reference sheets were inspected and summarized into prompts. Direct local reference-image input to native `image_gen` was not exposed, and reference sheets are not loaded by runtime. |
| Source image consistency across frames | Limited but validated | Consistency was maintained through selected master direction, simplified prompts, source extraction, contact sheets, review rounds, and validators. |

## Limitations

- Native `image_gen` does not expose output path, seed, model ID, native transparency, or explicit batch metadata.
- Generated files must be recovered from the Codex generated-images folder and copied into the repository.
- If a generated image appears inline but no local file is recoverable, it cannot count as a project asset until saved into the workspace.
- Direct arbitrary local file edit parameters were not exposed in the native tool during this run.
- Some sprite and enemy sheets retain paper/card extraction artifacts. This is tracked as a remaining human-review risk, not hidden by validators.

## Blockers

- None for producing a Gate B v2 image-generated review package.
- Native true image-editing and native transparency remain unavailable; the accepted fallback for this goal is real image generation plus local extraction/processing, with the limitation documented for human review.

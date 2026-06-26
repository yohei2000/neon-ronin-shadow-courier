# Image Generation Capability Report

Generated: 2026-06-26

## Route Used

- Route: native Codex `image_gen` tool via the `imagegen` skill.
- Tool/model name exposed: built-in `image_gen`; underlying model name is not exposed by the tool.
- `OPENAI_API_KEY` required: no for the native route.

## Capability Checks

| Capability | Status | Evidence |
| --- | --- | --- |
| Text-to-image | Works | Generated `art/generated/player/raw/player-master-candidate-board-raw-001.png` from a prompt. |
| Image-to-image/edit | Pending validation | The skill supports editing visible images, but this run has not yet validated an image-edit/refinement output. |
| Transparent background | Chroma-key workflow available | Native route does not expose a true transparent-background argument; the skill supports flat chroma-key generation plus local alpha removal. |
| Batch generation | Works by repeated native calls or multi-candidate boards | First call produced a 12-candidate player board. |
| Write generated images to `art/generated/` | Works | Generated output was recovered from `C:\Users\hitoa\.codex\generated_images\019efe9d-d65f-70d0-ba6a-be54dbdc5364` and copied into `art/generated/player/raw/`. |
| Iterative refinement | Pending validation | Planned through native follow-up generations and image-visible refinement prompts. |
| A-H visual references as inputs | Limited | Reference sheets can be visually inspected and summarized into prompts. Direct file-path image input to native `image_gen` is not exposed. |
| Source image consistency across frames | Limited | Must be maintained through selected master reference prompts, simplified design, contact-sheet inspection, and validators. |

## Limitations

- Native `image_gen` does not expose output path, seed, model ID, native transparency, or explicit batch metadata.
- Generated files must be recovered from the Codex generated-images folder and copied into the repository.
- If a generated image appears inline but no local file is recoverable, it cannot count as a project asset until saved into the workspace.
- Direct arbitrary local file edit parameters are not exposed in the native tool.

## Blockers

- None for text-to-image candidate generation.
- Image-edit refinement must still be validated before final Gate B v2 completion.

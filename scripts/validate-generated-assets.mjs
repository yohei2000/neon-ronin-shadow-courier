import fs from 'node:fs/promises';
import path from 'node:path';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const finalDir = path.join(rootDir, 'art', 'final-v2');
const errors = [];
const checked = [];

async function requireFile(relative, options = {}) {
  try {
    const full = path.join(rootDir, relative);
    const stat = await fs.stat(full);
    if (stat.size === 0) errors.push(`${relative} is empty.`);
    const item = { file: relative, bytes: stat.size };
    if (relative.endsWith('.png')) {
      const info = await readPngInfo(full);
      Object.assign(item, info);
      if (info.width < (options.minWidth ?? 1) || info.height < (options.minHeight ?? 1)) {
        errors.push(`${relative} dimensions ${info.width}x${info.height} below required minimum.`);
      }
      if (info.bytes < (options.minBytes ?? 1500)) {
        errors.push(`${relative} is suspiciously small for generated art evidence.`);
      }
    }
    checked.push(item);
    return true;
  } catch (error) {
    errors.push(`${relative} missing or unreadable: ${error.message}`);
    return false;
  }
}

async function readJson(relative) {
  try {
    return JSON.parse(await fs.readFile(path.join(rootDir, relative), 'utf8'));
  } catch (error) {
    errors.push(`${relative} missing or invalid JSON: ${error.message}`);
    return null;
  }
}

const rawFamilies = [
  ['player', 12, 'art/generated/player/raw/player-master-candidate-board-raw-001.png'],
  ['player-refinement-1', 1, 'art/generated/player/raw/player-master-refinement-pass-01.png'],
  ['player-refinement-2', 1, 'art/generated/player/raw/player-master-refinement-pass-02.png'],
  ['player-animation', 9, 'art/generated/player-animation/raw/player-animation-sheet-raw-001.png'],
  ['ink-crawler', 8, 'art/generated/ink-crawler/raw/ink-crawler-candidate-board-raw-001.png'],
  ['kite-wraith', 8, 'art/generated/kite-wraith/raw/kite-wraith-candidate-board-raw-001.png'],
  ['lantern-warden', 12, 'art/generated/lantern-warden/raw/lantern-warden-candidate-board-raw-001.png'],
  ['environment-key', 12, 'art/generated/environment-key/raw/environment-key-candidate-board-raw-001.png'],
  ['parallax', 7, 'art/generated/parallax/raw/parallax-layer-sheet-raw-001.png'],
  ['environment-kit', 78, 'art/generated/environment-kit/raw/environment-kit-raw-001.png'],
  ['ui', 8, 'art/generated/ui/raw/ui-candidate-board-raw-001.png'],
  ['vfx-slash', 8, 'art/generated/vfx-slash/raw/slash-candidate-board-raw-001.png'],
  ['impact-vfx', 7, 'art/generated/impact-vfx/raw/impact-pickup-vfx-raw-001.png'],
  ['telegraph', 8, 'art/generated/telegraph/raw/telegraph-candidate-board-raw-001.png'],
  ['title', 1, 'art/generated/title/raw/title-composition-raw-001.png']
];

let totalCandidates = 0;
for (const [family, count, file] of rawFamilies) {
  totalCandidates += count;
  await requireFile(file, { minWidth: 512, minHeight: 256, minBytes: 10000 });
  if (['player', 'environment-key', 'ink-crawler', 'kite-wraith', 'lantern-warden', 'ui', 'vfx-slash', 'telegraph'].includes(family)) {
    await requireFile(`art/generated/${family}/${family}-candidates.png`, { minWidth: 900, minHeight: 500, minBytes: 10000 });
  }
}

for (const file of [
  'art/generated/GENERATION_LOG.md',
  'art/generated/GENERATION_LOG.json',
  'art/generated/player/prompts.md',
  'art/generated/player/rejections.md',
  'art/generated/player-animation/consistency-failures.md',
  'art/generated/environment-key/prompts.md',
  'art/generated/ui/rejections.md'
]) {
  await requireFile(file, { minBytes: 100 });
}

for (const file of [
  'art/source/player/player-master.png',
  'art/source/player/player-master-readability.png',
  'art/source/player/player-idle-sheet.png',
  'art/source/player/player-run-sheet.png',
  'art/source/player/player-jump-sheet.png',
  'art/source/player/player-fall-sheet.png',
  'art/source/player/player-wall-slide-sheet.png',
  'art/source/player/player-wall-kick-sheet.png',
  'art/source/player/player-ground-slash-sheet.png',
  'art/source/player/player-air-slash-sheet.png',
  'art/source/player/player-hurt-sheet.png',
  'art/source/enemies/ink-crawler-sheet.png',
  'art/source/enemies/kite-wraith-preview-sheet.png',
  'art/source/enemies/lantern-warden-sheet.png',
  'art/source/enemies/lantern-warden-telegraph-sheet.png',
  'art/source/environment/neon-alley-key-art.png',
  'art/source/environment/layer-far-sky.png',
  'art/source/environment/layer-distant-skyline.png',
  'art/source/environment/layer-mid-buildings-signs.png',
  'art/source/environment/layer-gameplay-architecture.png',
  'art/source/environment/layer-near-props.png',
  'art/source/environment/layer-foreground-occlusion.png',
  'art/source/environment/layer-rain-fog-light.png',
  'art/source/ui/title-logo.png',
  'art/source/ui/ui-kit.png',
  'art/source/ui/mobile-controls-kit.png',
  'art/source/ui/icons.png',
  'art/source/vfx/slash-flipbook.png',
  'art/source/vfx/telegraph-flipbook.png',
  'art/source/vfx/hit-spark-flipbook.png',
  'art/source/vfx/ink-dissolve-flipbook.png',
  'art/source/vfx/wall-kick-burst.png',
  'art/source/vfx/pickup-flash.png',
  'art/source/vfx/checkpoint-pulse.png',
  'art/source/vfx/stage-clear-burst.png'
]) {
  await requireFile(file, { minBytes: 10000 });
}

const manifest = await readJson('art/asset-manifest.json');
if (manifest) {
  if (manifest.phase !== 'gate-b-v2-image-generated-art-lock-review') errors.push(`asset-manifest phase is ${manifest.phase}.`);
  if (!manifest.oldGateBV1FinalArtRejected) errors.push('asset-manifest does not record Gate B v1 rejection.');
  for (const asset of manifest.assets ?? []) {
    if (!asset.file?.includes('/final-v2/assets/')) errors.push(`${asset.key} is not a final-v2 runtime asset.`);
    if (!asset.source?.startsWith('art/generated/')) errors.push(`${asset.key} does not map back to art/generated source evidence.`);
    await requireFile(asset.file, { minBytes: 10000 });
  }
}

const generationLog = await readJson('art/generated/GENERATION_LOG.json');
if (generationLog) {
  if (generationLog.route !== 'native Codex image_gen') errors.push('generation log does not record native Codex image_gen route.');
  if ((generationLog.entries?.length ?? 0) < 10) errors.push('generation log has too few entries.');
}

const v1Rejection = await requireFile('art/approvals/GATE_B_V1_REJECTION.md', { minBytes: 100 });
const v2Status = await readJson('art/approvals/GATE_B_V2_STATUS.json');
if (!v1Rejection) errors.push('Gate B v1 rejection file is required.');
if (v2Status) {
  if (v2Status.approvalPhrase !== 'Approve Gate B v2') errors.push('Gate B v2 status must preserve the exact approval phrase.');
  if (v2Status.status === 'approved') {
    if (v2Status.approved !== true) errors.push('Gate B v2 approved status must set approved=true.');
    if (!v2Status.approvedAt || !v2Status.approvedBy) errors.push('Gate B v2 approved status must record approvedAt and approvedBy.');
  } else if (v2Status.approved !== false) {
    errors.push('Gate B v2 non-approved status must set approved=false.');
  }
}

if (totalCandidates < 150) {
  errors.push(`Generated candidate count ${totalCandidates} is below expected evidence volume.`);
}

await writeJson(path.join(finalDir, 'generated-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  totalCandidates,
  rawFamilies: rawFamilies.map(([family, count, file]) => ({ family, count, file })),
  checked,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:validate-generated PASS ${JSON.stringify({ rawFamilies: rawFamilies.length, totalCandidates })}`);

import fs from 'node:fs/promises';
import path from 'node:path';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const requiredFiles = [
  'art/asset-manifest.json',
  'art/animation-manifest.json',
  'art/vfx-manifest.json',
  'art/telegraph-manifest.json',
  'art/sign-density-scenes.json',
  'art/license-manifest.json',
  'art/final/atlas-manifest.json',
  'art/final/contact-sheet-report.json',
  'art/final/console-report.json',
  'art/final/screenshot-report.json',
  'art/final/performance-report.md',
  'art/final/player-master.png',
  'art/final/reference-a-brush-contact-sheet.png',
  'art/final/reference-b-lighting-presets.png',
  'art/final/reference-c-sign-density.png',
  'art/final/reference-e-seven-layer-parallax.png',
  'art/final/reference-g-slash-timeline.png',
  'art/final/ui-mobile-390x844.png',
  'art/approvals/GATE_A_STATUS.json',
  'art/approvals/GATE_B_STATUS.json'
];

const requiredRoundFiles = [
  'title-desktop.png',
  'title-mobile.png',
  'artlab-neutral.png',
  'artlab-busy.png',
  'player-motion.png',
  'player-contrast.png',
  'slash.png',
  'enemy.png',
  'warden-telegraph.png',
  'parallax.png',
  'hud.png',
  'mobile-controls.png',
  'review.md',
  'changes.md'
];

const errors = [];
const checkedFiles = [];

async function requireFile(relative) {
  try {
    const stat = await fs.stat(path.join(rootDir, relative));
    if (stat.size === 0) errors.push(`${relative} is empty.`);
    checkedFiles.push({ file: relative, bytes: stat.size });
    if (relative.endsWith('.png')) {
      const info = await readPngInfo(path.join(rootDir, relative));
      if (info.width <= 0 || info.height <= 0) errors.push(`${relative} has invalid dimensions.`);
      if (info.bytes < 1500) errors.push(`${relative} is suspiciously tiny for review evidence.`);
      checkedFiles[checkedFiles.length - 1] = { file: relative, ...info };
    }
  } catch (error) {
    errors.push(`${relative} missing or unreadable: ${error.message}`);
  }
}

for (const file of requiredFiles) {
  await requireFile(file);
}

const assetManifest = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'asset-manifest.json'), 'utf8'));
if (assetManifest.phase !== 'gate-b-final-art-lock-review') {
  errors.push(`asset-manifest phase is ${assetManifest.phase}.`);
}
if (!assetManifest.noRemoteRuntimeDependencies) {
  errors.push('asset-manifest does not forbid remote runtime dependencies.');
}

const requiredAssetKeys = [
  'player-spritesheet',
  'player-master',
  'enemy-spritesheet',
  'lantern-warden-spritesheet',
  'kite-wraith-preview',
  'slash-flipbook',
  'telegraph-flipbook',
  'ui-kit',
  'title-menu-panel',
  'mobile-controls-kit',
  'brush-kit',
  'sign-atlas',
  'title-composition',
  'layer-far-sky',
  'layer-distant-skyline',
  'layer-mid-roofs-signs',
  'layer-gameplay-layer',
  'layer-near-props',
  'layer-near-props-front',
  'layer-foreground-occlusion'
];

const assetKeys = new Set(assetManifest.assets.map((asset) => asset.key));
for (const key of requiredAssetKeys) {
  if (!assetKeys.has(key)) errors.push(`Required runtime asset key missing: ${key}.`);
}

for (const asset of assetManifest.assets) {
  if (/^https?:\/\//.test(asset.file)) errors.push(`${asset.key} uses a remote URL.`);
  if (asset.file.includes('art/references/')) errors.push(`${asset.key} points at a reference sheet.`);
  await requireFile(asset.file);
  if (!asset.references?.length) errors.push(`${asset.key} has no reference mapping.`);
  if (!asset.license) errors.push(`${asset.key} has no license ownership entry.`);
}

const screenshotReport = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'final', 'screenshot-report.json'), 'utf8'));
if (!screenshotReport.valid) errors.push('screenshot-report is not valid.');
if ((screenshotReport.screenshots?.length ?? 0) < 24) errors.push('screenshot-report has fewer than 24 deterministic captures.');

for (let round = 1; round <= 3; round += 1) {
  const dir = `art/reviews/round-${String(round).padStart(2, '0')}`;
  for (const file of requiredRoundFiles) {
    await requireFile(`${dir}/${file}`);
  }
}

const gateA = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'approvals', 'GATE_A_STATUS.json'), 'utf8'));
if (gateA.status !== 'approved' || gateA.approved !== true) errors.push('Gate A status is not approved.');

const gateB = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'approvals', 'GATE_B_STATUS.json'), 'utf8'));
if (gateB.status !== 'pending' || gateB.approved !== false) errors.push('Gate B status must remain pending before explicit approval.');

const runtimeText = await fs.readFile(path.join(rootDir, 'src', 'scenes', 'ArtLabScene.ts'), 'utf8');
const titleRuntimeText = await fs.readFile(path.join(rootDir, 'src', 'scenes', 'TitleScene.ts'), 'utf8');
const runtimeImageRefs = (runtimeText.match(/this\.add\.image/g) ?? []).length;
if (runtimeImageRefs < 8) errors.push('ArtLabScene does not visibly use enough raster runtime assets.');
if (runtimeText.includes('art/references/neon_ronin_art_refs_impl_ready')) errors.push('Runtime references specification sheets directly.');
if (runtimeText.includes('this.add.circle')) errors.push('ArtLabScene still uses visible primitive circles for final UI/mobile controls.');
if (titleRuntimeText.includes('backgroundColor:')) errors.push('TitleScene uses raw text backgroundColor instead of authored button/panel assets.');
if (!titleRuntimeText.includes('ArtAssetKey.TitleMenuPanel')) errors.push('TitleScene does not use the authored title menu panel asset.');
if (!runtimeText.includes('ArtAssetKey.MobileControlsKit')) errors.push('ArtLabScene does not use the authored mobile controls kit asset.');

await writeJson(path.join(rootDir, 'art', 'final', 'asset-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  checkedFiles,
  requiredAssetKeys,
  runtimeImageRefs,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:validate-assets PASS ${JSON.stringify({ files: checkedFiles.length, runtimeImageRefs })}`);

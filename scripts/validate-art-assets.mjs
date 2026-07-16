import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const requiredFiles = [
  'art/asset-manifest.json',
  'art/animation-manifest.json',
  'art/vfx-manifest.json',
  'art/telegraph-manifest.json',
  'art/sign-density-scenes.json',
  'art/license-manifest.json',
  'art/final-v2/atlas-manifest.json',
  'art/final-v2/contact-sheet-report.json',
  'art/final-v2/console-report.json',
  'art/final-v2/screenshot-report.json',
  'art/final-v2/performance-report.md',
  'art/final-v2/player-master.png',
  'art/final-v2/reference-a-brush-contact-sheet.png',
  'art/final-v2/reference-b-lighting-presets.png',
  'art/final-v2/reference-c-sign-density.png',
  'art/final-v2/reference-e-seven-layer-parallax.png',
  'art/final-v2/reference-g-slash-timeline.png',
  'art/final-v2/ui-mobile-390x844.png',
  'art/final-v2/generated-validation-report.json',
  'art/generated/GENERATION_LOG.json',
  'art/approvals/GATE_B_V1_REJECTION.md',
  'art/approvals/GATE_B_V2_STATUS.json',
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
let alphaBrowser;

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

async function getAlphaBrowser() {
  if (!alphaBrowser) alphaBrowser = await chromium.launch({ headless: true });
  return alphaBrowser;
}

async function inspectAlpha(relative) {
  const filePath = path.join(rootDir, relative);
  const bytes = await fs.readFile(filePath);
  const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
  const info = await readPngInfo(filePath);
  const browser = await getAlphaBrowser();
  const page = await browser.newPage({ viewport: { width: info.width, height: info.height }, deviceScaleFactor: 1 });
  try {
    return await page.evaluate(
      async ({ dataUrl, width, height }) => {
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Unable to load PNG for alpha inspection.'));
          image.src = dataUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, width, height);
        context.drawImage(img, 0, 0);
        const data = context.getImageData(0, 0, width, height).data;
        const pixelCount = width * height;
        let transparentPixels = 0;
        let opaquePaperPixels = 0;
        let allyHuePixels = 0;
        let enemyHuePixels = 0;
        let maxCornerAlpha = 0;
        const isPaperLike = (r, g, b) => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const range = max - min;
          const neutralLight = r > 206 && g > 200 && b > 184 && range < 58;
          const warmPaper = r > 184 && g > 170 && b > 135 && r >= g - 8 && g >= b - 18 && range < 82;
          const grayPaper = r > 180 && g > 178 && b > 172 && range < 38;
          const cyanAccent = g > 132 && b > 150 && r < 110;
          const magentaAccent = r > 125 && b > 92 && g < 120;
          const lanternGold = r > 170 && g > 118 && b < 122 && r - b > 58;
          return (neutralLight || warmPaper || grayPaper) && !cyanAccent && !magentaAccent && !lanternGold;
        };
        const rgbToHsv = (r, g, b) => {
          const rn = r / 255;
          const gn = g / 255;
          const bn = b / 255;
          const max = Math.max(rn, gn, bn);
          const min = Math.min(rn, gn, bn);
          const delta = max - min;
          let hue = 0;
          if (delta !== 0) {
            if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
            else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
            else hue = 60 * ((rn - gn) / delta + 4);
          }
          if (hue < 0) hue += 360;
          const saturation = max === 0 ? 0 : delta / max;
          return { hue, saturation, value: max };
        };
        const isPlayerHue = (r, g, b) => {
          const hsv = rgbToHsv(r, g, b);
          const cyanLike = hsv.saturation > 0.2 && hsv.value > 0.14 && hsv.hue >= 120 && hsv.hue <= 225;
          const magentaLike = hsv.saturation > 0.18 && hsv.value > 0.12 && hsv.hue >= 245 && hsv.hue <= 345;
          return cyanLike || magentaLike;
        };
        const isEnemyHue = (r, g, b) => {
          const amberLike = r > 170 && g > 92 && g < 210 && b < 110 && r - b > 80;
          const vermilionLike = r > 170 && g > 42 && g < 135 && b < 95 && r - b > 90;
          return amberLike || vermilionLike;
        };
        const cornerIndices = [
          0,
          width - 1,
          (height - 1) * width,
          height * width - 1
        ];
        for (let index = 0; index < pixelCount; index += 1) {
          const offset = index * 4;
          const alpha = data[offset + 3];
          if (alpha < 16) transparentPixels += 1;
          if (alpha > 220 && isPaperLike(data[offset], data[offset + 1], data[offset + 2])) opaquePaperPixels += 1;
          if (alpha > 36 && isPlayerHue(data[offset], data[offset + 1], data[offset + 2])) allyHuePixels += 1;
          if (alpha > 36 && isEnemyHue(data[offset], data[offset + 1], data[offset + 2])) enemyHuePixels += 1;
        }
        for (const index of cornerIndices) {
          maxCornerAlpha = Math.max(maxCornerAlpha, data[index * 4 + 3]);
        }
        return {
          width,
          height,
          maxCornerAlpha,
          transparentRatio: transparentPixels / pixelCount,
          opaquePaperRatio: opaquePaperPixels / pixelCount,
          allyHueRatio: allyHuePixels / pixelCount,
          enemyHueRatio: enemyHuePixels / pixelCount
        };
      },
      { dataUrl, width: info.width, height: info.height }
    );
  } finally {
    await page.close();
  }
}

try {
for (const file of requiredFiles) {
  await requireFile(file);
}

const assetManifest = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'asset-manifest.json'), 'utf8'));
if (assetManifest.phase !== 'gate-b-v2-image-generated-art-lock-review') {
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

const requiredTransparentAssetKeys = new Set([
  'player-spritesheet',
  'player-master',
  'enemy-spritesheet',
  'lantern-warden-spritesheet',
  'kite-wraith-preview',
  'slash-flipbook',
  'telegraph-flipbook',
  'brush-kit'
]);

const enemyFactionAssetKeys = new Set([
  'enemy-spritesheet',
  'lantern-warden-spritesheet',
  'kite-wraith-preview',
  'telegraph-flipbook'
]);

const assetKeys = new Set(assetManifest.assets.map((asset) => asset.key));
for (const key of requiredAssetKeys) {
  if (!assetKeys.has(key)) errors.push(`Required runtime asset key missing: ${key}.`);
}

for (const asset of assetManifest.assets) {
  if (/^https?:\/\//.test(asset.file)) errors.push(`${asset.key} uses a remote URL.`);
  if (asset.file.includes('art/references/')) errors.push(`${asset.key} points at a reference sheet.`);
  if (!asset.file.includes('art/final-v2/assets/')) errors.push(`${asset.key} is not loaded from final-v2 assets.`);
  if (!asset.source?.startsWith('art/generated/')) errors.push(`${asset.key} does not map back to generated raw evidence.`);
  await requireFile(asset.file);
  if (!asset.references?.length) errors.push(`${asset.key} has no reference mapping.`);
  if (!asset.license) errors.push(`${asset.key} has no license ownership entry.`);
  if (requiredTransparentAssetKeys.has(asset.key)) {
    const alpha = await inspectAlpha(asset.file);
    checkedFiles.push({ file: asset.file, alpha });
    if (alpha.maxCornerAlpha > 24) errors.push(`${asset.key} does not have transparent corners after cutout processing.`);
    if (alpha.transparentRatio < 0.12) errors.push(`${asset.key} has too little transparency for a cutout sprite/effect asset.`);
    if (alpha.opaquePaperRatio > 0.08) errors.push(`${asset.key} still has too much opaque paper/white background.`);
    if (enemyFactionAssetKeys.has(asset.key)) {
      if (alpha.allyHueRatio > 0.006) errors.push(`${asset.key} still uses too much player cyan/magenta color language.`);
      if (alpha.enemyHueRatio < 0.001) errors.push(`${asset.key} does not show the enemy amber/vermilion color group.`);
    }
  }
}

const screenshotReport = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'final-v2', 'screenshot-report.json'), 'utf8'));
if (!screenshotReport.valid) errors.push('screenshot-report is not valid.');
if ((screenshotReport.screenshots?.length ?? 0) < 24) errors.push('screenshot-report has fewer than 24 deterministic captures.');

for (let round = 1; round <= 3; round += 1) {
  const dir = `art/reviews/gate-b-v2/round-${String(round).padStart(2, '0')}`;
  for (const file of requiredRoundFiles) {
    await requireFile(`${dir}/${file}`);
  }
}

const gateA = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'approvals', 'GATE_A_STATUS.json'), 'utf8'));
if (gateA.status !== 'approved' || gateA.approved !== true) errors.push('Gate A status is not approved.');

const gateB = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'approvals', 'GATE_B_STATUS.json'), 'utf8'));
if (gateB.status !== 'pending' || gateB.approved !== false) errors.push('Superseded Gate B v1 status must remain unapproved.');
const gateBv2 = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'approvals', 'GATE_B_V2_STATUS.json'), 'utf8'));
if (gateBv2.approvalPhrase !== 'Approve Gate B v2') errors.push('Gate B v2 status must preserve exact approval phrase.');
if (gateBv2.status === 'approved') {
  if (gateBv2.approved !== true || !gateBv2.approvedAt || !gateBv2.approvedBy) {
    errors.push('Gate B v2 approved status must include approved=true, approvedAt, and approvedBy.');
  }
} else if (gateBv2.approved !== false) {
  errors.push('Gate B v2 non-approved status must set approved=false.');
}

const runtimeText = await fs.readFile(path.join(rootDir, 'src', 'scenes', 'ArtLabScene.ts'), 'utf8');
const titleRuntimeText = await fs.readFile(path.join(rootDir, 'src', 'scenes', 'TitleScene.ts'), 'utf8');
const runtimeImageRefs = (runtimeText.match(/this\.add\.image/g) ?? []).length;
if (runtimeImageRefs < 8) errors.push('ArtLabScene does not visibly use enough raster runtime assets.');
if (runtimeText.includes('art/references/neon_ronin_art_refs_impl_ready')) errors.push('Runtime references specification sheets directly.');
if (runtimeText.includes('this.add.circle')) errors.push('ArtLabScene still uses visible primitive circles for final UI/mobile controls.');
if (titleRuntimeText.includes('backgroundColor:')) errors.push('TitleScene uses raw text backgroundColor instead of authored button/panel assets.');
if (!titleRuntimeText.includes('ArtAssetKey.TitleMenuPanel')) errors.push('TitleScene does not use the authored title menu panel asset.');
if (!runtimeText.includes('ArtAssetKey.MobileControlsKit')) errors.push('ArtLabScene does not use the authored mobile controls kit asset.');

await writeJson(path.join(rootDir, 'art', 'final-v2', 'asset-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  checkedFiles,
  requiredAssetKeys,
  runtimeImageRefs,
  errors
});

  if (errors.length > 0) {
    console.error(JSON.stringify({ errors }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`art:validate-assets PASS ${JSON.stringify({ files: checkedFiles.length, runtimeImageRefs })}`);
  }
} finally {
  if (alphaBrowser) await alphaBrowser.close();
}

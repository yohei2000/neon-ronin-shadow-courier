import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const listFiles = (dir, acc = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, acc);
    else acc.push(full);
  }
  return acc;
};
const check = (id, passed, detail) => ({ id, passed, detail });
const manifestText = read(path.resolve('src', 'data', 'approvedArtManifest.ts'));
const artAssetsText = read(path.resolve('src', 'data', 'artAssets.ts'));
const preloadText = read(path.resolve('src', 'scenes', 'PreloadScene.ts'));
const stage1ContentText = read(path.resolve('src', 'data', 'stage1Content.json'));
const stage1LandformsText = read(path.resolve('src', 'data', 'stage1Landforms.json'));
const stage1Landforms = JSON.parse(stage1LandformsText);
const runtimeManifest = JSON.parse(read(path.resolve('src', 'assets', 'runtime', 'runtime-sprite-sheets.json')));
const runtimeManifestIds = new Set((runtimeManifest.sheets ?? []).map((sheet) => sheet.id));
const sourceFiles = listFiles(path.resolve('src')).filter((file) => /\.(ts|tsx|js|json)$/.test(file));
const runtimeScanFiles = sourceFiles.filter((file) => !file.endsWith(path.join('src', 'data', 'approvedArtManifest.ts')));
const stage1RuntimeFiles = sourceFiles.filter((file) =>
  [
    `${path.sep}src${path.sep}scenes${path.sep}Stage1Scene.ts`,
    `${path.sep}src${path.sep}entities${path.sep}`,
    `${path.sep}src${path.sep}ui${path.sep}Hud.ts`,
    `${path.sep}src${path.sep}ui${path.sep}TouchControls.ts`
  ].some((fragment) => file.includes(fragment))
);
const playableStageFiles = sourceFiles.filter((file) =>
  [
    `${path.sep}src${path.sep}scenes${path.sep}Stage1Scene.ts`,
    `${path.sep}src${path.sep}scenes${path.sep}Stage2Scene.ts`,
    `${path.sep}src${path.sep}entities${path.sep}`,
    `${path.sep}src${path.sep}ui${path.sep}Hud.ts`,
    `${path.sep}src${path.sep}ui${path.sep}TouchControls.ts`
  ].some((fragment) => file.includes(fragment))
);

const productionMatches = [...manifestText.matchAll(/productionPath: '([^']+)'/g)].map((match) => match[1]);
const approvedMatches = [...manifestText.matchAll(/approvedSourcePath: '([^']+)'/g)].map((match) => match[1]);
const pngs = fs.readdirSync(path.resolve('src', 'assets', 'approved-art')).filter((file) => file.endsWith('.png'));
const srcTextBundle = runtimeScanFiles.map((file) => `${file}\n${read(file)}`).join('\n');
const stage1TextBundle = stage1RuntimeFiles.map((file) => `${file}\n${read(file)}`).join('\n');
const playableStageTextBundle = playableStageFiles.map((file) => `${file}\n${read(file)}`).join('\n');
const primitiveStageGeometryPattern = /\.add\.(rectangle|graphics|polygon|ellipse|circle)\(/;
const requiredAnimations = [
  'ink-crawler-patrol',
  'ink-crawler-hit',
  'ink-crawler-defeat',
  'kite-wraith-drift',
  'kite-wraith-hit',
  'kite-wraith-defeat',
  'warden-idle',
  'warden-telegraph',
  'warden-attack',
  'warden-recovery',
  'warden-defeat',
  'slash-ground',
  'slash-air',
  'slash-spin'
];
const requiredPlayerAnimationNames = [
  'idle',
  'run',
  'smallJump',
  'bigJumpRise',
  'speedFlipJump',
  'apex',
  'fall',
  'wallSlide',
  'wallKick',
  'groundSlash',
  'airSlash'
];
const requiredTextures = [
  'Player',
  'Enemy',
  'LanternWarden',
  'KiteWraith',
  'Slash',
  'Telegraph',
  'UiKit',
  'MobileControlsKit',
  'LayerGameplay',
  'TitleMenuPanel'
];
const requiredRuntimeSpriteKeys = [
  'player-runtime-spritesheet',
  'ink-crawler-runtime-spritesheet',
  'kite-wraith-runtime-spritesheet',
  'slash-runtime-spritesheet',
  'telegraph-runtime-spritesheet',
  'lantern-warden-runtime-spritesheet'
];
const requiredRuntimeEnvironmentKeys = [
  'stage1-bg-far',
  'stage1-bg-distant',
  'stage1-bg-mid',
  'stage1-bg-near',
  'stage1-bg-front',
  'stage1-ground-tile',
  'stage1-platform-thin-tile',
  'stage1-terrain-rain-lantern-start',
  'stage1-terrain-neon-sign-run',
  'stage1-terrain-rooftop-hazard-line',
  'stage1-terrain-neon-thorn-climb',
  'stage1-terrain-lantern-warden-gate',
  'stage1-landforms-spritesheet',
  'stage1-moon-gate',
  'stage1-item-icons',
  'stage1-touch-controls'
];
const requiredRuntimeAssetKeys = [...requiredRuntimeSpriteKeys, ...requiredRuntimeEnvironmentKeys];

const byteEqual = (a, b) => {
  const left = fs.readFileSync(a);
  const right = fs.readFileSync(b);
  return left.length === right.length && left.equals(right);
};

const copyChecks = productionMatches.map((productionPath, index) => {
  const approvedPath = approvedMatches[index];
  return {
    productionPath,
    approvedPath,
    exists: fs.existsSync(productionPath) && fs.existsSync(approvedPath),
    byteEqual: fs.existsSync(productionPath) && fs.existsSync(approvedPath) ? byteEqual(productionPath, approvedPath) : false
  };
});

const auditRuntimeAssetPixels = async () => {
  const audits = [
    { id: 'player-runtime-spritesheet', file: 'src/assets/runtime/player-runtime-spritesheet.png', frameWidth: 256, frameHeight: 192, maxEdgeRatio: 0.16, maxBeigeRatio: 0.02, maxHaloRatio: 0.012 },
    { id: 'ink-crawler-runtime-spritesheet', file: 'src/assets/runtime/ink-crawler-runtime-spritesheet.png', frameWidth: 192, frameHeight: 144, maxEdgeRatio: 0.16, maxBeigeRatio: 0.02, maxHaloRatio: 0.012 },
    { id: 'kite-wraith-runtime-spritesheet', file: 'src/assets/runtime/kite-wraith-runtime-spritesheet.png', frameWidth: 192, frameHeight: 192, maxEdgeRatio: 0.16, maxBeigeRatio: 0.02, maxHaloRatio: 0.012 },
    { id: 'slash-runtime-spritesheet', file: 'src/assets/runtime/slash-runtime-spritesheet.png', frameWidth: 192, frameHeight: 160, maxEdgeRatio: 0.18, maxBeigeRatio: 0.02 },
    { id: 'telegraph-runtime-spritesheet', file: 'src/assets/runtime/telegraph-runtime-spritesheet.png', frameWidth: 160, frameHeight: 120, maxEdgeRatio: 0.18, maxBeigeRatio: 0.02 },
    { id: 'lantern-warden-runtime-spritesheet', file: 'src/assets/runtime/lantern-warden-runtime-spritesheet.png', frameWidth: 256, frameHeight: 256, maxEdgeRatio: 0.18, maxBeigeRatio: 0.02, maxHaloRatio: 0.012 },
    ...requiredRuntimeEnvironmentKeys.map((id) => ({
      id,
      file: `src/assets/runtime/${id}.png`,
      frameWidth: id === 'stage1-item-icons' ? 128 : id === 'stage1-touch-controls' ? 192 : id === 'stage1-landforms-spritesheet' ? 768 : undefined,
      frameHeight: id === 'stage1-item-icons' ? 128 : id === 'stage1-touch-controls' ? 160 : id === 'stage1-landforms-spritesheet' ? 384 : undefined,
      maxEdgeRatio: id === 'stage1-item-icons' || id === 'stage1-touch-controls' ? 0.20 : undefined,
      maxBeigeRatio: id.includes('ground') || id.includes('platform') ? 0.01 : id === 'stage1-landforms-spritesheet' ? 0.04 : 0.08,
      minOpaqueRatio: id === 'stage1-landforms-spritesheet' ? 0.10 : id === 'stage1-item-icons' || id === 'stage1-touch-controls' ? 0.03 : id.includes('bg-') ? 0.02 : 0.10,
      maxAverageLuma: id.includes('ground') || id.includes('platform') ? 95 : id === 'stage1-landforms-spritesheet' ? 135 : 150
    }))
  ];

  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    const results = [];
    for (const audit of audits) {
      const bytes = fs.readFileSync(path.resolve(audit.file));
      const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
      const result = await page.evaluate(async ({ audit, dataUrl }) => {
        const image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Unable to load ${audit.file}`));
          img.src = dataUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('2D canvas unavailable');
        context.drawImage(image, 0, 0);
        const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
        const frames = [];
        const frameWidth = audit.frameWidth ?? width;
        const frameHeight = audit.frameHeight ?? height;
        const columns = Math.floor(width / frameWidth);
        const rows = Math.floor(height / frameHeight);
        const edgeBand = 3;
        for (let row = 0; row < rows; row += 1) {
          for (let column = 0; column < columns; column += 1) {
            const left = column * frameWidth;
            const top = row * frameHeight;
            let opaque = 0;
            let beige = 0;
            let lumaSum = 0;
            let edgeOpaque = 0;
            let edgeSamples = 0;
            let halo = 0;
            const hasTransparentNeighbor = (px, py) => {
              for (let dy = -2; dy <= 2; dy += 1) {
                for (let dx = -2; dx <= 2; dx += 1) {
                  if (dx === 0 && dy === 0) continue;
                  const nx = px + dx;
                  const ny = py + dy;
                  if (nx < 0 || nx >= frameWidth || ny < 0 || ny >= frameHeight) continue;
                  const neighbor = ((top + ny) * width + left + nx) * 4;
                  if (data[neighbor + 3] <= 10) return true;
                }
              }
              return false;
            };
            for (let y = 0; y < frameHeight; y += 1) {
              for (let x = 0; x < frameWidth; x += 1) {
                const pixel = ((top + y) * width + left + x) * 4;
                const alpha = data[pixel + 3];
                const red = data[pixel];
                const green = data[pixel + 1];
                const blue = data[pixel + 2];
                const luma = (red + green + blue) / 3;
                const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
                if (alpha > 24) {
                  opaque += 1;
                  lumaSum += luma;
                  if (luma > 180 && saturation < 42) beige += 1;
                  if (audit.maxHaloRatio && luma > 145 && saturation < 42 && hasTransparentNeighbor(x, y)) halo += 1;
                }
                const onEdge = x < edgeBand || x >= frameWidth - edgeBand || y < edgeBand || y >= frameHeight - edgeBand;
                if (onEdge) {
                  edgeSamples += 1;
                  if (alpha > 24) edgeOpaque += 1;
                }
              }
            }
            const area = frameWidth * frameHeight;
            frames.push({
              index: row * columns + column,
              opaqueRatio: opaque / area,
              beigeRatio: opaque ? beige / opaque : 0,
              haloRatio: opaque ? halo / opaque : 0,
              edgeRatio: edgeSamples ? edgeOpaque / edgeSamples : 0,
              averageLuma: opaque ? lumaSum / opaque : 0
            });
          }
        }
        return { id: audit.id, file: audit.file, width, height, frames };
      }, { audit, dataUrl });

      const activeFrames = result.frames.filter((frame) => frame.opaqueRatio > 0.002);
      const maxEdgeRatio = Math.max(0, ...activeFrames.map((frame) => frame.edgeRatio));
      const maxBeigeRatio = Math.max(0, ...activeFrames.map((frame) => frame.beigeRatio));
      const maxHaloRatio = Math.max(0, ...activeFrames.map((frame) => frame.haloRatio));
      const maxAverageLuma = Math.max(0, ...activeFrames.map((frame) => frame.averageLuma));
      const minOpaqueRatio = Math.min(...activeFrames.map((frame) => frame.opaqueRatio));
      const passed =
        activeFrames.length > 0 &&
        (!audit.maxEdgeRatio || maxEdgeRatio <= audit.maxEdgeRatio) &&
        maxBeigeRatio <= audit.maxBeigeRatio &&
        (!audit.maxHaloRatio || maxHaloRatio <= audit.maxHaloRatio) &&
        (!audit.maxAverageLuma || maxAverageLuma <= audit.maxAverageLuma) &&
        (!audit.minOpaqueRatio || minOpaqueRatio >= audit.minOpaqueRatio);
      results.push({
        id: result.id,
        file: result.file,
        passed,
        activeFrames: activeFrames.length,
        maxEdgeRatio,
        maxBeigeRatio,
        maxHaloRatio,
        maxAverageLuma,
        minOpaqueRatio
      });
    }
    return results;
  } finally {
    await browser.close();
  }
};

const runtimeAssetAudit = await auditRuntimeAssetPixels();

const checks = [
  check('approved-art-count', pngs.length === 24 && productionMatches.length === 24, `${pngs.length} pngs, ${productionMatches.length} manifest entries`),
  check('approved-copies-byte-equal', copyChecks.every((item) => item.exists && item.byteEqual), `${copyChecks.filter((item) => item.exists && item.byteEqual).length}/24 byte-equal`),
  check('uses-approved-manifest', artAssetsText.includes('ApprovedArtUrlByKey'), 'ArtImageAssets routes through approved manifest'),
  check('no-old-gate-b-v1-final-art', !srcTextBundle.includes('art/final/'), 'no art/final runtime references'),
  check('no-reference-sheets-runtime', !srcTextBundle.includes('art/references/neon_ronin_art_refs_impl_ready'), 'no A-H reference package runtime references'),
  check('no-direct-final-v2-runtime-imports', !srcTextBundle.includes('art/final-v2/assets'), 'only approvedArtManifest records source lineage'),
  check('no-remote-runtime-assets', !/https?:\/\//.test(srcTextBundle), 'runtime source requests no remote assets'),
  check('no-stage1-primitive-placeholder-art', !/\.add\.(rectangle|graphics)\(/.test(stage1TextBundle), 'Stage1 character/enemy/UI/environment visuals use approved images'),
  check('no-playable-stage-geometric-primitives', !primitiveStageGeometryPattern.test(playableStageTextBundle), 'Stage1/Stage2 runtime geometry is sprite/tile dressed instead of primitive shapes'),
  check('required-textures-loaded', requiredTextures.every((key) => `${preloadText}\n${artAssetsText}`.includes(`ArtAssetKey.${key}`)), requiredTextures.join(', ')),
  check('runtime-sprite-sheets-exist', requiredRuntimeSpriteKeys.every((file) => fs.existsSync(path.resolve('src', 'assets', 'runtime', `${file}.png`))), requiredRuntimeSpriteKeys.join(', ')),
  check('runtime-environment-assets-exist', requiredRuntimeEnvironmentKeys.every((file) => fs.existsSync(path.resolve('src', 'assets', 'runtime', `${file}.png`))), requiredRuntimeEnvironmentKeys.join(', ')),
  check('runtime-manifest-covers-stage1-assets', requiredRuntimeAssetKeys.every((id) => runtimeManifestIds.has(id)), requiredRuntimeAssetKeys.join(', ')),
  check(
    'stage1-image-first-terrain-rendering',
      stage1ContentText.includes('"visualTerrain"') &&
      stage1TextBundle.includes('Stage1Data.visualTerrain.plates') &&
      stage1TextBundle.includes('Stage1Data.visualTerrain.landforms') &&
      stage1TextBundle.includes('Stage1CollisionPlatforms') &&
      !stage1TextBundle.includes('platform.height <= 30 ? RuntimeEnvironmentAssetKey.PlatformThinTile'),
    'Stage1 terrain renders from image plates and large landform sprites; landform colliders stay data-only'
  ),
  check(
    'stage1-large-landform-runtime',
    (stage1Landforms.landforms ?? []).length >= 25 &&
      (stage1Landforms.colliders ?? []).length >= 25 &&
      (stage1Landforms.sourcePanels ?? []).length === 5 &&
      (stage1Landforms.terrainPlateOutputs ?? []).length === 5 &&
      stage1Landforms.generation === 'imagegen-concept-background-first-v2' &&
      new Set((stage1Landforms.landforms ?? []).map((landform) => landform.frame)).size >= 12 &&
      preloadText.includes('RuntimeEnvironmentAssetKey.Stage1Landforms') &&
      stage1TextBundle.includes('RuntimeEnvironmentAssetKey.Stage1Landforms') &&
      stage1TextBundle.includes('landformColliders'),
    `${stage1Landforms.landforms?.length ?? 0} landforms, ${stage1Landforms.colliders?.length ?? 0} colliders, ${stage1Landforms.sourcePanels?.length ?? 0} source panels, ${new Set((stage1Landforms.landforms ?? []).map((landform) => landform.frame)).size} frames`
  ),
  check('runtime-cutout-pixel-audit', runtimeAssetAudit.every((item) => item.passed), `${runtimeAssetAudit.filter((item) => item.passed).length}/${runtimeAssetAudit.length} runtime assets pass edge/beige checks`),
  check(
    'required-animations-created',
    requiredAnimations.every((key) => preloadText.includes(key)) &&
      requiredPlayerAnimationNames.every((name) => new RegExp(`\\b${name}:`).test(artAssetsText)) &&
      preloadText.includes('player-${name}') &&
      preloadText.includes('RuntimeSpriteAssetKey.Player'),
    [...requiredPlayerAnimationNames.map((name) => `player-${name}`), ...requiredAnimations].join(', ')
  )
];

const report = {
  generatedAt: new Date().toISOString(),
  passed: checks.every((item) => item.passed),
  checks,
  runtimeAssetAudit,
  productionAssets: copyChecks
};
fs.writeFileSync(path.join(artifactDir, 'stage1-assets-qa-report.json'), `${JSON.stringify(report, null, 2)}\n`);

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`qa:assets-stage1 PASS ${checks.length} checks`);

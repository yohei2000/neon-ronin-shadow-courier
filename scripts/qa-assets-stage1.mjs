import fs from 'node:fs';
import path from 'node:path';

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

const productionMatches = [...manifestText.matchAll(/productionPath: '([^']+)'/g)].map((match) => match[1]);
const approvedMatches = [...manifestText.matchAll(/approvedSourcePath: '([^']+)'/g)].map((match) => match[1]);
const pngs = fs.readdirSync(path.resolve('src', 'assets', 'approved-art')).filter((file) => file.endsWith('.png'));
const srcTextBundle = runtimeScanFiles.map((file) => `${file}\n${read(file)}`).join('\n');
const stage1TextBundle = stage1RuntimeFiles.map((file) => `${file}\n${read(file)}`).join('\n');
const requiredAnimations = [
  'ink-crawler-patrol',
  'warden-idle',
  'warden-telegraph',
  'warden-attack',
  'warden-recovery',
  'warden-defeat',
  'slash-arc'
];
const requiredPlayerAnimationNames = ['idle', 'run', 'wallSlide', 'wallKick', 'groundSlash', 'airSlash'];
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

const checks = [
  check('approved-art-count', pngs.length === 24 && productionMatches.length === 24, `${pngs.length} pngs, ${productionMatches.length} manifest entries`),
  check('approved-copies-byte-equal', copyChecks.every((item) => item.exists && item.byteEqual), `${copyChecks.filter((item) => item.exists && item.byteEqual).length}/24 byte-equal`),
  check('uses-approved-manifest', artAssetsText.includes('ApprovedArtUrlByKey'), 'ArtImageAssets routes through approved manifest'),
  check('no-old-gate-b-v1-final-art', !srcTextBundle.includes('art/final/'), 'no art/final runtime references'),
  check('no-reference-sheets-runtime', !srcTextBundle.includes('art/references/neon_ronin_art_refs_impl_ready'), 'no A-H reference package runtime references'),
  check('no-direct-final-v2-runtime-imports', !srcTextBundle.includes('art/final-v2/assets'), 'only approvedArtManifest records source lineage'),
  check('no-remote-runtime-assets', !/https?:\/\//.test(srcTextBundle), 'runtime source requests no remote assets'),
  check('no-stage1-primitive-placeholder-art', !/\.add\.(rectangle|graphics)\(/.test(stage1TextBundle), 'Stage1 character/enemy/UI/environment visuals use approved images'),
  check('required-textures-loaded', requiredTextures.every((key) => `${preloadText}\n${artAssetsText}`.includes(`ArtAssetKey.${key}`)), requiredTextures.join(', ')),
  check(
    'required-animations-created',
    requiredAnimations.every((key) => preloadText.includes(key)) &&
      requiredPlayerAnimationNames.every((name) => new RegExp(`\\b${name}:`).test(artAssetsText)) &&
      preloadText.includes('player-${name}'),
    [...requiredPlayerAnimationNames.map((name) => `player-${name}`), ...requiredAnimations].join(', ')
  )
];

const report = {
  generatedAt: new Date().toISOString(),
  passed: checks.every((item) => item.passed),
  checks,
  productionAssets: copyChecks
};
fs.writeFileSync(path.join(artifactDir, 'stage1-assets-qa-report.json'), `${JSON.stringify(report, null, 2)}\n`);

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`qa:assets-stage1 PASS ${checks.length} checks`);

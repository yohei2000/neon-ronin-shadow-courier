import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { requiredScreenshots } from './qa-browser.mjs';

const qaDir = path.resolve('artifacts', 'qa');
const manifest = JSON.parse(await readFile(path.resolve('src', 'data', 'assetManifest.json'), 'utf8'));
const keysSource = await readFile(path.resolve('src', 'config', 'keys.ts'), 'utf8');
const preloadSource = await readFile(path.resolve('src', 'scenes', 'PreloadScene.ts'), 'utf8');
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const keyValues = new Set([...keysSource.matchAll(/'([^']+)'/g)].map((match) => match[1]));
const requiredPlayerStates = ['idle', 'run1', 'run2', 'run3', 'run4', 'jump', 'fall', 'wallSlide', 'slash1', 'slash2', 'slash3', 'hurt'];
const requiredTextures = [
  'player-idle',
  'player-run-1',
  'player-run-2',
  'player-run-3',
  'player-run-4',
  'player-jump',
  'player-fall',
  'player-wall',
  'player-slash-1',
  'player-slash-2',
  'player-slash-3',
  'player-hurt',
  'enemy-ink-crawler',
  'enemy-kite-wraith',
  'enemy-lantern-warden',
  'enemy-lantern-warden-hurt',
  'checkpoint-shrine',
  'goal-gate'
];
const requiredUi = ['ui-heart', 'ui-scroll', 'ui-timer', 'ui-seal', 'ui-pause'];
const requiredSfx = [
  'confirm',
  'cancel',
  'jump',
  'wall-jump',
  'slash',
  'enemy-hit',
  'enemy-defeat',
  'player-hurt',
  'pickup-seal',
  'pickup-scroll',
  'checkpoint',
  'miniboss-start',
  'miniboss-defeated',
  'stage-clear'
];

for (const state of requiredPlayerStates) {
  assert(manifest.playerStates.includes(state), `Player state ${state} missing from asset manifest.`);
}
for (const texture of requiredTextures) {
  assert(keyValues.has(texture), `Texture key ${texture} missing from keys.ts.`);
}
for (const texture of manifest.enemyTextures) {
  assert(keyValues.has(texture), `Enemy texture ${texture} missing from keys.ts.`);
}
for (const texture of manifest.tileDecorTextures) {
  assert(keyValues.has(texture), `Tile/decor texture ${texture} missing from keys.ts.`);
}
for (const icon of requiredUi) {
  assert(manifest.uiIcons.includes(icon), `UI icon ${icon} missing from manifest.`);
  assert(keyValues.has(icon), `UI icon ${icon} missing from keys.ts.`);
}
for (const texture of manifest.mobileTextures) {
  assert(keyValues.has(texture), `Mobile texture ${texture} missing from keys.ts.`);
}
for (const sfx of requiredSfx) {
  assert(manifest.sfx.includes(sfx), `SFX ${sfx} missing from manifest.`);
  assert(keyValues.has(sfx), `SFX key ${sfx} missing from keys.ts.`);
}

assert(manifest.playerStates.filter((state) => state.startsWith('run')).length >= 4, 'Run animation has fewer than 4 frames.');
assert(manifest.playerStates.filter((state) => state.startsWith('slash')).length >= 3, 'Slash effect has fewer than 3 frames.');
assert(manifest.tileDecorTextures.length >= 12, 'Fewer than 12 tile/decor textures.');
assert(manifest.enemyTextures.includes('enemy-lantern-warden'), 'Miniboss texture missing.');
assert(manifest.enemyTextures.includes('enemy-lantern-warden-hurt'), 'Miniboss hurt texture missing.');
assert(manifest.mobileTextures.includes('ui-button') && manifest.mobileTextures.includes('ui-dpad'), 'Mobile button textures/styles missing.');
assert(preloadSource.includes('makePlayer') && preloadSource.includes('makeTile') && preloadSource.includes('makeLanternWarden'), 'Generated asset pipeline is incomplete.');
assert((preloadSource.match(/lineStyle/g) ?? []).length >= 12, 'Procedural art lacks layered line work.');
assert((preloadSource.match(/fillTriangle|fillRoundedRect|fillEllipse|arc/g) ?? []).length >= 20, 'Procedural art lacks varied silhouette construction.');
assert((preloadSource.match(/fillCircle|fillRect|lineBetween|strokeRoundedRect|strokeTriangle|strokeEllipse/g) ?? []).length >= 45, 'Procedural art is too simple.');

if (process.env.QA_EXPECT_SCREENSHOTS === '1') {
  for (const screenshot of requiredScreenshots) {
    const file = path.join(qaDir, screenshot);
    try {
      const info = await stat(file);
      assert(info.size > 1500, `Screenshot ${screenshot} is missing or too small.`);
    } catch {
      errors.push(`Screenshot ${screenshot} is missing after qa:screenshots.`);
    }
  }
}

const report = {
  valid: errors.length === 0,
  errors,
  metrics: {
    playerStates: manifest.playerStates.length,
    runFrames: manifest.playerStates.filter((state) => state.startsWith('run')).length,
    slashFrames: manifest.playerStates.filter((state) => state.startsWith('slash')).length,
    enemyTextures: manifest.enemyTextures.length,
    tileDecorTextures: manifest.tileDecorTextures.length,
    uiIcons: manifest.uiIcons.length,
    mobileTextures: manifest.mobileTextures.length,
    sfx: manifest.sfx.length,
    screenshotCheck: process.env.QA_EXPECT_SCREENSHOTS === '1'
  }
};

await mkdir(qaDir, { recursive: true });
await writeFile(path.join(qaDir, 'asset-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

try {
  await access(path.join(qaDir, 'asset-report.json'));
} catch {
  errors.push('Asset report was not written.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`qa:assets PASS ${JSON.stringify(report.metrics)}`);

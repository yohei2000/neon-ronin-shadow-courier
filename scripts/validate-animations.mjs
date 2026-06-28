import fs from 'node:fs/promises';
import path from 'node:path';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'animation-manifest.json'), 'utf8'));
const errors = [];

const requiredPlayerStates = {
  idle: 6,
  run: 8,
  'small-jump': 4,
  'big-jump-rise': 5,
  'speed-flip-jump': 8,
  apex: 2,
  fall: 3,
  'wall-slide': 4,
  'wall-kick': 4,
  'ground-slash': 8,
  'air-slash': 6,
  hurt: 3,
  'checkpoint-respawn': 6
};

const player = manifest.player;
const playerInfo = await readPngInfo(path.join(rootDir, player.spritesheet));
if (playerInfo.width !== 1024 || playerInfo.height !== 1536) errors.push('Player animation master sheet dimensions drifted.');
if (player.origin?.x !== 0.5 || player.origin?.y !== 0.76) errors.push('Player origin changed from stable configured origin.');
if (player.runtimeFrameSize?.width !== 256 || player.runtimeFrameSize?.height !== 192) errors.push('Player runtime frame size changed from configured 256x192.');

for (const [state, minimumFrames] of Object.entries(requiredPlayerStates)) {
  const entry = player.states?.[state];
  if (!entry) {
    errors.push(`Missing player animation state: ${state}.`);
    continue;
  }
  if (entry.frames < minimumFrames) errors.push(`${state} has ${entry.frames} frames; required ${minimumFrames}.`);
  if (!(entry.frameDurationSeconds > 0 && entry.frameDurationSeconds <= 0.18)) errors.push(`${state} has invalid frame duration.`);
  if (!entry.stableOrigin) errors.push(`${state} is not marked stableOrigin.`);
}

const requiredSlashStates = {
  ground: 8,
  air: 6
};

const slashInfo = await readPngInfo(path.join(rootDir, manifest.slash.source));
if (slashInfo.width !== 1024 || slashInfo.height !== 160) errors.push('Slash source flipbook dimensions drifted.');
for (const [state, minimumFrames] of Object.entries(requiredSlashStates)) {
  const entry = manifest.slash.states?.[state];
  if (!entry) {
    errors.push(`Missing slash animation state: ${state}.`);
    continue;
  }
  if (entry.frames < minimumFrames) errors.push(`slash ${state} has ${entry.frames} frames; required ${minimumFrames}.`);
  if (!(entry.frameDurationSeconds > 0 && entry.frameDurationSeconds <= 0.08)) errors.push(`slash ${state} has invalid frame duration.`);
}

if (manifest.enemies?.inkCrawler?.frames < 4) errors.push('Ink Crawler animation frames below expected visual set.');
if (manifest.enemies?.lanternWarden?.frames < 8) errors.push('Lantern Warden state frames below expected visual set.');
if (!manifest.enemies?.kiteWraithPreview?.file) errors.push('Kite Wraith preview file missing.');

await writeJson(path.join(rootDir, 'art', 'final-v2', 'animation-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  checkedStates: Object.keys(requiredPlayerStates),
  checkedSlashStates: Object.keys(requiredSlashStates),
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:validate-animations PASS ${JSON.stringify({ playerStates: Object.keys(requiredPlayerStates).length, slashStates: Object.keys(requiredSlashStates).length })}`);

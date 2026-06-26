import fs from 'node:fs/promises';
import path from 'node:path';
import { rootDir, writeJson } from './art-lib.mjs';

const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'sign-density-scenes.json'), 'utf8'));
const errors = [];

for (const scene of manifest.scenes ?? []) {
  if (scene.heroSigns > 1) errors.push(`${scene.id} has ${scene.heroSigns} hero signs.`);
  if (scene.mediumSigns > 5) errors.push(`${scene.id} has ${scene.mediumSigns} medium signs.`);
  if (scene.smallSigns > 8) errors.push(`${scene.id} has ${scene.smallSigns} small signs.`);
  if (scene.heroOverlapsProtectedPlayerZone) errors.push(`${scene.id} hero sign overlaps protected player zone.`);
  if (!scene.negativeSpaceZones?.length) errors.push(`${scene.id} has no negative-space zone.`);
}

if ((manifest.scenes?.length ?? 0) < 2) {
  errors.push('Sign-density manifest must include desktop and mobile/reduced-density scenes.');
}

await writeJson(path.join(rootDir, 'art', 'final', 'sign-density-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  scenes: manifest.scenes,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:validate-sign-density PASS ${JSON.stringify({ scenes: manifest.scenes.length })}`);

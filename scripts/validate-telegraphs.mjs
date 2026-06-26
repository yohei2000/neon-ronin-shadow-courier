import fs from 'node:fs/promises';
import path from 'node:path';
import { rootDir, writeJson } from './art-lib.mjs';

const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'telegraph-manifest.json'), 'utf8'));
const errors = [];
const expectedHeavy = ['glow-up', 'aiming pose', 'ground warning', 'wind-up silhouette', 'release', 'recover'];
const expectedFast = ['glow-up', 'aiming pose', 'range warning', 'wind-up silhouette', 'release', 'recover'];

for (const [id, expected] of Object.entries({ heavy: expectedHeavy, fast: expectedFast })) {
  const sequence = manifest.sequences?.[id];
  if (!sequence) {
    errors.push(`Telegraph sequence missing: ${id}.`);
    continue;
  }
  if (sequence.phases?.join('|') !== expected.join('|')) {
    errors.push(`${id} telegraph phase order invalid: ${sequence.phases?.join(' -> ')}.`);
  }
  if (!(sequence.recoverWindowSeconds > 0)) errors.push(`${id} telegraph recover window missing.`);
  if (!sequence.hasRangeIndicator) errors.push(`${id} telegraph range/location indicator missing.`);
  if (!sequence.releaseHitAlignment?.includes('release')) errors.push(`${id} telegraph release/hit timing not documented.`);
}

if (manifest.sequences?.heavy?.color !== '#FF2E7A') errors.push('Heavy telegraph must use magenta danger language.');
if (manifest.sequences?.fast?.color !== '#00E5FF') errors.push('Fast telegraph must use cyan mobility/range language.');

await writeJson(path.join(rootDir, 'art', 'final', 'telegraph-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  sequences: manifest.sequences,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log('art:validate-telegraphs PASS {"sequences":2}');

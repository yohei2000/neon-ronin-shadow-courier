import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const manifestPath = path.join(rootDir, 'art', 'asset-manifest.json');
const finalDir = path.join(rootDir, 'art', 'final');
const reportPath = path.join(finalDir, 'atlas-manifest.json');

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const atlasCandidates = manifest.assets.filter((asset) =>
  ['spritesheet', 'flipbook', 'atlas', 'ui', 'brush', 'timeline'].includes(asset.type)
);

const atlases = [];
const errors = [];

for (const asset of atlasCandidates) {
  try {
    const fullPath = path.join(rootDir, asset.file);
    const info = await readPngInfo(fullPath);
    if (info.width !== asset.width || info.height !== asset.height) {
      errors.push(`${asset.file} manifest size ${asset.width}x${asset.height} does not match PNG ${info.width}x${info.height}.`);
    }
    if (info.width > 2048 || info.height > 2048) {
      errors.push(`${asset.file} exceeds mobile-safe atlas bound 2048px.`);
    }
    atlases.push({
      key: asset.key,
      file: asset.file,
      width: info.width,
      height: info.height,
      bytes: info.bytes,
      paddingPx: asset.type === 'spritesheet' || asset.type === 'flipbook' ? 2 : 4,
      extrusionPx: 1,
      mobileSafe: info.width <= 2048 && info.height <= 2048,
      references: asset.references
    });
  } catch (error) {
    errors.push(`${asset.file} unreadable: ${error.message}`);
  }
}

await ensureDir(finalDir);
await writeJson(reportPath, {
  generatedAt: new Date().toISOString(),
  sourceManifest: 'art/asset-manifest.json',
  deterministic: true,
  atlases,
  valid: errors.length === 0,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:atlas PASS ${JSON.stringify({ atlases: atlases.length })}`);

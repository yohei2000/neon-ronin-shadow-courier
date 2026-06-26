import fs from 'node:fs/promises';
import path from 'node:path';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'art', 'vfx-manifest.json'), 'utf8'));
const errors = [];
const slash = manifest.slash;

if (!slash) errors.push('Slash VFX manifest missing.');
if (slash?.totalDurationSeconds > 0.4) errors.push(`Slash exceeds 0.40s: ${slash.totalDurationSeconds}.`);
const phaseIds = slash?.phases?.map((phase) => phase.id) ?? [];
for (const required of ['anticipation', 'active', 'breakup', 'fade-out']) {
  if (!phaseIds.includes(required)) errors.push(`Slash phase missing: ${required}.`);
}
for (const layer of ['magenta core ribbon', 'thick black ink-brush edge', 'cyan accent sparks', 'magenta breakup shards', 'restrained soft glow']) {
  if (!slash?.layers?.includes(layer)) errors.push(`Slash layer missing: ${layer}.`);
}
if (slash?.particlePool?.unboundedEmitters !== false) errors.push('Slash particle pool must explicitly forbid unbounded emitters.');
if ((slash?.particlePool?.maxFullFx ?? 999) > 80) errors.push('Slash full-FX particle count exceeds target.');
if (!slash?.reducedFxVariant) errors.push('Slash reduced-FX variant missing.');
if (slash?.flipbook) {
  const info = await readPngInfo(path.join(rootDir, slash.flipbook));
  if (info.width > 1024 || info.height > 512) errors.push('Slash flipbook texture is too large.');
}

await writeJson(path.join(rootDir, 'art', 'final', 'vfx-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  slash,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:validate-vfx PASS ${JSON.stringify({ phases: phaseIds.length })}`);

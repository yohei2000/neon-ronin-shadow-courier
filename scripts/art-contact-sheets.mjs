import fs from 'node:fs/promises';
import path from 'node:path';
import { candidateDir, ensureDir, readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const requiredCandidates = [
  'player.png',
  'title.png',
  'environment.png',
  'ink-crawler.png',
  'kite-wraith.png',
  'lantern-warden.png',
  'ui.png',
  'moon-gate-hero-sign.png',
  'overview.png'
];

const report = {
  generatedAt: new Date().toISOString(),
  candidates: [],
  valid: true,
  errors: []
};

for (const file of requiredCandidates) {
  const fullPath = path.join(candidateDir, file);
  try {
    const info = await readPngInfo(fullPath);
    const stat = await fs.stat(fullPath);
    const entry = {
      file: `art/reviews/candidates/${file}`,
      ...info,
      bytes: stat.size
    };
    if (info.width < 900 || info.height < 500 || stat.size < 50_000) {
      report.valid = false;
      report.errors.push(`${file} is too small to be a useful contact sheet.`);
    }
    report.candidates.push(entry);
  } catch (error) {
    report.valid = false;
    report.errors.push(`${file} missing or invalid: ${error.message}`);
  }
}

await ensureDir(path.join(rootDir, 'art', 'reviews', 'gate-a'));
await writeJson(path.join(rootDir, 'art', 'reviews', 'gate-a', 'candidate-contact-sheet-report.json'), report);

if (!report.valid) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`art:contact-sheets PASS ${JSON.stringify({ candidates: report.candidates.length })}`);

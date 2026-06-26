import path from 'node:path';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const requiredContactSheets = [
  'art/final-v2/reference-a-brush-contact-sheet.png',
  'art/final-v2/reference-a-game-scale-test.png',
  'art/final-v2/reference-b-lighting-presets.png',
  'art/final-v2/reference-c-sign-density.png',
  'art/final-v2/player-animation-contact-sheet.png',
  'art/final-v2/player-five-core-poses.png',
  'art/final-v2/player-background-contrast-test.png',
  'art/final-v2/player-grayscale-test.png',
  'art/final-v2/player-64-48-32-test.png',
  'art/final-v2/reference-e-seven-layer-parallax.png',
  'art/final-v2/ui-desktop-contact-sheet.png',
  'art/final-v2/ui-material-swatches.png',
  'art/final-v2/ui-state-contact-sheet.png',
  'art/final-v2/ui-mobile-390x844.png',
  'art/final-v2/reference-g-slash-timeline.png',
  'art/final-v2/enemy-contact-sheet.png',
  'art/final-v2/lantern-warden-telegraph-contact-sheet.png',
  'art/final-v2/environment-contact-sheet.png',
  'art/final-v2/wet-reflection-contact-sheet.png',
  'art/final-v2/fog-depth-contact-sheet.png',
  'art/final-v2/reduced-fx-comparison.png'
];

const files = [];
const errors = [];

for (const file of requiredContactSheets) {
  try {
    const info = await readPngInfo(path.join(rootDir, file));
    if (info.width < 390 || info.height < 160) {
      errors.push(`${file} is too small to be review evidence.`);
    }
    files.push({ file, ...info });
  } catch (error) {
    errors.push(`${file} missing or unreadable: ${error.message}`);
    files.push({ file, present: false });
  }
}

await writeJson(path.join(rootDir, 'art', 'final-v2', 'contact-sheet-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  files,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:contact-sheets PASS ${JSON.stringify({ files: files.length })}`);

import path from 'node:path';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const requiredContactSheets = [
  'art/final/reference-a-brush-contact-sheet.png',
  'art/final/reference-a-game-scale-test.png',
  'art/final/reference-b-lighting-presets.png',
  'art/final/reference-c-sign-density.png',
  'art/final/player-animation-contact-sheet.png',
  'art/final/player-five-core-poses.png',
  'art/final/player-background-contrast-test.png',
  'art/final/player-grayscale-test.png',
  'art/final/player-64-48-32-test.png',
  'art/final/reference-e-seven-layer-parallax.png',
  'art/final/ui-desktop-contact-sheet.png',
  'art/final/ui-material-swatches.png',
  'art/final/ui-state-contact-sheet.png',
  'art/final/ui-mobile-390x844.png',
  'art/final/reference-g-slash-timeline.png',
  'art/final/enemy-contact-sheet.png',
  'art/final/lantern-warden-telegraph-contact-sheet.png',
  'art/final/environment-contact-sheet.png',
  'art/final/wet-reflection-contact-sheet.png',
  'art/final/fog-depth-contact-sheet.png',
  'art/final/reduced-fx-comparison.png'
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

await writeJson(path.join(rootDir, 'art', 'final', 'contact-sheet-report.json'), {
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

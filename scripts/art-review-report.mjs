import fs from 'node:fs/promises';
import path from 'node:path';
import { rootDir, writeJson } from './art-lib.mjs';

const requiredGateAFiles = [
  'art/TOOL_CAPABILITY_REPORT.md',
  'art/REFERENCE_ANALYSIS.md',
  'art/REFERENCE_COMPLIANCE_MATRIX.md',
  'art/ART_BIBLE.md',
  'art/palette.json',
  'art/art-style.json',
  'art/palette.png',
  'art/value-study.png',
  'art/shape-language.png',
  'art/player-silhouette-study.png',
  'art/environment-material-study.png',
  'art/ui-style-study.png',
  'art/vfx-style-study.png',
  'art/telegraph-style-study.png',
  'art/reviews/candidates/player.png',
  'art/reviews/candidates/title.png',
  'art/reviews/candidates/environment.png',
  'art/reviews/candidates/ink-crawler.png',
  'art/reviews/candidates/kite-wraith.png',
  'art/reviews/candidates/lantern-warden.png',
  'art/reviews/candidates/ui.png',
  'art/reviews/candidates/moon-gate-hero-sign.png',
  'art/reviews/candidates/overview.png',
  'art/reviews/gate-a/representative-composite-960x540.png',
  'art/approvals/GATE_A_REQUEST.md',
  'art/approvals/GATE_A_STATUS.json',
  'art/reviews/gate-a/gate-status-report.json',
  'art/reviews/gate-a/browser-smoke-report.json',
  'art/reviews/gate-a/gate-a-viewer-960x540.png',
  'art/generation-log/gate-a-candidates.md'
];

const report = {
  generatedAt: new Date().toISOString(),
  phase: 'gate-a-style-lock',
  valid: true,
  gateAApproval: 'PENDING_HUMAN_APPROVAL',
  gateBApproval: 'NOT_STARTED',
  files: [],
  errors: [],
  selectedDirection: {
    player: 'Player Candidate 2 consistency, with Candidate 3 hat silhouette only if frame stability survives.',
    title: 'Title Candidate 1 Moon Gate composition.',
    environment: 'Environment Candidate 1 seven-layer alley.',
    inkCrawler: 'Ink Crawler Candidate 1 low silhouette.',
    kiteWraith: 'Kite Wraith Candidate 3 forward motion language.',
    lanternWarden: 'Lantern Warden Candidate 2 readable vertical form plus Candidate 3 weight.',
    ui: 'UI Candidate 3 paper legibility with Candidate 2 semantic cyan discipline.',
    landmark: 'Moon Gate Candidate 1.'
  }
};

for (const relative of requiredGateAFiles) {
  const fullPath = path.join(rootDir, relative);
  try {
    const stat = await fs.stat(fullPath);
    report.files.push({ file: relative, bytes: stat.size, present: true });
    if (stat.size === 0) {
      report.valid = false;
      report.errors.push(`${relative} is empty.`);
    }
  } catch (error) {
    report.valid = false;
    report.errors.push(`${relative} missing: ${error.message}`);
    report.files.push({ file: relative, present: false });
  }
}

await writeJson(path.join(rootDir, 'art', 'reviews', 'gate-a', 'gate-a-package-report.json'), report);

const markdown = [
  '# Gate A Package Report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Status: ${report.valid ? 'READY_FOR_HUMAN_GATE_A_REVIEW' : 'INCOMPLETE'}`,
  '',
  'Gate A approval is still explicit-human-input only. This report does not approve the art lock.',
  '',
  '## Selected Direction',
  '',
  ...Object.entries(report.selectedDirection).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '## Evidence Files',
  '',
  ...report.files.map((item) => `- ${item.present ? 'PASS' : 'FAIL'} ${item.file}${item.bytes ? ` (${item.bytes} bytes)` : ''}`),
  '',
  '## Errors',
  '',
  ...(report.errors.length > 0 ? report.errors.map((error) => `- ${error}`) : ['- None']),
  ''
];

await fs.writeFile(path.join(rootDir, 'art', 'reviews', 'gate-a', 'gate-a-package-report.md'), markdown.join('\n'), 'utf8');

if (!report.valid) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`art:review-report PASS ${JSON.stringify({ files: report.files.length, gateAApproval: report.gateAApproval })}`);

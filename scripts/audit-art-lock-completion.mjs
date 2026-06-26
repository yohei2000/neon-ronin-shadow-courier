import fs from 'node:fs/promises';
import path from 'node:path';
import { readPngInfo, rootDir, writeJson } from './art-lib.mjs';

const auditPath = path.join(rootDir, 'art', 'reviews', 'completion-audit.json');
const auditMdPath = path.join(rootDir, 'art', 'reviews', 'completion-audit.md');
const requiredCommands = [
  'typecheck',
  'test',
  'build',
  'art:refs',
  'art:process',
  'art:atlas',
  'art:contact-sheets',
  'art:validate-assets',
  'art:validate-sign-density',
  'art:validate-animations',
  'art:validate-vfx',
  'art:validate-telegraphs',
  'art:screenshots',
  'art:review-report',
  'art:all'
];

const requirements = [];
const errors = [];

async function exists(relative) {
  try {
    const stat = await fs.stat(path.join(rootDir, relative));
    return stat.size > 0;
  } catch {
    return false;
  }
}

async function readJson(relative) {
  return JSON.parse(await fs.readFile(path.join(rootDir, relative), 'utf8'));
}

async function addRequirement(id, description, evidence, achieved, status = achieved ? 'passed' : 'missing') {
  requirements.push({ id, description, evidence, achieved, status });
  if (!achieved && status !== 'pending-human-approval') {
    errors.push(`${id}: ${description}`);
  }
}

const packageJson = await readJson('package.json');
const scripts = packageJson.scripts ?? {};
for (const command of requiredCommands) {
  await addRequirement(
    `command-script-${command}`,
    `package.json exposes npm script ${command}`,
    'package.json',
    Boolean(scripts[command])
  );
}

const gateA = await readJson('art/approvals/GATE_A_STATUS.json');
const gateB = await readJson('art/approvals/GATE_B_STATUS.json');
await addRequirement('gate-a-approved', 'Gate A received explicit human approval', 'art/approvals/GATE_A_STATUS.json', gateA.status === 'approved' && gateA.approved === true);
await addRequirement(
  'gate-b-approved',
  'Gate B received explicit human approval',
  'art/approvals/GATE_B_STATUS.json',
  gateB.status === 'approved' && gateB.approved === true,
  gateB.status === 'approved' && gateB.approved === true ? 'passed' : 'pending-human-approval'
);

for (const file of [
  'art/references/neon_ronin_art_refs_impl_ready/index.md',
  'art/references/neon_ronin_art_refs_impl_ready/a.md',
  'art/references/neon_ronin_art_refs_impl_ready/a.png',
  'art/references/neon_ronin_art_refs_impl_ready/b.md',
  'art/references/neon_ronin_art_refs_impl_ready/b.png',
  'art/references/neon_ronin_art_refs_impl_ready/c.md',
  'art/references/neon_ronin_art_refs_impl_ready/c.png',
  'art/references/neon_ronin_art_refs_impl_ready/d.md',
  'art/references/neon_ronin_art_refs_impl_ready/d.png',
  'art/references/neon_ronin_art_refs_impl_ready/e.md',
  'art/references/neon_ronin_art_refs_impl_ready/e.png',
  'art/references/neon_ronin_art_refs_impl_ready/f.md',
  'art/references/neon_ronin_art_refs_impl_ready/f.png',
  'art/references/neon_ronin_art_refs_impl_ready/g.md',
  'art/references/neon_ronin_art_refs_impl_ready/g.png',
  'art/references/neon_ronin_art_refs_impl_ready/h.md',
  'art/references/neon_ronin_art_refs_impl_ready/h.png'
]) {
  await addRequirement(`reference-${path.basename(file)}`, `Required reference package file exists: ${file}`, file, await exists(file));
}

for (const file of [
  'art/TOOL_CAPABILITY_REPORT.md',
  'art/REFERENCE_ANALYSIS.md',
  'art/REFERENCE_COMPLIANCE_MATRIX.md',
  'art/ART_BIBLE.md',
  'art/asset-manifest.json',
  'art/animation-manifest.json',
  'art/vfx-manifest.json',
  'art/telegraph-manifest.json',
  'art/sign-density-scenes.json',
  'art/license-manifest.json',
  'art/final/asset-validation-report.json',
  'art/final/sign-density-validation-report.json',
  'art/final/animation-validation-report.json',
  'art/final/vfx-validation-report.json',
  'art/final/telegraph-validation-report.json',
  'art/final/console-report.json',
  'art/final/screenshot-report.json',
  'art/reviews/final-scorecard.json',
  'art/reviews/gate-b/gate-b-package-report.json'
]) {
  await addRequirement(`evidence-${path.basename(file)}`, `Required evidence file exists: ${file}`, file, await exists(file));
}

const reports = [
  'art/final/asset-validation-report.json',
  'art/final/sign-density-validation-report.json',
  'art/final/animation-validation-report.json',
  'art/final/vfx-validation-report.json',
  'art/final/telegraph-validation-report.json',
  'art/final/console-report.json',
  'art/final/screenshot-report.json',
  'art/reviews/gate-b/gate-b-package-report.json'
];
for (const file of reports) {
  const report = await readJson(file);
  await addRequirement(`report-valid-${path.basename(file)}`, `Report is valid: ${file}`, file, report.valid === true);
}

const scorecard = await readJson('art/reviews/final-scorecard.json');
await addRequirement('scorecard-thresholds', 'Reviewer scores satisfy all configured thresholds', 'art/reviews/final-scorecard.json', scorecard.valid === true && scorecard.minimum >= 4.0 && scorecard.median >= 4.3);

const screenshotReport = await readJson('art/final/screenshot-report.json');
await addRequirement('screenshot-matrix', 'Deterministic screenshot matrix includes required final states and three revision rounds', 'art/final/screenshot-report.json', screenshotReport.valid === true && screenshotReport.revisionRounds >= 3 && screenshotReport.screenshots.length >= 64);

for (let round = 1; round <= 3; round += 1) {
  const prefix = `art/reviews/round-${String(round).padStart(2, '0')}`;
  for (const file of ['title-desktop.png', 'title-mobile.png', 'artlab-neutral.png', 'artlab-busy.png', 'player-motion.png', 'player-contrast.png', 'slash.png', 'enemy.png', 'warden-telegraph.png', 'parallax.png', 'hud.png', 'mobile-controls.png', 'review.md', 'changes.md']) {
    await addRequirement(`revision-${round}-${file}`, `Revision round ${round} contains ${file}`, `${prefix}/${file}`, await exists(`${prefix}/${file}`));
  }
}

const runtimeFiles = [
  'src/scenes/TitleScene.ts',
  'src/scenes/ArtLabScene.ts',
  'src/scenes/PreloadScene.ts',
  'src/data/artAssets.ts'
];
const runtimeText = (await Promise.all(runtimeFiles.map((file) => fs.readFile(path.join(rootDir, file), 'utf8')))).join('\n');
await addRequirement('no-reference-runtime-use', 'Runtime does not load the A-H specification sheets', runtimeFiles.join(', '), !runtimeText.includes('art/references/neon_ronin_art_refs_impl_ready'));
await addRequirement('authored-ui-assets', 'Title and mobile controls use authored runtime assets', runtimeFiles.join(', '), runtimeText.includes('TitleMenuPanel') && runtimeText.includes('MobileControlsKit'));
await addRequirement('no-legacy-stage1', 'Legacy Stage 1 runtime is absent from source tree', 'src/', !(await exists('src/scenes/Stage1Scene.ts')) && !(await exists('src/data/stage1.json')));

for (const file of ['art/final/title-desktop.png', 'art/final/title-mobile.png', 'art/final/artlab-busy.png', 'art/final/mobile-controls.png']) {
  const info = await readPngInfo(path.join(rootDir, file));
  await addRequirement(`png-${path.basename(file)}`, `Review PNG is non-empty and readable: ${file}`, file, info.width > 0 && info.height > 0 && info.bytes > 10000);
}

const complete = errors.length === 0 && gateB.status === 'approved' && gateB.approved === true;
const audit = {
  generatedAt: new Date().toISOString(),
  complete,
  blockingRequirement: complete ? null : 'Gate B explicit human approval is still required.',
  errors,
  requirements
};

await writeJson(auditPath, audit);
await fs.writeFile(
  auditMdPath,
  [
    '# Art Lock Completion Audit',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    `Complete: ${audit.complete ? 'yes' : 'no'}`,
    '',
    `Blocking requirement: ${audit.blockingRequirement ?? 'none'}`,
    '',
    '## Failed Non-Human Requirements',
    '',
    ...(errors.length > 0 ? errors.map((error) => `- ${error}`) : ['- None']),
    '',
    '## Gate State',
    '',
    `- Gate A: ${gateA.status}, approved=${gateA.approved}`,
    `- Gate B: ${gateB.status}, approved=${gateB.approved}`,
    '',
    '## Requirement Summary',
    '',
    ...requirements.map((item) => `- ${item.achieved ? 'PASS' : item.status === 'pending-human-approval' ? 'PENDING' : 'FAIL'} ${item.id}: ${item.description} (${item.evidence})`),
    ''
  ].join('\n'),
  'utf8'
);

if (errors.length > 0) {
  console.error(JSON.stringify(audit, null, 2));
  process.exit(1);
}

console.log(`art:audit PASS ${JSON.stringify({ complete, blockingRequirement: audit.blockingRequirement })}`);

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });

const runner = process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', prefix: [] };

const runNpm = (script) => {
  const result = spawnSync(runner.command, [...runner.prefix, 'run', script], { stdio: 'inherit', shell: false });
  return {
    script,
    passed: result.status === 0,
    status: result.status ?? 1
  };
};

const commandResults = [
  runNpm('art:validate-freeze'),
  runNpm('typecheck'),
  runNpm('test'),
  runNpm('build'),
  runNpm('qa:stage1'),
  runNpm('qa:assets-stage1'),
  runNpm('e2e'),
  runNpm('qa:screenshots-stage1')
];

const byScript = Object.fromEntries(commandResults.map((result) => [result.script, result]));
const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const e2e = readJson(path.join(artifactDir, 'e2e-report.json'), {});
const consoleReport = readJson(path.join(artifactDir, 'console-report.json'), { passed: false });
const qaStage1 = readJson(path.join(artifactDir, 'stage1-qa-report.json'), { passed: false });
const qaAssets = readJson(path.join(artifactDir, 'stage1-assets-qa-report.json'), { passed: false });
const screenshotFiles = [
  'title.png',
  'stage-start.png',
  'wall-kick-shaft.png',
  'combat.png',
  'checkpoint.png',
  'neon-thorn-run.png',
  'lantern-warden.png',
  'stage-clear.png',
  'mobile-390x844.png',
  'console-report.json',
  'e2e-report.json'
];
const screenshotsPresent = screenshotFiles.every((file) => fs.existsSync(path.join(artifactDir, file)));
const e2ePassed = byScript.e2e?.passed === true;
const commandPassed = (script) => byScript[script]?.passed === true;
const acceptance = [
  ['Gate B v2 art used', commandPassed('art:validate-freeze') && qaAssets.passed === true],
  ['no old v1 final runtime art', qaAssets.checks?.find((item) => item.id === 'no-old-gate-b-v1-final-art')?.passed === true],
  ['title flow works', e2ePassed],
  ['Stage1 starts', e2ePassed],
  ['player movement works', e2ePassed],
  ['wall kick works', e2ePassed && qaStage1.passed === true],
  ['slash works', e2ePassed],
  ['checkpoints work', e2ePassed],
  ['enemies work', e2ePassed],
  ['Lantern Warden works', e2ePassed],
  ['Moon Gate clear works', e2ePassed],
  ['StageClear works', e2ePassed],
  ['mobile controls work', e2ePassed],
  ['save works', commandPassed('test')],
  ['E2E keyboard clear passes', e2ePassed],
  ['console report clean', consoleReport.passed === true],
  ['typecheck passes', commandPassed('typecheck')],
  ['tests pass', commandPassed('test')],
  ['build passes', commandPassed('build')],
  ['qa:stage1 passes', commandPassed('qa:stage1')],
  ['qa:assets-stage1 passes', commandPassed('qa:assets-stage1')],
  ['qa:screenshots-stage1 passes', commandPassed('qa:screenshots-stage1') && screenshotsPresent]
];

const allPassed = commandResults.every((result) => result.passed) && acceptance.every(([, passed]) => passed);
const lines = [
  '# Stage1 Acceptance Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Command Results',
  '',
  ...commandResults.map((result) => `- ${result.passed ? 'PASS' : 'FAIL'} npm run ${result.script}`),
  '',
  '## Acceptance',
  '',
  ...acceptance.map(([label, passed]) => `- ${passed ? 'PASS' : 'FAIL'} ${label}`),
  '',
  '## E2E Report',
  '',
  `- Playwright status: ${e2ePassed ? 'PASS' : 'FAIL'}`,
  `- Console report: ${consoleReport.passed === true ? 'PASS' : 'FAIL'}`,
  `- Screenshots present: ${screenshotsPresent ? 'PASS' : 'FAIL'}`,
  '',
  '## Scope Notes',
  '',
  '- Stage 1 only: no Stage 2+, world map, final boss, player dash/projectile, charged slash, or ultimate systems.',
  '- Runtime art path: src/assets/approved-art, traced through src/data/approvedArtManifest.ts.',
  '- Core art regeneration intentionally excluded after Gate B v2 freeze.'
];
fs.writeFileSync(path.join(artifactDir, 'stage1-acceptance-report.md'), `${lines.join('\n')}\n`);

if (!allPassed) {
  console.error(lines.join('\n'));
  process.exit(1);
}

console.log('qa:all-stage1 PASS acceptance report written');

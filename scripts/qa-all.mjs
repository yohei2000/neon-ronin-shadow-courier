import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { writeAcceptanceReport } from './qa-report.mjs';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const commands = [
  { name: 'npm run typecheck', args: ['run', 'typecheck'] },
  { name: 'npm run test', args: ['run', 'test'] },
  { name: 'npm run build', args: ['run', 'build'] },
  { name: 'npm run qa:bundle', args: ['run', 'qa:bundle'] },
  { name: 'npm run e2e', args: ['run', 'e2e'] },
  { name: 'npm run qa:level', args: ['run', 'qa:level'] },
  { name: 'npm run qa:screenshots', args: ['run', 'qa:screenshots'] },
  { name: 'npm run qa:assets', args: ['run', 'qa:assets'], env: { QA_EXPECT_SCREENSHOTS: '1' } }
];

const results = [];

for (const command of commands) {
  console.log(`qa:all running ${command.name}`);
  const env = { ...process.env, ...(command.env ?? {}) };
  const startedAt = Date.now();
  const result =
    process.platform === 'win32'
      ? spawnSync(`${npmCmd} ${command.args.join(' ')}`, {
          stdio: 'inherit',
          env,
          cwd: process.cwd(),
          shell: true,
          windowsHide: true
        })
      : spawnSync(npmCmd, command.args, {
          stdio: 'inherit',
          env,
          cwd: process.cwd()
        });
  if (result.error) {
    console.error(`Failed to start ${command.name}: ${result.error.message}`);
  }
  const status = result.status === 0 ? 'PASS' : 'FAIL';
  results.push({ name: command.name, status, durationMs: Date.now() - startedAt });
  if (result.status !== 0) {
    await writeAcceptanceReport({ commands: results, readmeUpdated: await readmeHasQaEvidence() });
    process.exit(result.status ?? 1);
  }
}

const readmeUpdated = await readmeHasQaEvidence();
const consoleClean = await consoleReportIsClean();
await writeAcceptanceReport({
  commands: [...results, { name: 'npm run qa:all', status: 'PASS', durationMs: results.reduce((sum, item) => sum + item.durationMs, 0) }],
  e2ePass: true,
  levelPass: true,
  assetPass: true,
  consoleClean,
  readmeUpdated
});

if (!readmeUpdated) {
  console.error('README.md does not include required QA screenshot references.');
  process.exit(1);
}
if (!consoleClean) {
  console.error('artifacts/qa/console-report.json is not clean.');
  process.exit(1);
}

console.log('qa:all PASS');

async function readmeHasQaEvidence() {
  try {
    const readme = await readFile('README.md', 'utf8');
    return readme.includes('artifacts/qa/title.png') && readme.includes('npm run qa:all') && !readme.includes('World map');
  } catch {
    return false;
  }
}

async function consoleReportIsClean() {
  try {
    const report = JSON.parse(await readFile('artifacts/qa/console-report.json', 'utf8'));
    return (
      Array.isArray(report.errors) &&
      Array.isArray(report.pageErrors) &&
      Array.isArray(report.failedRequests) &&
      report.errors.length === 0 &&
      report.pageErrors.length === 0 &&
      report.failedRequests.length === 0
    );
  } catch {
    return false;
  }
}

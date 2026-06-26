import { spawnSync } from 'node:child_process';

const commands = [
  ['run', 'art:refs'],
  ['run', 'art:process'],
  ['run', 'art:atlas'],
  ['run', 'art:contact-sheets'],
  ['run', 'art:gate-status'],
  ['run', 'art:screenshots'],
  ['run', 'art:validate-generated'],
  ['run', 'art:validate-assets'],
  ['run', 'art:validate-sign-density'],
  ['run', 'art:validate-animations'],
  ['run', 'art:validate-vfx'],
  ['run', 'art:validate-telegraphs'],
  ['run', 'art:review-report'],
  ['run', 'art:audit']
];

const runner = process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', prefix: [] };

for (const args of commands) {
  const result = spawnSync(runner.command, [...runner.prefix, ...args], { stdio: 'inherit', shell: false });
  if (result.error) {
    console.error(result.error);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('art:all PASS final Art Lock Gate B package is ready for explicit human review.');

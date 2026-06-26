import { spawnSync } from 'node:child_process';

const commands = [
  ['run', 'art:refs'],
  ['run', 'art:process'],
  ['run', 'art:contact-sheets'],
  ['run', 'art:gate-status'],
  ['run', 'art:gate-a-smoke'],
  ['run', 'art:review-report']
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

console.log('art:all PASS gate-a package only; final Art Lock validators are still gated by explicit approval.');

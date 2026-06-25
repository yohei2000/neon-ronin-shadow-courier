import { startVitest } from 'vitest/node';

await startVitest('test', [], {
  root: process.cwd(),
  config: false,
  run: true,
  watch: false,
  dir: 'tests',
  environment: 'node'
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

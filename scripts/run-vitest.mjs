import { startVitest } from 'vitest/node';

await startVitest('test', [], {
  root: process.cwd(),
  config: false,
  run: true,
  watch: false,
  dir: 'tests',
  include: ['**/*.test.ts'],
  exclude: ['tests/e2e/**', 'node_modules/**'],
  environment: 'node'
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

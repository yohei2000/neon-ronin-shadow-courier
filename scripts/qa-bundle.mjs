import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const qaDir = path.resolve('artifacts', 'qa');
const assetsDir = path.resolve('dist', 'assets');
const errors = [];
const maxAppChunkBytes = 220_000;

function assert(condition, message) {
  if (!condition) errors.push(message);
}

let entries = [];
try {
  entries = await readdir(assetsDir);
} catch {
  errors.push('dist/assets does not exist. Run npm run build before npm run qa:bundle.');
}

const jsChunks = [];
for (const entry of entries.filter((file) => file.endsWith('.js'))) {
  const info = await stat(path.join(assetsDir, entry));
  jsChunks.push({ file: entry, bytes: info.size });
}

const vendorChunks = jsChunks.filter((chunk) => chunk.file.startsWith('vendor-phaser-'));
const appChunks = jsChunks.filter((chunk) => !chunk.file.startsWith('vendor-phaser-'));
const largestAppChunkBytes = appChunks.reduce((largest, chunk) => Math.max(largest, chunk.bytes), 0);

assert(jsChunks.length >= 2, 'Build should emit at least one app chunk and one Phaser vendor chunk.');
assert(vendorChunks.length === 1, 'Build should emit exactly one vendor-phaser JS chunk.');
assert(appChunks.length >= 1, 'Build should emit at least one app JS chunk.');
assert(largestAppChunkBytes > 0 && largestAppChunkBytes <= maxAppChunkBytes, `Largest app JS chunk exceeds ${maxAppChunkBytes} bytes.`);

const report = {
  valid: errors.length === 0,
  errors,
  maxAppChunkBytes,
  metrics: {
    jsChunkCount: jsChunks.length,
    vendorChunkCount: vendorChunks.length,
    appChunkCount: appChunks.length,
    largestAppChunkBytes,
    totalJsBytes: jsChunks.reduce((sum, chunk) => sum + chunk.bytes, 0)
  },
  chunks: jsChunks.sort((a, b) => b.bytes - a.bytes)
};

await mkdir(qaDir, { recursive: true });
await writeFile(path.join(qaDir, 'bundle-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`qa:bundle PASS ${JSON.stringify(report.metrics)}`);

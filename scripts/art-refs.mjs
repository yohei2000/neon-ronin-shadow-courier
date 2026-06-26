import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, readPngInfo, referenceDir, rootDir, writeJson } from './art-lib.mjs';

const required = [
  'index.md',
  'a.md',
  'a.png',
  'b.md',
  'b.png',
  'c.md',
  'c.png',
  'd.md',
  'd.png',
  'e.md',
  'e.png',
  'f.md',
  'f.png',
  'g.md',
  'g.png',
  'h.md',
  'h.png'
];

const report = {
  generatedAt: new Date().toISOString(),
  referenceDir: path.relative(rootDir, referenceDir).replaceAll('\\', '/'),
  files: [],
  valid: true,
  errors: []
};

for (const file of required) {
  const fullPath = path.join(referenceDir, file);
  try {
    const stat = await fs.stat(fullPath);
    const entry = {
      file,
      bytes: stat.size,
      present: true
    };
    if (file.endsWith('.png')) {
      Object.assign(entry, await readPngInfo(fullPath));
      if (entry.width < 960 || entry.height < 540) {
        report.valid = false;
        report.errors.push(`${file} is below expected reference-sheet resolution.`);
      }
    }
    if (file.endsWith('.md')) {
      const text = await fs.readFile(fullPath, 'utf8');
      entry.heading = text.split(/\r?\n/).find((line) => line.startsWith('# ')) ?? '';
      if (!text.includes('## 実装で残す要素') && file !== 'index.md') {
        report.valid = false;
        report.errors.push(`${file} does not include implementation elements section.`);
      }
    }
    report.files.push(entry);
  } catch (error) {
    report.valid = false;
    report.errors.push(`${file} missing or unreadable: ${error.message}`);
    report.files.push({ file, present: false });
  }
}

await ensureDir(path.join(rootDir, 'art', 'reviews', 'gate-a'));
await writeJson(path.join(rootDir, 'art', 'reference-audit.json'), report);

if (!report.valid) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`art:refs PASS ${JSON.stringify({ files: report.files.length })}`);

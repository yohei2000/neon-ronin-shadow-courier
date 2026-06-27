import fs from 'node:fs/promises';
import path from 'node:path';
import { rootDir, writeJson } from './art-lib.mjs';

const errors = [];
const checked = [];
const productionDir = path.join(rootDir, 'src', 'assets', 'approved-art');
const manifestPath = path.join(rootDir, 'src', 'data', 'approvedArtManifest.ts');
const runtimeMapPath = path.join(rootDir, 'src', 'data', 'artAssets.ts');

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

async function assertSameBytes(leftRelative, rightRelative, key) {
  const [left, right] = await Promise.all([
    fs.readFile(path.join(rootDir, leftRelative)),
    fs.readFile(path.join(rootDir, rightRelative))
  ]);
  const same = left.length === right.length && left.equals(right);
  checked.push({ key, productionPath: leftRelative, approvedSourcePath: rightRelative, bytes: left.length, same });
  if (!same) errors.push(`${key} production copy does not match ${rightRelative}.`);
}

const gateBv2 = await readJson('art/approvals/GATE_B_V2_STATUS.json');
if (gateBv2.status !== 'approved' || gateBv2.approved !== true) {
  errors.push('Gate B v2 must be approved before freezing production art assets.');
}

const sourceManifest = await readJson('art/asset-manifest.json');
const runtimeAssets = (sourceManifest.assets ?? []).filter((asset) => asset.runtime === true);
const manifestText = await fs.readFile(manifestPath, 'utf8');
const runtimeMapText = await fs.readFile(runtimeMapPath, 'utf8');

if (runtimeMapText.includes('art/final-v2/assets')) {
  errors.push('Runtime art map still imports directly from art/final-v2/assets instead of the approved production path.');
}
if (!runtimeMapText.includes('ApprovedArtUrlByKey')) {
  errors.push('Runtime art map does not use ApprovedArtUrlByKey.');
}
if (!runtimeMapText.includes('EnvironmentKey')) {
  errors.push('Runtime art map does not expose the approved environment-key asset for Stage1.');
}

const productionFiles = (await fs.readdir(productionDir)).filter((file) => file.endsWith('.png')).sort();
if (productionFiles.length !== runtimeAssets.length) {
  errors.push(`Production approved-art file count ${productionFiles.length} does not match runtime asset count ${runtimeAssets.length}.`);
}

for (const asset of runtimeAssets) {
  const fileName = `${asset.key}.png`;
  const productionPath = `src/assets/approved-art/${fileName}`;
  const approvedSourcePath = `art/final-v2/assets/${fileName}`;
  if (asset.file !== approvedSourcePath) {
    errors.push(`${asset.key} source manifest points at ${asset.file}, expected ${approvedSourcePath}.`);
  }
  if (!(await exists(productionPath))) errors.push(`${asset.key} missing production copy ${productionPath}.`);
  if (!(await exists(approvedSourcePath))) errors.push(`${asset.key} missing approved source ${approvedSourcePath}.`);
  if ((await exists(productionPath)) && (await exists(approvedSourcePath))) {
    await assertSameBytes(productionPath, approvedSourcePath, asset.key);
  }

  const entryPattern = new RegExp(`key: '${asset.key}',[\\s\\S]*?runtimeUrl: approvedArtUrl\\('${fileName}'\\)`, 'm');
  const entryMatch = manifestText.match(entryPattern);
  if (!entryMatch) {
    errors.push(`${asset.key} missing from approvedArtManifest.ts.`);
    continue;
  }
  const entryText = entryMatch[0];
  if (!entryText.includes(`productionPath: '${productionPath}'`)) {
    errors.push(`${asset.key} manifest productionPath is not ${productionPath}.`);
  }
  if (!entryText.includes(`approvedSourcePath: '${approvedSourcePath}'`)) {
    errors.push(`${asset.key} manifest approvedSourcePath is not ${approvedSourcePath}.`);
  }
  const lineageMatch = entryText.match(/lineagePath: '([^']+)'/);
  const lineagePath = lineageMatch?.[1] ?? '';
  if (!lineagePath.startsWith('art/source/') && !lineagePath.startsWith('art/final-v2/')) {
    errors.push(`${asset.key} lineagePath must map back to art/source or art/final-v2.`);
  } else if (!(await exists(lineagePath))) {
    errors.push(`${asset.key} lineagePath does not exist: ${lineagePath}.`);
  }
  if (!entryText.includes('stage1Runtime: true')) {
    errors.push(`${asset.key} must be marked stage1Runtime: true.`);
  }
}

await writeJson(path.join(rootDir, 'art', 'final-v2', 'approved-art-freeze-validation-report.json'), {
  generatedAt: new Date().toISOString(),
  valid: errors.length === 0,
  productionDir: 'src/assets/approved-art',
  sourceManifest: 'art/asset-manifest.json',
  approvedManifest: 'src/data/approvedArtManifest.ts',
  checked,
  errors
});

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

console.log(`art:validate-freeze PASS ${JSON.stringify({ assets: checked.length, productionDir: 'src/assets/approved-art' })}`);

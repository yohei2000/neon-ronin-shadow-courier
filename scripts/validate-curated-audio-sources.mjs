import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = join(ROOT, 'audio', 'curated-audio-sources.json');
const SOURCE_ROOT = join(ROOT, 'audio', 'curated-sources');
const toPosix = (value) => value.replaceAll('\\', '/');
const fail = (message) => {
  throw new Error(`Curated audio source validation failed: ${message}`);
};

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const walkWavs = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkWavs(absolutePath)));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.wav') files.push(absolutePath);
  }
  return files;
};

const parseWavHeader = (buffer, path) => {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    fail(`${path} is not a RIFF/WAVE file.`);
  }

  let offset = 12;
  let format = null;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkOffset = offset + 8;
    if (chunkId === 'fmt ' && chunkSize >= 16) {
      format = {
        audioFormat: buffer.readUInt16LE(chunkOffset),
        channels: buffer.readUInt16LE(chunkOffset + 2),
        sampleRate: buffer.readUInt32LE(chunkOffset + 4),
        bitsPerSample: buffer.readUInt16LE(chunkOffset + 14)
      };
      break;
    }
    offset = chunkOffset + chunkSize + (chunkSize % 2);
  }
  if (!format) fail(`${path} has no PCM format chunk.`);
  return format;
};

const matchesPack = (pack, masterId) =>
  (pack.masterNames ?? []).includes(masterId) || (pack.masterPrefixes ?? []).some((prefix) => masterId.startsWith(prefix));

const manifest = await readJson(MANIFEST_PATH);
if (manifest.schemaVersion !== 1) fail(`Unsupported manifest schema ${manifest.schemaVersion}.`);
if (manifest.license !== 'CC0-1.0' || manifest.licenseUrl !== 'https://creativecommons.org/publicdomain/zero/1.0/') {
  fail('The manifest must pin all curated sources to CC0 1.0.');
}
if (!Array.isArray(manifest.sourcePacks) || manifest.sourcePacks.length === 0) fail('No source packs are declared.');

const packIds = new Set();
for (const pack of manifest.sourcePacks) {
  if (!pack.id || packIds.has(pack.id)) fail(`Invalid or duplicate source pack id ${pack.id}.`);
  packIds.add(pack.id);
  if (!pack.title || !pack.author || !pack.pageUrl?.startsWith('https://')) fail(`${pack.id} has incomplete provenance.`);
  if (pack.license !== manifest.license) fail(`${pack.id} is not declared as ${manifest.license}.`);
  if (!Array.isArray(pack.downloads) || pack.downloads.length === 0) fail(`${pack.id} has no pinned download.`);
  for (const download of pack.downloads) {
    if (!download.fileName || !download.url?.startsWith('https://') || !/^[a-f0-9]{64}$/.test(download.sha256)) {
      fail(`${pack.id} has an incomplete or invalid pinned download.`);
    }
  }
}

const integrityPath = join(ROOT, ...manifest.integrityReport.split('/'));
const integrity = await readJson(integrityPath);
if (integrity.sampleRate !== 48_000) fail(`Integrity report sample rate is ${integrity.sampleRate}.`);
const records = [...(integrity.oneShots ?? []), ...(integrity.loops ?? []), ...(integrity.music ?? [])];
if (records.length === 0) fail('Integrity report contains no curated masters.');

const expectedPaths = new Set();
const packUseCounts = new Map(manifest.sourcePacks.map((pack) => [pack.id, 0]));
for (const record of records) {
  const normalizedPath = toPosix(record.path ?? '');
  if (!normalizedPath.startsWith('audio/curated-sources/') || expectedPaths.has(normalizedPath)) {
    fail(`Invalid or duplicate curated master path ${normalizedPath}.`);
  }
  expectedPaths.add(normalizedPath);
  if (record.sampleRate !== 48_000 || ![1, 2].includes(record.channels) || !/^[a-f0-9]{64}$/.test(record.sha256 ?? '')) {
    fail(`${normalizedPath} has invalid integrity metadata.`);
  }
  if (!record.sourceFile || !/^[a-f0-9]{64}$/.test(record.sourceSha256 ?? '')) {
    fail(`${normalizedPath} is missing its upstream source identity.`);
  }

  const masterId = basename(normalizedPath, '.wav');
  const matchingPacks = manifest.sourcePacks.filter((pack) => matchesPack(pack, masterId));
  if (matchingPacks.length !== 1) fail(`${normalizedPath} maps to ${matchingPacks.length} source packs; expected exactly one.`);
  const pack = matchingPacks[0];
  packUseCounts.set(pack.id, packUseCounts.get(pack.id) + 1);

  const directDownload = pack.downloads.find((download) => download.fileName === record.sourceFile);
  if (directDownload && directDownload.sha256 !== record.sourceSha256) {
    fail(`${normalizedPath} does not match the pinned hash for ${record.sourceFile}.`);
  }

  const absolutePath = join(ROOT, ...normalizedPath.split('/'));
  const buffer = await readFile(absolutePath);
  if (sha256(buffer) !== record.sha256) fail(`${normalizedPath} hash differs from the integrity report.`);
  const format = parseWavHeader(buffer, normalizedPath);
  if (format.audioFormat !== 1 || format.sampleRate !== 48_000 || format.bitsPerSample !== 16 || ![1, 2].includes(format.channels)) {
    fail(`${normalizedPath} must be 48 kHz, 16-bit integer PCM, mono or stereo.`);
  }
}

const actualPaths = new Set(
  (await walkWavs(SOURCE_ROOT)).map((absolutePath) => toPosix(relative(ROOT, absolutePath)))
);
const missing = [...expectedPaths].filter((path) => !actualPaths.has(path));
const unexpected = [...actualPaths].filter((path) => !expectedPaths.has(path));
if (missing.length || unexpected.length) {
  fail(`Source set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
}
for (const [packId, count] of packUseCounts) {
  if (count === 0) fail(`${packId} is declared but does not own any curated master.`);
}

console.log(
  `Curated audio source validation PASS: ${records.length} masters, ${manifest.sourcePacks.length} CC0 source packs, all hashes verified.`
);

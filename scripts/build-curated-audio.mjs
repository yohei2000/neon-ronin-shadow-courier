import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 48_000;
const BIT_DEPTH = 16;
const MAX_PEAK = 0.94;
const TAU = Math.PI * 2;
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE_DIR = join(ROOT, 'audio', 'curated-sources');
const OUT_DIR = join(ROOT, 'src', 'assets', 'audio');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => {
  const amount = clamp(value, 0, 1);
  return amount * amount * (3 - 2 * amount);
};
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

const hashString = (text) => {
  let hash = 0x811c9dc5;
  for (const character of text) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const hashUnit = (index, seed) => {
  let value = (index | 0) ^ (seed | 0);
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
};

const walkWavs = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkWavs(absolutePath));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.wav') files.push(absolutePath);
  }
  return files;
};

const sourcePaths = new Map();
for (const absolutePath of walkWavs(SOURCE_DIR)) {
  const id = basename(absolutePath, '.wav');
  if (sourcePaths.has(id)) throw new Error(`Duplicate curated source id: ${id}`);
  sourcePaths.set(id, absolutePath);
}

const parseWav = (absolutePath) => {
  const buffer = readFileSync(absolutePath);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`Not a RIFF/WAVE source: ${absolutePath}`);
  }

  let offset = 12;
  let format = null;
  let dataOffset = null;
  let dataSize = null;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;
    if (chunkId === 'fmt ') {
      format = {
        audioFormat: buffer.readUInt16LE(chunkDataOffset),
        channels: buffer.readUInt16LE(chunkDataOffset + 2),
        sampleRate: buffer.readUInt32LE(chunkDataOffset + 4),
        bitDepth: buffer.readUInt16LE(chunkDataOffset + 14)
      };
    } else if (chunkId === 'data') {
      dataOffset = chunkDataOffset;
      dataSize = Math.min(chunkSize, buffer.length - chunkDataOffset);
    }
    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (!format || dataOffset === null || dataSize === null) throw new Error(`Incomplete WAV source: ${absolutePath}`);
  if (format.audioFormat !== 1 || format.sampleRate !== SAMPLE_RATE || format.bitDepth !== BIT_DEPTH) {
    throw new Error(`Curated source must be 48 kHz 16-bit PCM: ${absolutePath}`);
  }
  if (format.channels !== 1 && format.channels !== 2) throw new Error(`Unsupported source channel count: ${absolutePath}`);

  const sampleCount = Math.floor(dataSize / 2);
  const samples = new Float64Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = buffer.readInt16LE(dataOffset + index * 2) / 32_768;
  }
  return {
    channels: format.channels,
    frameCount: Math.floor(sampleCount / format.channels),
    samples
  };
};

const sourceCache = new Map();
const processedCache = new Map();

const getSource = (id) => {
  if (sourceCache.has(id)) return sourceCache.get(id);
  const absolutePath = sourcePaths.get(id);
  if (!absolutePath) throw new Error(`Unknown curated source: ${id}`);
  const source = parseWav(absolutePath);
  sourceCache.set(id, source);
  return source;
};

const lowPass = (audio, cutoffHz) => {
  const samples = new Float64Array(audio.samples.length);
  const alpha = 1 - Math.exp((-TAU * cutoffHz) / SAMPLE_RATE);
  for (let channel = 0; channel < audio.channels; channel += 1) {
    let state = audio.samples[channel];
    for (let frame = 0; frame < audio.frameCount; frame += 1) {
      const offset = frame * audio.channels + channel;
      state += alpha * (audio.samples[offset] - state);
      samples[offset] = state;
    }
  }
  return { ...audio, samples };
};

const highPass = (audio, cutoffHz) => {
  const samples = new Float64Array(audio.samples.length);
  const coefficient = Math.exp((-TAU * cutoffHz) / SAMPLE_RATE);
  for (let channel = 0; channel < audio.channels; channel += 1) {
    let previousInput = audio.samples[channel];
    let previousOutput = 0;
    for (let frame = 0; frame < audio.frameCount; frame += 1) {
      const offset = frame * audio.channels + channel;
      const input = audio.samples[offset];
      const output = coefficient * (previousOutput + input - previousInput);
      samples[offset] = output;
      previousInput = input;
      previousOutput = output;
    }
  }
  return { ...audio, samples };
};

const getProcessedSource = (id, lowPassHz, highPassHz) => {
  const cacheKey = `${id}:${lowPassHz ?? 0}:${highPassHz ?? 0}`;
  if (processedCache.has(cacheKey)) return processedCache.get(cacheKey);
  let audio = getSource(id);
  if (lowPassHz) audio = lowPass(audio, lowPassHz);
  if (highPassHz) audio = highPass(audio, highPassHz);
  processedCache.set(cacheKey, audio);
  return audio;
};

const createAudio = (duration, channels) => {
  const frameCount = Math.round(duration * SAMPLE_RATE);
  return { channels, frameCount, samples: new Float64Array(frameCount * channels) };
};

const sourceSample = (audio, framePosition, channel) => {
  const frameA = Math.floor(framePosition);
  const frameB = Math.min(audio.frameCount - 1, frameA + 1);
  const amount = framePosition - frameA;
  const channelIndex = Math.min(channel, audio.channels - 1);
  const sampleA = audio.samples[frameA * audio.channels + channelIndex];
  const sampleB = audio.samples[frameB * audio.channels + channelIndex];
  return sampleA + (sampleB - sampleA) * amount;
};

const mixLayer = (destination, layer) => {
  const source = getProcessedSource(layer.id, layer.lowPassHz, layer.highPassHz);
  const startFrame = Math.round((layer.start ?? 0) * SAMPLE_RATE);
  const sourceOffsetFrames = Math.round((layer.sourceOffset ?? 0) * SAMPLE_RATE);
  const rate = layer.rate ?? 1;
  const gain = layer.gain ?? 1;
  const panPosition = clamp(layer.pan ?? 0, -1, 1);
  const panAngle = (panPosition + 1) * Math.PI * 0.25;
  const leftPan = Math.cos(panAngle) * Math.SQRT2;
  const rightPan = Math.sin(panAngle) * Math.SQRT2;

  for (let destinationFrame = Math.max(0, startFrame); destinationFrame < destination.frameCount; destinationFrame += 1) {
    const localFrame = destinationFrame - startFrame;
    let sourceFrame = sourceOffsetFrames + localFrame * rate;
    if (layer.reverse) sourceFrame = source.frameCount - 1 - sourceFrame;
    if (layer.repeat) sourceFrame = mod(sourceFrame, source.frameCount);
    if (sourceFrame < 0 || sourceFrame >= source.frameCount - 1) {
      if (!layer.repeat) break;
      continue;
    }

    if (destination.channels === 1) {
      const value = source.channels === 1
        ? sourceSample(source, sourceFrame, 0)
        : (sourceSample(source, sourceFrame, 0) + sourceSample(source, sourceFrame, 1)) * 0.5;
      destination.samples[destinationFrame] += value * gain;
      continue;
    }

    if (source.channels === 1) {
      const value = sourceSample(source, sourceFrame, 0) * gain;
      const offset = destinationFrame * 2;
      destination.samples[offset] += value * leftPan;
      destination.samples[offset + 1] += value * rightPan;
      continue;
    }

    const offset = destinationFrame * 2;
    destination.samples[offset] += sourceSample(source, sourceFrame, 0) * gain * (panPosition > 0 ? 1 - panPosition * 0.72 : 1);
    destination.samples[offset + 1] += sourceSample(source, sourceFrame, 1) * gain * (panPosition < 0 ? 1 + panPosition * 0.72 : 1);
  }
};

const removeDc = (audio, oneShot) => {
  for (let channel = 0; channel < audio.channels; channel += 1) {
    let mean = 0;
    for (let frame = 0; frame < audio.frameCount; frame += 1) mean += audio.samples[frame * audio.channels + channel];
    mean /= audio.frameCount;
    if (!oneShot) {
      for (let frame = 0; frame < audio.frameCount; frame += 1) audio.samples[frame * audio.channels + channel] -= mean;
      continue;
    }

    const coefficient = Math.exp((-TAU * 18) / SAMPLE_RATE);
    let previousInput = 0;
    let previousOutput = 0;
    for (let frame = 0; frame < audio.frameCount; frame += 1) {
      const offset = frame * audio.channels + channel;
      const input = audio.samples[offset] - mean;
      const output = input - previousInput + coefficient * previousOutput;
      audio.samples[offset] = output;
      previousInput = input;
      previousOutput = output;
    }
  }
};

const fadeOneShot = (audio, attackSeconds = 0.004, releaseSeconds = 0.035) => {
  const attackFrames = Math.min(audio.frameCount, Math.max(1, Math.round(attackSeconds * SAMPLE_RATE)));
  const releaseFrames = Math.min(audio.frameCount, Math.max(1, Math.round(releaseSeconds * SAMPLE_RATE)));
  for (let frame = 0; frame < audio.frameCount; frame += 1) {
    const attack = smooth(frame / attackFrames);
    const release = smooth((audio.frameCount - 1 - frame) / releaseFrames);
    const window = Math.min(attack, release);
    for (let channel = 0; channel < audio.channels; channel += 1) {
      audio.samples[frame * audio.channels + channel] *= window;
    }
  }
};

const repairIsolatedSteps = (audio) => {
  const threshold = 0.032;
  const ratio = 1.9;
  for (let pass = 0; pass < 16; pass += 1) {
    const previous = new Float64Array(audio.samples);
    let repaired = 0;
    for (let channel = 0; channel < audio.channels; channel += 1) {
      for (let frame = 2; frame < audio.frameCount - 1; frame += 1) {
        const beforeBefore = previous[(frame - 2) * audio.channels + channel];
        const before = previous[(frame - 1) * audio.channels + channel];
        const current = previous[frame * audio.channels + channel];
        const after = previous[(frame + 1) * audio.channels + channel];
        const step = Math.abs(current - before);
        const neighborStep = Math.max(Math.abs(before - beforeBefore), Math.abs(after - current), 1e-7);
        if (step > threshold && step / neighborStep > ratio) {
          audio.samples[frame * audio.channels + channel] = (before + after) * 0.5;
          repaired += 1;
        }
      }
    }
    if (repaired === 0) break;
  }
};

const stabilizeStereoLowBand = (audio, cutoffHz = 260) => {
  if (audio.channels !== 2) return;
  const low = lowPass(audio, cutoffHz);
  let leftEnergy = 0;
  let rightEnergy = 0;
  for (let frame = 0; frame < audio.frameCount; frame += 1) {
    const offset = frame * 2;
    leftEnergy += low.samples[offset] ** 2;
    rightEnergy += low.samples[offset + 1] ** 2;
  }
  const referenceChannel = leftEnergy >= rightEnergy ? 0 : 1;
  for (let frame = 0; frame < audio.frameCount; frame += 1) {
    const offset = frame * 2;
    const lowLeft = low.samples[offset];
    const lowRight = low.samples[offset + 1];
    const mono = low.samples[offset + referenceChannel];
    audio.samples[offset] += mono - lowLeft;
    audio.samples[offset + 1] += mono - lowRight;
  }
};

const narrowStereo = (audio, width = 0.48) => {
  if (audio.channels !== 2) return;
  for (let frame = 0; frame < audio.frameCount; frame += 1) {
    const offset = frame * 2;
    const mid = (audio.samples[offset] + audio.samples[offset + 1]) * 0.5;
    const side = (audio.samples[offset] - audio.samples[offset + 1]) * 0.5 * width;
    audio.samples[offset] = mid + side;
    audio.samples[offset + 1] = mid - side;
  }
};

const measureRmsDb = (audio) => {
  let energy = 0;
  for (const sample of audio.samples) energy += sample * sample;
  const rms = Math.sqrt(energy / Math.max(1, audio.samples.length));
  return 20 * Math.log10(Math.max(rms, 1e-9));
};

const normalizePeak = (audio, targetPeak) => {
  let peak = 0;
  for (const sample of audio.samples) peak = Math.max(peak, Math.abs(sample));
  if (peak <= 1e-9) return;
  const gain = targetPeak / peak;
  for (let index = 0; index < audio.samples.length; index += 1) audio.samples[index] *= gain;
};

// A stereo-linked, look-ahead density compressor lowers isolated transients
// without flattening the body or shifting the left/right image. Peak
// normalization then restores headroom. This keeps field recordings and
// mastered CC0 music audible at gameplay levels without hard clipping them.
const compressDensity = (audio, thresholdDb, ratio, releaseMs) => {
  const frameLevels = new Float64Array(audio.frameCount);
  for (let frame = 0; frame < audio.frameCount; frame += 1) {
    let level = 0;
    for (let channel = 0; channel < audio.channels; channel += 1) {
      level = Math.max(level, Math.abs(audio.samples[frame * audio.channels + channel]));
    }
    frameLevels[frame] = level;
  }

  const decay = Math.exp(-1 / Math.max(1, (releaseMs / 1_000) * SAMPLE_RATE));
  const envelope = new Float64Array(audio.frameCount);
  let level = 0;
  for (let frame = 0; frame < audio.frameCount; frame += 1) {
    level = Math.max(frameLevels[frame], level * decay);
    envelope[frame] = level;
  }
  level = 0;
  for (let frame = audio.frameCount - 1; frame >= 0; frame -= 1) {
    level = Math.max(frameLevels[frame], level * decay);
    envelope[frame] = Math.max(envelope[frame], level);
  }

  for (let frame = 0; frame < audio.frameCount; frame += 1) {
    const levelDb = 20 * Math.log10(Math.max(envelope[frame], 1e-9));
    const compressedDb = levelDb > thresholdDb
      ? thresholdDb + (levelDb - thresholdDb) / ratio
      : levelDb;
    const gain = 10 ** ((compressedDb - levelDb) / 20);
    for (let channel = 0; channel < audio.channels; channel += 1) {
      audio.samples[frame * audio.channels + channel] *= gain;
    }
  }
};

const densifyToTarget = (audio, targetRmsDb, targetPeak, loop) => {
  if (typeof targetRmsDb !== 'number') return;
  const releaseMs = loop ? 150 : 55;
  for (let pass = 0; pass < 3 && measureRmsDb(audio) < targetRmsDb - 0.3; pass += 1) {
    compressDensity(audio, targetRmsDb + 2 - pass * 1.5, 2.7 + pass * 0.45, releaseMs);
    normalizePeak(audio, targetPeak);
  }
};

const conditionLoopSeam = (audio) => {
  const repairFrames = Math.min(Math.round(SAMPLE_RATE * 0.02), Math.floor(audio.frameCount / 10));
  for (let channel = 0; channel < audio.channels; channel += 1) {
    const first = audio.samples[channel];
    const second = audio.samples[audio.channels + channel];
    const penultimate = audio.samples[(audio.frameCount - 2) * audio.channels + channel];
    const last = audio.samples[(audio.frameCount - 1) * audio.channels + channel];
    const midpoint = (first + last) * 0.5;
    const slope = ((second - first) + (last - penultimate)) * 0.5;

    const repairBoundary = (reverse, desiredSlope) => {
      const indexAt = (frame) => (reverse ? audio.frameCount - 1 - frame : frame) * audio.channels + channel;
      const value0 = audio.samples[indexAt(0)];
      const value1 = audio.samples[indexAt(1)];
      const correction0 = midpoint - value0;
      const slopeCorrection = desiredSlope - (value1 - value0);
      const slopeRepairFrames = Math.min(repairFrames, 24);
      for (let frame = 0; frame < repairFrames; frame += 1) {
        const amount = frame / Math.max(1, repairFrames - 1);
        const amount2 = amount * amount;
        const amount3 = amount2 * amount;
        const valueWeight = 2 * amount3 - 3 * amount2 + 1;
        let slopeRepair = 0;
        if (frame < slopeRepairFrames) {
          const slopeAmount = frame / Math.max(1, slopeRepairFrames - 1);
          const slopeAmount2 = slopeAmount * slopeAmount;
          const slopeAmount3 = slopeAmount2 * slopeAmount;
          const slopeWeight = slopeAmount3 - 2 * slopeAmount2 + slopeAmount;
          slopeRepair = slopeWeight * slopeCorrection * Math.max(1, slopeRepairFrames - 1);
        }
        audio.samples[indexAt(frame)] += valueWeight * correction0 + slopeRepair;
      }
    };

    repairBoundary(false, slope);
    repairBoundary(true, -slope);
    audio.samples[channel] = midpoint;
    audio.samples[audio.channels + channel] = midpoint + slope;
    audio.samples[(audio.frameCount - 2) * audio.channels + channel] = midpoint - slope;
    audio.samples[(audio.frameCount - 1) * audio.channels + channel] = midpoint;
  }
};

const conditionAudio = (audio, { loop, targetPeak, targetRmsDb, drive = 1.12, fadeIn, fadeOut, repairSteps = false }) => {
  removeDc(audio, !loop);
  if (!loop) fadeOneShot(audio, fadeIn, fadeOut);
  const denominator = Math.tanh(drive);
  let peak = 0;
  for (let index = 0; index < audio.samples.length; index += 1) {
    const value = Math.tanh(audio.samples[index] * drive) / denominator;
    audio.samples[index] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const safeTarget = Math.min(targetPeak, MAX_PEAK - 0.01);
  const normalization = peak > 1e-9 ? safeTarget / peak : 1;
  for (let index = 0; index < audio.samples.length; index += 1) audio.samples[index] *= normalization;
  if (!loop) densifyToTarget(audio, targetRmsDb, safeTarget, false);
  removeDc(audio, !loop);
  if (loop) {
    stabilizeStereoLowBand(audio);
    narrowStereo(audio);
    densifyToTarget(audio, targetRmsDb, safeTarget, true);
    if (repairSteps) repairIsolatedSteps(audio);
    conditionLoopSeam(audio);
    removeDc(audio, false);
  } else if (repairSteps) repairIsolatedSteps(audio);

  if (typeof targetRmsDb === 'number') {
    const currentRmsDb = measureRmsDb(audio);
    if (currentRmsDb > targetRmsDb) {
      const trim = 10 ** ((targetRmsDb - currentRmsDb) / 20);
      for (let index = 0; index < audio.samples.length; index += 1) audio.samples[index] *= trim;
    }
  }

  peak = 0;
  for (const sample of audio.samples) peak = Math.max(peak, Math.abs(sample));
  if (peak > MAX_PEAK - 0.005) {
    const limiter = (MAX_PEAK - 0.005) / peak;
    for (let index = 0; index < audio.samples.length; index += 1) audio.samples[index] *= limiter;
  }
};

const writeWav = (name, audio, loop) => {
  const bytesPerSample = BIT_DEPTH / 8;
  const dataSize = audio.frameCount * audio.channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(audio.channels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * audio.channels * bytesPerSample, 28);
  buffer.writeUInt16LE(audio.channels * bytesPerSample, 32);
  buffer.writeUInt16LE(BIT_DEPTH, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const ditherSeed = hashString(`curated:${name}`);
  for (let index = 0; index < audio.samples.length; index += 1) {
    const dither = (hashUnit(index * 2, ditherSeed) - hashUnit(index * 2 + 1, ditherSeed)) / 65_536;
    const sample = clamp(audio.samples[index] + dither, -1, 1);
    buffer.writeInt16LE(Math.round(sample < 0 ? sample * 32_768 : sample * 32_767), 44 + index * 2);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileWithRetry(join(OUT_DIR, `${name}.wav`), buffer);
  return {
    name,
    channels: audio.channels,
    frames: audio.frameCount,
    durationSeconds: audio.frameCount / SAMPLE_RATE,
    loop
  };
};

const results = [];
const retryWait = new Int32Array(new SharedArrayBuffer(4));

const writeFileWithRetry = (path, buffer) => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      writeFileSync(path, buffer);
      return;
    } catch (error) {
      const retryable = ['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(error?.code);
      if (!retryable || attempt === 11) throw error;
      Atomics.wait(retryWait, 0, 0, Math.min(500, 35 * 2 ** attempt));
    }
  }
};

const targetRmsByName = {
  'stage1-jump': -15.5,
  'stage1-jump-alt': -15.5,
  'stage1-wall-kick': -16,
  'stage1-wall-kick-alt': -16,
  'stage1-footstep-a': -17,
  'stage1-footstep-b': -17,
  'stage1-land-soft': -17,
  'stage1-land-heavy': -14,
  'stage1-wall-slide-loop': -17,
  'stage1-attack': -13.5,
  'stage1-attack-alt-a': -13.5,
  'stage1-attack-alt-b': -13.5,
  'stage1-spin-attack': -13,
  'stage1-hit-light-a': -14.5,
  'stage1-hit-light-b': -14.5,
  'stage1-hit-heavy': -13,
  'stage1-enemy-defeat': -13.5,
  'stage1-enemy-defeat-wraith': -14,
  'stage1-player-hurt': -14,
  'stage1-player-hurt-alt': -14,
  'stage1-pickup-seal': -15,
  'stage1-pickup-seal-alt': -15,
  'stage1-pickup-scroll': -15,
  'stage1-pickup-health': -14.5,
  'stage1-pickup-energy': -14.5,
  'stage1-checkpoint': -12.5,
  'stage1-warden-attack': -14,
  'stage1-warden-projectile': -12.5,
  'stage1-warden-hit': -14,
  'stage1-warden-defeat': -12.5,
  'stage2-shadow-thread-launch': -14,
  'stage2-shadow-thread-hit': -13,
  'stage2-relay-attack': -12.5,
  'stage2-relay-projectile': -12.5,
  'stage2-relay-hit': -14,
  'stage2-relay-defeat': -12.5,
  'ui-move': -16,
  'ui-confirm': -13.5,
  'ui-back': -16,
  'ui-pause': -15,
  'game-over': -13.5,
  respawn: -14,
  'stage1-stage-clear': -13,
  'ambience-updraft-loop': -16,
  'music-menu': -14,
  'ambience-stage1': -19,
  'music-stage1-base': -14.5,
  'music-stage1-combat': -16,
  'ambience-stage2': -18,
  'music-stage2-base': -15,
  'music-stage2-combat': -16.5,
  'music-stage-clear': -15
};

const render = ({ name, duration, channels = 1, layers, loop = false, targetPeak = loop ? 0.78 : 0.89, drive, fadeIn, fadeOut }) => {
  const audio = createAudio(duration, channels);
  for (const layer of layers) mixLayer(audio, layer);
  conditionAudio(audio, { loop, targetPeak, targetRmsDb: targetRmsByName[name], drive, fadeIn, fadeOut });
  results.push(writeWav(name, audio, loop));
};

const oneShots = [
  { name: 'stage1-jump', duration: 0.52, layers: [
    { id: 'boots-jump', gain: 0.68 }, { id: 'whoosh-body-1', gain: 0.32, rate: 1.08 }, { id: 'rpg-cloth-1', gain: 0.18, start: 0.018 }
  ] },
  { name: 'stage1-jump-alt', duration: 0.56, layers: [
    { id: 'boots-jump', gain: 0.62, rate: 0.94 }, { id: 'whoosh-body-2', gain: 0.36, rate: 0.98 }, { id: 'rpg-cloth-3', gain: 0.2, start: 0.014 }
  ] },
  { name: 'stage1-wall-kick', duration: 0.54, layers: [
    { id: 'impact-concrete-0', gain: 0.76 }, { id: 'boots-step', gain: 0.5 }, { id: 'whoosh-metal-1', gain: 0.3, rate: 1.12, start: 0.015 }
  ] },
  { name: 'stage1-wall-kick-alt', duration: 0.58, layers: [
    { id: 'impact-concrete-1', gain: 0.76 }, { id: 'rpg-footstep-03', gain: 0.46 }, { id: 'whoosh-metal-2', gain: 0.32, rate: 1.04, start: 0.018 }
  ] },
  { name: 'stage1-footstep-a', duration: 0.18, targetPeak: 0.77, layers: [
    { id: 'impact-concrete-0', gain: 0.72, rate: 1.08 }, { id: 'rpg-footstep-00', gain: 0.26, rate: 1.18 }
  ] },
  { name: 'stage1-footstep-b', duration: 0.2, targetPeak: 0.77, layers: [
    { id: 'impact-concrete-1', gain: 0.72, rate: 1.03 }, { id: 'rpg-footstep-03', gain: 0.28, rate: 1.15 }
  ] },
  { name: 'stage1-land-soft', duration: 0.4, targetPeak: 0.84, layers: [
    { id: 'boots-step', gain: 0.64 }, { id: 'impact-concrete-1', gain: 0.48 }, { id: 'rpg-cloth-3', gain: 0.16, start: 0.025 }
  ] },
  { name: 'stage1-land-heavy', duration: 0.74, targetPeak: 0.92, layers: [
    { id: 'impact-punch-heavy-0', gain: 0.78 }, { id: 'boots-jump', gain: 0.52 }, { id: 'impact-metal-heavy-0', gain: 0.24 }, { id: 'scifi-low-explosion-1', gain: 0.18, lowPassHz: 180, rate: 1.18 }
  ] },
  { name: 'stage1-attack', duration: 0.7, layers: [
    { id: 'whoosh-metal-1', gain: 0.72 }, { id: 'rpg-knife-slice-1', gain: 0.54, start: 0.055 }, { id: 'rpg-draw-knife-1', gain: 0.22, start: 0.02 }
  ] },
  { name: 'stage1-attack-alt-a', duration: 0.72, layers: [
    { id: 'whoosh-body-1', gain: 0.68, rate: 0.96 }, { id: 'rpg-knife-slice-2', gain: 0.56, start: 0.05 }, { id: 'rpg-draw-knife-2', gain: 0.2, start: 0.018 }
  ] },
  { name: 'stage1-attack-alt-b', duration: 0.76, layers: [
    { id: 'whoosh-metal-2', gain: 0.7, rate: 0.94 }, { id: 'rpg-knife-slice-1', gain: 0.5, rate: 0.92, start: 0.07 }, { id: 'rpg-draw-knife-3', gain: 0.24, start: 0.02 }
  ] },
  { name: 'stage1-spin-attack', duration: 1.16, targetPeak: 0.92, layers: [
    { id: 'whoosh-body-1', gain: 0.62, rate: 0.82 }, { id: 'whoosh-metal-2', gain: 0.54, reverse: true, rate: 0.8, start: 0.28 }, { id: 'whoosh-body-2', gain: 0.52, rate: 0.78, start: 0.52 }, { id: 'paralyzer-1', gain: 0.24, highPassHz: 900, start: 0.1 }
  ] },
  { name: 'stage1-hit-light-a', duration: 0.55, layers: [
    { id: 'impact-punch-medium-1', gain: 0.78 }, { id: 'impact-metal-medium-0', gain: 0.35 }, { id: 'sword-clash-3', gain: 0.2, highPassHz: 1500 }
  ] },
  { name: 'stage1-hit-light-b', duration: 0.58, layers: [
    { id: 'impact-punch-medium-3', gain: 0.8 }, { id: 'impact-metal-medium-3', gain: 0.32 }, { id: 'sword-clash-5', gain: 0.2, highPassHz: 1600 }
  ] },
  { name: 'stage1-hit-heavy', duration: 1.08, targetPeak: 0.93, layers: [
    { id: 'impact-punch-heavy-2', gain: 0.82 }, { id: 'sword-clash-1', gain: 0.48 }, { id: 'scifi-low-explosion-1', gain: 0.24, lowPassHz: 220 }
  ] },
  { name: 'stage1-enemy-defeat', duration: 1.54, targetPeak: 0.91, layers: [
    { id: 'scifi-slime-0', gain: 0.58 }, { id: 'scifi-explosion-crunch-0', gain: 0.66, start: 0.04 }, { id: 'scifi-forcefield-2', gain: 0.28, reverse: true, start: 0.25 }
  ] },
  { name: 'stage1-enemy-defeat-wraith', duration: 1.7, targetPeak: 0.91, layers: [
    { id: 'paralyzer-2', gain: 0.54, highPassHz: 500 }, { id: 'scifi-forcefield-4', gain: 0.52, reverse: true, start: 0.18 }, { id: 'ui-glass-4', gain: 0.3, start: 0.25 }, { id: 'scifi-explosion-crunch-2', gain: 0.36, start: 0.42 }
  ] },
  { name: 'stage1-player-hurt', duration: 0.72, layers: [
    { id: 'impact-punch-heavy-4', gain: 0.76 }, { id: 'rpg-cloth-1', gain: 0.36, start: 0.015 }, { id: 'impact-metal-medium-0', gain: 0.2 }
  ] },
  { name: 'stage1-player-hurt-alt', duration: 0.76, layers: [
    { id: 'impact-punch-heavy-0', gain: 0.72, rate: 0.96 }, { id: 'rpg-cloth-3', gain: 0.4, start: 0.02 }, { id: 'impact-metal-medium-3', gain: 0.2 }
  ] },
  { name: 'stage1-pickup-seal', duration: 0.62, targetPeak: 0.84, layers: [
    { id: 'coin-flip', gain: 0.7 }, { id: 'ui-confirm-1', gain: 0.42, start: 0.08 }
  ] },
  { name: 'stage1-pickup-seal-alt', duration: 0.82, targetPeak: 0.84, layers: [
    { id: 'rpg-coins-2', gain: 0.58 }, { id: 'coin-spin', gain: 0.46, rate: 1.45 }, { id: 'ui-select-3', gain: 0.28, start: 0.09 }
  ] },
  { name: 'stage1-pickup-scroll', duration: 1.12, targetPeak: 0.86, layers: [
    { id: 'ui-scroll-3', gain: 0.7 }, { id: 'rpg-cloth-3', gain: 0.28, start: 0.06 }, { id: 'jingle-pizzi-7', gain: 0.25, start: 0.18, highPassHz: 500 }
  ] },
  { name: 'stage1-pickup-health', duration: 0.86, targetPeak: 0.86, layers: [
    { id: 'ui-confirm-2', gain: 0.72 }, { id: 'scifi-forcefield-0', gain: 0.26, reverse: true, rate: 1.2 }, { id: 'jingle-pizzi-7', gain: 0.2, rate: 1.3, start: 0.06 }
  ] },
  { name: 'stage1-pickup-energy', duration: 0.82, targetPeak: 0.87, layers: [
    { id: 'paralyzer-1', gain: 0.56, highPassHz: 600 }, { id: 'ui-maximize-4', gain: 0.52, start: 0.05 }, { id: 'scifi-forcefield-4', gain: 0.24, reverse: true, rate: 1.3 }
  ] },
  { name: 'stage1-checkpoint', duration: 1.9, targetPeak: 0.92, layers: [
    { id: 'ui-confirm-4', gain: 0.7 }, { id: 'scifi-forcefield-0', gain: 0.45, reverse: true, rate: 0.9 }, { id: 'jingle-steel-1', gain: 0.54, start: 0.22 }, { id: 'ui-maximize-5', gain: 0.32, start: 0.5 }
  ] },
  { name: 'stage1-warden-attack', duration: 1.08, targetPeak: 0.92, layers: [
    { id: 'rpg-draw-knife-3', gain: 0.54 }, { id: 'whoosh-metal-2', gain: 0.68, rate: 0.82, start: 0.08 }, { id: 'scifi-low-explosion-1', gain: 0.26, lowPassHz: 190, start: 0.12 }
  ] },
  { name: 'stage1-warden-projectile', duration: 1.0, targetPeak: 0.9, layers: [
    { id: 'scifi-laser-large-1', gain: 0.76 }, { id: 'scifi-forcefield-2', gain: 0.42, start: 0.02 }, { id: 'paralyzer-1', gain: 0.2, highPassHz: 1200 }
  ] },
  { name: 'stage1-warden-hit', duration: 0.86, targetPeak: 0.92, layers: [
    { id: 'impact-metal-heavy-1', gain: 0.72 }, { id: 'impact-punch-heavy-2', gain: 0.54 }, { id: 'sword-clash-5', gain: 0.38, start: 0.03 }
  ] },
  { name: 'stage1-warden-defeat', duration: 2.7, targetPeak: 0.93, layers: [
    { id: 'scifi-low-explosion-0', gain: 0.64 }, { id: 'scifi-explosion-crunch-4', gain: 0.76, start: 0.08 }, { id: 'impact-metal-heavy-3', gain: 0.42, start: 0.28 }, { id: 'jingle-hit-11', gain: 0.28, start: 0.82, lowPassHz: 2800 }
  ] },
  { name: 'stage2-shadow-thread-launch', duration: 1.18, targetPeak: 0.92, layers: [
    { id: 'paralyzer-2', gain: 0.58, highPassHz: 450 }, { id: 'whoosh-metal-1', gain: 0.58, rate: 0.8, start: 0.04 }, { id: 'scifi-forcefield-4', gain: 0.48, reverse: true, start: 0.08 }
  ] },
  { name: 'stage2-shadow-thread-hit', duration: 0.94, targetPeak: 0.93, layers: [
    { id: 'scifi-impact-metal-2', gain: 0.7 }, { id: 'paralyzer-1', gain: 0.52, highPassHz: 700 }, { id: 'sword-clash-3', gain: 0.46, start: 0.02 }, { id: 'whoosh-body-2', gain: 0.26, reverse: true }
  ] },
  { name: 'stage2-relay-attack', duration: 1.14, targetPeak: 0.92, layers: [
    { id: 'scifi-laser-small-2', gain: 0.62 }, { id: 'ui-error-3', gain: 0.34, highPassHz: 500 }, { id: 'scifi-forcefield-0', gain: 0.48, start: 0.08 }, { id: 'impact-metal-heavy-0', gain: 0.24, start: 0.12 }
  ] },
  { name: 'stage2-relay-projectile', duration: 1.02, targetPeak: 0.91, layers: [
    { id: 'scifi-laser-large-1', gain: 0.66, rate: 0.88 }, { id: 'scifi-forcefield-4', gain: 0.5, rate: 1.08 }, { id: 'paralyzer-1', gain: 0.22, highPassHz: 900, start: 0.04 }
  ] },
  { name: 'stage2-relay-hit', duration: 0.88, targetPeak: 0.93, layers: [
    { id: 'scifi-impact-metal-2', gain: 0.74 }, { id: 'impact-punch-heavy-4', gain: 0.56 }, { id: 'paralyzer-1', gain: 0.32, highPassHz: 800, start: 0.04 }
  ] },
  { name: 'stage2-relay-defeat', duration: 2.86, targetPeak: 0.93, layers: [
    { id: 'scifi-low-explosion-0', gain: 0.62 }, { id: 'scifi-explosion-crunch-4', gain: 0.72, start: 0.12 }, { id: 'paralyzer-2', gain: 0.44, reverse: true, start: 0.34 }, { id: 'jingle-steel-1', gain: 0.3, start: 1.0, lowPassHz: 3200 }
  ] },
  { name: 'ui-move', duration: 0.2, targetPeak: 0.78, layers: [
    { id: 'ui-select-3', gain: 0.76, rate: 1.4 }, { id: 'rpg-metal-click', gain: 0.18, rate: 1.5 }
  ] },
  { name: 'ui-confirm', duration: 0.56, targetPeak: 0.87, layers: [
    { id: 'ui-confirm-1', gain: 0.72 }, { id: 'ui-confirm-2', gain: 0.4, start: 0.055, rate: 1.12 }
  ] },
  { name: 'ui-back', duration: 0.22, targetPeak: 0.82, layers: [
    { id: 'ui-back-3', gain: 0.78 }, { id: 'rpg-metal-latch', gain: 0.24, rate: 1.5, lowPassHz: 3200 }
  ] },
  { name: 'ui-pause', duration: 0.72, targetPeak: 0.86, layers: [
    { id: 'ui-open-4', gain: 0.62 }, { id: 'ui-close-4', gain: 0.46, reverse: true, start: 0.12 }, { id: 'ui-select-5', gain: 0.24, start: 0.18 }
  ] },
  { name: 'game-over', duration: 2.6, targetPeak: 0.92, layers: [
    { id: 'ui-error-5', gain: 0.68 }, { id: 'jingle-nes-0', gain: 0.38, start: 0.18, lowPassHz: 2600, rate: 0.88 }, { id: 'scifi-low-explosion-0', gain: 0.32, lowPassHz: 260, start: 0.05 }
  ] },
  { name: 'respawn', duration: 1.92, targetPeak: 0.91, layers: [
    { id: 'scifi-forcefield-2', gain: 0.54, reverse: true, rate: 0.88 }, { id: 'ui-maximize-5', gain: 0.54, start: 0.18 }, { id: 'jingle-steel-1', gain: 0.38, start: 0.34, highPassHz: 400 }
  ] },
  { name: 'stage1-stage-clear', duration: 2.55, targetPeak: 0.93, layers: [
    { id: 'jingle-steel-1', gain: 0.64 }, { id: 'ui-confirm-4', gain: 0.42, start: 0.18 }, { id: 'scifi-forcefield-0', gain: 0.32, reverse: true, start: 0.12 }, { id: 'jingle-pizzi-7', gain: 0.24, start: 0.64, rate: 1.08 }
  ] }
];

for (const definition of oneShots) render(definition);

render({
  name: 'stage1-wall-slide-loop',
  duration: 1.5,
  loop: true,
  targetPeak: 0.72,
  layers: [
    { id: 'metal-scrape', gain: 0.72, rate: 1.01 },
    { id: 'computer-noise', gain: 0.12, repeat: true, highPassHz: 500 }
  ]
});

render({
  name: 'ambience-updraft-loop',
  duration: 4,
  channels: 2,
  loop: true,
  targetPeak: 0.75,
  layers: [
    { id: 'thruster-fire-0', gain: 0.54, repeat: true, pan: -0.36 },
    { id: 'thruster-fire-2', gain: 0.5, repeat: true, pan: 0.38, highPassHz: 180 },
    { id: 'space-engine', gain: 0.28, repeat: true, lowPassHz: 900 }
  ]
});

const copyAudio = (source) => ({
  channels: source.channels,
  frameCount: source.frameCount,
  samples: new Float64Array(source.samples)
});

const renderPreparedLoop = (name, audio, targetPeak) => {
  conditionAudio(audio, {
    loop: true,
    targetPeak,
    targetRmsDb: targetRmsByName[name],
    drive: 1.04,
    repairSteps: name.startsWith('music-')
  });
  results.push(writeWav(name, audio, true));
};

renderPreparedLoop('music-menu', copyAudio(getSource('menu-night-club')), 0.76);

render({
  name: 'ambience-stage1',
  duration: 16,
  channels: 2,
  loop: true,
  targetPeak: 0.72,
  drive: 1.03,
  layers: [
    { id: 'rain', gain: 0.82, repeat: true },
    { id: 'cyber-city', gain: 0.26, repeat: true, highPassHz: 160 }
  ]
});

const renderMusicPair = (sourceId, baseName, combatName, { baseCutoff, combatCutoff }) => {
  const source = getSource(sourceId);
  const low = lowPass(source, baseCutoff);
  const high = highPass(source, combatCutoff);
  const base = copyAudio(source);
  const combat = copyAudio(source);
  for (let index = 0; index < source.samples.length; index += 1) {
    base.samples[index] = source.samples[index] * 0.62 + low.samples[index] * 0.38;
    combat.samples[index] = source.samples[index] * 0.58 + high.samples[index] * 0.48;
  }
  renderPreparedLoop(baseName, base, 0.75);
  renderPreparedLoop(combatName, combat, 0.72);
};

renderMusicPair('stage1-new-factory', 'music-stage1-base', 'music-stage1-combat', {
  baseCutoff: 4_200,
  combatCutoff: 760
});

render({
  name: 'ambience-stage2',
  duration: 16,
  channels: 2,
  loop: true,
  targetPeak: 0.72,
  drive: 1.04,
  layers: [
    { id: 'factory', gain: 0.72, repeat: true },
    { id: 'space-engine', gain: 0.2, repeat: true, lowPassHz: 1_100 },
    { id: 'engine-circular', gain: 0.13, repeat: true, pan: -0.42, highPassHz: 120 },
    { id: 'engine-circular', gain: 0.11, repeat: true, pan: 0.48, rate: 1.006, highPassHz: 180 },
    { id: 'water-drop', gain: 0.18, start: 3.1, pan: -0.5 },
    { id: 'water-drop', gain: 0.15, start: 10.7, pan: 0.56, rate: 0.92 }
  ]
});

renderMusicPair('stage2-sewers', 'music-stage2-base', 'music-stage2-combat', {
  baseCutoff: 4_600,
  combatCutoff: 820
});

renderPreparedLoop('music-stage-clear', copyAudio(getSource('clear-victory')), 0.76);

const expectedNames = [
  'stage1-jump', 'stage1-jump-alt', 'stage1-wall-kick', 'stage1-wall-kick-alt',
  'stage1-footstep-a', 'stage1-footstep-b', 'stage1-land-soft', 'stage1-land-heavy',
  'stage1-wall-slide-loop', 'stage1-attack', 'stage1-attack-alt-a', 'stage1-attack-alt-b',
  'stage1-spin-attack', 'stage1-hit-light-a', 'stage1-hit-light-b', 'stage1-hit-heavy',
  'stage1-enemy-defeat', 'stage1-enemy-defeat-wraith', 'stage1-player-hurt',
  'stage1-player-hurt-alt', 'stage1-pickup-seal', 'stage1-pickup-seal-alt',
  'stage1-pickup-scroll', 'stage1-pickup-health', 'stage1-pickup-energy',
  'stage1-checkpoint', 'stage1-warden-attack', 'stage1-warden-projectile',
  'stage1-warden-hit', 'stage1-warden-defeat', 'stage2-shadow-thread-launch',
  'stage2-shadow-thread-hit', 'stage2-relay-attack', 'stage2-relay-projectile',
  'stage2-relay-hit', 'stage2-relay-defeat', 'ui-move', 'ui-confirm', 'ui-back', 'ui-pause',
  'game-over', 'respawn', 'stage1-stage-clear', 'ambience-updraft-loop', 'music-menu',
  'ambience-stage1', 'music-stage1-base', 'music-stage1-combat', 'ambience-stage2',
  'music-stage2-base', 'music-stage2-combat', 'music-stage-clear'
];

const actualNames = results.map((result) => result.name).sort();
const expectedSorted = [...expectedNames].sort();
if (actualNames.length !== expectedSorted.length || actualNames.some((name, index) => name !== expectedSorted[index])) {
  throw new Error(`Curated audio output mismatch. Expected ${expectedSorted.length}, got ${actualNames.length}.`);
}

console.log(`Built ${results.length} curated CC0-derived WAV assets from ${sourceCache.size} source masters.`);

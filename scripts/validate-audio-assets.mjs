import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const AUDIO_DIR = join(ROOT, 'src', 'assets', 'audio');
const REPORT_PATH = join(ROOT, 'artifacts', 'audio', 'audio-validation-report.json');

const REQUIRED_FILES = [
  'stage1-jump.wav',
  'stage1-wall-kick.wav',
  'stage1-attack.wav',
  'stage1-spin-attack.wav',
  'stage1-enemy-defeat.wav',
  'stage1-player-hurt.wav',
  'stage1-pickup-seal.wav',
  'stage1-pickup-scroll.wav',
  'stage1-pickup-health.wav',
  'stage1-pickup-energy.wav',
  'stage1-checkpoint.wav',
  'stage1-warden-attack.wav',
  'stage1-warden-projectile.wav',
  'stage1-stage-clear.wav',
  'stage1-jump-alt.wav',
  'stage1-wall-kick-alt.wav',
  'stage1-footstep-a.wav',
  'stage1-footstep-b.wav',
  'stage1-land-soft.wav',
  'stage1-land-heavy.wav',
  'stage1-wall-slide-loop.wav',
  'stage1-attack-alt-a.wav',
  'stage1-attack-alt-b.wav',
  'stage1-hit-light-a.wav',
  'stage1-hit-light-b.wav',
  'stage1-hit-heavy.wav',
  'stage1-enemy-defeat-wraith.wav',
  'stage1-player-hurt-alt.wav',
  'stage1-pickup-seal-alt.wav',
  'stage1-warden-hit.wav',
  'stage1-warden-defeat.wav',
  'stage2-shadow-thread-launch.wav',
  'stage2-shadow-thread-hit.wav',
  'stage2-relay-attack.wav',
  'stage2-relay-projectile.wav',
  'stage2-relay-hit.wav',
  'stage2-relay-defeat.wav',
  'ui-move.wav',
  'ui-confirm.wav',
  'ui-back.wav',
  'ui-pause.wav',
  'game-over.wav',
  'respawn.wav',
  'ambience-updraft-loop.wav',
  'music-menu.wav',
  'ambience-stage1.wav',
  'music-stage1-base.wav',
  'music-stage1-combat.wav',
  'ambience-stage2.wav',
  'music-stage2-base.wav',
  'music-stage2-combat.wav',
  'music-stage-clear.wav'
];

const LOOP_FILES = new Set([
  'stage1-wall-slide-loop.wav',
  'ambience-updraft-loop.wav',
  'music-menu.wav',
  'ambience-stage1.wav',
  'music-stage1-base.wav',
  'music-stage1-combat.wav',
  'ambience-stage2.wav',
  'music-stage2-base.wav',
  'music-stage2-combat.wav',
  'music-stage-clear.wav'
]);

const MUSIC_PAIRS = [
  ['music-stage1-base.wav', 'music-stage1-combat.wav'],
  ['music-stage2-base.wav', 'music-stage2-combat.wav']
];

const LIMITS = Object.freeze({
  allowedSampleRates: [48000],
  allowedChannels: [1, 2],
  bitsPerSample: 16,
  peakMin: 0.15,
  peakMax: 0.96,
  rmsMin: 0.001,
  dcOffsetMax: 0.01,
  clippedSampleRatioMax: 0.0001,
  oneShotBoundaryAmplitudeMax: 0.02,
  oneShotBoundarySlopeMax: 0.08,
  loopSeamValueDeltaMax: 0.02,
  loopSeamSlopeDeltaMax: 0.02,
  musicInternalStepAmplitudeMin: 0.04,
  musicInternalStepIsolationRatio: 2.2,
  stereoLowBandCorrelationMin: 0.5,
  stereoLowBandMonoFoldDbMin: -1.5,
  musicPairCorrelationMin: 0.55,
  musicPairBestLagBucketsMax: 0,
  durationSeconds: {
    oneShot: { min: 0.08, max: 4 },
    shortLoop: { min: 0.5, max: 4 },
    ambienceLoop: { min: 3, max: 120 },
    musicLoop: { min: 6, max: 180 }
  }
});

const round = (value, digits = 8) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : value;

const normalizeSample = (sample) => (sample < 0 ? sample / 32768 : sample / 32767);

const toReportPath = (absolutePath) => relative(ROOT, absolutePath).replaceAll('\\', '/');

async function findWavFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findWavFiles(absolutePath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.wav')) {
      files.push(absolutePath);
    }
  }

  return files.sort((a, b) => toReportPath(a).localeCompare(toReportPath(b)));
}

function durationProfileFor(fileName) {
  if (fileName === 'stage1-wall-slide-loop.wav') {
    return { name: 'shortLoop', ...LIMITS.durationSeconds.shortLoop };
  }

  if (fileName.startsWith('music-')) {
    return { name: 'musicLoop', ...LIMITS.durationSeconds.musicLoop };
  }

  if (fileName.startsWith('ambience-')) {
    return { name: 'ambienceLoop', ...LIMITS.durationSeconds.ambienceLoop };
  }

  if (LOOP_FILES.has(fileName) || /(?:^|-)loop(?:-|\.wav$)/i.test(fileName)) {
    return { name: 'ambienceLoop', ...LIMITS.durationSeconds.ambienceLoop };
  }

  return { name: 'oneShot', ...LIMITS.durationSeconds.oneShot };
}

function parseWav(buffer) {
  const structuralErrors = [];
  const result = {
    container: buffer.length >= 4 ? buffer.toString('ascii', 0, 4) : null,
    waveId: buffer.length >= 12 ? buffer.toString('ascii', 8, 12) : null,
    riffDeclaredBytes: null,
    audioFormat: null,
    channels: null,
    sampleRate: null,
    byteRate: null,
    blockAlign: null,
    bitsPerSample: null,
    dataOffset: null,
    dataBytes: null,
    frameCount: null,
    durationSeconds: null,
    samples: null,
    structuralErrors
  };

  if (buffer.length < 12) {
    structuralErrors.push('File is too small to contain a RIFF/WAVE header.');
    return result;
  }

  if (result.container !== 'RIFF') structuralErrors.push('Container must be RIFF.');
  if (result.waveId !== 'WAVE') structuralErrors.push('RIFF form type must be WAVE.');

  result.riffDeclaredBytes = buffer.readUInt32LE(4) + 8;
  if (result.riffDeclaredBytes !== buffer.length) {
    structuralErrors.push(
      `RIFF declares ${result.riffDeclaredBytes} bytes but the file contains ${buffer.length}.`
    );
  }

  const scanEnd = Math.min(buffer.length, result.riffDeclaredBytes);
  let offset = 12;
  let fmtFound = false;
  let dataFound = false;

  while (offset + 8 <= scanEnd) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;
    const chunkEnd = chunkDataOffset + chunkSize;

    if (chunkEnd > scanEnd) {
      structuralErrors.push(`Chunk ${JSON.stringify(chunkId)} extends beyond the RIFF payload.`);
      break;
    }

    if (chunkId === 'fmt ' && !fmtFound) {
      fmtFound = true;
      if (chunkSize < 16) {
        structuralErrors.push('fmt chunk must contain at least 16 bytes.');
      } else {
        result.audioFormat = buffer.readUInt16LE(chunkDataOffset);
        result.channels = buffer.readUInt16LE(chunkDataOffset + 2);
        result.sampleRate = buffer.readUInt32LE(chunkDataOffset + 4);
        result.byteRate = buffer.readUInt32LE(chunkDataOffset + 8);
        result.blockAlign = buffer.readUInt16LE(chunkDataOffset + 12);
        result.bitsPerSample = buffer.readUInt16LE(chunkDataOffset + 14);
      }
    } else if (chunkId === 'data' && !dataFound) {
      dataFound = true;
      result.dataOffset = chunkDataOffset;
      result.dataBytes = chunkSize;
    }

    offset = chunkEnd + (chunkSize & 1);
  }

  if (!fmtFound) structuralErrors.push('Missing fmt chunk.');
  if (!dataFound) structuralErrors.push('Missing data chunk.');

  if (
    result.dataOffset !== null &&
    result.dataBytes !== null &&
    result.blockAlign &&
    result.sampleRate
  ) {
    if (result.dataBytes % result.blockAlign !== 0) {
      structuralErrors.push('data chunk size is not aligned to complete PCM frames.');
    }
    result.frameCount = Math.floor(result.dataBytes / result.blockAlign);
    result.durationSeconds = result.frameCount / result.sampleRate;
  }

  if (
    result.dataOffset !== null &&
    result.dataBytes !== null &&
    result.bitsPerSample === 16 &&
    result.dataBytes % 2 === 0
  ) {
    const sampleCount = result.dataBytes / 2;
    const samples = new Int16Array(sampleCount);
    for (let index = 0; index < sampleCount; index += 1) {
      samples[index] = buffer.readInt16LE(result.dataOffset + index * 2);
    }
    result.samples = samples;
  }

  return result;
}

function analyzeSamples(parsed, isLoop) {
  const { channels, frameCount, sampleRate, samples } = parsed;
  if (!samples || !channels || !frameCount || frameCount < 2) return null;

  const sumByChannel = Array(channels).fill(0);
  const squareSumByChannel = Array(channels).fill(0);
  let peak = 0;
  let squareSum = 0;
  let clippedSamples = 0;
  let nonZeroSamples = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const raw = samples[index];
    const value = normalizeSample(raw);
    const channel = index % channels;
    const magnitude = Math.abs(value);
    peak = Math.max(peak, magnitude);
    squareSum += value * value;
    sumByChannel[channel] += value;
    squareSumByChannel[channel] += value * value;
    if (raw === -32768 || raw === 32767) clippedSamples += 1;
    if (raw !== 0) nonZeroSamples += 1;
  }

  let maxAdjacentDelta = 0;
  let maxIsolatedInternalStep = 0;
  let isolatedInternalStepCount = 0;
  for (let channel = 0; channel < channels; channel += 1) {
    for (let frame = 2; frame < frameCount - 1; frame += 1) {
      const beforeBefore = normalizeSample(samples[(frame - 2) * channels + channel]);
      const before = normalizeSample(samples[(frame - 1) * channels + channel]);
      const current = normalizeSample(samples[frame * channels + channel]);
      const after = normalizeSample(samples[(frame + 1) * channels + channel]);
      const step = Math.abs(current - before);
      const neighborStep = Math.max(Math.abs(before - beforeBefore), Math.abs(after - current), 1e-7);
      maxAdjacentDelta = Math.max(maxAdjacentDelta, step);
      if (
        step > LIMITS.musicInternalStepAmplitudeMin &&
        step / neighborStep > LIMITS.musicInternalStepIsolationRatio
      ) {
        isolatedInternalStepCount += 1;
        maxIsolatedInternalStep = Math.max(maxIsolatedInternalStep, step);
      }
    }
  }

  let stereo = null;
  if (channels === 2 && sampleRate) {
    let sumLeft = 0;
    let sumRight = 0;
    let sumLeftSquare = 0;
    let sumRightSquare = 0;
    let sumProduct = 0;
    let monoSquare = 0;
    let lowLeft = 0;
    let lowRight = 0;
    let lowLeftSum = 0;
    let lowRightSum = 0;
    let lowLeftSquare = 0;
    let lowRightSquare = 0;
    let lowProduct = 0;
    let lowMonoSquare = 0;
    const lowPassAlpha = 1 - Math.exp((-2 * Math.PI * 120) / sampleRate);
    for (let frame = 0; frame < frameCount; frame += 1) {
      const left = normalizeSample(samples[frame * 2]);
      const right = normalizeSample(samples[frame * 2 + 1]);
      sumLeft += left;
      sumRight += right;
      sumLeftSquare += left * left;
      sumRightSquare += right * right;
      sumProduct += left * right;
      monoSquare += ((left + right) * 0.5) ** 2;
      lowLeft += lowPassAlpha * (left - lowLeft);
      lowRight += lowPassAlpha * (right - lowRight);
      lowLeftSum += lowLeft;
      lowRightSum += lowRight;
      lowLeftSquare += lowLeft * lowLeft;
      lowRightSquare += lowRight * lowRight;
      lowProduct += lowLeft * lowRight;
      lowMonoSquare += ((lowLeft + lowRight) * 0.5) ** 2;
    }
    const correlation = (sumX, sumY, sumXX, sumYY, sumXY) => {
      const covariance = sumXY - (sumX * sumY) / frameCount;
      const varianceX = sumXX - (sumX * sumX) / frameCount;
      const varianceY = sumYY - (sumY * sumY) / frameCount;
      return covariance / Math.max(Math.sqrt(Math.max(varianceX, 0) * Math.max(varianceY, 0)), 1e-12);
    };
    const stereoEnergy = Math.max((sumLeftSquare + sumRightSquare) * 0.5, 1e-12);
    const lowStereoEnergy = Math.max((lowLeftSquare + lowRightSquare) * 0.5, 1e-12);
    stereo = {
      correlation: round(correlation(sumLeft, sumRight, sumLeftSquare, sumRightSquare, sumProduct)),
      monoFoldDb: round(10 * Math.log10(Math.max(monoSquare, 1e-12) / stereoEnergy), 5),
      lowBandCorrelation: round(correlation(lowLeftSum, lowRightSum, lowLeftSquare, lowRightSquare, lowProduct)),
      lowBandMonoFoldDb: round(10 * Math.log10(Math.max(lowMonoSquare, 1e-12) / lowStereoEnergy), 5)
    };
  }

  const signatureLength = 1024;
  const correlationSignature = Array.from({ length: signatureLength }, (_, bucket) => {
    const start = Math.floor((bucket * frameCount) / signatureLength);
    const end = Math.max(start + 1, Math.floor(((bucket + 1) * frameCount) / signatureLength));
    let sum = 0;
    for (let frame = start; frame < Math.min(end, frameCount); frame += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        sum += normalizeSample(samples[frame * channels + channel]) / channels;
      }
    }
    return sum / Math.max(1, Math.min(end, frameCount) - start);
  });

  const firstValues = [];
  const lastValues = [];
  const startSlopes = [];
  const endSlopes = [];
  for (let channel = 0; channel < channels; channel += 1) {
    const first = normalizeSample(samples[channel]);
    const second = normalizeSample(samples[channels + channel]);
    const penultimate = normalizeSample(samples[(frameCount - 2) * channels + channel]);
    const last = normalizeSample(samples[(frameCount - 1) * channels + channel]);
    firstValues.push(first);
    lastValues.push(last);
    startSlopes.push(second - first);
    endSlopes.push(last - penultimate);
  }

  const maxAbs = (values) => Math.max(...values.map(Math.abs));
  const maxPairDelta = (left, right) =>
    Math.max(...left.map((value, index) => Math.abs(value - right[index])));

  return {
    peak: round(peak),
    rms: round(Math.sqrt(squareSum / samples.length)),
    rmsByChannel: squareSumByChannel.map((value) => round(Math.sqrt(value / frameCount))),
    dcOffsetByChannel: sumByChannel.map((value) => round(value / frameCount)),
    maxAbsoluteDcOffset: round(maxAbs(sumByChannel.map((value) => value / frameCount))),
    clippedSampleCount: clippedSamples,
    clippedSampleRatio: round(clippedSamples / samples.length, 10),
    nonZeroSampleRatio: round(nonZeroSamples / samples.length, 10),
    maxAdjacentDelta: round(maxAdjacentDelta),
    isolatedInternalStepCount,
    maxIsolatedInternalStep: round(maxIsolatedInternalStep),
    stereo,
    correlationSignature,
    edge: {
      firstValues: firstValues.map((value) => round(value)),
      lastValues: lastValues.map((value) => round(value)),
      startSlopes: startSlopes.map((value) => round(value)),
      endSlopes: endSlopes.map((value) => round(value)),
      startBoundaryAmplitude: round(maxAbs(firstValues)),
      endBoundaryAmplitude: round(maxAbs(lastValues)),
      startBoundarySlope: round(maxAbs(startSlopes)),
      endBoundarySlope: round(maxAbs(endSlopes)),
      loopSeamValueDelta: isLoop ? round(maxPairDelta(firstValues, lastValues)) : null,
      loopSeamSlopeDelta: isLoop ? round(maxPairDelta(startSlopes, endSlopes)) : null
    }
  };
}

function validateFile(fileName, parsed, metrics, durationProfile) {
  const errors = [...parsed.structuralErrors];
  const checks = {};
  const addCheck = (name, passed, detail) => {
    checks[name] = { passed, detail };
    if (!passed) errors.push(detail);
  };

  addCheck('riffPcm', parsed.container === 'RIFF' && parsed.waveId === 'WAVE' && parsed.audioFormat === 1,
    'Audio must be RIFF/WAVE with integer PCM format code 1.');
  addCheck('bitsPerSample', parsed.bitsPerSample === LIMITS.bitsPerSample,
    `Audio must be ${LIMITS.bitsPerSample}-bit PCM; found ${parsed.bitsPerSample ?? 'unknown'}.`);
  addCheck('sampleRate', LIMITS.allowedSampleRates.includes(parsed.sampleRate),
    `Sample rate must be 48 kHz; found ${parsed.sampleRate ?? 'unknown'} Hz.`);
  addCheck('channels', LIMITS.allowedChannels.includes(parsed.channels),
    `Channel count must be mono or stereo; found ${parsed.channels ?? 'unknown'}.`);

  if (parsed.channels && parsed.bitsPerSample) {
    const expectedBlockAlign = parsed.channels * (parsed.bitsPerSample / 8);
    addCheck('blockAlign', parsed.blockAlign === expectedBlockAlign,
      `blockAlign must be ${expectedBlockAlign}; found ${parsed.blockAlign ?? 'unknown'}.`);
    if (parsed.sampleRate) {
      const expectedByteRate = parsed.sampleRate * expectedBlockAlign;
      addCheck('byteRate', parsed.byteRate === expectedByteRate,
        `byteRate must be ${expectedByteRate}; found ${parsed.byteRate ?? 'unknown'}.`);
    }
  }

  const duration = parsed.durationSeconds;
  addCheck('duration', duration !== null && duration >= durationProfile.min && duration <= durationProfile.max,
    `${durationProfile.name} duration must be ${durationProfile.min}..${durationProfile.max}s; found ${duration === null ? 'unknown' : `${round(duration, 4)}s`}.`);

  if (!metrics) {
    addCheck('decodableSamples', false, 'No complete 16-bit PCM sample frames could be decoded.');
    return { checks, errors };
  }

  addCheck('nonSilent', metrics.nonZeroSampleRatio > 0 && metrics.rms >= LIMITS.rmsMin,
    `Audio is silent or effectively silent (RMS ${metrics.rms}, non-zero ratio ${metrics.nonZeroSampleRatio}).`);
  addCheck('peak', metrics.peak >= LIMITS.peakMin && metrics.peak <= LIMITS.peakMax,
    `Peak must be ${LIMITS.peakMin}..${LIMITS.peakMax}; found ${metrics.peak}.`);
  addCheck('dcOffset', metrics.maxAbsoluteDcOffset <= LIMITS.dcOffsetMax,
    `Absolute DC offset must be <= ${LIMITS.dcOffsetMax}; found ${metrics.maxAbsoluteDcOffset}.`);
  addCheck('clipping', metrics.clippedSampleRatio <= LIMITS.clippedSampleRatioMax,
    `Clipped-sample ratio must be <= ${LIMITS.clippedSampleRatioMax}; found ${metrics.clippedSampleRatio}.`);

  if (fileName.startsWith('music-')) {
    addCheck('internalDiscontinuities', metrics.isolatedInternalStepCount === 0,
      `Music must not contain isolated internal steps above ${LIMITS.musicInternalStepAmplitudeMin}; found ${metrics.isolatedInternalStepCount}, max ${metrics.maxIsolatedInternalStep}.`);
  }

  if (parsed.channels === 2 && metrics.stereo) {
    addCheck('stereoLowBandCorrelation', metrics.stereo.lowBandCorrelation >= LIMITS.stereoLowBandCorrelationMin,
      `Stereo low-band correlation must be >= ${LIMITS.stereoLowBandCorrelationMin}; found ${metrics.stereo.lowBandCorrelation}.`);
    addCheck('stereoLowBandMonoFold', metrics.stereo.lowBandMonoFoldDb >= LIMITS.stereoLowBandMonoFoldDbMin,
      `Stereo low-band mono fold must be >= ${LIMITS.stereoLowBandMonoFoldDbMin} dB; found ${metrics.stereo.lowBandMonoFoldDb} dB.`);
  }

  const isLoop = LOOP_FILES.has(fileName) || durationProfile.name !== 'oneShot';
  if (isLoop) {
    addCheck('loopSeamValue', metrics.edge.loopSeamValueDelta <= LIMITS.loopSeamValueDeltaMax,
      `Loop seam value delta must be <= ${LIMITS.loopSeamValueDeltaMax}; found ${metrics.edge.loopSeamValueDelta}.`);
    addCheck('loopSeamSlope', metrics.edge.loopSeamSlopeDelta <= LIMITS.loopSeamSlopeDeltaMax,
      `Loop seam slope delta must be <= ${LIMITS.loopSeamSlopeDeltaMax}; found ${metrics.edge.loopSeamSlopeDelta}.`);
  } else {
    addCheck('startClick',
      metrics.edge.startBoundaryAmplitude <= LIMITS.oneShotBoundaryAmplitudeMax &&
        metrics.edge.startBoundarySlope <= LIMITS.oneShotBoundarySlopeMax,
      `Start boundary amplitude ${metrics.edge.startBoundaryAmplitude} (max ${LIMITS.oneShotBoundaryAmplitudeMax}), slope ${metrics.edge.startBoundarySlope} (max ${LIMITS.oneShotBoundarySlopeMax}).`);
    addCheck('endClick',
      metrics.edge.endBoundaryAmplitude <= LIMITS.oneShotBoundaryAmplitudeMax &&
        metrics.edge.endBoundarySlope <= LIMITS.oneShotBoundarySlopeMax,
      `End boundary amplitude ${metrics.edge.endBoundaryAmplitude} (max ${LIMITS.oneShotBoundaryAmplitudeMax}), slope ${metrics.edge.endBoundarySlope} (max ${LIMITS.oneShotBoundarySlopeMax}).`);
  }

  return { checks, errors };
}

async function analyzeFile(absolutePath) {
  const fileName = toReportPath(absolutePath).replace(/^src\/assets\/audio\//, '');
  const baseName = fileName.split('/').at(-1);
  const buffer = await readFile(absolutePath);
  const hash = createHash('sha256').update(buffer).digest('hex');
  const parsed = parseWav(buffer);
  const durationProfile = durationProfileFor(baseName);
  const isLoop = LOOP_FILES.has(baseName) || durationProfile.name !== 'oneShot';
  const metrics = analyzeSamples(parsed, isLoop);
  const validation = validateFile(baseName, parsed, metrics, durationProfile);

  return {
    file: fileName,
    bytes: buffer.length,
    sha256: hash,
    kind: isLoop ? 'loop' : 'oneShot',
    durationProfile,
    format: {
      container: parsed.container,
      waveId: parsed.waveId,
      audioFormat: parsed.audioFormat,
      channels: parsed.channels,
      sampleRate: parsed.sampleRate,
      byteRate: parsed.byteRate,
      blockAlign: parsed.blockAlign,
      bitsPerSample: parsed.bitsPerSample,
      dataBytes: parsed.dataBytes,
      frameCount: parsed.frameCount,
      durationSeconds: parsed.durationSeconds === null ? null : round(parsed.durationSeconds, 6)
    },
    metrics,
    checks: validation.checks,
    errors: [...new Set(validation.errors)]
  };
}

function validateMusicPairs(filesByName) {
  const correlation = (left, right, lag = 0) => {
    if (!left || !right || left.length !== right.length || left.length === 0) return null;
    const leftStart = Math.max(0, -lag);
    const rightStart = Math.max(0, lag);
    const count = Math.min(left.length - leftStart, right.length - rightStart);
    if (count < 32) return null;
    let sumLeft = 0;
    let sumRight = 0;
    let sumLeftSquare = 0;
    let sumRightSquare = 0;
    let sumProduct = 0;
    for (let index = 0; index < count; index += 1) {
      const leftValue = left[leftStart + index];
      const rightValue = right[rightStart + index];
      sumLeft += leftValue;
      sumRight += rightValue;
      sumLeftSquare += leftValue * leftValue;
      sumRightSquare += rightValue * rightValue;
      sumProduct += leftValue * rightValue;
    }
    const covariance = sumProduct - (sumLeft * sumRight) / count;
    const varianceLeft = sumLeftSquare - (sumLeft * sumLeft) / count;
    const varianceRight = sumRightSquare - (sumRight * sumRight) / count;
    return covariance / Math.max(Math.sqrt(Math.max(varianceLeft, 0) * Math.max(varianceRight, 0)), 1e-12);
  };

  return MUSIC_PAIRS.map(([baseName, combatName]) => {
    const base = filesByName.get(baseName);
    const combat = filesByName.get(combatName);
    const errors = [];

    if (!base) errors.push(`Missing ${baseName}.`);
    if (!combat) errors.push(`Missing ${combatName}.`);
    if (base && combat) {
      if (base.format.sampleRate !== combat.format.sampleRate) {
        errors.push(`Sample rates differ (${base.format.sampleRate} vs ${combat.format.sampleRate}).`);
      }
      if (base.format.frameCount !== combat.format.frameCount) {
        errors.push(`Frame counts differ (${base.format.frameCount} vs ${combat.format.frameCount}).`);
      }
      if (base.format.channels !== combat.format.channels) {
        errors.push(`Channel counts differ (${base.format.channels} vs ${combat.format.channels}).`);
      }
    }
    const waveformCorrelation = base && combat
      ? correlation(base.metrics?.correlationSignature, combat.metrics?.correlationSignature)
      : null;
    if (waveformCorrelation === null || waveformCorrelation < LIMITS.musicPairCorrelationMin) {
      errors.push(`Waveform correlation must be >= ${LIMITS.musicPairCorrelationMin}; found ${waveformCorrelation === null ? 'unknown' : round(waveformCorrelation, 5)}.`);
    }
    let bestLagBuckets = null;
    let bestLagCorrelation = null;
    if (base && combat) {
      for (let lag = -8; lag <= 8; lag += 1) {
        const candidate = correlation(base.metrics?.correlationSignature, combat.metrics?.correlationSignature, lag);
        if (candidate !== null && (bestLagCorrelation === null || candidate > bestLagCorrelation)) {
          bestLagCorrelation = candidate;
          bestLagBuckets = lag;
        }
      }
    }
    if (bestLagBuckets === null || Math.abs(bestLagBuckets) > LIMITS.musicPairBestLagBucketsMax) {
      errors.push(
        `Best waveform-correlation lag must be within ${LIMITS.musicPairBestLagBucketsMax} buckets of zero; found ${bestLagBuckets ?? 'unknown'}.`
      );
    }

    return {
      base: baseName,
      combat: combatName,
      sameSampleRate: Boolean(base && combat && base.format.sampleRate === combat.format.sampleRate),
      sameFrameCount: Boolean(base && combat && base.format.frameCount === combat.format.frameCount),
      sameChannelCount: Boolean(base && combat && base.format.channels === combat.format.channels),
      waveformCorrelation: waveformCorrelation === null ? null : round(waveformCorrelation, 5),
      bestLagBuckets,
      bestLagCorrelation: bestLagCorrelation === null ? null : round(bestLagCorrelation, 5),
      valid: errors.length === 0,
      errors
    };
  });
}

async function main() {
  const runErrors = [];
  let absoluteFiles = [];

  try {
    absoluteFiles = await findWavFiles(AUDIO_DIR);
  } catch (error) {
    runErrors.push(`Unable to enumerate ${toReportPath(AUDIO_DIR)}: ${error.message}`);
  }

  const files = [];
  for (const absolutePath of absoluteFiles) {
    try {
      files.push(await analyzeFile(absolutePath));
    } catch (error) {
      files.push({
        file: toReportPath(absolutePath).replace(/^src\/assets\/audio\//, ''),
        bytes: null,
        sha256: null,
        kind: null,
        durationProfile: null,
        format: null,
        metrics: null,
        checks: {},
        errors: [`Unhandled analysis error: ${error.message}`]
      });
    }
  }

  const filesByName = new Map(files.map((file) => [file.file, file]));
  const missingRequiredFiles = REQUIRED_FILES.filter((fileName) => !filesByName.has(fileName));

  const hashes = new Map();
  for (const file of files) {
    if (!file.sha256) continue;
    const group = hashes.get(file.sha256) ?? [];
    group.push(file.file);
    hashes.set(file.sha256, group);
  }

  const duplicateGroups = [...hashes.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([sha256, names]) => ({ sha256, files: names.sort() }));

  for (const group of duplicateGroups) {
    for (const fileName of group.files) {
      const file = files.find((candidate) => candidate.file === fileName);
      if (file) file.errors.push(`Audio bytes duplicate: ${group.files.join(', ')}.`);
    }
  }

  const musicPairs = validateMusicPairs(filesByName);
  for (const file of files) {
    if (file.metrics) delete file.metrics.correlationSignature;
  }
  for (const file of files) file.valid = file.errors.length === 0;
  const invalidFiles = files.filter((file) => file.errors.length > 0);
  const issueCount =
    runErrors.length +
    missingRequiredFiles.length +
    duplicateGroups.length +
    musicPairs.filter((pair) => !pair.valid).length +
    invalidFiles.reduce((sum, file) => sum + file.errors.length, 0);
  const valid = issueCount === 0;

  const report = {
    schemaVersion: 1,
    validator: 'scripts/validate-audio-assets.mjs',
    generatedAt: new Date().toISOString(),
    audioDirectory: toReportPath(AUDIO_DIR),
    valid,
    summary: {
      wavFileCount: files.length,
      requiredFileCount: REQUIRED_FILES.length,
      missingRequiredFileCount: missingRequiredFiles.length,
      invalidFileCount: invalidFiles.length,
      duplicateGroupCount: duplicateGroups.length,
      invalidMusicPairCount: musicPairs.filter((pair) => !pair.valid).length,
      issueCount
    },
    limits: LIMITS,
    checks: {
      requiredFilesPresent: missingRequiredFiles.length === 0,
      everyWavValid: invalidFiles.length === 0,
      uniqueFileHashes: duplicateGroups.length === 0,
      musicPairsAligned: musicPairs.every((pair) => pair.valid),
      runCompleted: runErrors.length === 0
    },
    requiredFiles: REQUIRED_FILES,
    missingRequiredFiles,
    duplicateGroups,
    musicPairs,
    runErrors,
    files
  };

  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const status = valid ? 'PASS' : 'FAIL';
  console.log(
    `Audio validation ${status}: ${files.length} WAV files, ${invalidFiles.length} invalid files, ` +
      `${missingRequiredFiles.length} missing required files, ${duplicateGroups.length} duplicate groups.`
  );
  console.log(`Report: ${toReportPath(REPORT_PATH)}`);

  if (!valid) process.exitCode = 1;
}

main().catch(async (error) => {
  const emergencyReport = {
    schemaVersion: 1,
    validator: 'scripts/validate-audio-assets.mjs',
    generatedAt: new Date().toISOString(),
    valid: false,
    fatalError: error instanceof Error ? error.stack ?? error.message : String(error)
  };

  try {
    await mkdir(dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify(emergencyReport, null, 2)}\n`, 'utf8');
  } catch {
    // Preserve the original failure when even the report cannot be written.
  }

  console.error('Audio validation failed unexpectedly:', error);
  process.exitCode = 1;
});

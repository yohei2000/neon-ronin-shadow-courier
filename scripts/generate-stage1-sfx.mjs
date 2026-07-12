import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Neon Ronin audio is intentionally generated in-repository. Keeping the
// synthesis deterministic makes every shipped WAV reproducible without an
// external sample library or a platform-dependent audio toolchain.
const SAMPLE_RATE = 48_000;
const BIT_DEPTH = 16;
const MAX_PEAK = 0.94;
const TAU = Math.PI * 2;
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'src', 'assets', 'audio');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const fract = (value) => value - Math.floor(value);
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
const smooth = (value) => {
  const amount = clamp(value, 0, 1);
  return amount * amount * (3 - 2 * amount);
};
const fadeWindow = (t, duration, attack = 0.004, release = 0.025) =>
  Math.min(smooth(t / Math.max(attack, 0.0001)), smooth((duration - t) / Math.max(release, 0.0001)));
const attackDecay = (t, attack = 0.004, decayRate = 8) =>
  t < 0 ? 0 : smooth(t / Math.max(attack, 0.0001)) * Math.exp(-t * decayRate);
const sine = (frequency, t, phase = 0) => Math.sin(TAU * frequency * t + phase);
const triangle = (frequency, t, phase = 0) => (2 / Math.PI) * Math.asin(sine(frequency, t, phase));
const sweep = (fromHz, toHz, t, duration, phase = 0) => {
  const safeDuration = Math.max(duration, 0.001);
  const rate = (toHz - fromHz) / safeDuration;
  const limitedT = clamp(t, 0, safeDuration);
  return Math.sin(TAU * (fromHz * limitedT + 0.5 * rate * limitedT * limitedT) + phase);
};
const midi = (note) => 440 * 2 ** ((note - 69) / 12);

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

const createNoise = (seed) => {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) / 0xffffffff) * 2 - 1;
  };
};

// Smooth deterministic noise for transient grit. The fixed grid makes it
// cheap enough for real assets while avoiding the brittle fizz of white noise.
const valueNoise = (t, seed, rate = 4_800) => {
  const position = Math.max(0, t) * rate;
  const index = Math.floor(position);
  const amount = smooth(fract(position));
  const a = hashUnit(index, seed) * 2 - 1;
  const b = hashUnit(index + 1, seed) * 2 - 1;
  return lerp(a, b, amount);
};

const periodicBand = (t, duration, seed, frequencies) => {
  let sum = 0;
  let weight = 0;
  for (let index = 0; index < frequencies.length; index += 1) {
    const cycles = Math.max(1, Math.round(frequencies[index] * duration));
    const phase = hashUnit(index, seed) * TAU;
    const amplitude = 1 / Math.sqrt(1 + index * 0.55);
    sum += sine(cycles / duration, t, phase) * amplitude;
    weight += amplitude;
  }
  return sum / Math.max(weight * 0.54, 1);
};

const pan = (value, position, channel) => {
  const angle = (clamp(position, -1, 1) + 1) * Math.PI * 0.25;
  return value * (channel === 0 ? Math.cos(angle) : Math.sin(angle));
};

const pluckVoice = (frequency, localT, brightness = 0.4) => {
  if (localT < 0 || localT > 1.15) return 0;
  const body = sine(frequency, localT) + triangle(frequency * 2.003, localT, 0.15) * brightness;
  const wood = sine(frequency * 3.01, localT, 0.4) * brightness * 0.28;
  return (body * 0.72 + wood) * attackDecay(localT, 0.0025, 5.9);
};

const drumBody = (localT, high = 112, low = 48, decayRate = 12) => {
  if (localT < 0 || localT > 0.65) return 0;
  return sweep(high, low, localT, 0.22) * attackDecay(localT, 0.0015, decayRate);
};

const transientNoise = (localT, seed, rate = 5_200, decayRate = 18) => {
  if (localT < 0 || localT > 0.55) return 0;
  return valueNoise(localT, seed, rate) * attackDecay(localT, 0.0012, decayRate);
};

const softClip = (value, drive = 1.35) => Math.tanh(value * drive) / Math.tanh(drive);

const removeDc = (samples, channels, oneShot) => {
  const frameCount = samples.length / channels;
  for (let channel = 0; channel < channels; channel += 1) {
    let mean = 0;
    for (let frame = 0; frame < frameCount; frame += 1) mean += samples[frame * channels + channel];
    mean /= frameCount;

    if (!oneShot) {
      for (let frame = 0; frame < frameCount; frame += 1) samples[frame * channels + channel] -= mean;
      continue;
    }

    // 18 Hz first-order high-pass removes synthesis bias and sub-audible
    // speaker travel without thinning the deliberately weighty low end.
    const coefficient = Math.exp((-TAU * 18) / SAMPLE_RATE);
    let previousInput = 0;
    let previousOutput = 0;
    for (let frame = 0; frame < frameCount; frame += 1) {
      const offset = frame * channels + channel;
      const input = samples[offset] - mean;
      const output = input - previousInput + coefficient * previousOutput;
      samples[offset] = output;
      previousInput = input;
      previousOutput = output;
    }
  }
};

const conditionLoopSeam = (samples, channels) => {
  const frameCount = samples.length / channels;
  const repairFrames = Math.min(Math.round(SAMPLE_RATE * 0.018), Math.floor(frameCount / 10));
  for (let channel = 0; channel < channels; channel += 1) {
    const firstOffset = channel;
    const lastOffset = (frameCount - 1) * channels + channel;
    const first = samples[firstOffset];
    const last = samples[lastOffset];
    const midpoint = (first + last) * 0.5;
    for (let frame = 0; frame < repairFrames; frame += 1) {
      const correction = 1 - smooth(frame / Math.max(1, repairFrames - 1));
      const startOffset = frame * channels + channel;
      const endOffset = (frameCount - 1 - frame) * channels + channel;
      samples[startOffset] += (midpoint - first) * correction;
      samples[endOffset] += (midpoint - last) * correction;
    }
  }
};

const removeResidualDc = (samples, channels, loop, duration, fadeIn, fadeOut) => {
  const frameCount = samples.length / channels;
  for (let channel = 0; channel < channels; channel += 1) {
    let sum = 0;
    for (let frame = 0; frame < frameCount; frame += 1) sum += samples[frame * channels + channel];

    if (loop) {
      const mean = sum / frameCount;
      for (let frame = 0; frame < frameCount; frame += 1) samples[frame * channels + channel] -= mean;
      continue;
    }

    // A shaped correction removes any tiny bias reintroduced by nonlinear
    // soft clipping without lifting the already-silent first or last sample.
    let weightSum = 0;
    for (let frame = 0; frame < frameCount; frame += 1) {
      weightSum += fadeWindow(frame / SAMPLE_RATE, duration, fadeIn, fadeOut);
    }
    const correction = sum / Math.max(weightSum, 1);
    for (let frame = 0; frame < frameCount; frame += 1) {
      const t = frame / SAMPLE_RATE;
      samples[frame * channels + channel] -= correction * fadeWindow(t, duration, fadeIn, fadeOut);
    }
  }
};

const results = [];

const writeWav = ({
  name,
  duration,
  synth,
  channels = 1,
  loop = false,
  gain = 1,
  targetPeak = loop ? 0.84 : 0.92,
  fadeIn = 0.004,
  fadeOut = 0.025,
  drive = 1.35
}) => {
  const frameCount = Math.round(duration * SAMPLE_RATE);
  const samples = new Float64Array(frameCount * channels);
  const noise = Array.from({ length: channels }, (_, channel) =>
    createNoise(hashString(`${name}:${channel}:neon-ronin`))
  );

  for (let frame = 0; frame < frameCount; frame += 1) {
    const t = frame / SAMPLE_RATE;
    for (let channel = 0; channel < channels; channel += 1) {
      const raw = synth(t, duration, channel, noise[channel]);
      samples[frame * channels + channel] = Number.isFinite(raw) ? raw * gain : 0;
    }
  }

  removeDc(samples, channels, !loop);

  if (!loop) {
    for (let frame = 0; frame < frameCount; frame += 1) {
      const t = frame / SAMPLE_RATE;
      const window = fadeWindow(t, duration, fadeIn, fadeOut);
      for (let channel = 0; channel < channels; channel += 1) {
        samples[frame * channels + channel] *= window;
      }
    }
  }

  let peak = 0;
  for (let offset = 0; offset < samples.length; offset += 1) {
    samples[offset] = softClip(samples[offset], drive);
  }
  removeResidualDc(samples, channels, loop, duration, fadeIn, fadeOut);
  for (let offset = 0; offset < samples.length; offset += 1) {
    peak = Math.max(peak, Math.abs(samples[offset]));
  }

  const safeTarget = Math.min(targetPeak, MAX_PEAK - 0.01);
  const normalization = peak > 0.000001 ? safeTarget / peak : 1;
  for (let offset = 0; offset < samples.length; offset += 1) samples[offset] *= normalization;

  if (loop) conditionLoopSeam(samples, channels);

  // A final safety pass protects the 0.94 delivery ceiling even after seam
  // conditioning. The 0.93 working target leaves deterministic dither room.
  peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const limiter = peak > MAX_PEAK - 0.005 ? (MAX_PEAK - 0.005) / peak : 1;
  if (limiter !== 1) {
    for (let offset = 0; offset < samples.length; offset += 1) samples[offset] *= limiter;
  }

  const bytesPerSample = BIT_DEPTH / 8;
  const dataSize = frameCount * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(BIT_DEPTH, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const ditherSeed = hashString(`${name}:tpdf`);
  let encodedPeak = 0;
  for (let offset = 0; offset < samples.length; offset += 1) {
    const dither = (hashUnit(offset * 2, ditherSeed) - hashUnit(offset * 2 + 1, ditherSeed)) / 65_536;
    const value = clamp(samples[offset] + dither, -MAX_PEAK, MAX_PEAK);
    encodedPeak = Math.max(encodedPeak, Math.abs(value));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + offset * bytesPerSample);
  }

  const path = join(OUT_DIR, `${name}.wav`);
  writeFileSync(path, buffer);
  const seamDelta = loop
    ? Math.max(
        ...Array.from({ length: channels }, (_, channel) =>
          Math.abs(samples[channel] - samples[(frameCount - 1) * channels + channel])
        )
      )
    : null;
  results.push({ name: `${name}.wav`, seconds: duration, channels, bytes: buffer.length, peak: encodedPeak, seamDelta });
};

mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Stage 1 movement and combat: cloth, wood, steel and restrained neon energy.
// ---------------------------------------------------------------------------

writeWav({
  name: 'stage1-jump',
  duration: 0.42,
  gain: 0.9,
  synth: (t, d, _channel, noise) => {
    const launch = sweep(84, 188, t, 0.29) * attackDecay(t, 0.003, 5.8);
    const foot = sweep(118, 54, t, 0.11) * attackDecay(t, 0.0015, 16);
    const cloth = (noise() * 0.35 + valueNoise(t, 0x1173, 3_200) * 0.65) * attackDecay(t, 0.002, 12);
    const lift = sine(392, t, 0.2) * fadeWindow(t, d, 0.025, 0.1) * Math.exp(-t * 4.6);
    return launch * 0.66 + foot * 0.28 + cloth * 0.14 + lift * 0.13;
  }
});

writeWav({
  name: 'stage1-jump-alt',
  duration: 0.44,
  gain: 0.9,
  synth: (t, d, _channel, noise) => {
    const launch = sweep(76, 176, t, 0.31, 0.3) * attackDecay(t, 0.003, 5.2);
    const sole = sweep(104, 47, t, 0.13) * attackDecay(t, 0.001, 15);
    const cloth = (noise() * 0.25 + valueNoise(t, 0x91e5, 2_700) * 0.75) * attackDecay(t, 0.003, 10.5);
    const airy = sine(330, t) * fadeWindow(t, d, 0.035, 0.12) * Math.exp(-t * 4.2);
    return launch * 0.69 + sole * 0.24 + cloth * 0.16 + airy * 0.12;
  }
});

writeWav({
  name: 'stage1-wall-kick',
  duration: 0.46,
  gain: 0.92,
  synth: (t, d, _channel, noise) => {
    const wall = sweep(142, 45, t, 0.19) * attackDecay(t, 0.001, 9.6);
    const wood = sine(188, t) * attackDecay(t, 0.001, 14) + sine(376, t, 0.3) * attackDecay(t, 0.001, 22) * 0.22;
    const scrape = (valueNoise(t, 0x4210, 2_300) * 0.76 + noise() * 0.24) * attackDecay(t, 0.002, 13);
    const rebound = sweep(156, 312, t, d) * fadeWindow(t, d, 0.025, 0.1) * Math.exp(-t * 4.1);
    return wall * 0.66 + wood * 0.26 + scrape * 0.23 + rebound * 0.23;
  }
});

writeWav({
  name: 'stage1-wall-kick-alt',
  duration: 0.48,
  gain: 0.92,
  synth: (t, d, _channel, noise) => {
    const wall = sweep(126, 39, t, 0.21, 0.25) * attackDecay(t, 0.0015, 8.9);
    const rail = sine(242, t) * attackDecay(t, 0.001, 15) + sine(515, t, 0.8) * attackDecay(t, 0.001, 25) * 0.15;
    const scrape = (valueNoise(t, 0xa247, 2_000) * 0.82 + noise() * 0.18) * attackDecay(t, 0.002, 11.5);
    const rebound = sweep(142, 282, t, d) * fadeWindow(t, d, 0.028, 0.11) * Math.exp(-t * 3.9);
    return wall * 0.7 + rail * 0.22 + scrape * 0.22 + rebound * 0.22;
  }
});

const footstep = (name, duration, seed, pitch) =>
  writeWav({
    name,
    duration,
    gain: 0.88,
    fadeOut: 0.012,
    synth: (t, _d, _channel, noise) => {
      const sole = sweep(pitch, pitch * 0.42, t, 0.065) * attackDecay(t, 0.0008, 28);
      const grit = (valueNoise(t, seed, 2_200) * 0.78 + noise() * 0.22) * attackDecay(t, 0.0008, 34);
      const cloth = valueNoise(t, seed ^ 0x5f1d, 1_000) * attackDecay(t - 0.018, 0.002, 29);
      return sole * 0.66 + grit * 0.24 + cloth * 0.11;
    }
  });

footstep('stage1-footstep-a', 0.14, 0x7a13, 104);
footstep('stage1-footstep-b', 0.15, 0x2d8f, 96);

writeWav({
  name: 'stage1-land-soft',
  duration: 0.26,
  gain: 0.87,
  synth: (t, _d, _channel, noise) => {
    const thud = sweep(104, 42, t, 0.12) * attackDecay(t, 0.001, 18);
    const cloth = (valueNoise(t, 0x303a, 1_900) * 0.8 + noise() * 0.2) * attackDecay(t, 0.002, 22);
    return thud * 0.74 + cloth * 0.22 + sine(55, t) * attackDecay(t, 0.001, 16) * 0.18;
  }
});

writeWav({
  name: 'stage1-land-heavy',
  duration: 0.48,
  gain: 0.96,
  synth: (t, _d, _channel, noise) => {
    const thud = sweep(128, 34, t, 0.19) * attackDecay(t, 0.001, 10);
    const floor = sine(47, t) * attackDecay(t, 0.001, 8.2) + sine(94, t, 0.3) * attackDecay(t, 0.001, 14) * 0.24;
    const debris = (valueNoise(t, 0x82a1, 2_600) * 0.78 + noise() * 0.22) * attackDecay(t, 0.001, 17);
    return thud * 0.76 + floor * 0.38 + debris * 0.25;
  }
});

writeWav({
  name: 'stage1-wall-slide-loop',
  duration: 0.8,
  loop: true,
  targetPeak: 0.78,
  gain: 0.72,
  drive: 1.18,
  synth: (t, d) => {
    const scrape = periodicBand(t, d, 0xb319, [185, 273, 361, 487, 622, 809, 1_040, 1_320]);
    const grit = periodicBand(t, d, 0x2e71, [410, 575, 730, 915, 1_180]);
    const pulse = 0.68 + sine(5 / d, t, 0.4) * 0.18 + sine(9 / d, t, 1.2) * 0.1;
    return (scrape * 0.62 + grit * 0.2 + sine(92.5, t) * 0.09) * pulse;
  }
});

const bladeSound = (name, duration, variant) =>
  writeWav({
    name,
    duration,
    gain: 0.9,
    synth: (t, d, _channel, noise) => {
      const direction = variant === 1 ? [250, 890] : variant === 2 ? [420, 1_080] : [320, 960];
      const body = sweep(direction[0], direction[1], t, d * 0.82, variant * 0.3) * fadeWindow(t, d, 0.012, 0.08);
      const steel = sine(variant === 2 ? 1_180 : 980, t, 0.4) * attackDecay(t, 0.0015, 13) + sine(610, t) * attackDecay(t, 0.002, 9) * 0.2;
      const air = (valueNoise(t, 0x9f20 + variant * 401, 5_800) * 0.8 + noise() * 0.2) * fadeWindow(t, d, 0.018, 0.09);
      const hilt = sweep(132, 62, t, 0.1) * attackDecay(t, 0.001, 22);
      return body * 0.58 + steel * 0.2 + air * 0.26 + hilt * 0.24;
    }
  });

bladeSound('stage1-attack', 0.38, 0);
bladeSound('stage1-attack-alt-a', 0.4, 1);
bladeSound('stage1-attack-alt-b', 0.44, 2);

writeWav({
  name: 'stage1-spin-attack',
  duration: 0.72,
  gain: 0.93,
  synth: (t, d, _channel, noise) => {
    const orbit = sine(5.5, t) * 0.5 + 0.5;
    const flame = sweep(102, 258, t, d) * fadeWindow(t, d, 0.018, 0.13) * (0.62 + orbit * 0.23);
    const ring = sweep(270, 980, t, d * 0.86) * fadeWindow(t, d, 0.025, 0.14);
    const air = (valueNoise(t, 0x5c81, 4_200) * 0.78 + noise() * 0.22) * fadeWindow(t, d, 0.015, 0.12) * (0.56 + orbit * 0.25);
    const core = sine(72, t) * attackDecay(t, 0.002, 3.9);
    return flame * 0.48 + ring * 0.34 + air * 0.28 + core * 0.25;
  }
});

const lightHit = (name, duration, seed, pitch) =>
  writeWav({
    name,
    duration,
    gain: 0.94,
    synth: (t, _d, _channel, noise) => {
      const impact = sweep(pitch, pitch * 0.34, t, 0.1) * attackDecay(t, 0.0008, 19);
      const slice = (valueNoise(t, seed, 4_000) * 0.78 + noise() * 0.22) * attackDecay(t, 0.0008, 23);
      const ring = sine(pitch * 2.6, t) * attackDecay(t, 0.001, 16);
      return impact * 0.63 + slice * 0.29 + ring * 0.16;
    }
  });

lightHit('stage1-hit-light-a', 0.26, 0x128d, 178);
lightHit('stage1-hit-light-b', 0.28, 0xaf21, 162);

writeWav({
  name: 'stage1-hit-heavy',
  duration: 0.52,
  gain: 0.98,
  synth: (t, _d, _channel, noise) => {
    const impact = sweep(166, 34, t, 0.18) * attackDecay(t, 0.0008, 10.5);
    const body = sine(51, t) * attackDecay(t, 0.001, 8) + sine(102, t, 0.2) * attackDecay(t, 0.001, 13) * 0.24;
    const breakage = (valueNoise(t, 0xdd91, 3_200) * 0.78 + noise() * 0.22) * attackDecay(t, 0.001, 16);
    return impact * 0.72 + body * 0.4 + breakage * 0.28;
  }
});

writeWav({
  name: 'stage1-enemy-defeat',
  duration: 0.82,
  gain: 0.9,
  synth: (t, d, _channel, noise) => {
    const collapse = sweep(238, 38, t, d * 0.82) * attackDecay(t, 0.002, 3.4);
    const ink = (valueNoise(t, 0x1ab3, 2_600) * 0.82 + noise() * 0.18) * fadeWindow(t, d, 0.002, 0.16) * Math.exp(-t * 4.1);
    const emberT = t - 0.1;
    const ember = emberT > 0 ? sine(440, emberT) * attackDecay(emberT, 0.01, 5.2) : 0;
    const floor = sine(46, t) * attackDecay(t, 0.001, 5.6);
    return collapse * 0.61 + ink * 0.27 + ember * 0.14 + floor * 0.3;
  }
});

writeWav({
  name: 'stage1-enemy-defeat-wraith',
  duration: 0.94,
  gain: 0.86,
  synth: (t, d, _channel, noise) => {
    const fall = sweep(420, 52, t, d * 0.9, 0.4) * fadeWindow(t, d, 0.012, 0.17) * Math.exp(-t * 2.3);
    const spectral = sine(311, t, sine(5, t) * 0.5) * attackDecay(t, 0.008, 3.5);
    const tear = (valueNoise(t, 0x77e2, 3_600) * 0.86 + noise() * 0.14) * fadeWindow(t, d, 0.01, 0.18) * Math.exp(-t * 3.2);
    const implosion = sweep(108, 31, t, 0.3) * attackDecay(t, 0.001, 7.2);
    return fall * 0.47 + spectral * 0.2 + tear * 0.24 + implosion * 0.38;
  }
});

const hurtSound = (name, duration, seed, pitch) =>
  writeWav({
    name,
    duration,
    gain: 0.94,
    synth: (t, _d, _channel, noise) => {
      const hit = sweep(pitch, 38, t, 0.25) * attackDecay(t, 0.001, 7.1);
      const body = sine(57, t) * attackDecay(t, 0.001, 8.3);
      const grit = (valueNoise(t, seed, 2_900) * 0.8 + noise() * 0.2) * attackDecay(t, 0.001, 16);
      return hit * 0.68 + body * 0.34 + grit * 0.24;
    }
  });

hurtSound('stage1-player-hurt', 0.5, 0x87f3, 148);
hurtSound('stage1-player-hurt-alt', 0.54, 0x42b7, 132);

const pickup = (name, duration, notes, seed, weight = 1) =>
  writeWav({
    name,
    duration,
    gain: 0.84,
    targetPeak: 0.86,
    synth: (t, _d, _channel, noise) => {
      let tone = 0;
      for (let index = 0; index < notes.length; index += 1) {
        const [start, frequency, level] = notes[index];
        const localT = t - start;
        if (localT >= 0) {
          tone += (sine(frequency, localT) * 0.76 + sine(frequency * 2, localT, 0.2) * 0.1) *
            attackDecay(localT, 0.002, 5.4) * level;
        }
      }
      const click = (valueNoise(t, seed, 3_500) * 0.82 + noise() * 0.18) * attackDecay(t, 0.0008, 27);
      return tone * weight + click * 0.09;
    }
  });

pickup('stage1-pickup-seal', 0.36, [[0, 392, 0.5], [0.095, 587.33, 0.4]], 0x2f17, 0.86);
pickup('stage1-pickup-seal-alt', 0.38, [[0, 349.23, 0.48], [0.105, 523.25, 0.42]], 0xb729, 0.86);
pickup('stage1-pickup-scroll', 0.52, [[0.035, 293.66, 0.42], [0.16, 440, 0.32]], 0x1e73, 0.8);
pickup('stage1-pickup-health', 0.56, [[0, 261.63, 0.42], [0.11, 392, 0.34], [0.23, 523.25, 0.26]], 0x86d2, 0.84);
pickup('stage1-pickup-energy', 0.5, [[0, 196, 0.43], [0.08, 392, 0.32], [0.19, 659.25, 0.24]], 0x618c, 0.82);

writeWav({
  name: 'stage1-checkpoint',
  duration: 1.4,
  gain: 0.84,
  targetPeak: 0.88,
  synth: (t) => {
    const strikes = [[0, 174.61], [0.34, 261.63], [0.68, 392]];
    return strikes.reduce((sum, [start, frequency], index) => {
      const localT = t - start;
      if (localT < 0) return sum;
      const bronze = sine(frequency, localT) + sine(frequency * 2.01, localT, 0.4) * 0.19 + sine(frequency * 3.94, localT) * 0.07;
      return sum + bronze * attackDecay(localT, 0.002, 2.8 + index * 0.35) * 0.4;
    }, 0) + sine(49, t) * attackDecay(t, 0.002, 2.9) * 0.2;
  }
});

// ---------------------------------------------------------------------------
// Boss and Stage 2 combat signatures.
// ---------------------------------------------------------------------------

writeWav({
  name: 'stage1-warden-attack',
  duration: 0.78,
  gain: 0.94,
  synth: (t, d, _channel, noise) => {
    const warning = sweep(184, 39, t, 0.56) * attackDecay(t, 0.004, 3.5);
    const bell = sine(218, t) * attackDecay(t, 0.001, 4.8) + sine(437, t, 0.6) * attackDecay(t, 0.001, 7.5) * 0.19;
    const heat = (valueNoise(t, 0x3301, 3_200) * 0.82 + noise() * 0.18) * fadeWindow(t, d, 0.02, 0.14) * Math.exp(-t * 2.8);
    const weight = sine(43, t) * attackDecay(t, 0.002, 4.2);
    return warning * 0.57 + bell * 0.24 + heat * 0.25 + weight * 0.34;
  }
});

writeWav({
  name: 'stage1-warden-projectile',
  duration: 0.68,
  gain: 0.91,
  synth: (t, d, _channel, noise) => {
    const launch = sweep(112, 510, t, d * 0.84) * fadeWindow(t, d, 0.006, 0.1) * Math.exp(-t * 2.2);
    const ember = (valueNoise(t, 0xee14, 4_300) * 0.84 + noise() * 0.16) * fadeWindow(t, d, 0.008, 0.12) * Math.exp(-t * 3.2);
    const body = sine(71, t) * attackDecay(t, 0.001, 5.1);
    return launch * 0.5 + ember * 0.24 + body * 0.34;
  }
});

lightHit('stage1-warden-hit', 0.42, 0xd107, 142);

writeWav({
  name: 'stage1-warden-defeat',
  duration: 1.85,
  gain: 0.94,
  fadeOut: 0.14,
  synth: (t, d, _channel, noise) => {
    const collapse = sweep(176, 27, t, 1.35) * attackDecay(t, 0.003, 1.75);
    const bell = sine(164.81, t) * attackDecay(t, 0.001, 2.2) + sine(329.63, t, 0.8) * attackDecay(t, 0.001, 3.4) * 0.17;
    const debris = (valueNoise(t, 0x7c92, 2_700) * 0.82 + noise() * 0.18) * fadeWindow(t, d, 0.004, 0.18) * Math.exp(-t * 2.3);
    const finalT = t - 0.72;
    const finalHit = finalT > 0 ? drumBody(finalT, 118, 30, 5.8) : 0;
    return collapse * 0.54 + bell * 0.24 + debris * 0.25 + finalHit * 0.55 + sine(36, t) * attackDecay(t, 0.002, 2.1) * 0.25;
  }
});

writeWav({
  name: 'stage2-shadow-thread-launch',
  duration: 0.72,
  gain: 0.88,
  synth: (t, d, _channel, noise) => {
    const thread = sweep(118, 760, t, d * 0.8) * fadeWindow(t, d, 0.01, 0.11) * Math.exp(-t * 1.8);
    const tension = sine(224, t, sine(7, t) * 0.42) * attackDecay(t, 0.004, 4.2);
    const snapT = t - 0.19;
    const snap = snapT > 0 ? transientNoise(snapT, 0x2a71, 4_900, 27) : 0;
    const air = (valueNoise(t, 0x8214, 3_200) * 0.82 + noise() * 0.18) * fadeWindow(t, d, 0.01, 0.13) * Math.exp(-t * 2.7);
    return thread * 0.47 + tension * 0.24 + snap * 0.28 + air * 0.18;
  }
});

writeWav({
  name: 'stage2-shadow-thread-hit',
  duration: 0.48,
  gain: 0.94,
  synth: (t, _d, _channel, noise) => {
    const snap = sweep(510, 82, t, 0.22) * attackDecay(t, 0.001, 10);
    const body = sweep(132, 35, t, 0.19) * attackDecay(t, 0.001, 10.5);
    const fiber = (valueNoise(t, 0xa52c, 4_100) * 0.8 + noise() * 0.2) * attackDecay(t, 0.001, 18);
    return snap * 0.46 + body * 0.55 + fiber * 0.24;
  }
});

writeWav({
  name: 'stage2-relay-attack',
  duration: 0.82,
  gain: 0.94,
  synth: (t, d, _channel, noise) => {
    const charge = sweep(72, 248, t, 0.5) * fadeWindow(t, d, 0.018, 0.17) * Math.exp(-t * 1.8);
    const relay = sine(96, t, sine(9, t) * 0.46) * attackDecay(t, 0.005, 3.1);
    const releaseT = t - 0.43;
    const release = releaseT > 0 ? drumBody(releaseT, 146, 37, 8.5) : 0;
    const staticLayer = (valueNoise(t, 0x3d21, 3_700) * 0.83 + noise() * 0.17) * fadeWindow(t, d, 0.01, 0.13) * Math.exp(-t * 2.8);
    return charge * 0.43 + relay * 0.32 + release * 0.6 + staticLayer * 0.2;
  }
});

writeWav({
  name: 'stage2-relay-projectile',
  duration: 0.72,
  gain: 0.91,
  synth: (t, d, _channel, noise) => {
    const launch = sweep(92, 620, t, d * 0.86, 0.5) * fadeWindow(t, d, 0.006, 0.11) * Math.exp(-t * 1.9);
    const pulse = sine(82, t) * attackDecay(t, 0.002, 4.2) * (0.72 + sine(18, t) * 0.22);
    const staticLayer = (valueNoise(t, 0xb04f, 4_600) * 0.84 + noise() * 0.16) * fadeWindow(t, d, 0.009, 0.12) * Math.exp(-t * 2.9);
    return launch * 0.51 + pulse * 0.34 + staticLayer * 0.21;
  }
});

lightHit('stage2-relay-hit', 0.46, 0xf821, 152);

writeWav({
  name: 'stage2-relay-defeat',
  duration: 1.95,
  gain: 0.95,
  fadeOut: 0.15,
  synth: (t, d, _channel, noise) => {
    const powerDown = sweep(310, 29, t, 1.6) * fadeWindow(t, d, 0.004, 0.18) * Math.exp(-t * 1.35);
    const relay = sine(83, t, sine(5.5, t) * 0.62) * attackDecay(t, 0.002, 1.9);
    const staticLayer = (valueNoise(t, 0x2bc7, 3_900) * 0.84 + noise() * 0.16) * fadeWindow(t, d, 0.002, 0.2) * Math.exp(-t * 2.1);
    const breakT = t - 0.78;
    const breakHit = breakT > 0 ? drumBody(breakT, 136, 26, 5.2) : 0;
    return powerDown * 0.46 + relay * 0.31 + staticLayer * 0.26 + breakHit * 0.6 + sine(34, t) * attackDecay(t, 0.002, 1.8) * 0.26;
  }
});

// ---------------------------------------------------------------------------
// UI and game-state cues. Short, tactile and intentionally below the music.
// ---------------------------------------------------------------------------

pickup('ui-move', 0.12, [[0, 330, 0.42]], 0x2418, 0.52);
pickup('ui-confirm', 0.28, [[0, 293.66, 0.42], [0.07, 440, 0.34]], 0xe317, 0.7);
pickup('ui-back', 0.22, [[0, 392, 0.36], [0.06, 261.63, 0.31]], 0x7aa1, 0.68);

writeWav({
  name: 'ui-pause',
  duration: 0.42,
  gain: 0.72,
  targetPeak: 0.8,
  synth: (t) => {
    const a = sine(196, t) * attackDecay(t, 0.002, 5.6);
    const localT = t - 0.085;
    const b = localT > 0 ? sine(196, localT) * attackDecay(localT, 0.002, 6.2) : 0;
    return a * 0.42 + b * 0.32 + sine(49, t) * attackDecay(t, 0.001, 7.5) * 0.16;
  }
});

writeWav({
  name: 'game-over',
  duration: 2.4,
  gain: 0.8,
  targetPeak: 0.88,
  fadeOut: 0.18,
  synth: (t, d) => {
    const notes = [[0, 293.66], [0.48, 246.94], [0.96, 196], [1.48, 146.83]];
    const melody = notes.reduce((sum, [start, frequency]) => {
      const localT = t - start;
      return localT >= 0 ? sum + pluckVoice(frequency, localT, 0.25) * 0.38 : sum;
    }, 0);
    const descent = sweep(92, 31, t, d * 0.9) * fadeWindow(t, d, 0.02, 0.22) * Math.exp(-t * 1.35);
    const gong = sine(55, t) * attackDecay(t, 0.002, 1.6) + sine(110.5, t, 0.4) * attackDecay(t, 0.002, 2.3) * 0.18;
    return melody + descent * 0.3 + gong * 0.36;
  }
});

writeWav({
  name: 'respawn',
  duration: 1.35,
  gain: 0.82,
  targetPeak: 0.88,
  synth: (t, d, _channel, noise) => {
    const rise = sweep(82, 410, t, d * 0.82) * fadeWindow(t, d, 0.025, 0.18) * Math.exp(-t * 1.3);
    const tones = [[0.18, 196], [0.47, 293.66], [0.76, 440]].reduce((sum, [start, frequency]) => {
      const localT = t - start;
      return localT >= 0 ? sum + pluckVoice(frequency, localT, 0.2) * 0.3 : sum;
    }, 0);
    const air = (valueNoise(t, 0x9d2a, 2_400) * 0.86 + noise() * 0.14) * fadeWindow(t, d, 0.03, 0.2) * Math.exp(-t * 1.7);
    return rise * 0.35 + tones + air * 0.12 + sine(49, t) * attackDecay(t, 0.002, 2.4) * 0.2;
  }
});

writeWav({
  name: 'stage1-stage-clear',
  duration: 2.2,
  gain: 0.82,
  targetPeak: 0.9,
  fadeOut: 0.16,
  synth: (t) => {
    const notes = [[0, 196], [0.32, 261.63], [0.64, 392], [1.02, 523.25], [1.42, 392]];
    const melody = notes.reduce((sum, [start, frequency], index) => {
      const localT = t - start;
      return localT >= 0 ? sum + pluckVoice(frequency, localT, 0.24) * (index === 3 ? 0.42 : 0.34) : sum;
    }, 0);
    const gongT = t - 1.02;
    const gong = gongT >= 0 ? (sine(98, gongT) + sine(196.7, gongT) * 0.18) * attackDecay(gongT, 0.002, 2.1) : 0;
    return melody + gong * 0.26;
  }
});

// ---------------------------------------------------------------------------
// Seamless stereo ambience. Every oscillator completes an integer number of
// cycles; seam conditioning only removes the final sub-sample rounding delta.
// ---------------------------------------------------------------------------

writeWav({
  name: 'ambience-updraft-loop',
  duration: 4,
  channels: 2,
  loop: true,
  gain: 0.58,
  targetPeak: 0.72,
  drive: 1.12,
  synth: (t, d, channel) => {
    const seed = channel === 0 ? 0x3a21 : 0x7e15;
    const lowWind = periodicBand(t, d, 0x4e31, [42, 57, 76, 104]);
    const wideWind = periodicBand(t, d, seed, [139, 187, 252, 338, 452, 610, 820]);
    const air = periodicBand(t, d, seed ^ 0x51d9, [510, 680, 890, 1_120, 1_460]);
    const lift = sine(3 / d, t, channel * 1.3) * 0.17 + sine(7 / d, t, 0.8 + channel) * 0.08;
    const tone = sine(Math.round(73.42 * d) / d, t, 0.17) * 0.12;
    return lowWind * 0.36 + wideWind * (0.32 + lift) + air * 0.12 + tone;
  }
});

writeWav({
  name: 'ambience-stage1',
  duration: 12,
  channels: 2,
  loop: true,
  gain: 0.52,
  targetPeak: 0.68,
  drive: 1.1,
  synth: (t, d, channel) => {
    const seed = channel === 0 ? 0x17b3 : 0x6a91;
    const rain = periodicBand(t, d, seed, [170, 245, 330, 450, 610, 820, 1_070, 1_390, 1_780]);
    const cityLow = periodicBand(t, d, 0x83d1, [28, 41, 55, 73, 91, 118]);
    const cityWidth = periodicBand(t, d, seed ^ 0x83d1, [147, 193, 251]);
    const neon = sine(Math.round(59.8 * d) / d, t, 0.16) * (0.6 + sine(5 / d, t, channel + 0.3) * 0.08);
    const distantPulse = sine(2 / d, t, 0.35) * sine(Math.round(42 * d) / d, t) * 0.08;
    return rain * 0.29 + cityLow * 0.29 + cityWidth * 0.1 + neon * 0.09 + distantPulse;
  }
});

writeWav({
  name: 'ambience-stage2',
  duration: 12,
  channels: 2,
  loop: true,
  gain: 0.55,
  targetPeak: 0.7,
  drive: 1.12,
  synth: (t, d, channel) => {
    const seed = channel === 0 ? 0x5531 : 0xb294;
    const drainLow = periodicBand(t, d, 0x5531, [35, 49, 67, 88, 116]);
    const drainWidth = periodicBand(t, d, seed, [151, 197, 256]);
    const water = periodicBand(t, d, seed ^ 0x91a7, [240, 330, 455, 620, 840, 1_130, 1_480]);
    const machinery = sine(Math.round(46.25 * d) / d, t, 0.18) * (0.66 + sine(7 / d, t, 0.6 + channel) * 0.08);
    const signal = sine(Math.round(184.8 * d) / d, t, 1.2 + channel * 0.4) * sine(3 / d, t, channel * 0.6) * 0.05;
    return drainLow * 0.31 + drainWidth * 0.12 + water * 0.22 + machinery * 0.13 + signal;
  }
});

// ---------------------------------------------------------------------------
// Music: short loopable neon-Japanese electronic cues. The Stage 1 and Stage 2
// base/combat pairs share tempo, harmony, duration and event grid so the game
// can start both together and crossfade without rhythmic or harmonic drift.
// ---------------------------------------------------------------------------

const sequenceLayer = ({ t, loopDuration, beat, pattern, scale, root, channel, brightness = 0.35, level = 1 }) => {
  const step = beat * 0.5;
  const stepIndex = Math.floor(t / step);
  let output = 0;
  const historySteps = Math.ceil(1.15 / step) + 1;
  for (let back = 0; back < historySteps; back += 1) {
    const eventIndex = stepIndex - back;
    const localT = t - eventIndex * step;
    const degree = pattern[mod(eventIndex, pattern.length)];
    if (degree === null || localT < 0 || localT > 1.1) continue;
    const octave = degree >= scale.length ? 12 : degree < 0 ? -12 : 0;
    const scaleIndex = mod(degree, scale.length);
    const frequency = midi(root + scale[scaleIndex] + octave);
    const position = ((mod(eventIndex, 5) - 2) / 2) * 0.48;
    output += pan(pluckVoice(frequency, localT, brightness), position, channel) * level;
  }
  return output;
};

const padLayer = ({ t, duration, roots, intervals, channel, level = 1 }) => {
  const chordDuration = duration / roots.length;
  const chordIndex = Math.floor(t / chordDuration) % roots.length;
  const localT = mod(t, chordDuration);
  const chordEnvelope = Math.min(smooth(localT / 0.32), smooth((chordDuration - localT) / 0.48));
  let output = 0;
  for (let noteIndex = 0; noteIndex < intervals.length; noteIndex += 1) {
    const frequency = midi(roots[chordIndex] + intervals[noteIndex]);
    const cycles = Math.max(1, Math.round(frequency * chordDuration));
    const tunedFrequency = cycles / chordDuration;
    const phase = channel * (0.13 + noteIndex * 0.09) + noteIndex * 0.35;
    output += (sine(tunedFrequency, localT, phase) * 0.72 + triangle(tunedFrequency * 0.5, localT, phase) * 0.18) /
      (1 + noteIndex * 0.32);
  }
  return output * chordEnvelope * level;
};

const bassLayer = ({ t, beat, pattern, root, channel, level = 1 }) => {
  const beatIndex = Math.floor(t / beat);
  const localT = mod(t, beat);
  const semitone = pattern[mod(beatIndex, pattern.length)];
  const frequency = midi(root + semitone);
  const body = sine(frequency, localT) + triangle(frequency, localT, 0.14) * 0.28;
  const envelope = attackDecay(localT, 0.006, 3.7) * smooth((beat - localT) / 0.035);
  return pan(body * envelope, 0, channel) * level;
};

const rhythmLayer = ({ t, beat, channel, combat, seed }) => {
  const beatIndex = Math.floor(t / beat);
  const beatT = mod(t, beat);
  const eighth = beat * 0.5;
  const eighthIndex = Math.floor(t / eighth);
  const eighthT = mod(t, eighth);
  const kickPattern = combat ? [1, 0, 1, 1, 1, 0, 1, 0] : [1, 0, 0, 0, 1, 0, 0, 0];
  const kick = kickPattern[mod(beatIndex, kickPattern.length)] ? drumBody(beatT, combat ? 116 : 104, 43, combat ? 12 : 10) : 0;
  const rim = mod(beatIndex, 4) === 2 ? transientNoise(beatT, seed + beatIndex, 3_900, 19) : 0;
  const hatGate = combat || mod(eighthIndex, 4) === 0;
  const hat = hatGate ? transientNoise(eighthT, seed ^ (eighthIndex * 131), combat ? 7_200 : 5_200, combat ? 31 : 38) : 0;
  const taikoPan = mod(beatIndex, 4) === 3 ? (channel === 0 ? 0.82 : 0.62) : 0.72;
  return kick * 0.43 + rim * (combat ? 0.2 : 0.1) * taikoPan + hat * (combat ? 0.12 : 0.045);
};

const makeStageMusic = ({ stage, combat }) => {
  const isStage1 = stage === 1;
  const bpm = isStage1 ? 120 : 135;
  const beat = 60 / bpm;
  const root = isStage1 ? 50 : 49;
  const scale = isStage1 ? [0, 2, 3, 7, 8] : [0, 1, 5, 7, 10];
  const pluckPattern = isStage1
    ? [0, null, 1, 2, 3, null, 2, 1, 0, null, 3, 4, 3, 2, 1, null]
    : [0, 2, null, 1, 3, null, 4, 3, 0, null, 2, 4, 3, 1, null, 2, 4, null];
  const bassPattern = isStage1 ? [0, 0, 7, 0, 3, 3, 8, 7] : [0, 0, 5, 0, 1, 1, 10, 7, 0];
  const chordRoots = isStage1 ? [50, 53, 58, 57] : [49, 54, 59, 56];
  const chordIntervals = isStage1 ? [0, 7, 15] : [0, 7, 13];

  return (t, duration, channel) => {
    const pad = padLayer({ t, duration, roots: chordRoots, intervals: chordIntervals, channel, level: combat ? 0.2 : 0.22 });
    const bass = bassLayer({ t, beat, pattern: bassPattern, root: root - 12, channel, level: combat ? 0.3 : 0.27 });
    const pluck = sequenceLayer({
      t,
      loopDuration: duration,
      beat,
      pattern: pluckPattern,
      scale,
      root,
      channel,
      brightness: combat ? 0.42 : 0.28,
      level: combat ? 0.27 : 0.23
    });
    const rhythm = rhythmLayer({ t, beat, channel, combat, seed: isStage1 ? 0x4d21 : 0x92a7 });
    const pulse = sine(Math.round((isStage1 ? 98 : 92.5) * duration) / duration, t, channel * 0.12) *
      (0.5 + 0.5 * sine((duration / beat) / duration, t, -Math.PI / 2)) * (combat ? 0.055 : 0.035);
    const combatSignal = combat
      ? pan(sine(Math.round((isStage1 ? 392 : 369.99) * duration) / duration, t, channel * 0.25) *
          (0.5 + sine(4 / duration, t, 0.6) * 0.3), channel === 0 ? -0.35 : 0.35, channel) * 0.025
      : 0;
    return pad + bass + pluck + rhythm + pulse + combatSignal;
  };
};

const makeMenuMusic = () => {
  const duration = 16;
  const bpm = 90;
  const beat = 60 / bpm;
  const pattern = [0, null, 2, null, 3, 1, null, 4, 3, null, 2, 1];
  const scale = [0, 2, 3, 7, 8];
  return (t, _d, channel) => {
    const pad = padLayer({ t, duration, roots: [45, 48, 53, 52], intervals: [0, 7, 15], channel, level: 0.24 });
    const pluck = sequenceLayer({ t, loopDuration: duration, beat, pattern, scale, root: 57, channel, brightness: 0.22, level: 0.23 });
    const sub = bassLayer({ t, beat: beat * 2, pattern: [0, 3, 8, 7], root: 33, channel, level: 0.16 });
    const pulseT = mod(t, beat * 2);
    const pulse = drumBody(pulseT, 84, 39, 11) * 0.12;
    const neon = sine(Math.round(219.8 * duration) / duration, t, 0.3 + channel * 0.25) * sine(3 / duration, t, channel) * 0.025;
    return pad + pluck + sub + pulse + neon;
  };
};

writeWav({
  name: 'music-menu',
  duration: 16,
  channels: 2,
  loop: true,
  gain: 0.86,
  targetPeak: 0.86,
  drive: 1.2,
  synth: makeMenuMusic()
});

writeWav({
  name: 'music-stage1-base',
  duration: 16,
  channels: 2,
  loop: true,
  gain: 0.9,
  targetPeak: 0.87,
  drive: 1.25,
  synth: makeStageMusic({ stage: 1, combat: false })
});

writeWav({
  name: 'music-stage1-combat',
  duration: 16,
  channels: 2,
  loop: true,
  gain: 0.92,
  targetPeak: 0.89,
  drive: 1.28,
  synth: makeStageMusic({ stage: 1, combat: true })
});

writeWav({
  name: 'music-stage2-base',
  duration: 16,
  channels: 2,
  loop: true,
  gain: 0.9,
  targetPeak: 0.87,
  drive: 1.25,
  synth: makeStageMusic({ stage: 2, combat: false })
});

writeWav({
  name: 'music-stage2-combat',
  duration: 16,
  channels: 2,
  loop: true,
  gain: 0.92,
  targetPeak: 0.89,
  drive: 1.28,
  synth: makeStageMusic({ stage: 2, combat: true })
});

writeWav({
  name: 'music-stage-clear',
  duration: 8,
  channels: 2,
  loop: true,
  gain: 0.85,
  targetPeak: 0.87,
  drive: 1.2,
  synth: (t, duration, channel) => {
    const beat = 0.5;
    const pad = padLayer({ t, duration, roots: [50, 53, 57, 50], intervals: [0, 7, 14], channel, level: 0.2 });
    const pattern = [0, null, 1, 2, 3, 4, 3, 2, 0, 1, 3, 4, 5, 4, 3, 2];
    const pluck = sequenceLayer({
      t,
      loopDuration: duration,
      beat,
      pattern,
      scale: [0, 2, 3, 7, 8],
      root: 62,
      channel,
      brightness: 0.24,
      level: 0.28
    });
    const beatT = mod(t, beat);
    const taiko = drumBody(beatT, 92, 41, 11) * (mod(Math.floor(t / beat), 4) === 0 ? 0.18 : 0.05);
    const bass = bassLayer({ t, beat: beat * 2, pattern: [0, 3, 7, 0], root: 38, channel, level: 0.17 });
    return pad + pluck + taiko + bass;
  }
});

const expectedCount = 52;
if (results.length !== expectedCount) {
  throw new Error(`Expected ${expectedCount} generated WAV files, received ${results.length}`);
}

console.log(`Generated ${results.length} deterministic WAV assets in ${OUT_DIR}`);
console.table(results.map((result) => ({
  file: result.name,
  seconds: result.seconds.toFixed(2),
  channels: result.channels,
  bytes: result.bytes,
  peak: result.peak.toFixed(4),
  seam: result.seamDelta === null ? '-' : result.seamDelta.toExponential(2)
})));

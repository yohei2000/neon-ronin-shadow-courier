import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const TAU = Math.PI * 2;
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'src', 'assets', 'audio');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const sine = (frequency, t, phase = 0) => Math.sin(TAU * frequency * t + phase);
const sweep = (fromHz, toHz, t, duration, phase = 0) => {
  const k = (toHz - fromHz) / Math.max(duration, 0.001);
  return Math.sin(TAU * (fromHz * t + 0.5 * k * t * t) + phase);
};
const smooth = (x) => {
  const amount = clamp(x, 0, 1);
  return amount * amount * (3 - 2 * amount);
};
const envelope = (t, duration, attack = 0.008, release = 0.055) => {
  const fadeIn = smooth(t / attack);
  const fadeOut = smooth((duration - t) / release);
  return Math.min(fadeIn, fadeOut);
};
const decay = (t, amount) => Math.exp(-t * amount);

const createNoise = (seed = 0x45d9f3b) => {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return (value / 0xffffffff) * 2 - 1;
  };
};

const writeWav = (name, durationSeconds, synth, gain = 0.88) => {
  const frameCount = Math.ceil(durationSeconds * SAMPLE_RATE);
  const samples = new Float32Array(frameCount);
  const noise = createNoise(name.split('').reduce((seed, char) => seed + char.charCodeAt(0), 0x9e3779b9));
  let peak = 0;

  for (let index = 0; index < frameCount; index += 1) {
    const t = index / SAMPLE_RATE;
    const value = clamp(synth(t, durationSeconds, noise) * envelope(t, durationSeconds) * gain, -1, 1);
    samples[index] = value;
    peak = Math.max(peak, Math.abs(value));
  }

  const normalize = peak > 0.96 ? 0.96 / peak : 1;
  const buffer = Buffer.alloc(44 + frameCount * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + frameCount * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(frameCount * 2, 40);

  for (let index = 0; index < frameCount; index += 1) {
    const sample = Math.round(clamp(samples[index] * normalize, -1, 1) * 32767);
    buffer.writeInt16LE(sample, 44 + index * 2);
  }

  writeFileSync(join(OUT_DIR, `${name}.wav`), buffer);
};

mkdirSync(OUT_DIR, { recursive: true });

writeWav('stage1-jump', 0.32, (t, d, noise) => {
  const legDrive = sweep(92, 168, t, d) * decay(t, 5.8);
  const clothSnap = noise() * decay(t, 18) * 0.08;
  const neonLift = sine(520, t) * Math.sin(Math.PI * clamp(t / d, 0, 1)) * 0.18;
  return legDrive * 0.84 + neonLift + clothSnap;
});

writeWav('stage1-wall-kick', 0.34, (t, d, noise) => {
  const impact = sweep(128, 46, t, 0.18) * decay(t, 8.5);
  const scrape = noise() * decay(t, 15) * 0.28;
  const rebound = sweep(190, 310, t, d) * Math.sin(Math.PI * clamp(t / d, 0, 1)) * 0.24;
  return impact * 0.86 + scrape + rebound;
});

writeWav('stage1-attack', 0.27, (t, d, noise) => {
  const cutBody = sweep(340, 920, t, d) * Math.sin(Math.PI * clamp(t / d, 0, 1));
  const metalEdge = sine(1180, t) * decay(t, 10) * 0.18;
  const air = noise() * Math.sin(Math.PI * clamp(t / d, 0, 1)) * 0.26;
  const impact = sweep(150, 72, t, 0.1) * decay(t, 18) * 0.25;
  return cutBody * 0.68 + metalEdge + air + impact;
});

writeWav('stage1-spin-attack', 0.5, (t, d, noise) => {
  const wobble = 0.5 + 0.5 * sine(6.5, t);
  const flameBody = sweep(130, 280, t, d) * (0.5 + wobble * 0.32) * decay(t, 1.6);
  const bladeRing = sweep(360, 940, t, d) * Math.sin(Math.PI * clamp(t / d, 0, 1)) * 0.44;
  const fireAir = noise() * (0.24 + wobble * 0.24) * Math.sin(Math.PI * clamp(t / d, 0, 1));
  return flameBody * 0.78 + bladeRing + fireAir;
});

writeWav('stage1-enemy-defeat', 0.62, (t, d, noise) => {
  const collapse = sweep(260, 42, t, d) * decay(t, 2.6);
  const crackleGate = t < 0.24 ? 1 : decay(t - 0.24, 11);
  const crackle = noise() * crackleGate * 0.30;
  const ember = sine(520, t) * decay(Math.max(0, t - 0.1), 5) * (t > 0.1 ? 0.22 : 0);
  return collapse * 0.82 + crackle + ember;
});

writeWav('stage1-player-hurt', 0.38, (t, d, noise) => {
  const hit = sweep(142, 42, t, d) * decay(t, 5.4);
  const grit = noise() * decay(t, 12) * 0.24;
  const body = sine(74, t) * decay(t, 6.8) * 0.28;
  return hit * 0.82 + grit + body;
});

writeWav('stage1-pickup-seal', 0.28, (t, d, noise) => {
  const first = sine(420, t) * decay(t, 5.2);
  const secondT = Math.max(0, t - 0.08);
  const second = t > 0.08 ? sine(630, secondT) * decay(secondT, 5.6) : 0;
  const copperClick = noise() * decay(t, 28) * 0.06;
  return first * 0.46 + second * 0.34 + copperClick;
});

writeWav('stage1-pickup-scroll', 0.38, (t, d, noise) => {
  const rustle = noise() * decay(t, 12) * 0.20;
  const sealTone = sine(330, t) * decay(Math.max(0, t - 0.055), 4.2) * (t > 0.035 ? 0.34 : 0);
  return rustle + sealTone + sine(495, t) * 0.12 * decay(t, 5.2);
});

writeWav('stage1-pickup-health', 0.42, (t) => {
  const mix = sine(261.63, t) * 0.34 + sine(392, t) * 0.25 + sine(523.25, t) * 0.16;
  return mix * decay(t, 3.1);
});

writeWav('stage1-pickup-energy', 0.38, (t, d, noise) => {
  const pulse = sine(196, t) * 0.34 + sine(392, t, 0.4) * 0.22 + sine(784, t, 0.8) * 0.10;
  const staticBed = noise() * decay(t, 12) * 0.08;
  return pulse * (0.6 + 0.4 * sine(8, t)) * decay(t, 3.4) + staticBed;
});

writeWav('stage1-checkpoint', 0.92, (t) => {
  const gong = sine(196, t) * decay(t, 2.1) + sine(392, t) * 0.24 * decay(t, 3.8);
  const secondT = Math.max(0, t - 0.28);
  const answer = t > 0.28 ? sine(293.66, secondT) * decay(secondT, 2.4) + sine(587.33, secondT) * 0.2 * decay(secondT, 4.2) : 0;
  return gong * 0.48 + answer * 0.48;
});

writeWav('stage1-warden-attack', 0.5, (t, d, noise) => {
  const warning = sweep(170, 42, t, d) * decay(t, 2.9);
  const heat = noise() * Math.sin(Math.PI * clamp(t / d, 0, 1)) * 0.28;
  const bell = sine(260, t) * decay(t, 4.4) * 0.26;
  return warning * 0.78 + heat + bell;
});

writeWav('stage1-warden-projectile', 0.44, (t, d, noise) => {
  const launch = sweep(150, 520, t, d) * decay(t, 2.4);
  const ember = noise() * decay(t, 7.4) * 0.22;
  const body = sine(92, t) * decay(t, 5.5) * 0.25;
  return launch * 0.54 + ember + body;
});

writeWav('stage1-stage-clear', 1.12, (t) => {
  const notes = [
    [0, 196],
    [0.22, 261.63],
    [0.44, 392],
    [0.68, 523.25]
  ];
  return notes.reduce((sum, [start, frequency]) => {
    if (t < start) return sum;
    const localT = t - start;
    return sum + sine(frequency, localT) * 0.34 * decay(localT, 2.5) + sine(frequency * 2, localT) * 0.08 * decay(localT, 4.2);
  }, 0);
});

console.log(`Generated Stage1 SFX in ${OUT_DIR}`);

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

writeWav('stage1-jump', 0.24, (t, d, noise) => {
  const rise = sweep(210, 680, t, d);
  const neon = sine(1280, t) * decay(t, 9);
  return rise * 0.74 + neon * 0.16 + noise() * 0.018 * decay(t, 16);
});

writeWav('stage1-wall-kick', 0.22, (t, d, noise) => {
  const thud = sweep(190, 82, t, 0.14) * decay(t, 16);
  const rebound = sweep(320, 540, t, d) * Math.sin(Math.PI * clamp(t / d, 0, 1));
  return thud * 0.5 + rebound * 0.42 + noise() * 0.18 * decay(t, 24);
});

writeWav('stage1-attack', 0.19, (t, d, noise) => {
  const blade = sweep(760, 2380, t, d) * Math.sin(Math.PI * clamp(t / d, 0, 1));
  const air = noise() * Math.sin(Math.PI * clamp(t / d, 0, 1)) * 0.34;
  return blade * 0.62 + air;
});

writeWav('stage1-spin-attack', 0.34, (t, d, noise) => {
  const wobble = 0.5 + 0.5 * sine(8.5, t);
  const blade = sweep(460, 1560, t, d) * (0.45 + wobble * 0.38);
  const air = noise() * (0.26 + wobble * 0.24);
  return blade * 0.58 + air * Math.sin(Math.PI * clamp(t / d, 0, 1));
});

writeWav('stage1-enemy-defeat', 0.42, (t, d, noise) => {
  const drop = sweep(560, 118, t, d) * decay(t, 3.6);
  const crackleGate = t < 0.18 ? 1 : decay(t - 0.18, 20);
  const crackle = noise() * crackleGate * 0.34;
  const ember = sine(1240, t) * decay(Math.max(0, t - 0.08), 9) * (t > 0.08 ? 1 : 0);
  return drop * 0.66 + crackle + ember * 0.16;
});

writeWav('stage1-player-hurt', 0.28, (t, d, noise) => {
  const hit = sweep(180, 72, t, d) * decay(t, 7);
  const grit = noise() * decay(t, 18);
  return hit * 0.82 + grit * 0.18;
});

writeWav('stage1-pickup-seal', 0.22, (t, d) => {
  const note = t < 0.075 ? 880 : t < 0.145 ? 1320 : 1760;
  return sine(note, t) * 0.58 * decay(t, 3.5) + sine(note * 2, t) * 0.14 * decay(t, 5);
});

writeWav('stage1-pickup-scroll', 0.3, (t, d, noise) => {
  const rustle = noise() * decay(t, 18) * 0.16;
  const chime = sine(740, t) * decay(Math.max(0, t - 0.055), 4) * (t > 0.035 ? 0.48 : 0);
  return rustle + chime + sine(1110, t) * 0.14 * decay(t, 5);
});

writeWav('stage1-pickup-health', 0.34, (t) => {
  const mix = sine(523.25, t) * 0.32 + sine(659.25, t) * 0.25 + sine(783.99, t) * 0.22;
  return mix * decay(t, 3.8);
});

writeWav('stage1-pickup-energy', 0.28, (t) => {
  const shimmer = sine(988, t) * 0.36 + sine(1482, t, 0.4) * 0.22 + sine(1976, t, 0.8) * 0.12;
  return shimmer * (0.55 + 0.45 * sine(12, t)) * decay(t, 4.2);
});

writeWav('stage1-checkpoint', 0.68, (t) => {
  const first = sine(392, t) * decay(t, 3.3) + sine(784, t) * 0.28 * decay(t, 5);
  const secondT = Math.max(0, t - 0.21);
  const second = t > 0.21 ? sine(587.33, secondT) * decay(secondT, 3.1) + sine(1174.66, secondT) * 0.22 * decay(secondT, 4.8) : 0;
  return first * 0.42 + second * 0.5;
});

writeWav('stage1-warden-attack', 0.32, (t, d, noise) => {
  const warning = sweep(300, 95, t, d) * decay(t, 4.2);
  const heat = noise() * Math.sin(Math.PI * clamp(t / d, 0, 1)) * 0.24;
  return warning * 0.64 + heat;
});

writeWav('stage1-warden-projectile', 0.3, (t, d, noise) => {
  const spark = sweep(260, 940, t, d) * decay(t, 2.5);
  const ember = noise() * decay(t, 9) * 0.24;
  return spark * 0.55 + ember;
});

writeWav('stage1-stage-clear', 0.92, (t) => {
  const notes = [
    [0, 523.25],
    [0.16, 659.25],
    [0.32, 783.99],
    [0.5, 1046.5]
  ];
  return notes.reduce((sum, [start, frequency]) => {
    if (t < start) return sum;
    const localT = t - start;
    return sum + sine(frequency, localT) * 0.33 * decay(localT, 3.2) + sine(frequency * 2, localT) * 0.08 * decay(localT, 5);
  }, 0);
});

console.log(`Generated Stage1 SFX in ${OUT_DIR}`);

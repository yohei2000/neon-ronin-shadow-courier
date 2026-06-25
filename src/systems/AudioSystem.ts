import type { AudioKey } from '../config/keys';
import type { GameSettings } from '../types/save';
import { SaveSystem } from './SaveSystem';

type BrowserAudioContext = AudioContext;

const sfxShape: Record<AudioKey, { readonly frequency: number; readonly duration: number; readonly type: OscillatorType }> = {
  confirm: { frequency: 660, duration: 0.08, type: 'triangle' },
  cancel: { frequency: 220, duration: 0.08, type: 'sine' },
  jump: { frequency: 480, duration: 0.12, type: 'square' },
  'wall-jump': { frequency: 540, duration: 0.14, type: 'triangle' },
  slash: { frequency: 640, duration: 0.07, type: 'triangle' },
  'enemy-hit': { frequency: 360, duration: 0.08, type: 'square' },
  'enemy-defeat': { frequency: 180, duration: 0.18, type: 'triangle' },
  'player-hurt': { frequency: 140, duration: 0.16, type: 'sawtooth' },
  'pickup-seal': { frequency: 820, duration: 0.08, type: 'triangle' },
  'pickup-scroll': { frequency: 980, duration: 0.16, type: 'sine' },
  checkpoint: { frequency: 520, duration: 0.22, type: 'sine' },
  'miniboss-start': { frequency: 150, duration: 0.28, type: 'sawtooth' },
  'miniboss-defeated': { frequency: 720, duration: 0.24, type: 'triangle' },
  'stage-clear': { frequency: 990, duration: 0.28, type: 'triangle' },
  victory: { frequency: 1040, duration: 0.38, type: 'triangle' }
};

export class AudioSystem {
  private context: BrowserAudioContext | null = null;
  private unlocked = false;

  constructor(private readonly saveSystem: SaveSystem) {}

  unlock(): void {
    const AudioContextCtor =
      typeof window !== 'undefined'
        ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AudioContextCtor) {
      return;
    }
    this.context ??= new AudioContextCtor();
    void this.context.resume().then(() => {
      this.unlocked = true;
    });
  }

  play(key: AudioKey): void {
    const settings = this.saveSystem.data.settings;
    if (settings.muted || settings.masterVolume <= 0 || settings.sfxVolume <= 0) {
      return;
    }
    this.unlock();
    if (!this.context || !this.unlocked) {
      return;
    }
    const shape = sfxShape[key];
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = shape.type;
    oscillator.frequency.setValueAtTime(shape.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, shape.frequency * 0.45), now + shape.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(settings.masterVolume * settings.sfxVolume * 0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + shape.duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + shape.duration + 0.02);
  }

  getSettings(): GameSettings {
    return this.saveSystem.data.settings;
  }
}

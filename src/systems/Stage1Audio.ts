import * as Phaser from 'phaser';
import { Stage1SfxKey } from '../data/audioAssets';
import type { Stage1Settings } from './SaveSystem';

export const Stage1SfxEvent = 'stage1:sfx';

export type Stage1SfxOptions = {
  readonly volume?: number;
  readonly detune?: number;
  readonly rate?: number;
  readonly minGapMs?: number;
};

const defaultMinGapMs: Partial<Record<Stage1SfxKey, number>> = {
  [Stage1SfxKey.Attack]: 110,
  [Stage1SfxKey.SpinAttack]: 170,
  [Stage1SfxKey.PlayerHurt]: 180,
  [Stage1SfxKey.PickupSeal]: 38,
  [Stage1SfxKey.PickupEnergy]: 60,
  [Stage1SfxKey.WardenAttack]: 260,
  [Stage1SfxKey.WardenProjectile]: 120
};

const defaultVolume: Record<Stage1SfxKey, number> = {
  [Stage1SfxKey.Jump]: 0.62,
  [Stage1SfxKey.WallKick]: 0.68,
  [Stage1SfxKey.Attack]: 0.62,
  [Stage1SfxKey.SpinAttack]: 0.7,
  [Stage1SfxKey.EnemyDefeat]: 0.78,
  [Stage1SfxKey.PlayerHurt]: 0.72,
  [Stage1SfxKey.PickupSeal]: 0.46,
  [Stage1SfxKey.PickupScroll]: 0.58,
  [Stage1SfxKey.PickupHealth]: 0.58,
  [Stage1SfxKey.PickupEnergy]: 0.54,
  [Stage1SfxKey.Checkpoint]: 0.72,
  [Stage1SfxKey.WardenAttack]: 0.68,
  [Stage1SfxKey.WardenProjectile]: 0.6,
  [Stage1SfxKey.StageClear]: 0.82
};

export class Stage1Audio {
  private readonly lastPlayedMs = new Map<Stage1SfxKey, number>();
  private readonly sfxVolume: number;
  private readonly handleSfxEvent = (key: Stage1SfxKey, options: Stage1SfxOptions = {}) => this.play(key, options);

  constructor(private readonly scene: Phaser.Scene, settings: Stage1Settings) {
    this.scene.sound.volume = settings.masterVolume;
    this.sfxVolume = settings.sfxVolume;
    this.scene.events.on(Stage1SfxEvent, this.handleSfxEvent);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  play(key: Stage1SfxKey, options: Stage1SfxOptions = {}): void {
    if (this.sfxVolume <= 0 || !this.scene.cache.audio.exists(key)) return;

    const now = this.scene.time.now;
    const minGapMs = options.minGapMs ?? defaultMinGapMs[key] ?? 0;
    const lastPlayedMs = this.lastPlayedMs.get(key) ?? -Infinity;
    if (now - lastPlayedMs < minGapMs) return;

    this.lastPlayedMs.set(key, now);
    this.scene.sound.play(key, {
      volume: Math.max(0, Math.min(1, this.sfxVolume * (options.volume ?? defaultVolume[key]))),
      detune: options.detune ?? 0,
      rate: options.rate ?? 1
    });
  }

  destroy(): void {
    this.scene.events.off(Stage1SfxEvent, this.handleSfxEvent);
  }
}

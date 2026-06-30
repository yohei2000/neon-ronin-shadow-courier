export const Stage1SfxKey = {
  Jump: 'stage1-sfx-jump',
  WallKick: 'stage1-sfx-wall-kick',
  Attack: 'stage1-sfx-attack',
  SpinAttack: 'stage1-sfx-spin-attack',
  EnemyDefeat: 'stage1-sfx-enemy-defeat',
  PlayerHurt: 'stage1-sfx-player-hurt',
  PickupSeal: 'stage1-sfx-pickup-seal',
  PickupScroll: 'stage1-sfx-pickup-scroll',
  PickupHealth: 'stage1-sfx-pickup-health',
  PickupEnergy: 'stage1-sfx-pickup-energy',
  Checkpoint: 'stage1-sfx-checkpoint',
  WardenAttack: 'stage1-sfx-warden-attack',
  WardenProjectile: 'stage1-sfx-warden-projectile',
  StageClear: 'stage1-sfx-stage-clear'
} as const;

export type Stage1SfxKey = (typeof Stage1SfxKey)[keyof typeof Stage1SfxKey];

export const Stage1AudioAssets: Record<Stage1SfxKey, string> = {
  [Stage1SfxKey.Jump]: new URL('../assets/audio/stage1-jump.wav', import.meta.url).href,
  [Stage1SfxKey.WallKick]: new URL('../assets/audio/stage1-wall-kick.wav', import.meta.url).href,
  [Stage1SfxKey.Attack]: new URL('../assets/audio/stage1-attack.wav', import.meta.url).href,
  [Stage1SfxKey.SpinAttack]: new URL('../assets/audio/stage1-spin-attack.wav', import.meta.url).href,
  [Stage1SfxKey.EnemyDefeat]: new URL('../assets/audio/stage1-enemy-defeat.wav', import.meta.url).href,
  [Stage1SfxKey.PlayerHurt]: new URL('../assets/audio/stage1-player-hurt.wav', import.meta.url).href,
  [Stage1SfxKey.PickupSeal]: new URL('../assets/audio/stage1-pickup-seal.wav', import.meta.url).href,
  [Stage1SfxKey.PickupScroll]: new URL('../assets/audio/stage1-pickup-scroll.wav', import.meta.url).href,
  [Stage1SfxKey.PickupHealth]: new URL('../assets/audio/stage1-pickup-health.wav', import.meta.url).href,
  [Stage1SfxKey.PickupEnergy]: new URL('../assets/audio/stage1-pickup-energy.wav', import.meta.url).href,
  [Stage1SfxKey.Checkpoint]: new URL('../assets/audio/stage1-checkpoint.wav', import.meta.url).href,
  [Stage1SfxKey.WardenAttack]: new URL('../assets/audio/stage1-warden-attack.wav', import.meta.url).href,
  [Stage1SfxKey.WardenProjectile]: new URL('../assets/audio/stage1-warden-projectile.wav', import.meta.url).href,
  [Stage1SfxKey.StageClear]: new URL('../assets/audio/stage1-stage-clear.wav', import.meta.url).href
};

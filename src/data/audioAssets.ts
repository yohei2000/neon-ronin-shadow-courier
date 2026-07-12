export const GameAudioKey = {
  Jump: 'game-sfx-jump',
  JumpAlt: 'game-sfx-jump-alt',
  WallKick: 'game-sfx-wall-kick',
  WallKickAlt: 'game-sfx-wall-kick-alt',
  FootstepA: 'game-sfx-footstep-a',
  FootstepB: 'game-sfx-footstep-b',
  LandSoft: 'game-sfx-land-soft',
  LandHeavy: 'game-sfx-land-heavy',
  WallSlideLoop: 'game-loop-wall-slide',
  Attack: 'game-sfx-attack',
  AttackAltA: 'game-sfx-attack-alt-a',
  AttackAltB: 'game-sfx-attack-alt-b',
  SpinAttack: 'game-sfx-spin-attack',
  HitLightA: 'game-sfx-hit-light-a',
  HitLightB: 'game-sfx-hit-light-b',
  HitHeavy: 'game-sfx-hit-heavy',
  EnemyDefeat: 'game-sfx-enemy-defeat-crawler',
  EnemyDefeatWraith: 'game-sfx-enemy-defeat-wraith',
  PlayerHurt: 'game-sfx-player-hurt',
  PlayerHurtAlt: 'game-sfx-player-hurt-alt',
  PickupSeal: 'game-sfx-pickup-seal',
  PickupSealAlt: 'game-sfx-pickup-seal-alt',
  PickupScroll: 'game-sfx-pickup-scroll',
  PickupHealth: 'game-sfx-pickup-health',
  PickupEnergy: 'game-sfx-pickup-energy',
  Checkpoint: 'game-sfx-checkpoint',
  WardenAttack: 'game-sfx-warden-attack',
  WardenProjectile: 'game-sfx-warden-projectile',
  WardenHit: 'game-sfx-warden-hit',
  WardenDefeat: 'game-sfx-warden-defeat',
  ShadowThreadLaunch: 'game-sfx-shadow-thread-launch',
  ShadowThreadHit: 'game-sfx-shadow-thread-hit',
  RelayAttack: 'game-sfx-relay-attack',
  RelayProjectile: 'game-sfx-relay-projectile',
  RelayHit: 'game-sfx-relay-hit',
  RelayDefeat: 'game-sfx-relay-defeat',
  UiMove: 'game-ui-move',
  UiConfirm: 'game-ui-confirm',
  UiBack: 'game-ui-back',
  UiPause: 'game-ui-pause',
  GameOver: 'game-sfx-game-over',
  Respawn: 'game-sfx-respawn',
  StageClear: 'game-sfx-stage-clear',
  UpdraftLoop: 'game-loop-updraft',
  MusicMenu: 'game-music-menu',
  AmbienceStage1: 'game-ambience-stage1',
  MusicStage1Base: 'game-music-stage1-base',
  MusicStage1Combat: 'game-music-stage1-combat',
  AmbienceStage2: 'game-ambience-stage2',
  MusicStage2Base: 'game-music-stage2-base',
  MusicStage2Combat: 'game-music-stage2-combat',
  MusicStageClear: 'game-music-stage-clear'
} as const;

export type GameAudioKey = (typeof GameAudioKey)[keyof typeof GameAudioKey];

export const GameAudioAssets: Record<GameAudioKey, string> = {
  [GameAudioKey.Jump]: new URL('../assets/audio/stage1-jump.wav', import.meta.url).href,
  [GameAudioKey.JumpAlt]: new URL('../assets/audio/stage1-jump-alt.wav', import.meta.url).href,
  [GameAudioKey.WallKick]: new URL('../assets/audio/stage1-wall-kick.wav', import.meta.url).href,
  [GameAudioKey.WallKickAlt]: new URL('../assets/audio/stage1-wall-kick-alt.wav', import.meta.url).href,
  [GameAudioKey.FootstepA]: new URL('../assets/audio/stage1-footstep-a.wav', import.meta.url).href,
  [GameAudioKey.FootstepB]: new URL('../assets/audio/stage1-footstep-b.wav', import.meta.url).href,
  [GameAudioKey.LandSoft]: new URL('../assets/audio/stage1-land-soft.wav', import.meta.url).href,
  [GameAudioKey.LandHeavy]: new URL('../assets/audio/stage1-land-heavy.wav', import.meta.url).href,
  [GameAudioKey.WallSlideLoop]: new URL('../assets/audio/stage1-wall-slide-loop.wav', import.meta.url).href,
  [GameAudioKey.Attack]: new URL('../assets/audio/stage1-attack.wav', import.meta.url).href,
  [GameAudioKey.AttackAltA]: new URL('../assets/audio/stage1-attack-alt-a.wav', import.meta.url).href,
  [GameAudioKey.AttackAltB]: new URL('../assets/audio/stage1-attack-alt-b.wav', import.meta.url).href,
  [GameAudioKey.SpinAttack]: new URL('../assets/audio/stage1-spin-attack.wav', import.meta.url).href,
  [GameAudioKey.HitLightA]: new URL('../assets/audio/stage1-hit-light-a.wav', import.meta.url).href,
  [GameAudioKey.HitLightB]: new URL('../assets/audio/stage1-hit-light-b.wav', import.meta.url).href,
  [GameAudioKey.HitHeavy]: new URL('../assets/audio/stage1-hit-heavy.wav', import.meta.url).href,
  [GameAudioKey.EnemyDefeat]: new URL('../assets/audio/stage1-enemy-defeat.wav', import.meta.url).href,
  [GameAudioKey.EnemyDefeatWraith]: new URL('../assets/audio/stage1-enemy-defeat-wraith.wav', import.meta.url).href,
  [GameAudioKey.PlayerHurt]: new URL('../assets/audio/stage1-player-hurt.wav', import.meta.url).href,
  [GameAudioKey.PlayerHurtAlt]: new URL('../assets/audio/stage1-player-hurt-alt.wav', import.meta.url).href,
  [GameAudioKey.PickupSeal]: new URL('../assets/audio/stage1-pickup-seal.wav', import.meta.url).href,
  [GameAudioKey.PickupSealAlt]: new URL('../assets/audio/stage1-pickup-seal-alt.wav', import.meta.url).href,
  [GameAudioKey.PickupScroll]: new URL('../assets/audio/stage1-pickup-scroll.wav', import.meta.url).href,
  [GameAudioKey.PickupHealth]: new URL('../assets/audio/stage1-pickup-health.wav', import.meta.url).href,
  [GameAudioKey.PickupEnergy]: new URL('../assets/audio/stage1-pickup-energy.wav', import.meta.url).href,
  [GameAudioKey.Checkpoint]: new URL('../assets/audio/stage1-checkpoint.wav', import.meta.url).href,
  [GameAudioKey.WardenAttack]: new URL('../assets/audio/stage1-warden-attack.wav', import.meta.url).href,
  [GameAudioKey.WardenProjectile]: new URL('../assets/audio/stage1-warden-projectile.wav', import.meta.url).href,
  [GameAudioKey.WardenHit]: new URL('../assets/audio/stage1-warden-hit.wav', import.meta.url).href,
  [GameAudioKey.WardenDefeat]: new URL('../assets/audio/stage1-warden-defeat.wav', import.meta.url).href,
  [GameAudioKey.ShadowThreadLaunch]: new URL('../assets/audio/stage2-shadow-thread-launch.wav', import.meta.url).href,
  [GameAudioKey.ShadowThreadHit]: new URL('../assets/audio/stage2-shadow-thread-hit.wav', import.meta.url).href,
  [GameAudioKey.RelayAttack]: new URL('../assets/audio/stage2-relay-attack.wav', import.meta.url).href,
  [GameAudioKey.RelayProjectile]: new URL('../assets/audio/stage2-relay-projectile.wav', import.meta.url).href,
  [GameAudioKey.RelayHit]: new URL('../assets/audio/stage2-relay-hit.wav', import.meta.url).href,
  [GameAudioKey.RelayDefeat]: new URL('../assets/audio/stage2-relay-defeat.wav', import.meta.url).href,
  [GameAudioKey.UiMove]: new URL('../assets/audio/ui-move.wav', import.meta.url).href,
  [GameAudioKey.UiConfirm]: new URL('../assets/audio/ui-confirm.wav', import.meta.url).href,
  [GameAudioKey.UiBack]: new URL('../assets/audio/ui-back.wav', import.meta.url).href,
  [GameAudioKey.UiPause]: new URL('../assets/audio/ui-pause.wav', import.meta.url).href,
  [GameAudioKey.GameOver]: new URL('../assets/audio/game-over.wav', import.meta.url).href,
  [GameAudioKey.Respawn]: new URL('../assets/audio/respawn.wav', import.meta.url).href,
  [GameAudioKey.StageClear]: new URL('../assets/audio/stage1-stage-clear.wav', import.meta.url).href,
  [GameAudioKey.UpdraftLoop]: new URL('../assets/audio/ambience-updraft-loop.wav', import.meta.url).href,
  [GameAudioKey.MusicMenu]: new URL('../assets/audio/music-menu.wav', import.meta.url).href,
  [GameAudioKey.AmbienceStage1]: new URL('../assets/audio/ambience-stage1.wav', import.meta.url).href,
  [GameAudioKey.MusicStage1Base]: new URL('../assets/audio/music-stage1-base.wav', import.meta.url).href,
  [GameAudioKey.MusicStage1Combat]: new URL('../assets/audio/music-stage1-combat.wav', import.meta.url).href,
  [GameAudioKey.AmbienceStage2]: new URL('../assets/audio/ambience-stage2.wav', import.meta.url).href,
  [GameAudioKey.MusicStage2Base]: new URL('../assets/audio/music-stage2-base.wav', import.meta.url).href,
  [GameAudioKey.MusicStage2Combat]: new URL('../assets/audio/music-stage2-combat.wav', import.meta.url).href,
  [GameAudioKey.MusicStageClear]: new URL('../assets/audio/music-stage-clear.wav', import.meta.url).href
};

export type GameAudioCategory = 'sfx' | 'music' | 'ambience';

export type GameAudioMetadataEntry = {
  readonly category: GameAudioCategory;
  readonly volume: number;
  readonly loop?: boolean;
  readonly minGapMs?: number;
  readonly priority?: number;
  readonly duckMusic?: number;
};

const sfx = (volume: number, minGapMs = 0, priority = 2, duckMusic = 0): GameAudioMetadataEntry => ({
  category: 'sfx',
  volume,
  minGapMs,
  priority,
  duckMusic
});

const music = (volume: number, loop = true): GameAudioMetadataEntry => ({ category: 'music', volume, loop });
const ambience = (volume: number): GameAudioMetadataEntry => ({ category: 'ambience', volume, loop: true });

export const GameAudioMetadata: Record<GameAudioKey, GameAudioMetadataEntry> = {
  [GameAudioKey.Jump]: sfx(0.66, 70, 2),
  [GameAudioKey.JumpAlt]: sfx(0.66, 70, 2),
  [GameAudioKey.WallKick]: sfx(0.72, 80, 2, 0.04),
  [GameAudioKey.WallKickAlt]: sfx(0.72, 80, 2, 0.04),
  [GameAudioKey.FootstepA]: sfx(0.3, 90, 0),
  [GameAudioKey.FootstepB]: sfx(0.3, 90, 0),
  [GameAudioKey.LandSoft]: sfx(0.45, 90, 1, 0.04),
  [GameAudioKey.LandHeavy]: sfx(0.78, 130, 3, 0.14),
  [GameAudioKey.WallSlideLoop]: ambience(0.22),
  [GameAudioKey.Attack]: sfx(0.66, 82, 2),
  [GameAudioKey.AttackAltA]: sfx(0.66, 82, 2),
  [GameAudioKey.AttackAltB]: sfx(0.66, 82, 2),
  [GameAudioKey.SpinAttack]: sfx(0.8, 170, 3, 0.12),
  [GameAudioKey.HitLightA]: sfx(0.72, 42, 3, 0.1),
  [GameAudioKey.HitLightB]: sfx(0.72, 42, 3, 0.1),
  [GameAudioKey.HitHeavy]: sfx(0.94, 85, 4, 0.24),
  [GameAudioKey.EnemyDefeat]: sfx(0.84, 70, 3, 0.16),
  [GameAudioKey.EnemyDefeatWraith]: sfx(0.84, 70, 3, 0.16),
  [GameAudioKey.PlayerHurt]: sfx(0.84, 180, 5, 0.34),
  [GameAudioKey.PlayerHurtAlt]: sfx(0.84, 180, 5, 0.34),
  [GameAudioKey.PickupSeal]: sfx(0.46, 34, 1),
  [GameAudioKey.PickupSealAlt]: sfx(0.46, 34, 1),
  [GameAudioKey.PickupScroll]: sfx(0.58, 80, 2),
  [GameAudioKey.PickupHealth]: sfx(0.62, 80, 2),
  [GameAudioKey.PickupEnergy]: sfx(0.58, 70, 2),
  [GameAudioKey.Checkpoint]: sfx(0.76, 300, 4, 0.2),
  [GameAudioKey.WardenAttack]: sfx(0.76, 230, 3, 0.12),
  [GameAudioKey.WardenProjectile]: sfx(0.68, 100, 3, 0.08),
  [GameAudioKey.WardenHit]: sfx(0.82, 70, 4, 0.18),
  [GameAudioKey.WardenDefeat]: sfx(1, 500, 5, 0.58),
  [GameAudioKey.ShadowThreadLaunch]: sfx(0.82, 70, 4, 0.16),
  [GameAudioKey.ShadowThreadHit]: sfx(0.92, 70, 5, 0.28),
  [GameAudioKey.RelayAttack]: sfx(0.78, 230, 3, 0.14),
  [GameAudioKey.RelayProjectile]: sfx(0.7, 100, 3, 0.1),
  [GameAudioKey.RelayHit]: sfx(0.86, 70, 4, 0.2),
  [GameAudioKey.RelayDefeat]: sfx(1, 500, 5, 0.62),
  [GameAudioKey.UiMove]: sfx(0.32, 35, 1),
  [GameAudioKey.UiConfirm]: sfx(0.62, 90, 3, 0.08),
  [GameAudioKey.UiBack]: sfx(0.46, 90, 2),
  [GameAudioKey.UiPause]: sfx(0.5, 100, 3, 0.08),
  [GameAudioKey.GameOver]: sfx(0.92, 600, 5, 0.7),
  [GameAudioKey.Respawn]: sfx(0.76, 180, 4, 0.26),
  [GameAudioKey.StageClear]: sfx(0.96, 600, 5, 0.72),
  [GameAudioKey.UpdraftLoop]: ambience(0.24),
  [GameAudioKey.MusicMenu]: music(0.54),
  [GameAudioKey.AmbienceStage1]: ambience(0.36),
  [GameAudioKey.MusicStage1Base]: music(0.48),
  [GameAudioKey.MusicStage1Combat]: music(0.4),
  [GameAudioKey.AmbienceStage2]: ambience(0.34),
  [GameAudioKey.MusicStage2Base]: music(0.5),
  [GameAudioKey.MusicStage2Combat]: music(0.44),
  [GameAudioKey.MusicStageClear]: music(0.62)
};

export const GameAudioGroups = {
  jump: [GameAudioKey.Jump, GameAudioKey.JumpAlt],
  wallKick: [GameAudioKey.WallKick, GameAudioKey.WallKickAlt],
  footstep: [GameAudioKey.FootstepA, GameAudioKey.FootstepB],
  attack: [GameAudioKey.Attack, GameAudioKey.AttackAltA, GameAudioKey.AttackAltB],
  hitLight: [GameAudioKey.HitLightA, GameAudioKey.HitLightB],
  playerHurt: [GameAudioKey.PlayerHurt, GameAudioKey.PlayerHurtAlt],
  pickupSeal: [GameAudioKey.PickupSeal, GameAudioKey.PickupSealAlt]
} as const satisfies Record<string, readonly GameAudioKey[]>;

export type GameAudioGroupKey = keyof typeof GameAudioGroups;
export type GameAudioProfileKey = 'menu' | 'stage1' | 'stage2' | 'clear';

export const GameAudioProfiles: Record<
  GameAudioProfileKey,
  { readonly ambience?: GameAudioKey; readonly musicBase?: GameAudioKey; readonly musicCombat?: GameAudioKey }
> = {
  menu: { musicBase: GameAudioKey.MusicMenu },
  stage1: {
    ambience: GameAudioKey.AmbienceStage1,
    musicBase: GameAudioKey.MusicStage1Base,
    musicCombat: GameAudioKey.MusicStage1Combat
  },
  stage2: {
    ambience: GameAudioKey.AmbienceStage2,
    musicBase: GameAudioKey.MusicStage2Base,
    musicCombat: GameAudioKey.MusicStage2Combat
  },
  clear: { musicBase: GameAudioKey.MusicStageClear }
};

// Compatibility exports keep existing gameplay integrations and downstream checks stable.
export const Stage1SfxKey = GameAudioKey;
export type Stage1SfxKey = GameAudioKey;
export const Stage1AudioAssets = GameAudioAssets;

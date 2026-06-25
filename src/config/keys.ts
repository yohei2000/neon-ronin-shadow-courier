export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  Controls: 'ControlsScene',
  Settings: 'SettingsScene',
  WorldMap: 'WorldMapScene',
  Game: 'GameScene',
  Pause: 'PauseScene',
  GameOver: 'GameOverScene',
  StageClear: 'StageClearScene',
  Ending: 'EndingScene'
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

export const TextureKey = {
  PlayerIdle: 'player-idle',
  PlayerRun: 'player-run',
  PlayerJump: 'player-jump',
  PlayerFall: 'player-fall',
  PlayerWall: 'player-wall',
  PlayerDash: 'player-dash',
  PlayerAttack: 'player-attack',
  PlayerHurt: 'player-hurt',
  ShadowCrawler: 'enemy-shadow-crawler',
  KiteWraith: 'enemy-kite-wraith',
  GearSentinel: 'enemy-gear-sentinel',
  NeonArcher: 'enemy-neon-archer',
  PulseJumper: 'enemy-pulse-jumper',
  Boss: 'boss-onmyo-core',
  BossPhase: 'boss-phase-core',
  Projectile: 'projectile',
  EnemyProjectile: 'enemy-projectile',
  TileInk: 'tile-ink',
  TileRoof: 'tile-roof',
  TileBamboo: 'tile-bamboo',
  TileCastle: 'tile-castle',
  TileKeep: 'tile-keep',
  OneWay: 'tile-one-way',
  Hazard: 'hazard-thorn',
  MovingPlatform: 'moving-platform',
  FallingPlatform: 'falling-platform',
  WindZone: 'wind-zone',
  Checkpoint: 'checkpoint-shrine',
  GoalGate: 'goal-gate',
  Scroll: 'pickup-scroll',
  Seal: 'pickup-seal',
  Health: 'pickup-health',
  Energy: 'pickup-energy',
  HeartIcon: 'ui-heart',
  EnergyIcon: 'ui-energy',
  ScrollIcon: 'ui-scroll',
  Button: 'ui-button',
  Dpad: 'ui-dpad'
} as const;

export type TextureKey = (typeof TextureKey)[keyof typeof TextureKey];

export const AudioKey = {
  Confirm: 'confirm',
  Cancel: 'cancel',
  Jump: 'jump',
  WallJump: 'wall-jump',
  Dash: 'dash',
  Slash: 'slash',
  ChargedSlash: 'charged-slash',
  Projectile: 'projectile',
  EnemyHit: 'enemy-hit',
  EnemyDefeat: 'enemy-defeat',
  PlayerHurt: 'player-hurt',
  Pickup: 'pickup',
  Checkpoint: 'checkpoint',
  StageClear: 'stage-clear',
  BossPhase: 'boss-phase',
  Victory: 'victory'
} as const;

export type AudioKey = (typeof AudioKey)[keyof typeof AudioKey];

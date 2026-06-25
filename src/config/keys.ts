export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  Controls: 'ControlsScene',
  Settings: 'SettingsScene',
  Stage1: 'Stage1Scene',
  Pause: 'PauseScene',
  GameOver: 'GameOverScene',
  StageClear: 'StageClearScene',
  Credits: 'CreditsScene'
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

export const TextureKey = {
  PlayerIdle: 'player-idle',
  PlayerRun1: 'player-run-1',
  PlayerRun2: 'player-run-2',
  PlayerRun3: 'player-run-3',
  PlayerRun4: 'player-run-4',
  PlayerJump: 'player-jump',
  PlayerFall: 'player-fall',
  PlayerWall: 'player-wall',
  PlayerSlash1: 'player-slash-1',
  PlayerSlash2: 'player-slash-2',
  PlayerSlash3: 'player-slash-3',
  PlayerHurt: 'player-hurt',
  InkCrawler: 'enemy-ink-crawler',
  KiteWraith: 'enemy-kite-wraith',
  LanternWarden: 'enemy-lantern-warden',
  LanternWardenHurt: 'enemy-lantern-warden-hurt',
  TileFloor: 'tile-floor',
  TileWall: 'tile-wall',
  TileRoof: 'tile-roof',
  TileEdge: 'tile-edge',
  TileSign: 'tile-neon-sign',
  TileLantern: 'tile-lantern',
  TilePipe: 'tile-pipe',
  TileWindow: 'tile-window',
  TilePaint: 'tile-wall-kick-paint',
  TileShrine: 'tile-shrine',
  TileThorn: 'tile-thorn',
  TileMoonGate: 'tile-moon-gate',
  TimedSpark: 'hazard-timed-spark',
  FallingSign: 'hazard-falling-sign',
  Checkpoint: 'checkpoint-shrine',
  GoalGate: 'goal-gate',
  Scroll: 'pickup-scroll',
  Seal: 'pickup-seal',
  Health: 'pickup-health',
  Energy: 'pickup-energy',
  HeartIcon: 'ui-heart',
  ScrollIcon: 'ui-scroll',
  TimerIcon: 'ui-timer',
  SealIcon: 'ui-seal',
  Button: 'ui-button',
  Dpad: 'ui-dpad',
  PauseIcon: 'ui-pause'
} as const;

export type TextureKey = (typeof TextureKey)[keyof typeof TextureKey];

export const AudioKey = {
  Confirm: 'confirm',
  Cancel: 'cancel',
  Jump: 'jump',
  WallJump: 'wall-jump',
  Slash: 'slash',
  EnemyHit: 'enemy-hit',
  EnemyDefeat: 'enemy-defeat',
  PlayerHurt: 'player-hurt',
  PickupSeal: 'pickup-seal',
  PickupScroll: 'pickup-scroll',
  Checkpoint: 'checkpoint',
  MinibossStart: 'miniboss-start',
  MinibossDefeated: 'miniboss-defeated',
  StageClear: 'stage-clear',
  Victory: 'victory'
} as const;

export type AudioKey = (typeof AudioKey)[keyof typeof AudioKey];

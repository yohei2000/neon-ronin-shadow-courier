import { ApprovedArtUrlByKey } from './approvedArtManifest';

export const ArtAssetKey = {
  Player: 'player-spritesheet',
  PlayerMaster: 'player-master',
  Enemy: 'enemy-spritesheet',
  LanternWarden: 'lantern-warden-spritesheet',
  KiteWraith: 'kite-wraith-preview',
  Slash: 'slash-flipbook',
  Telegraph: 'telegraph-flipbook',
  UiKit: 'ui-kit',
  TitleMenuPanel: 'title-menu-panel',
  MobileControlsKit: 'mobile-controls-kit',
  BrushKit: 'brush-kit',
  SignAtlas: 'sign-atlas',
  TitleComposition: 'title-composition',
  EnvironmentKey: 'environment-key',
  LayerFarSky: 'layer-far-sky',
  LayerDistantSkyline: 'layer-distant-skyline',
  LayerMidRoofsSigns: 'layer-mid-roofs-signs',
  LayerGameplay: 'layer-gameplay-layer',
  LayerNearProps: 'layer-near-props',
  LayerNearPropsFront: 'layer-near-props-front',
  LayerForegroundOcclusion: 'layer-foreground-occlusion',
  LightingMoonlight: 'lighting-moonlight-lantern-gold',
  LightingNeon: 'lighting-cyan-magenta-neon',
  LightingWarmCool: 'lighting-warm-cool-alley'
} as const;

export type ArtAssetKey = (typeof ArtAssetKey)[keyof typeof ArtAssetKey];

export const RuntimeSpriteAssetKey = {
  Player: 'player-runtime-spritesheet',
  InkCrawler: 'ink-crawler-runtime-spritesheet',
  KiteWraith: 'kite-wraith-runtime-spritesheet',
  Slash: 'slash-runtime-spritesheet',
  Telegraph: 'telegraph-runtime-spritesheet',
  LanternWarden: 'lantern-warden-runtime-spritesheet'
} as const;

export type RuntimeSpriteAssetKey = (typeof RuntimeSpriteAssetKey)[keyof typeof RuntimeSpriteAssetKey];

export const RuntimeEnvironmentAssetKey = {
  BackgroundFar: 'stage1-bg-far',
  BackgroundDistant: 'stage1-bg-distant',
  BackgroundMid: 'stage1-bg-mid',
  BackgroundNear: 'stage1-bg-near',
  BackgroundFront: 'stage1-bg-front',
  GroundTile: 'stage1-ground-tile',
  PlatformThinTile: 'stage1-platform-thin-tile',
  MoonGate: 'stage1-moon-gate',
  ItemIcons: 'stage1-item-icons',
  TouchControls: 'stage1-touch-controls'
} as const;

export type RuntimeEnvironmentAssetKey = (typeof RuntimeEnvironmentAssetKey)[keyof typeof RuntimeEnvironmentAssetKey];

export const ArtImageAssets: Record<ArtAssetKey, string> = {
  [ArtAssetKey.Player]: ApprovedArtUrlByKey[ArtAssetKey.Player],
  [ArtAssetKey.PlayerMaster]: ApprovedArtUrlByKey[ArtAssetKey.PlayerMaster],
  [ArtAssetKey.Enemy]: ApprovedArtUrlByKey[ArtAssetKey.Enemy],
  [ArtAssetKey.LanternWarden]: ApprovedArtUrlByKey[ArtAssetKey.LanternWarden],
  [ArtAssetKey.KiteWraith]: ApprovedArtUrlByKey[ArtAssetKey.KiteWraith],
  [ArtAssetKey.Slash]: ApprovedArtUrlByKey[ArtAssetKey.Slash],
  [ArtAssetKey.Telegraph]: ApprovedArtUrlByKey[ArtAssetKey.Telegraph],
  [ArtAssetKey.UiKit]: ApprovedArtUrlByKey[ArtAssetKey.UiKit],
  [ArtAssetKey.TitleMenuPanel]: ApprovedArtUrlByKey[ArtAssetKey.TitleMenuPanel],
  [ArtAssetKey.MobileControlsKit]: ApprovedArtUrlByKey[ArtAssetKey.MobileControlsKit],
  [ArtAssetKey.BrushKit]: ApprovedArtUrlByKey[ArtAssetKey.BrushKit],
  [ArtAssetKey.SignAtlas]: ApprovedArtUrlByKey[ArtAssetKey.SignAtlas],
  [ArtAssetKey.TitleComposition]: ApprovedArtUrlByKey[ArtAssetKey.TitleComposition],
  [ArtAssetKey.EnvironmentKey]: ApprovedArtUrlByKey[ArtAssetKey.EnvironmentKey],
  [ArtAssetKey.LayerFarSky]: ApprovedArtUrlByKey[ArtAssetKey.LayerFarSky],
  [ArtAssetKey.LayerDistantSkyline]: ApprovedArtUrlByKey[ArtAssetKey.LayerDistantSkyline],
  [ArtAssetKey.LayerMidRoofsSigns]: ApprovedArtUrlByKey[ArtAssetKey.LayerMidRoofsSigns],
  [ArtAssetKey.LayerGameplay]: ApprovedArtUrlByKey[ArtAssetKey.LayerGameplay],
  [ArtAssetKey.LayerNearProps]: ApprovedArtUrlByKey[ArtAssetKey.LayerNearProps],
  [ArtAssetKey.LayerNearPropsFront]: ApprovedArtUrlByKey[ArtAssetKey.LayerNearPropsFront],
  [ArtAssetKey.LayerForegroundOcclusion]: ApprovedArtUrlByKey[ArtAssetKey.LayerForegroundOcclusion],
  [ArtAssetKey.LightingMoonlight]: ApprovedArtUrlByKey[ArtAssetKey.LightingMoonlight],
  [ArtAssetKey.LightingNeon]: ApprovedArtUrlByKey[ArtAssetKey.LightingNeon],
  [ArtAssetKey.LightingWarmCool]: ApprovedArtUrlByKey[ArtAssetKey.LightingWarmCool]
};

export const RuntimeSpriteImageAssets: Record<RuntimeSpriteAssetKey, string> = {
  [RuntimeSpriteAssetKey.Player]: new URL('../assets/runtime/player-runtime-spritesheet.png', import.meta.url).href,
  [RuntimeSpriteAssetKey.InkCrawler]: new URL('../assets/runtime/ink-crawler-runtime-spritesheet.png', import.meta.url).href,
  [RuntimeSpriteAssetKey.KiteWraith]: new URL('../assets/runtime/kite-wraith-runtime-spritesheet.png', import.meta.url).href,
  [RuntimeSpriteAssetKey.Slash]: new URL('../assets/runtime/slash-runtime-spritesheet.png', import.meta.url).href,
  [RuntimeSpriteAssetKey.Telegraph]: new URL('../assets/runtime/telegraph-runtime-spritesheet.png', import.meta.url).href,
  [RuntimeSpriteAssetKey.LanternWarden]: new URL('../assets/runtime/lantern-warden-runtime-spritesheet.png', import.meta.url).href
};

export const RuntimeEnvironmentImageAssets: Record<RuntimeEnvironmentAssetKey, string> = {
  [RuntimeEnvironmentAssetKey.BackgroundFar]: new URL('../assets/runtime/stage1-bg-far.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.BackgroundDistant]: new URL('../assets/runtime/stage1-bg-distant.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.BackgroundMid]: new URL('../assets/runtime/stage1-bg-mid.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.BackgroundNear]: new URL('../assets/runtime/stage1-bg-near.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.BackgroundFront]: new URL('../assets/runtime/stage1-bg-front.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.GroundTile]: new URL('../assets/runtime/stage1-ground-tile.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.PlatformThinTile]: new URL('../assets/runtime/stage1-platform-thin-tile.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.MoonGate]: new URL('../assets/runtime/stage1-moon-gate.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.ItemIcons]: new URL('../assets/runtime/stage1-item-icons.png', import.meta.url).href,
  [RuntimeEnvironmentAssetKey.TouchControls]: new URL('../assets/runtime/stage1-touch-controls.png', import.meta.url).href
};

export const RuntimeItemFrame = {
  Seal: 0,
  Scroll: 1,
  Health: 2,
  Energy: 3,
  Checkpoint: 4
} as const;

export const RuntimeTouchFrame = {
  Dpad: 0,
  Jump: 1,
  Slash: 2
} as const;

const frameRange = (start: number, count: number): number[] => Array.from({ length: count }, (_, index) => start + index);

export const PlayerAnimationFrames = {
  idle: { frames: frameRange(0, 6), frameRate: 7, repeat: -1 },
  run: { frames: frameRange(6, 8), frameRate: 18, repeat: -1 },
  smallJump: { frames: frameRange(14, 4), frameRate: 13, repeat: 0 },
  bigJumpRise: { frames: frameRange(18, 5), frameRate: 14, repeat: 0 },
  speedFlipJump: { frames: frameRange(23, 8), frameRate: 20, repeat: -1 },
  apex: { frames: frameRange(31, 2), frameRate: 6, repeat: -1 },
  fall: { frames: frameRange(33, 3), frameRate: 8, repeat: -1 },
  wallSlide: { frames: frameRange(36, 4), frameRate: 8, repeat: -1 },
  wallKick: { frames: frameRange(40, 4), frameRate: 14, repeat: 0 },
  groundSlash: { frames: frameRange(44, 8), frameRate: 24, repeat: 0 },
  airSlash: { frames: frameRange(52, 6), frameRate: 22, repeat: 0 },
  hurt: { frames: frameRange(58, 3), frameRate: 10, repeat: -1 },
  checkpointRespawn: { frames: frameRange(61, 6), frameRate: 8, repeat: -1 }
} as const;

export const RuntimePlayerVisualConfig = {
  textureKey: RuntimeSpriteAssetKey.Player,
  scale: 0.56
} as const;

export const InkCrawlerAnimationFrames = {
  patrol: { frames: frameRange(0, 8), frameRate: 12, repeat: -1 },
  hit: { frames: frameRange(8, 4), frameRate: 16, repeat: 0 },
  defeat: { frames: frameRange(12, 6), frameRate: 10, repeat: 0 }
} as const;

export const KiteWraithAnimationFrames = {
  drift: { frames: frameRange(0, 8), frameRate: 10, repeat: -1 },
  hit: { frames: frameRange(8, 4), frameRate: 16, repeat: 0 },
  defeat: { frames: frameRange(12, 6), frameRate: 10, repeat: 0 }
} as const;

export const SlashAnimationFrames = {
  ground: { frames: frameRange(0, 8), frameRate: 30, repeat: 0 },
  air: { frames: frameRange(8, 6), frameRate: 28, repeat: 0 }
} as const;

export const LanternWardenAnimationFrames = {
  idle: { frames: [1], frameRate: 1, repeat: -1 },
  telegraph: { frames: [2], frameRate: 1, repeat: -1 },
  attack: { frames: [3], frameRate: 1, repeat: -1 },
  recovery: { frames: [1], frameRate: 1, repeat: -1 },
  defeat: { frames: [0], frameRate: 1, repeat: 0 }
} as const;

export const RuntimeAssetKeys = Object.values(ArtAssetKey);
export const RuntimeStage1SpriteKeys = Object.values(RuntimeSpriteAssetKey);
export const RuntimeStage1EnvironmentKeys = Object.values(RuntimeEnvironmentAssetKey);
export const RuntimeStage1AssetKeys = [...RuntimeStage1SpriteKeys, ...RuntimeStage1EnvironmentKeys];

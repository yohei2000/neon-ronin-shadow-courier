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
  KiteWraith: 'kite-wraith-runtime-spritesheet'
} as const;

export type RuntimeSpriteAssetKey = (typeof RuntimeSpriteAssetKey)[keyof typeof RuntimeSpriteAssetKey];

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
  [RuntimeSpriteAssetKey.KiteWraith]: new URL('../assets/runtime/kite-wraith-runtime-spritesheet.png', import.meta.url).href
};

export const PlayerAnimationFrames = {
  idle: { frames: [25, 26, 25, 24], frameRate: 5, repeat: -1 },
  run: { frames: [6, 7, 8, 9, 10, 8], frameRate: 12, repeat: -1 },
  jumpRise: { frames: [11, 12, 13], frameRate: 10, repeat: 0 },
  apex: { frames: [14, 15], frameRate: 8, repeat: -1 },
  fall: { frames: [14, 15], frameRate: 8, repeat: -1 },
  wallSlide: { frames: [16, 17, 18, 19], frameRate: 8, repeat: -1 },
  wallKick: { frames: [20, 21, 20], frameRate: 12, repeat: 0 },
  groundSlash: { frames: [22, 23, 24, 25, 26], frameRate: 16, repeat: 0 },
  airSlash: { frames: [20, 21, 22, 23], frameRate: 16, repeat: 0 },
  hurt: { frames: [13, 14], frameRate: 10, repeat: -1 },
  checkpointRespawn: { frames: [25, 26, 25, 24], frameRate: 10, repeat: -1 }
} as const;

export const RuntimePlayerVisualConfig = {
  textureKey: RuntimeSpriteAssetKey.Player,
  scale: 0.56
} as const;

export const InkCrawlerAnimationFrames = {
  patrol: { frames: [0, 1, 2, 3, 4, 5, 6, 7], frameRate: 8, repeat: -1 },
  hit: { frames: [3, 4], frameRate: 12, repeat: 0 }
} as const;

export const KiteWraithAnimationFrames = {
  drift: { frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  hit: { frames: [3, 2], frameRate: 10, repeat: 0 }
} as const;

export const RuntimeAssetKeys = Object.values(ArtAssetKey);
export const RuntimeStage1SpriteKeys = Object.values(RuntimeSpriteAssetKey);

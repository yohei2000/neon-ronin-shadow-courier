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

export const PlayerAnimationFrames = {
  idle: { start: 0, frames: 6, frameRate: 8, repeat: -1 },
  run: { start: 6, frames: 8, frameRate: 12, repeat: -1 },
  jumpRise: { start: 14, frames: 3, frameRate: 10, repeat: 0 },
  apex: { start: 17, frames: 2, frameRate: 8, repeat: -1 },
  fall: { start: 19, frames: 2, frameRate: 8, repeat: -1 },
  wallSlide: { start: 21, frames: 4, frameRate: 8, repeat: -1 },
  wallKick: { start: 25, frames: 4, frameRate: 12, repeat: 0 },
  groundSlash: { start: 29, frames: 8, frameRate: 18, repeat: -1 },
  airSlash: { start: 37, frames: 6, frameRate: 18, repeat: -1 },
  hurt: { start: 43, frames: 3, frameRate: 10, repeat: -1 },
  checkpointRespawn: { start: 46, frames: 6, frameRate: 10, repeat: -1 }
} as const;

export const RuntimePlayerVisualConfig = {
  textureKey: ArtAssetKey.PlayerMaster,
  scale: 0.24
} as const;

export const RuntimeAssetKeys = Object.values(ArtAssetKey);

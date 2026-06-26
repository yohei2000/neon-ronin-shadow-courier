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
  [ArtAssetKey.Player]: new URL('../../art/final-v2/assets/player-spritesheet.png', import.meta.url).href,
  [ArtAssetKey.PlayerMaster]: new URL('../../art/final-v2/assets/player-master.png', import.meta.url).href,
  [ArtAssetKey.Enemy]: new URL('../../art/final-v2/assets/enemy-spritesheet.png', import.meta.url).href,
  [ArtAssetKey.LanternWarden]: new URL('../../art/final-v2/assets/lantern-warden-spritesheet.png', import.meta.url).href,
  [ArtAssetKey.KiteWraith]: new URL('../../art/final-v2/assets/kite-wraith-preview.png', import.meta.url).href,
  [ArtAssetKey.Slash]: new URL('../../art/final-v2/assets/slash-flipbook.png', import.meta.url).href,
  [ArtAssetKey.Telegraph]: new URL('../../art/final-v2/assets/telegraph-flipbook.png', import.meta.url).href,
  [ArtAssetKey.UiKit]: new URL('../../art/final-v2/assets/ui-kit.png', import.meta.url).href,
  [ArtAssetKey.TitleMenuPanel]: new URL('../../art/final-v2/assets/title-menu-panel.png', import.meta.url).href,
  [ArtAssetKey.MobileControlsKit]: new URL('../../art/final-v2/assets/mobile-controls-kit.png', import.meta.url).href,
  [ArtAssetKey.BrushKit]: new URL('../../art/final-v2/assets/brush-kit.png', import.meta.url).href,
  [ArtAssetKey.SignAtlas]: new URL('../../art/final-v2/assets/sign-atlas.png', import.meta.url).href,
  [ArtAssetKey.TitleComposition]: new URL('../../art/final-v2/assets/title-composition.png', import.meta.url).href,
  [ArtAssetKey.LayerFarSky]: new URL('../../art/final-v2/assets/layer-far-sky.png', import.meta.url).href,
  [ArtAssetKey.LayerDistantSkyline]: new URL('../../art/final-v2/assets/layer-distant-skyline.png', import.meta.url).href,
  [ArtAssetKey.LayerMidRoofsSigns]: new URL('../../art/final-v2/assets/layer-mid-roofs-signs.png', import.meta.url).href,
  [ArtAssetKey.LayerGameplay]: new URL('../../art/final-v2/assets/layer-gameplay-layer.png', import.meta.url).href,
  [ArtAssetKey.LayerNearProps]: new URL('../../art/final-v2/assets/layer-near-props.png', import.meta.url).href,
  [ArtAssetKey.LayerNearPropsFront]: new URL('../../art/final-v2/assets/layer-near-props-front.png', import.meta.url).href,
  [ArtAssetKey.LayerForegroundOcclusion]: new URL('../../art/final-v2/assets/layer-foreground-occlusion.png', import.meta.url).href,
  [ArtAssetKey.LightingMoonlight]: new URL('../../art/final-v2/assets/lighting-moonlight-lantern-gold.png', import.meta.url).href,
  [ArtAssetKey.LightingNeon]: new URL('../../art/final-v2/assets/lighting-cyan-magenta-neon.png', import.meta.url).href,
  [ArtAssetKey.LightingWarmCool]: new URL('../../art/final-v2/assets/lighting-warm-cool-alley.png', import.meta.url).href
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

export const RuntimeAssetKeys = Object.values(ArtAssetKey);

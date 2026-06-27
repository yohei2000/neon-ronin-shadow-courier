export type ApprovedArtKey =
  | 'player-spritesheet'
  | 'player-master'
  | 'enemy-spritesheet'
  | 'lantern-warden-spritesheet'
  | 'kite-wraith-preview'
  | 'slash-flipbook'
  | 'telegraph-flipbook'
  | 'ui-kit'
  | 'title-menu-panel'
  | 'mobile-controls-kit'
  | 'brush-kit'
  | 'sign-atlas'
  | 'title-composition'
  | 'environment-key'
  | 'layer-far-sky'
  | 'layer-distant-skyline'
  | 'layer-mid-roofs-signs'
  | 'layer-gameplay-layer'
  | 'layer-near-props'
  | 'layer-near-props-front'
  | 'layer-foreground-occlusion'
  | 'lighting-moonlight-lantern-gold'
  | 'lighting-cyan-magenta-neon'
  | 'lighting-warm-cool-alley';

export type ApprovedArtManifestEntry = {
  readonly key: ApprovedArtKey;
  readonly fileName: `${ApprovedArtKey}.png`;
  readonly productionPath: `src/assets/approved-art/${ApprovedArtKey}.png`;
  readonly approvedSourcePath: `art/final-v2/assets/${ApprovedArtKey}.png`;
  readonly lineagePath: `art/source/${string}` | `art/final-v2/${string}`;
  readonly width: number;
  readonly height: number;
  readonly kind:
    | 'spritesheet'
    | 'master'
    | 'preview'
    | 'flipbook'
    | 'timeline'
    | 'ui'
    | 'brush'
    | 'atlas'
    | 'composition'
    | 'parallax-layer'
    | 'lighting-preset';
  readonly stage1Runtime: true;
  readonly runtimeUrl: string;
};

const approvedArtUrl = (fileName: `${ApprovedArtKey}.png`) =>
  new URL(`../assets/approved-art/${fileName}`, import.meta.url).href;

export const ApprovedArtManifest = [
  {
    key: 'player-spritesheet',
    fileName: 'player-spritesheet.png',
    productionPath: 'src/assets/approved-art/player-spritesheet.png',
    approvedSourcePath: 'art/final-v2/assets/player-spritesheet.png',
    lineagePath: 'art/source/player/player-animation-master-sheet.png',
    width: 1024,
    height: 896,
    kind: 'spritesheet',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('player-spritesheet.png')
  },
  {
    key: 'player-master',
    fileName: 'player-master.png',
    productionPath: 'src/assets/approved-art/player-master.png',
    approvedSourcePath: 'art/final-v2/assets/player-master.png',
    lineagePath: 'art/source/player/player-master.png',
    width: 512,
    height: 512,
    kind: 'master',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('player-master.png')
  },
  {
    key: 'enemy-spritesheet',
    fileName: 'enemy-spritesheet.png',
    productionPath: 'src/assets/approved-art/enemy-spritesheet.png',
    approvedSourcePath: 'art/final-v2/assets/enemy-spritesheet.png',
    lineagePath: 'art/source/enemies/ink-crawler-sheet.png',
    width: 512,
    height: 320,
    kind: 'spritesheet',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('enemy-spritesheet.png')
  },
  {
    key: 'lantern-warden-spritesheet',
    fileName: 'lantern-warden-spritesheet.png',
    productionPath: 'src/assets/approved-art/lantern-warden-spritesheet.png',
    approvedSourcePath: 'art/final-v2/assets/lantern-warden-spritesheet.png',
    lineagePath: 'art/source/enemies/lantern-warden-sheet.png',
    width: 1024,
    height: 256,
    kind: 'spritesheet',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('lantern-warden-spritesheet.png')
  },
  {
    key: 'kite-wraith-preview',
    fileName: 'kite-wraith-preview.png',
    productionPath: 'src/assets/approved-art/kite-wraith-preview.png',
    approvedSourcePath: 'art/final-v2/assets/kite-wraith-preview.png',
    lineagePath: 'art/source/enemies/kite-wraith-preview-sheet.png',
    width: 512,
    height: 256,
    kind: 'preview',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('kite-wraith-preview.png')
  },
  {
    key: 'slash-flipbook',
    fileName: 'slash-flipbook.png',
    productionPath: 'src/assets/approved-art/slash-flipbook.png',
    approvedSourcePath: 'art/final-v2/assets/slash-flipbook.png',
    lineagePath: 'art/source/vfx/slash-flipbook.png',
    width: 1024,
    height: 160,
    kind: 'flipbook',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('slash-flipbook.png')
  },
  {
    key: 'telegraph-flipbook',
    fileName: 'telegraph-flipbook.png',
    productionPath: 'src/assets/approved-art/telegraph-flipbook.png',
    approvedSourcePath: 'art/final-v2/assets/telegraph-flipbook.png',
    lineagePath: 'art/source/vfx/telegraph-flipbook.png',
    width: 960,
    height: 430,
    kind: 'timeline',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('telegraph-flipbook.png')
  },
  {
    key: 'ui-kit',
    fileName: 'ui-kit.png',
    productionPath: 'src/assets/approved-art/ui-kit.png',
    approvedSourcePath: 'art/final-v2/assets/ui-kit.png',
    lineagePath: 'art/source/ui/ui-kit.png',
    width: 960,
    height: 540,
    kind: 'ui',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('ui-kit.png')
  },
  {
    key: 'title-menu-panel',
    fileName: 'title-menu-panel.png',
    productionPath: 'src/assets/approved-art/title-menu-panel.png',
    approvedSourcePath: 'art/final-v2/assets/title-menu-panel.png',
    lineagePath: 'art/source/ui/ui-kit.png',
    width: 520,
    height: 240,
    kind: 'ui',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('title-menu-panel.png')
  },
  {
    key: 'mobile-controls-kit',
    fileName: 'mobile-controls-kit.png',
    productionPath: 'src/assets/approved-art/mobile-controls-kit.png',
    approvedSourcePath: 'art/final-v2/assets/mobile-controls-kit.png',
    lineagePath: 'art/source/ui/mobile-controls-kit.png',
    width: 640,
    height: 320,
    kind: 'ui',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('mobile-controls-kit.png')
  },
  {
    key: 'brush-kit',
    fileName: 'brush-kit.png',
    productionPath: 'src/assets/approved-art/brush-kit.png',
    approvedSourcePath: 'art/final-v2/assets/brush-kit.png',
    lineagePath: 'art/source/svg/brush-kit.svg',
    width: 960,
    height: 540,
    kind: 'brush',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('brush-kit.png')
  },
  {
    key: 'sign-atlas',
    fileName: 'sign-atlas.png',
    productionPath: 'src/assets/approved-art/sign-atlas.png',
    approvedSourcePath: 'art/final-v2/assets/sign-atlas.png',
    lineagePath: 'art/source/environment/sign-atlas.png',
    width: 960,
    height: 640,
    kind: 'atlas',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('sign-atlas.png')
  },
  {
    key: 'title-composition',
    fileName: 'title-composition.png',
    productionPath: 'src/assets/approved-art/title-composition.png',
    approvedSourcePath: 'art/final-v2/assets/title-composition.png',
    lineagePath: 'art/source/ui/title-logo.png',
    width: 960,
    height: 540,
    kind: 'composition',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('title-composition.png')
  },
  {
    key: 'environment-key',
    fileName: 'environment-key.png',
    productionPath: 'src/assets/approved-art/environment-key.png',
    approvedSourcePath: 'art/final-v2/assets/environment-key.png',
    lineagePath: 'art/source/environment/neon-alley-key-art.png',
    width: 960,
    height: 540,
    kind: 'composition',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('environment-key.png')
  },
  {
    key: 'layer-far-sky',
    fileName: 'layer-far-sky.png',
    productionPath: 'src/assets/approved-art/layer-far-sky.png',
    approvedSourcePath: 'art/final-v2/assets/layer-far-sky.png',
    lineagePath: 'art/source/environment/layer-far-sky.png',
    width: 1920,
    height: 540,
    kind: 'parallax-layer',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('layer-far-sky.png')
  },
  {
    key: 'layer-distant-skyline',
    fileName: 'layer-distant-skyline.png',
    productionPath: 'src/assets/approved-art/layer-distant-skyline.png',
    approvedSourcePath: 'art/final-v2/assets/layer-distant-skyline.png',
    lineagePath: 'art/source/environment/layer-distant-skyline.png',
    width: 1920,
    height: 540,
    kind: 'parallax-layer',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('layer-distant-skyline.png')
  },
  {
    key: 'layer-mid-roofs-signs',
    fileName: 'layer-mid-roofs-signs.png',
    productionPath: 'src/assets/approved-art/layer-mid-roofs-signs.png',
    approvedSourcePath: 'art/final-v2/assets/layer-mid-roofs-signs.png',
    lineagePath: 'art/source/environment/layer-mid-buildings-signs.png',
    width: 1920,
    height: 540,
    kind: 'parallax-layer',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('layer-mid-roofs-signs.png')
  },
  {
    key: 'layer-gameplay-layer',
    fileName: 'layer-gameplay-layer.png',
    productionPath: 'src/assets/approved-art/layer-gameplay-layer.png',
    approvedSourcePath: 'art/final-v2/assets/layer-gameplay-layer.png',
    lineagePath: 'art/source/environment/layer-gameplay-architecture.png',
    width: 1920,
    height: 540,
    kind: 'parallax-layer',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('layer-gameplay-layer.png')
  },
  {
    key: 'layer-near-props',
    fileName: 'layer-near-props.png',
    productionPath: 'src/assets/approved-art/layer-near-props.png',
    approvedSourcePath: 'art/final-v2/assets/layer-near-props.png',
    lineagePath: 'art/source/environment/layer-near-props.png',
    width: 1920,
    height: 540,
    kind: 'parallax-layer',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('layer-near-props.png')
  },
  {
    key: 'layer-near-props-front',
    fileName: 'layer-near-props-front.png',
    productionPath: 'src/assets/approved-art/layer-near-props-front.png',
    approvedSourcePath: 'art/final-v2/assets/layer-near-props-front.png',
    lineagePath: 'art/source/environment/layer-foreground-occlusion.png',
    width: 1920,
    height: 540,
    kind: 'parallax-layer',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('layer-near-props-front.png')
  },
  {
    key: 'layer-foreground-occlusion',
    fileName: 'layer-foreground-occlusion.png',
    productionPath: 'src/assets/approved-art/layer-foreground-occlusion.png',
    approvedSourcePath: 'art/final-v2/assets/layer-foreground-occlusion.png',
    lineagePath: 'art/source/environment/layer-rain-fog-light.png',
    width: 1920,
    height: 540,
    kind: 'parallax-layer',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('layer-foreground-occlusion.png')
  },
  {
    key: 'lighting-moonlight-lantern-gold',
    fileName: 'lighting-moonlight-lantern-gold.png',
    productionPath: 'src/assets/approved-art/lighting-moonlight-lantern-gold.png',
    approvedSourcePath: 'art/final-v2/assets/lighting-moonlight-lantern-gold.png',
    lineagePath: 'art/source/environment/neon-alley-key-art.png',
    width: 960,
    height: 540,
    kind: 'lighting-preset',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('lighting-moonlight-lantern-gold.png')
  },
  {
    key: 'lighting-cyan-magenta-neon',
    fileName: 'lighting-cyan-magenta-neon.png',
    productionPath: 'src/assets/approved-art/lighting-cyan-magenta-neon.png',
    approvedSourcePath: 'art/final-v2/assets/lighting-cyan-magenta-neon.png',
    lineagePath: 'art/source/ui/title-logo.png',
    width: 960,
    height: 540,
    kind: 'lighting-preset',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('lighting-cyan-magenta-neon.png')
  },
  {
    key: 'lighting-warm-cool-alley',
    fileName: 'lighting-warm-cool-alley.png',
    productionPath: 'src/assets/approved-art/lighting-warm-cool-alley.png',
    approvedSourcePath: 'art/final-v2/assets/lighting-warm-cool-alley.png',
    lineagePath: 'art/source/environment/neon-alley-key-art.png',
    width: 960,
    height: 540,
    kind: 'lighting-preset',
    stage1Runtime: true,
    runtimeUrl: approvedArtUrl('lighting-warm-cool-alley.png')
  }
] as const satisfies readonly ApprovedArtManifestEntry[];

export const ApprovedArtUrlByKey = Object.fromEntries(
  ApprovedArtManifest.map((entry) => [entry.key, entry.runtimeUrl])
) as Record<ApprovedArtKey, string>;

export const ApprovedStage1RuntimeAssetKeys = ApprovedArtManifest.map((entry) => entry.key);

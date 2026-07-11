import stage1Content from './stage1Content.json';
import stage1Landforms from './stage1Landforms.json';
import type { RuntimeEnvironmentAssetKey } from './artAssets';

export type Stage1SectionName =
  | 'Rain Lantern Start'
  | 'Neon Sign Run'
  | 'Rooftop Hazard Line'
  | 'Neon Thorn Climb'
  | 'Lantern Warden Gate';

export type RectData = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type Stage1Section = {
  readonly id: string;
  readonly name: Stage1SectionName;
  readonly startX: number;
  readonly endX: number;
  readonly orientation: 'horizontal' | 'vertical';
  readonly optionalRoute: boolean;
};

export type Stage1Platform = RectData & {
  readonly id: string;
};

export type Stage1TerrainSupport = RectData & {
  readonly id: string;
};

export type StageVisualTerrainPlate = RectData & {
  readonly id: string;
  readonly assetKey: RuntimeEnvironmentAssetKey;
  readonly usableRange: {
    readonly start: number;
    readonly end: number;
  };
  readonly overlap: {
    readonly left: number;
    readonly right: number;
  };
  readonly depth: number;
  readonly alpha: number;
};

export type StageVisualTerrainLandform = RectData & {
  readonly id: string;
  readonly frame: number;
  readonly depth: number;
  readonly alpha: number;
  readonly flipX: boolean;
  readonly sectionId: string;
};

export type StageVisualTerrainCollider = RectData & {
  readonly id: string;
  readonly landformId: string;
  readonly sectionId: string;
  readonly role: 'floor' | 'wall' | 'step';
};

export type Stage1LandformRuntimeData = {
  readonly generation:
    | 'background-first-landforms-v1'
    | 'imagegen-concept-background-first-v2'
    | 'imagegen-continuous-background-overlap-v2'
    | 'imagegen-continuous-background-rolling-v4';
  readonly assetKey: RuntimeEnvironmentAssetKey;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly sourcePanels?: readonly {
    readonly id: string;
    readonly file: string;
    readonly sectionId: string;
    readonly plateAssetKey: RuntimeEnvironmentAssetKey;
  }[];
  readonly terrainPlateOutputs?: readonly {
    readonly id: RuntimeEnvironmentAssetKey;
    readonly source: string;
    readonly output: string;
    readonly width: number;
    readonly height: number;
    readonly mode: string;
    readonly collisionSource: string;
  }[];
  readonly landforms: readonly StageVisualTerrainLandform[];
  readonly colliders: readonly StageVisualTerrainCollider[];
};

export type StageVisualTerrain = {
  readonly mode: 'image-first-overlap-v4';
  readonly sourceManifest: string;
  readonly overlapPerUsableBoundaryPx: number;
  readonly collisionSource: 'platforms+landform-colliders';
  readonly plates: readonly StageVisualTerrainPlate[];
  readonly landforms: readonly StageVisualTerrainLandform[];
  readonly landformColliders: readonly StageVisualTerrainCollider[];
};

export type Stage1Checkpoint = RectData & {
  readonly id: string;
  readonly name: string;
  readonly respawnX: number;
  readonly respawnY: number;
  readonly sectionId: string;
};

export type Stage1Hazard = RectData & {
  readonly id: string;
  readonly type: 'neon-thorn' | 'timed-spark' | 'fall-pit';
  readonly damage: number;
};

export type Stage1Gimmick = RectData & {
  readonly id: string;
  readonly type: 'updraft-vent';
  readonly strength: number;
};

export type Stage1Seal = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
};

export type Stage1Scroll = Stage1Seal & {
  readonly routeId: string;
};

export type Stage1Pickup = Stage1Seal & {
  readonly type: 'health' | 'energy';
};

export type Stage1EnemyDefinition = {
  readonly id: string;
  readonly type: 'ink-crawler' | 'kite-wraith';
  readonly x: number;
  readonly y: number;
  readonly patrolMinX: number;
  readonly patrolMaxX: number;
  readonly sectionId: string;
};

export type Stage1WardenDefinition = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly arena: RectData;
  readonly hp: number;
  readonly attackStates: readonly ['lantern-sweep', 'spark-drop', 'rush-cut'];
};

export type Stage1Data = {
  readonly id: string;
  readonly title: string;
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly start: { readonly x: number; readonly y: number };
  readonly targetFirstClearSeconds: { readonly min: number; readonly max: number };
  readonly targetOptimizedSeconds: { readonly min: number; readonly max: number };
  readonly safeFirstScreen: RectData;
  readonly safeRestBeforeMiniboss: RectData;
  readonly sections: readonly Stage1Section[];
  readonly visualTerrain: StageVisualTerrain;
  readonly platforms: readonly Stage1Platform[];
  readonly terrainSupports: readonly Stage1TerrainSupport[];
  readonly checkpoints: readonly Stage1Checkpoint[];
  readonly hazards: readonly Stage1Hazard[];
  readonly gimmicks: readonly Stage1Gimmick[];
  readonly collectibles: {
    readonly seals: readonly Stage1Seal[];
    readonly scrolls: readonly Stage1Scroll[];
    readonly pickups: readonly Stage1Pickup[];
  };
  readonly enemies: readonly Stage1EnemyDefinition[];
  readonly warden: Stage1WardenDefinition;
  readonly moonGate: RectData & {
    readonly id: string;
    readonly requiresWardenDefeated: boolean;
  };
};

export const RequiredStage1SectionNames = [
  'Rain Lantern Start',
  'Neon Sign Run',
  'Rooftop Hazard Line',
  'Neon Thorn Climb',
  'Lantern Warden Gate'
] as const satisfies readonly Stage1SectionName[];

export const Stage1Tuning = {
  gameSpeed: 2,
  maxFrameDeltaMs: 33,
  coyoteMs: 120,
  jumpBufferMs: 120,
  gravity: 1420,
  runSpeed: 183,
  groundAcceleration: 130,
  groundDeceleration: 240,
  groundTurnDeceleration: 140,
  airAcceleration: 300,
  airDeceleration: 180,
  airTurnDeceleration: 110,
  jumpVelocity: -560,
  shortJumpCutVelocity: -210,
  speedFlipJumpVelocity: -686,
  speedFlipShortJumpCutVelocity: -257,
  speedFlipHorizontalBoost: 1.225,
  speedFlipVisualMs: 960,
  speedFlipRotationMs: 520,
  slashArcWidth: 198,
  slashArcHeight: 92,
  slashSpinSize: 240,
  wardenProjectileSpeed: 250,
  wardenProjectileLifetimeMs: 1500,
  wardenProjectileFireDelayMs: 110,
  wardenProjectileWidth: 46,
  wardenProjectileHeight: 28,
  wallKickX: 285,
  wallKickY: -535,
  wallSlideMaxFall: 125,
  maxFallSpeed: 760,
  slashStartupMs: 75,
  slashActiveMs: 135,
  slashRecoveryMs: 185,
  hitPauseMs: 55,
  damageCooldownMs: 1800,
  invulnerabilityMs: 1800,
  damageKnockbackX: 155,
  hazardKnockbackX: 185,
  damageKnockbackY: -142,
  hazardKnockbackY: -180,
  damageKnockbackControlLockMs: 140,
  cameraLead: 84
} as const;

const Stage1BaseData = stage1Content as unknown as Omit<Stage1Data, 'visualTerrain'> & {
  readonly visualTerrain: Omit<StageVisualTerrain, 'landforms' | 'landformColliders'>;
};
const Stage1Landforms = stage1Landforms as unknown as Stage1LandformRuntimeData;

export const Stage1Data = {
  ...Stage1BaseData,
  visualTerrain: {
    ...Stage1BaseData.visualTerrain,
    landforms: Stage1Landforms.landforms,
    landformColliders: Stage1Landforms.colliders
  }
} as unknown as Stage1Data;

export const Stage1CollisionPlatforms: readonly RectData[] = [...Stage1Data.platforms, ...Stage1Data.visualTerrain.landformColliders];

export const getSectionForX = (x: number): Stage1Section => {
  return (
    Stage1Data.sections.find((section) => x >= section.startX && x < section.endX) ??
    Stage1Data.sections[Stage1Data.sections.length - 1]
  );
};

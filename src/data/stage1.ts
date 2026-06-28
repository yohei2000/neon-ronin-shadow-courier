import stage1Content from './stage1Content.json';

export type Stage1SectionName =
  | 'Rain Lantern Start'
  | 'First Slash Alley'
  | 'Wall-Kick Sign Shaft'
  | 'Rooftop Gap Line'
  | 'Hidden Scroll Route A'
  | 'Hidden Scroll Route B'
  | 'Checkpoint Shrine Plaza'
  | 'Neon Thorn Run'
  | 'Lantern Warden Encounter'
  | 'Moon Gate Finish';

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
  readonly platforms: readonly Stage1Platform[];
  readonly checkpoints: readonly Stage1Checkpoint[];
  readonly hazards: readonly Stage1Hazard[];
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
  'First Slash Alley',
  'Wall-Kick Sign Shaft',
  'Rooftop Gap Line',
  'Hidden Scroll Route A',
  'Hidden Scroll Route B',
  'Checkpoint Shrine Plaza',
  'Neon Thorn Run',
  'Lantern Warden Encounter',
  'Moon Gate Finish'
] as const satisfies readonly Stage1SectionName[];

export const Stage1Tuning = {
  gameSpeed: 2,
  maxFrameDeltaMs: 33,
  coyoteMs: 120,
  jumpBufferMs: 120,
  gravity: 1420,
  runSpeed: 122,
  groundAcceleration: 235,
  groundDeceleration: 560,
  groundTurnDeceleration: 260,
  airAcceleration: 340,
  airDeceleration: 300,
  airTurnDeceleration: 260,
  jumpVelocity: -560,
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
  cameraLead: 84
} as const;

export const Stage1Data = stage1Content as unknown as Stage1Data;

export const getSectionForX = (x: number): Stage1Section => {
  return (
    Stage1Data.sections.find((section) => x >= section.startX && x < section.endX) ??
    Stage1Data.sections[Stage1Data.sections.length - 1]
  );
};

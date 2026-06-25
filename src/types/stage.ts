import type { EnemyType, PickupType, RectSpec } from './game';

export interface SectionDefinition extends RectSpec {
  readonly id: string;
  readonly name: string;
  readonly safe?: boolean;
}

export interface PlatformDefinition extends RectSpec {
  readonly kind: 'floor' | 'wall' | 'roof' | 'edge';
}

export interface HazardDefinition extends RectSpec {
  readonly id: string;
  readonly kind: 'thorn' | 'spark' | 'fall';
  readonly safeIntro?: boolean;
}

export interface PickupDefinition {
  readonly id: string;
  readonly type: PickupType;
  readonly x: number;
  readonly y: number;
}

export interface ScrollDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly route: 'wall' | 'hidden' | 'combat';
}

export interface EnemySpawnDefinition {
  readonly id: string;
  readonly type: EnemyType;
  readonly x: number;
  readonly y: number;
  readonly patrol: number;
}

export interface CheckpointDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface TutorialMarkerDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly text: string;
}

export interface Stage1Definition {
  readonly id: 'stage1';
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly playerSpawn: { readonly x: number; readonly y: number };
  readonly goal: { readonly x: number; readonly y: number };
  readonly minibossTriggerX: number;
  readonly sections: readonly SectionDefinition[];
  readonly criticalPath: readonly string[];
  readonly platforms: readonly PlatformDefinition[];
  readonly hazards: readonly HazardDefinition[];
  readonly pickups: readonly PickupDefinition[];
  readonly scrolls: readonly ScrollDefinition[];
  readonly enemies: readonly EnemySpawnDefinition[];
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly tutorials: readonly TutorialMarkerDefinition[];
}

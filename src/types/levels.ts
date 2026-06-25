import type { AbilityId, EnemyType, GridPoint, PickupType, RectSpec, StageId, StageTheme } from './game';

export type TileSymbol = '.' | '#' | '=' | '^' | 'F' | 'W' | 'G' | 'B';

export const TileSymbols = ['.', '#', '=', '^', 'F', 'W', 'G', 'B'] as const satisfies readonly TileSymbol[];

export interface EnemySpawnDefinition {
  readonly type: EnemyType;
  readonly x: number;
  readonly y: number;
  readonly patrol?: number;
}

export interface ScrollDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly hint: string;
}

export interface PickupDefinition {
  readonly id: string;
  readonly type: PickupType;
  readonly x: number;
  readonly y: number;
}

export interface HazardDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface MovingPlatformDefinition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly travelX: number;
  readonly travelY: number;
  readonly durationMs: number;
}

export interface BossDefinition {
  readonly x: number;
  readonly y: number;
  readonly triggerX: number;
  readonly arenaLeft: number;
  readonly arenaRight: number;
  readonly name: string;
}

export interface LevelDefinition {
  readonly id: StageId;
  readonly name: string;
  readonly subtitle: string;
  readonly theme: StageTheme;
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly string[];
  readonly playerSpawn: GridPoint | null;
  readonly goal: GridPoint | null;
  readonly checkpoints: readonly GridPoint[];
  readonly scrolls: readonly ScrollDefinition[];
  readonly enemies: readonly EnemySpawnDefinition[];
  readonly hazards: readonly HazardDefinition[];
  readonly movingPlatforms: readonly MovingPlatformDefinition[];
  readonly pickups: readonly PickupDefinition[];
  readonly oneWayPlatforms: readonly RectSpec[];
  readonly fallingPlatforms: readonly RectSpec[];
  readonly windZones: readonly RectSpec[];
  readonly unlockAbility?: AbilityId;
  readonly requiredAbilities: readonly AbilityId[];
  readonly tutorial: readonly string[];
  readonly boss?: BossDefinition;
}

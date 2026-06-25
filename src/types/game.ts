export type StageId = 1 | 2 | 3 | 4 | 5;

export const StageIds = [1, 2, 3, 4, 5] as const satisfies readonly StageId[];

export type StageRank = 'S' | 'A' | 'B' | 'C';

export type AbilityId =
  | 'wallKick'
  | 'dash'
  | 'projectile'
  | 'chargedSlash'
  | 'ultimateArt';

export const AbilityIds = [
  'wallKick',
  'dash',
  'projectile',
  'chargedSlash',
  'ultimateArt'
] as const satisfies readonly AbilityId[];

export type EnemyType =
  | 'ShadowCrawler'
  | 'KiteWraith'
  | 'GearSentinel'
  | 'NeonArcher'
  | 'PulseJumper';

export type PickupType = 'seal' | 'health' | 'energy';

export type StageTheme = 'alley' | 'rooftop' | 'bamboo' | 'castle' | 'keep';

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export interface RectSpec {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

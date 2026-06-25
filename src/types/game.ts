export type StageRank = 'S' | 'A' | 'B' | 'C';

export type EnemyType = 'inkCrawler' | 'kiteWraith' | 'lanternWarden';

export type PickupType = 'seal' | 'health' | 'energy';

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

export interface StageResult {
  readonly elapsedMs: number;
  readonly rank: StageRank;
  readonly scrollsFound: readonly string[];
  readonly damageTaken: number;
  readonly seals: number;
  readonly defeatedMiniboss: boolean;
}

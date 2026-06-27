import type { RectData } from '../data/stage1';

export type DamageSource = 'enemy-contact' | 'hazard' | 'fall' | 'warden-attack';

export type EnemyKind = 'ink-crawler' | 'kite-wraith' | 'lantern-warden';

export interface StageEnemy {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly damage: number;
  dead: boolean;
  update(deltaMs: number, playerX: number, playerY: number): void;
  getBody(): RectData;
  takeHit(amount: number): boolean;
  destroy(): void;
}

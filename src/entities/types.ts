import type { RectData } from '../data/stage1';

export type DamageSource = 'enemy-contact' | 'hazard' | 'fall' | 'warden-attack';

export type EnemyKind = 'ink-crawler' | 'kite-wraith' | 'lantern-warden';
export type EnemyHitResult = 'ignored' | 'hit' | 'defeated';

export type EnemyRuntimeState = {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly dead: boolean;
  readonly visible: boolean;
  readonly alpha: number;
  readonly animation: string | null;
};

export interface StageEnemy {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly damage: number;
  dead: boolean;
  update(deltaMs: number, playerX: number, playerY: number): void;
  getBody(): RectData;
  takeHit(amount: number): EnemyHitResult;
  getRuntimeState(): EnemyRuntimeState;
  destroy(): void;
}

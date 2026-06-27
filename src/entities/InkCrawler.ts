import * as Phaser from 'phaser';
import { RuntimeSpriteAssetKey } from '../data/artAssets';
import type { Stage1EnemyDefinition } from '../data/stage1';
import { centerRect } from '../systems/geometry';
import type { StageEnemy } from './types';

export class InkCrawler implements StageEnemy {
  readonly id: string;
  readonly kind = 'ink-crawler' as const;
  readonly damage = 1;
  dead = false;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private direction: -1 | 1 = 1;
  private hp = 2;

  constructor(scene: Phaser.Scene, private readonly definition: Stage1EnemyDefinition) {
    this.id = definition.id;
    this.sprite = scene.add
      .sprite(definition.x, definition.y, RuntimeSpriteAssetKey.InkCrawler, 0)
      .setOrigin(0.5, 0.74)
      .setScale(0.54)
      .setDepth(25);
    this.sprite.play('ink-crawler-patrol');
  }

  update(deltaMs: number): void {
    if (this.dead) return;
    const dt = deltaMs / 1000;
    this.sprite.x += this.direction * 62 * dt;
    if (this.sprite.x > this.definition.patrolMaxX) {
      this.sprite.x = this.definition.patrolMaxX;
      this.direction = -1;
    }
    if (this.sprite.x < this.definition.patrolMinX) {
      this.sprite.x = this.definition.patrolMinX;
      this.direction = 1;
    }
    this.sprite.setFlipX(this.direction < 0);
  }

  getBody() {
    return centerRect(this.sprite.x, this.sprite.y + 14, 58, 42);
  }

  takeHit(amount: number): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    this.sprite.play('ink-crawler-hit', true);
    this.sprite.setAlpha(0.72);
    if (this.hp <= 0) {
      this.dead = true;
      this.sprite.setVisible(false);
      return true;
    }
    return false;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

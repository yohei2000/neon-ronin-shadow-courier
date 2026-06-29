import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import { RuntimeSpriteAssetKey } from '../data/artAssets';
import type { Stage1EnemyDefinition } from '../data/stage1';
import { centerRect } from '../systems/geometry';
import type { EnemyRuntimeState, StageEnemy } from './types';

const InkCrawlerVisualGroundOffsetY = 50;
const InkCrawlerBodyCenterOffsetY = -9;
const InkCrawlerPatrolAcceleration = 7.5;

export class InkCrawler implements StageEnemy {
  readonly id: string;
  readonly kind = 'ink-crawler' as const;
  readonly damage = 1;
  dead = false;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private direction: -1 | 1 = 1;
  private hp = 2;
  private speed = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly definition: Stage1EnemyDefinition) {
    this.id = definition.id;
    this.sprite = scene.add
      .sprite(definition.x, definition.y + InkCrawlerVisualGroundOffsetY, RuntimeSpriteAssetKey.InkCrawler, 2)
      .setOrigin(0.5, 0.74)
      .setScale(0.54)
      .setDepth(25);
    this.sprite.play('ink-crawler-patrol');
  }

  update(deltaMs: number): void {
    if (this.dead) return;
    const dt = deltaMs / 1000;
    const targetSpeed = this.direction * 62;
    this.speed += (targetSpeed - this.speed) * Math.min(1, InkCrawlerPatrolAcceleration * dt);
    this.sprite.x += this.speed * dt;
    if (this.sprite.x > this.definition.patrolMaxX) {
      this.sprite.x = this.definition.patrolMaxX;
      this.direction = -1;
      this.speed = 0;
    }
    if (this.sprite.x < this.definition.patrolMinX) {
      this.sprite.x = this.definition.patrolMinX;
      this.direction = 1;
      this.speed = 0;
    }
    this.sprite.setFlipX(this.direction < 0);
  }

  getBody() {
    return centerRect(this.sprite.x, this.sprite.y + InkCrawlerBodyCenterOffsetY, 58, 42);
  }

  takeHit(amount: number): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.dead = true;
      this.sprite.clearTint();
      this.sprite.setAlpha(1);
      this.sprite.play('ink-crawler-defeat', true);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 1050,
        delay: 360,
        ease: 'Sine.easeOut',
        onComplete: () => this.sprite.setVisible(false)
      });
      return true;
    }
    this.sprite.setTint(Palette.enemyAmber);
    this.sprite.setAlpha(0.82);
    this.sprite.play('ink-crawler-hit', true);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.dead) return;
      this.sprite.clearTint();
      this.sprite.setAlpha(1);
      this.sprite.play('ink-crawler-patrol', true);
    });
    return false;
  }

  getRuntimeState(): EnemyRuntimeState {
    return {
      id: this.id,
      kind: this.kind,
      x: Math.round(this.sprite.x),
      y: Math.round(this.sprite.y),
      hp: this.hp,
      dead: this.dead,
      visible: this.sprite.visible,
      alpha: Number(this.sprite.alpha.toFixed(2)),
      animation: this.sprite.anims.currentAnim?.key ?? null
    };
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

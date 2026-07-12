import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import { RuntimeSpriteAssetKey } from '../data/artAssets';
import type { Stage1EnemyDefinition } from '../data/stage1';
import { centerRect } from '../systems/geometry';
import type { EnemyRuntimeState, StageEnemy } from './types';

const InkCrawlerVisualGroundOffsetY = 50;
const InkCrawlerBodyCenterOffsetY = -9;
const InkCrawlerPatrolAcceleration = 7.5;
const InkCrawlerVisualScale = 0.54;

export class InkCrawler implements StageEnemy {
  readonly id: string;
  readonly kind = 'ink-crawler' as const;
  readonly damage = 1;
  dead = false;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private direction: -1 | 1 = 1;
  private hp = 2;
  private speed = 0;
  private localTime = 0;
  private visualOffsetY = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly definition: Stage1EnemyDefinition) {
    this.id = definition.id;
    this.sprite = scene.add
      .sprite(definition.x, definition.y + InkCrawlerVisualGroundOffsetY, RuntimeSpriteAssetKey.InkCrawler, 2)
      .setOrigin(0.5, 0.74)
      .setScale(InkCrawlerVisualScale)
      .setDepth(25);
    this.sprite.play('ink-crawler-patrol');
  }

  update(deltaMs: number): void {
    if (this.dead) return;
    const dt = deltaMs / 1000;
    this.localTime += deltaMs;
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
    const crawl = Math.sin(this.localTime / 95);
    this.visualOffsetY = Math.abs(crawl) * 1.2;
    this.sprite
      .setY(this.definition.y + InkCrawlerVisualGroundOffsetY + this.visualOffsetY)
      .setScale(InkCrawlerVisualScale * (1 + Math.abs(crawl) * 0.018), InkCrawlerVisualScale * (1 - Math.abs(crawl) * 0.012))
      .setAngle(crawl * 1.2);
  }

  getBody() {
    return centerRect(this.sprite.x, this.sprite.y - this.visualOffsetY + InkCrawlerBodyCenterOffsetY, 58, 42);
  }

  takeHit(amount: number): import('./types').EnemyHitResult {
    if (this.dead) return 'ignored';
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
      return 'defeated';
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
    return 'hit';
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

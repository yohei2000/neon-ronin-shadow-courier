import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import { RuntimeSpriteAssetKey } from '../data/artAssets';
import type { Stage1EnemyDefinition } from '../data/stage1';
import { centerRect } from '../systems/geometry';
import type { EnemyRuntimeState, StageEnemy } from './types';

const KiteWraithVisualScale = 0.38;

export class KiteWraith implements StageEnemy {
  readonly id: string;
  readonly kind = 'kite-wraith' as const;
  readonly damage = 1;
  dead = false;
  private readonly image: Phaser.GameObjects.Sprite;
  private readonly spawnY: number;
  private direction: -1 | 1 = -1;
  private hp = 2;
  private localTime = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly definition: Stage1EnemyDefinition) {
    this.id = definition.id;
    this.spawnY = definition.y;
    this.image = scene.add
      .sprite(definition.x, definition.y, RuntimeSpriteAssetKey.KiteWraith, 0)
      .setOrigin(0.5, 0.58)
      .setScale(KiteWraithVisualScale)
      .setDepth(24);
    this.image.play('kite-wraith-drift');
  }

  update(deltaMs: number, playerX: number): void {
    if (this.dead) return;
    const dt = deltaMs / 1000;
    this.localTime += deltaMs;
    const chaseBias = Math.abs(playerX - this.image.x) < 260 ? Math.sign(playerX - this.image.x) * 18 : 0;
    const drift = Math.sin(this.localTime / 260);
    this.image.x += (this.direction * 58 + chaseBias) * dt;
    this.image.y = this.spawnY + Math.sin(this.localTime / 360) * 22;
    if (this.image.x > this.definition.patrolMaxX) {
      this.image.x = this.definition.patrolMaxX;
      this.direction = -1;
    }
    if (this.image.x < this.definition.patrolMinX) {
      this.image.x = this.definition.patrolMinX;
      this.direction = 1;
    }
    this.image
      .setFlipX(this.direction > 0)
      .setScale(KiteWraithVisualScale * (1 + drift * 0.018), KiteWraithVisualScale * (1 - drift * 0.012))
      .setAngle(drift * 2.0);
  }

  getBody() {
    return centerRect(this.image.x, this.image.y, 66, 50);
  }

  takeHit(amount: number): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.dead = true;
      this.image.clearTint();
      this.image.setAlpha(1);
      this.image.play('kite-wraith-defeat', true);
      this.scene.tweens.add({
        targets: this.image,
        alpha: 0,
        duration: 1100,
        delay: 380,
        ease: 'Sine.easeOut',
        onComplete: () => this.image.setVisible(false)
      });
      return true;
    }
    this.image.setTint(Palette.enemyAmber);
    this.image.play('kite-wraith-hit', true);
    this.image.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.dead) {
        this.image.clearTint();
        this.image.play('kite-wraith-drift', true);
      }
    });
    return false;
  }

  getRuntimeState(): EnemyRuntimeState {
    return {
      id: this.id,
      kind: this.kind,
      x: Math.round(this.image.x),
      y: Math.round(this.image.y),
      hp: this.hp,
      dead: this.dead,
      visible: this.image.visible,
      alpha: Number(this.image.alpha.toFixed(2)),
      animation: this.image.anims.currentAnim?.key ?? null
    };
  }

  destroy(): void {
    this.image.destroy();
  }
}

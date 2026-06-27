import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import { ArtAssetKey } from '../data/artAssets';
import type { Stage1EnemyDefinition } from '../data/stage1';
import { centerRect } from '../systems/geometry';
import type { StageEnemy } from './types';

export class KiteWraith implements StageEnemy {
  readonly id: string;
  readonly kind = 'kite-wraith' as const;
  readonly damage = 1;
  dead = false;
  private readonly image: Phaser.GameObjects.Image;
  private readonly spawnY: number;
  private direction: -1 | 1 = -1;
  private hp = 2;
  private localTime = 0;

  constructor(scene: Phaser.Scene, private readonly definition: Stage1EnemyDefinition) {
    this.id = definition.id;
    this.spawnY = definition.y;
    this.image = scene.add.image(definition.x, definition.y, ArtAssetKey.KiteWraith).setScale(0.28).setDepth(24);
  }

  update(deltaMs: number, playerX: number): void {
    if (this.dead) return;
    const dt = deltaMs / 1000;
    this.localTime += deltaMs;
    const chaseBias = Math.abs(playerX - this.image.x) < 260 ? Math.sign(playerX - this.image.x) * 18 : 0;
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
    this.image.setFlipX(this.direction > 0);
  }

  getBody() {
    return centerRect(this.image.x, this.image.y, 66, 50);
  }

  takeHit(amount: number): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    this.image.setTint(Palette.enemyAmber);
    if (this.hp <= 0) {
      this.dead = true;
      this.image.setVisible(false);
      return true;
    }
    return false;
  }

  destroy(): void {
    this.image.destroy();
  }
}

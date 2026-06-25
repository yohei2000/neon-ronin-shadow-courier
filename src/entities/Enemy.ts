import * as Phaser from 'phaser';
import { EnemyBalance } from '../data/balance';
import { Palette } from '../config/palette';
import { TextureKey } from '../config/keys';
import type { EnemyType } from '../types/game';
import { Projectile } from './Projectile';

const textureByType: Record<EnemyType, TextureKey> = {
  ShadowCrawler: TextureKey.ShadowCrawler,
  KiteWraith: TextureKey.KiteWraith,
  GearSentinel: TextureKey.GearSentinel,
  NeonArcher: TextureKey.NeonArcher,
  PulseJumper: TextureKey.PulseJumper
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly enemyType: EnemyType;
  readonly contactDamage: number;
  readonly scoreValue: number;
  private hp: number;
  private readonly spawnX: number;
  private readonly spawnY: number;
  private readonly patrolPixels: number;
  private nextActionAt = 0;
  private facing: -1 | 1 = -1;
  private stunnedUntil = 0;

  constructor(scene: Phaser.Scene, type: EnemyType, x: number, y: number, patrolTiles = 4) {
    super(scene, x, y, textureByType[type]);
    this.enemyType = type;
    this.spawnX = x;
    this.spawnY = y;
    this.patrolPixels = Math.max(1, patrolTiles) * 32;
    this.hp = EnemyBalance[type].hp;
    this.contactDamage = EnemyBalance[type].damage;
    this.scoreValue = EnemyBalance[type].score;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(12);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 30);
    body.setOffset(2, 2);
    if (type === 'KiteWraith') {
      body.setAllowGravity(false);
    }
    if (type === 'NeonArcher') {
      body.setDragX(800);
    }
  }

  updateEnemy(
    time: number,
    player: Phaser.GameObjects.Components.Transform,
    enemyProjectiles: Phaser.GameObjects.Group
  ): void {
    if (!this.active) {
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (time < this.stunnedUntil) {
      body.setVelocityX(0);
      return;
    }
    const balance = EnemyBalance[this.enemyType];
    if (player.x < this.x) {
      this.facing = -1;
      this.setFlipX(false);
    } else {
      this.facing = 1;
      this.setFlipX(true);
    }
    switch (this.enemyType) {
      case 'ShadowCrawler': {
        if (body.blocked.left) {
          this.facing = 1;
        }
        if (body.blocked.right) {
          this.facing = -1;
        }
        if (Math.abs(this.x - this.spawnX) > this.patrolPixels) {
          this.facing = this.x > this.spawnX ? -1 : 1;
        }
        body.setVelocityX(this.facing * balance.speed);
        break;
      }
      case 'KiteWraith': {
        this.x = this.spawnX + Math.sin(time / 900) * this.patrolPixels * 0.45;
        this.y = this.spawnY + Math.sin(time / 420) * 20;
        break;
      }
      case 'GearSentinel': {
        if (Math.abs(this.x - this.spawnX) > this.patrolPixels) {
          this.facing = this.x > this.spawnX ? -1 : 1;
        }
        body.setVelocityX(this.facing * balance.speed);
        break;
      }
      case 'NeonArcher': {
        body.setVelocityX(0);
        if (time >= this.nextActionAt) {
          this.nextActionAt = time + 1900;
          this.setTint(Palette.gold);
          this.scene.time.delayedCall(260, () => {
            if (!this.active) {
              return;
            }
            this.clearTint();
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            const projectile = new Projectile(this.scene, {
              x: this.x + Math.cos(angle) * 16,
              y: this.y,
              velocityX: Math.cos(angle) * 190,
              velocityY: Math.sin(angle) * 190,
              damage: 1,
              friendly: false,
              lifetimeMs: 3500
            });
            enemyProjectiles.add(projectile);
          });
        }
        break;
      }
      case 'PulseJumper': {
        if (time >= this.nextActionAt && body.blocked.down) {
          this.nextActionAt = time + 1650;
          this.setTint(Palette.magenta);
          this.scene.time.delayedCall(180, () => {
            if (!this.active) {
              return;
            }
            this.clearTint();
            body.setVelocity(this.facing * 120, -330);
          });
        }
        break;
      }
    }
  }

  applyDamage(amount: number, sourceX: number, charged: boolean): boolean {
    if (!this.active) {
      return false;
    }
    const hitFromFront = this.enemyType === 'GearSentinel' && Math.sign(sourceX - this.x) === this.facing;
    if (hitFromFront && !charged) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0.45,
        yoyo: true,
        duration: 55
      });
      return false;
    }
    this.hp -= amount;
    this.stunnedUntil = this.scene.time.now + 220;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(sourceX < this.x ? 155 : -155);
    body.setVelocityY(-90);
    this.setTint(Palette.red);
    this.scene.time.delayedCall(90, () => this.clearTint());
    if (this.hp <= 0) {
      this.disableBody(true, true);
      this.destroy();
    }
    return true;
  }

  getHp(): number {
    return this.hp;
  }
}

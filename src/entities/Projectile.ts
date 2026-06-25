import * as Phaser from 'phaser';
import { TextureKey } from '../config/keys';

export interface ProjectileOptions {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly damage: number;
  readonly friendly: boolean;
  readonly lifetimeMs: number;
}

export class Projectile extends Phaser.Physics.Arcade.Image {
  readonly damage: number;
  readonly friendly: boolean;
  private readonly expiresAt: number;

  constructor(scene: Phaser.Scene, options: ProjectileOptions) {
    super(scene, options.x, options.y, options.friendly ? TextureKey.Projectile : TextureKey.EnemyProjectile);
    this.damage = options.damage;
    this.friendly = options.friendly;
    this.expiresAt = scene.time.now + options.lifetimeMs;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(25);
    this.setBlendMode(Phaser.BlendModes.ADD);
    this.setData('friendly', options.friendly);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(7);
    body.setVelocity(options.velocityX, options.velocityY);
  }

  updateProjectile(time: number): void {
    if (time >= this.expiresAt) {
      this.destroy();
      return;
    }
    this.rotation += this.friendly ? 0.24 : -0.15;
  }
}

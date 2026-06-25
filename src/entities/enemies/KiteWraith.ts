import * as Phaser from 'phaser';
import { TextureKey } from '../../config/keys';
import { Palette } from '../../config/palette';
import { EnemyBalance } from '../../data/balance';

export class KiteWraith extends Phaser.Physics.Arcade.Sprite {
  readonly damage = EnemyBalance.kiteWraith.damage;
  private hp = EnemyBalance.kiteWraith.hp;
  private readonly homeX: number;
  private readonly homeY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly patrol: number) {
    super(scene, x, y, TextureKey.KiteWraith);
    this.homeX = x;
    this.homeY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(21);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(42, 28);
    body.setOffset(8, 14);
  }

  updateEnemy(time: number): void {
    this.x = this.homeX + Math.sin(time / 850) * this.patrol * 0.5;
    this.y = this.homeY + Math.sin(time / 420) * 22;
  }

  hit(amount: number): boolean {
    this.hp -= amount;
    this.setTint(Palette.red);
    this.scene.time.delayedCall(100, () => this.clearTint());
    if (this.hp <= 0) {
      this.disableBody(true, true);
      this.destroy();
      return true;
    }
    return false;
  }
}

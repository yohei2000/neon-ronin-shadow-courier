import * as Phaser from 'phaser';
import { TextureKey } from '../../config/keys';
import { Palette } from '../../config/palette';
import { EnemyBalance } from '../../data/balance';

export class InkCrawler extends Phaser.Physics.Arcade.Sprite {
  readonly damage = EnemyBalance.inkCrawler.damage;
  private hp = EnemyBalance.inkCrawler.hp;
  private direction: -1 | 1 = -1;
  private readonly left: number;
  private readonly right: number;

  constructor(scene: Phaser.Scene, x: number, y: number, patrol: number) {
    super(scene, x, y, TextureKey.InkCrawler);
    this.left = x - patrol / 2;
    this.right = x + patrol / 2;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(20);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(38, 24);
    body.setOffset(8, 22);
  }

  updateEnemy(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x <= this.left || body.blocked.left) this.direction = 1;
    if (this.x >= this.right || body.blocked.right) this.direction = -1;
    body.setVelocityX(this.direction * EnemyBalance.inkCrawler.speed);
    this.setFlipX(this.direction > 0);
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

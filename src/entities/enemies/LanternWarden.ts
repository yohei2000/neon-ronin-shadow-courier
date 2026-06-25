import * as Phaser from 'phaser';
import { TextureKey } from '../../config/keys';
import { Palette } from '../../config/palette';
import { EnemyBalance } from '../../data/balance';

export class LanternWarden extends Phaser.Physics.Arcade.Sprite {
  readonly damage = EnemyBalance.lanternWarden.damage;
  private hp = EnemyBalance.lanternWarden.hp;
  private activeFight = false;
  private nextAttackAt = 0;
  private attackingUntil = 0;
  private direction: -1 | 1 = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKey.LanternWarden);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(25);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(52, 62);
    body.setOffset(14, 15);
  }

  begin(time: number): void {
    this.activeFight = true;
    this.nextAttackAt = time + 900;
  }

  updateWarden(time: number, playerX: number): void {
    if (!this.activeFight) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.direction = playerX < this.x ? -1 : 1;
    this.setFlipX(this.direction < 0);
    if (time >= this.nextAttackAt) {
      this.nextAttackAt = time + 1800;
      this.attackingUntil = time + 360;
      this.setTint(Palette.gold);
      this.scene.time.delayedCall(220, () => this.clearTint());
    }
    if (time < this.attackingUntil) {
      body.setVelocityX(this.direction * EnemyBalance.lanternWarden.speed);
    } else {
      body.setVelocityX(0);
    }
  }

  isDangerous(time: number): boolean {
    return this.activeFight && time < this.attackingUntil;
  }

  isActiveFight(): boolean {
    return this.activeFight;
  }

  hit(amount: number): boolean {
    if (!this.activeFight) return false;
    this.hp -= amount;
    this.setTexture(TextureKey.LanternWardenHurt);
    this.scene.time.delayedCall(90, () => {
      if (this.active) this.setTexture(TextureKey.LanternWarden);
    });
    if (this.hp <= 0) {
      this.activeFight = false;
      this.disableBody(true, true);
      this.destroy();
      return true;
    }
    return false;
  }

  healthRatio(): number {
    return Math.max(0, this.hp / EnemyBalance.lanternWarden.hp);
  }
}

import * as Phaser from 'phaser';
import { BossBalance } from '../data/balance';
import { Palette } from '../config/palette';
import { TextureKey } from '../config/keys';
import type { BossDefinition } from '../types/levels';
import { Projectile } from './Projectile';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly bossName: string;
  private hp: number = BossBalance.hp;
  private phase = 1;
  private activeFight = false;
  private nextAttackAt = 0;
  private nextTeleportAt = 0;
  private nextSummonAt = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly definition: BossDefinition
  ) {
    super(scene, definition.x, definition.y, TextureKey.Boss);
    this.bossName = definition.name;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(30);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(60, 72);
    body.setOffset(6, 4);
    this.setVisible(false);
    this.disableBody(true, true);
  }

  begin(time: number): void {
    if (this.activeFight) {
      return;
    }
    this.activeFight = true;
    this.enableBody(false, this.definition.x, this.definition.y, true, true);
    this.setVisible(true);
    this.nextAttackAt = time + 700;
    this.nextTeleportAt = time + 2100;
    this.nextSummonAt = time + 3200;
  }

  updateBoss(
    time: number,
    player: Phaser.GameObjects.Components.Transform,
    enemyProjectiles: Phaser.GameObjects.Group,
    onSummon: (x: number, y: number) => void,
    onPhaseChange: (phase: number) => void
  ): void {
    if (!this.activeFight || !this.active) {
      return;
    }
    this.rotation = Math.sin(time / 300) * 0.05;
    this.y = this.definition.y + Math.sin(time / 520) * 18;
    if (time >= this.nextTeleportAt) {
      this.nextTeleportAt = time + (this.phase === 3 ? 1500 : 2300);
      const arenaWidth = this.definition.arenaRight - this.definition.arenaLeft;
      const lane = Phaser.Math.Between(0, 2) / 2;
      this.x = this.definition.arenaLeft + arenaWidth * (0.2 + lane * 0.6);
      this.setTint(Palette.cyan);
      this.scene.time.delayedCall(120, () => this.clearTint());
    }
    if (time >= this.nextAttackAt) {
      this.nextAttackAt = time + (this.phase === 1 ? 1150 : this.phase === 2 ? 860 : 620);
      this.firePattern(player, enemyProjectiles);
    }
    if (this.phase >= 2 && time >= this.nextSummonAt) {
      this.nextSummonAt = time + 4300;
      onSummon(this.x + Phaser.Math.Between(-70, 70), this.y + 60);
    }
    const nextPhase = this.hp <= BossBalance.phase3At ? 3 : this.hp <= BossBalance.phase2At ? 2 : 1;
    if (nextPhase !== this.phase) {
      this.phase = nextPhase;
      this.setTexture(TextureKey.BossPhase);
      this.scene.time.delayedCall(260, () => {
        if (this.active) {
          this.setTexture(TextureKey.Boss);
        }
      });
      onPhaseChange(this.phase);
    }
  }

  damage(amount: number): boolean {
    if (!this.activeFight || !this.active) {
      return false;
    }
    this.hp -= amount;
    this.setTint(Palette.red);
    this.scene.time.delayedCall(90, () => this.clearTint());
    if (this.hp <= 0) {
      this.hp = 0;
      this.activeFight = false;
      this.disableBody(true, true);
      this.destroy();
      return true;
    }
    return false;
  }

  isFightActive(): boolean {
    return this.activeFight;
  }

  getHealthRatio(): number {
    return Math.max(0, this.hp / BossBalance.hp);
  }

  getPhase(): number {
    return this.phase;
  }

  private firePattern(
    player: Phaser.GameObjects.Components.Transform,
    enemyProjectiles: Phaser.GameObjects.Group
  ): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const count = this.phase === 1 ? 1 : this.phase === 2 ? 3 : 5;
    for (let index = 0; index < count; index += 1) {
      const spread = (index - (count - 1) / 2) * 0.24;
      const angle = baseAngle + spread;
      const speed = this.phase === 3 ? 245 : 195;
      enemyProjectiles.add(
        new Projectile(this.scene, {
          x: this.x,
          y: this.y,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          damage: BossBalance.projectileDamage,
          friendly: false,
          lifetimeMs: 4200
        })
      );
    }
  }
}

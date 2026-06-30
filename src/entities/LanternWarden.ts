import * as Phaser from 'phaser';
import { Palette, PaletteHex } from '../config/palette';
import { Stage1SfxKey } from '../data/audioAssets';
import { RuntimeSpriteAssetKey } from '../data/artAssets';
import { Stage1Tuning, type RectData, type Stage1WardenDefinition } from '../data/stage1';
import { centerRect } from '../systems/geometry';
import { Stage1SfxEvent } from '../systems/Stage1Audio';
import { buildWardenProjectileRect, resolveWardenProjectileMotion } from '../systems/wardenRangedAttack';
import type { EnemyRuntimeState, StageEnemy } from './types';

type WardenState = 'idle' | 'telegraph' | 'active' | 'recovery' | 'defeated';

const WardenVisualGroundOffsetY = 61;
const WardenBodyCenterOffsetY = -10;
const WardenTelegraphOffsetY = 65;

type WardenProjectile = {
  readonly id: number;
  readonly sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  readonly vx: number;
  readonly vy: number;
  readonly angleDeg: number;
  lifeMs: number;
};

export class LanternWarden implements StageEnemy {
  readonly id: string;
  readonly kind = 'lantern-warden' as const;
  readonly damage = 1;
  dead = false;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly telegraph: Phaser.GameObjects.Sprite;
  private hp: number;
  private state: WardenState = 'idle';
  private stateMs = 0;
  private attackIndex = 0;
  private facing: -1 | 1 = -1;
  private projectiles: WardenProjectile[] = [];
  private nextProjectileId = 1;
  private firedThisState = false;

  constructor(private readonly scene: Phaser.Scene, private readonly definition: Stage1WardenDefinition) {
    this.id = definition.id;
    this.hp = definition.hp;
    this.sprite = scene.add
      .sprite(definition.x, definition.y + WardenVisualGroundOffsetY, RuntimeSpriteAssetKey.LanternWarden, 1)
      .setScale(0.72)
      .setDepth(26);
    this.telegraph = scene.add
      .sprite(definition.x, definition.y + 86, RuntimeSpriteAssetKey.Telegraph, 1)
      .setDisplaySize(168, 96)
      .setDepth(22)
      .setVisible(false);
    this.sprite.play('warden-idle');
  }

  update(deltaMs: number, playerX: number, playerY: number): void {
    this.updateProjectiles(deltaMs);
    if (this.dead) return;
    this.stateMs += deltaMs;
    this.facing = playerX < this.sprite.x ? -1 : 1;
    this.sprite.setFlipX(this.facing < 0);

    if (this.state === 'idle' && this.stateMs > 900) {
      this.enterState('telegraph');
    } else if (this.state === 'telegraph' && this.stateMs > 650) {
      this.enterState('active');
    } else if (this.state === 'active' && this.stateMs > 420) {
      this.enterState('recovery');
    } else if (this.state === 'recovery' && this.stateMs > 760) {
      this.attackIndex = (this.attackIndex + 1) % this.definition.attackStates.length;
      this.enterState('idle');
    }

    if (
      this.state === 'active' &&
      this.definition.attackStates[this.attackIndex] === 'spark-drop' &&
      !this.firedThisState &&
      this.stateMs >= Stage1Tuning.wardenProjectileFireDelayMs
    ) {
      this.fireProjectile(playerX, playerY);
      this.firedThisState = true;
    }

    const targetX = this.definition.x + Math.sin(this.scene.time.now / 900) * 38;
    this.sprite.x += (targetX - this.sprite.x) * 0.03;
    this.telegraph
      .setPosition(this.sprite.x + this.facing * 76, this.sprite.y + WardenTelegraphOffsetY)
      .setFrame(this.state === 'active' ? 4 : 1)
      .setVisible(this.state === 'telegraph' || this.state === 'active')
      .setAlpha(this.state === 'active' ? 0.65 : 0.38)
      .setTint(this.state === 'active' ? Palette.enemyVermilion : Palette.enemyAmber);
  }

  getBody(): RectData {
    return centerRect(this.sprite.x, this.sprite.y + WardenBodyCenterOffsetY, 74, 138);
  }

  getAttackRect(): RectData | null {
    if (this.dead || this.state !== 'active') return null;
    const attack = this.definition.attackStates[this.attackIndex];
    if (attack === 'lantern-sweep') {
      return { x: this.sprite.x + (this.facing > 0 ? 18 : -170), y: this.sprite.y + 18, width: 152, height: 72 };
    }
    if (attack === 'spark-drop') {
      return { x: this.sprite.x - 68, y: this.sprite.y - 10, width: 136, height: 142 };
    }
    return { x: this.sprite.x + (this.facing > 0 ? 8 : -210), y: this.sprite.y + 42, width: 202, height: 54 };
  }

  getAttackRects(): readonly RectData[] {
    const melee = this.getAttackRect();
    const projectiles = this.projectiles.map((projectile) => buildWardenProjectileRect(projectile.x, projectile.y));
    return melee ? [melee, ...projectiles] : projectiles;
  }

  takeHit(amount: number): boolean {
    if (this.dead || this.state === 'telegraph') return false;
    this.hp = Math.max(0, this.hp - amount);
    this.sprite.setTint(Palette.enemyAmber);
    this.scene.time.delayedCall(90, () => this.sprite.clearTint());
    if (this.hp <= 0) {
      this.dead = true;
      this.state = 'defeated';
      this.sprite.play('warden-defeat');
      this.sprite.setAlpha(0.42);
      this.telegraph.setVisible(false);
      this.clearProjectiles();
      return true;
    }
    return false;
  }

  getHp(): { current: number; max: number; state: WardenState; attack: string; projectileCount: number } {
    return {
      current: this.hp,
      max: this.definition.hp,
      state: this.state,
      attack: this.definition.attackStates[this.attackIndex],
      projectileCount: this.projectiles.length
    };
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

  setVisible(value: boolean): void {
    this.sprite.setVisible(value);
    this.telegraph.setVisible(false);
    this.projectiles.forEach((projectile) => projectile.sprite.setVisible(value));
  }

  destroy(): void {
    this.sprite.destroy();
    this.telegraph.destroy();
    this.clearProjectiles();
  }

  private enterState(state: WardenState): void {
    this.state = state;
    this.stateMs = 0;
    this.firedThisState = false;
    if (state === 'idle') this.sprite.play('warden-idle', true);
    if (state === 'telegraph') this.sprite.play('warden-telegraph', true);
    if (state === 'active') {
      this.sprite.play('warden-attack', true);
      this.scene.events.emit(Stage1SfxEvent, Stage1SfxKey.WardenAttack);
    }
    if (state === 'recovery') this.sprite.play('warden-recovery', true);
  }

  private fireProjectile(playerX: number, playerY: number): void {
    const originX = this.sprite.x + this.facing * 58;
    const originY = this.sprite.y + 16;
    const motion = resolveWardenProjectileMotion(originX, originY, playerX, playerY - 22);
    const sprite = this.scene.add
      .sprite(originX, originY, RuntimeSpriteAssetKey.Telegraph, 4)
      .setDisplaySize(Stage1Tuning.wardenProjectileWidth * 1.45, Stage1Tuning.wardenProjectileHeight * 1.65)
      .setTint(Palette.enemyVermilion)
      .setAlpha(0.88)
      .setAngle(motion.angleDeg)
      .setDepth(25);
    this.projectiles.push({
      id: this.nextProjectileId,
      sprite,
      x: originX,
      y: originY,
      vx: motion.vx,
      vy: motion.vy,
      angleDeg: motion.angleDeg,
      lifeMs: 0
    });
    this.scene.events.emit(Stage1SfxEvent, Stage1SfxKey.WardenProjectile, { detune: this.nextProjectileId % 2 === 0 ? 80 : -60 });
    this.nextProjectileId += 1;
  }

  private updateProjectiles(deltaMs: number): void {
    if (this.projectiles.length === 0) return;
    const dt = deltaMs / 1000;
    const active: WardenProjectile[] = [];
    for (const projectile of this.projectiles) {
      projectile.lifeMs += deltaMs;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.sprite
        .setPosition(projectile.x, projectile.y)
        .setAngle(projectile.angleDeg + Math.sin(this.scene.time.now / 70) * 5)
        .setAlpha(projectile.lifeMs < 160 ? 0.55 : 0.88);
      const expired = projectile.lifeMs >= Stage1Tuning.wardenProjectileLifetimeMs;
      const outOfArena =
        projectile.x < this.definition.arena.x - 160 ||
        projectile.x > this.definition.arena.x + this.definition.arena.width + 160 ||
        projectile.y < this.definition.arena.y - 160 ||
        projectile.y > this.definition.arena.y + this.definition.arena.height + 180;
      if (expired || outOfArena) {
        projectile.sprite.destroy();
      } else {
        active.push(projectile);
      }
    }
    this.projectiles = active;
  }

  private clearProjectiles(): void {
    this.projectiles.forEach((projectile) => projectile.sprite.destroy());
    this.projectiles = [];
  }
}

export const formatWardenHealth = (current: number, max: number): string => {
  const filled = Math.ceil((current / max) * 12);
  return `${'|'.repeat(filled)}${'.'.repeat(Math.max(0, 12 - filled))}`;
};

export const WardenHealthTextStyle = {
  fontFamily: 'Consolas, monospace',
  fontSize: '18px',
  color: PaletteHex.enemyAmber
} as const;

import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import { ArtAssetKey } from '../data/artAssets';
import { Stage1Data, Stage1Tuning, type Stage1Platform } from '../data/stage1';
import type { Stage1InputSnapshot } from '../systems/InputSystem';
import { centerRect, clamp, rectsOverlap, type MutableRect } from '../systems/geometry';
import { CombatSystem, type SlashState } from '../systems/CombatSystem';
import type { DamageSource } from './types';

export type PlayerRuntimeState = {
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly facing: -1 | 1;
  readonly onGround: boolean;
  readonly wallSliding: boolean;
  readonly slashing: boolean;
  readonly invulnerable: boolean;
  readonly damageTaken: number;
};

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly slashSprite: Phaser.GameObjects.Sprite;
  private x: number;
  private y: number;
  private vx = 0;
  private vy = 0;
  private facing: -1 | 1 = 1;
  private onGround = false;
  private touchingLeft = false;
  private touchingRight = false;
  private wallSliding = false;
  private lastGroundedMs = -Infinity;
  private lastJumpPressedMs = -Infinity;
  private slashElapsedMs = -1;
  private invulnerableUntilMs = 0;
  private lastDamageMs = -Infinity;
  private respawnX: number;
  private respawnY: number;
  private hp = 30;
  private readonly maxHp = 30;
  private damageTaken = 0;

  constructor(private readonly scene: Phaser.Scene, startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.respawnX = startX;
    this.respawnY = startY;
    this.sprite = scene.add.sprite(this.x, this.y, ArtAssetKey.Player, 0).setScale(0.62).setDepth(30);
    this.slashSprite = scene.add.sprite(this.x, this.y, ArtAssetKey.Slash, 0).setScale(0.58).setDepth(31).setVisible(false);
    this.sprite.play('player-idle');
  }

  update(input: Stage1InputSnapshot, platforms: readonly Stage1Platform[], nowMs: number, deltaMs: number, paused = false): SlashState {
    if (paused) {
      this.syncVisuals(null);
      return CombatSystem.buildSlashState(this.x, this.y, this.facing, -1);
    }

    if (input.jumpPressed) {
      this.lastJumpPressedMs = nowMs;
    }

    if (input.moveX !== 0) {
      this.facing = input.moveX;
    }

    const canGroundJump = this.onGround || nowMs - this.lastGroundedMs <= Stage1Tuning.coyoteMs;
    const canWallKick = !this.onGround && (this.touchingLeft || this.touchingRight);
    if (nowMs - this.lastJumpPressedMs <= Stage1Tuning.jumpBufferMs && (canGroundJump || canWallKick)) {
      if (canWallKick && !canGroundJump) {
        const wallDir = this.touchingLeft ? 1 : -1;
        this.vx = wallDir * Stage1Tuning.wallKickX;
        this.vy = Stage1Tuning.wallKickY;
        this.facing = wallDir as -1 | 1;
        this.sprite.play('player-wallKick', true);
      } else {
        this.vy = Stage1Tuning.jumpVelocity;
      }
      this.onGround = false;
      this.lastJumpPressedMs = -Infinity;
    }

    if (input.jumpReleased && this.vy < -210) {
      this.vy = -210;
    }

    const dt = deltaMs / 1000;
    const targetVx = input.moveX * Stage1Tuning.runSpeed;
    const accel = this.onGround ? 0.38 : 0.18;
    this.vx += (targetVx - this.vx) * accel;
    if (Math.abs(this.vx) < 1) this.vx = 0;

    this.vy = Math.min(Stage1Tuning.maxFallSpeed, this.vy + Stage1Tuning.gravity * dt);
    this.wallSliding =
      !this.onGround &&
      this.vy > 0 &&
      ((this.touchingLeft && input.moveX < 0) || (this.touchingRight && input.moveX > 0));
    if (this.wallSliding) {
      this.vy = Math.min(this.vy, Stage1Tuning.wallSlideMaxFall);
    }

    this.moveAndCollide(this.vx * dt, 0, platforms);
    this.moveAndCollide(0, this.vy * dt, platforms);

    if (this.y > Stage1Data.worldHeight - 48) {
      this.takeDamage(1, nowMs, 'fall');
      this.respawnAtCheckpoint();
    }

    if (input.attackPressed && this.slashElapsedMs < 0) {
      this.slashElapsedMs = 0;
      this.sprite.play(this.onGround ? 'player-groundSlash' : 'player-airSlash', true);
    }

    let slash = CombatSystem.buildSlashState(this.x, this.y, this.facing, -1);
    if (this.slashElapsedMs >= 0) {
      this.slashElapsedMs += deltaMs;
      slash = CombatSystem.buildSlashState(this.x, this.y, this.facing, this.slashElapsedMs);
      if (slash.phase === 'idle') {
        this.slashElapsedMs = -1;
      }
    }

    this.syncVisuals(slash);
    return slash;
  }

  setCheckpoint(x: number, y: number): void {
    this.respawnX = x;
    this.respawnY = y;
  }

  respawnAtCheckpoint(): void {
    this.x = this.respawnX;
    this.y = this.respawnY;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }

  retryCheckpoint(): void {
    this.hp = this.maxHp;
    this.respawnAtCheckpoint();
  }

  restart(startX: number, startY: number): void {
    this.x = startX;
    this.y = startY;
    this.respawnX = startX;
    this.respawnY = startY;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.damageTaken = 0;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  takeDamage(amount: number, nowMs: number, source: DamageSource): boolean {
    if (nowMs < this.invulnerableUntilMs || nowMs - this.lastDamageMs < Stage1Tuning.damageCooldownMs) {
      return false;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.damageTaken += amount;
    this.lastDamageMs = nowMs;
    this.invulnerableUntilMs = nowMs + Stage1Tuning.invulnerabilityMs;
    this.sprite.play('player-hurt', true);
    this.vx = source === 'fall' ? 0 : source === 'hazard' ? this.facing * 180 : -this.facing * 190;
    this.vy = source === 'hazard' ? -330 : Math.min(this.vy, -240);
    return true;
  }

  getBody(): MutableRect {
    return centerRect(this.x, this.y, 42, 72);
  }

  getRuntimeState(): PlayerRuntimeState {
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
      hp: this.hp,
      maxHp: this.maxHp,
      facing: this.facing,
      onGround: this.onGround,
      wallSliding: this.wallSliding,
      slashing: this.slashElapsedMs >= 0,
      invulnerable: this.scene.time.now < this.invulnerableUntilMs,
      damageTaken: this.damageTaken
    };
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  getDamageTaken(): number {
    return this.damageTaken;
  }

  getPosition(): { x: number; y: number; facing: -1 | 1 } {
    return { x: this.x, y: this.y, facing: this.facing };
  }

  private moveAndCollide(dx: number, dy: number, platforms: readonly Stage1Platform[]): void {
    if (dx !== 0) {
      this.x += dx;
      this.touchingLeft = false;
      this.touchingRight = false;
      for (const platform of platforms) {
        if (!rectsOverlap(this.getBody(), platform)) continue;
        if (dx > 0) {
          this.x = platform.x - this.getBody().width / 2;
          this.touchingRight = true;
        } else {
          this.x = platform.x + platform.width + this.getBody().width / 2;
          this.touchingLeft = true;
        }
        this.vx = 0;
      }
      this.x = clamp(this.x, 22, Stage1Data.worldWidth - 22);
    }

    if (dy !== 0) {
      this.y += dy;
      this.onGround = false;
      for (const platform of platforms) {
        if (!rectsOverlap(this.getBody(), platform)) continue;
        if (dy > 0) {
          this.y = platform.y - this.getBody().height / 2;
          this.vy = 0;
          this.onGround = true;
          this.lastGroundedMs = this.scene.time.now;
        } else {
          this.y = platform.y + platform.height + this.getBody().height / 2;
          this.vy = 0;
        }
      }
    }
  }

  private syncVisuals(slash: SlashState | null): void {
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setFlipX(this.facing < 0);
    this.sprite.setAlpha(this.scene.time.now < this.invulnerableUntilMs && Math.floor(this.scene.time.now / 90) % 2 === 0 ? 0.58 : 1);

    if (this.slashElapsedMs < 0) {
      if (this.wallSliding) this.sprite.play('player-wallSlide', true);
      else if (!this.onGround && this.vy < -40) this.sprite.play('player-jumpRise', true);
      else if (!this.onGround) this.sprite.play('player-fall', true);
      else if (Math.abs(this.vx) > 18) this.sprite.play('player-run', true);
      else this.sprite.play('player-idle', true);
    }

    if (!slash || slash.phase === 'idle') {
      this.slashSprite.setVisible(false);
      return;
    }

    this.slashSprite
      .setVisible(true)
      .setPosition(this.x + this.facing * 52, this.y - 16)
      .setFlipX(this.facing < 0)
      .setAlpha(slash.phase === 'active' ? 0.95 : 0.48)
      .setTint(slash.phase === 'active' ? Palette.neonMagenta : Palette.neonCyan);
    this.slashSprite.play('slash-arc', true);
  }
}

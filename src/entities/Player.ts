import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import { RuntimePlayerVisualConfig, RuntimeSpriteAssetKey } from '../data/artAssets';
import { Stage1Data, Stage1Tuning, type Stage1Platform } from '../data/stage1';
import type { Stage1InputSnapshot } from '../systems/InputSystem';
import { centerRect, clamp, rectsOverlap, type MutableRect } from '../systems/geometry';
import { resolveHorizontalVelocity } from '../systems/horizontalMotion';
import {
  resolveInitialJumpVisualVariant,
  shouldUseSmallJumpVariant,
  type JumpVisualVariant
} from '../systems/playerVisualState';
import { CombatSystem, type SlashState } from '../systems/CombatSystem';
import type { DamageSource } from './types';

export type PlayerVisualPose =
  | 'idle'
  | 'run'
  | 'smallJump'
  | 'bigJumpRise'
  | 'speedFlipJump'
  | 'apex'
  | 'fall'
  | 'wallSlide'
  | 'wallKick'
  | 'groundSlash'
  | 'airSlash'
  | 'hurt';

export type PlayerRuntimeState = {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly facing: -1 | 1;
  readonly onGround: boolean;
  readonly wallSliding: boolean;
  readonly slashing: boolean;
  readonly pose: PlayerVisualPose;
  readonly jumpVariant: JumpVisualVariant | null;
  readonly invulnerable: boolean;
  readonly damageTaken: number;
};

const PlayerPoseTransforms: Record<PlayerVisualPose, { readonly angle: number; readonly offsetY: number }> = {
  idle: { angle: 0, offsetY: 0 },
  run: { angle: -2, offsetY: 1 },
  smallJump: { angle: -4, offsetY: -2 },
  bigJumpRise: { angle: -7, offsetY: -5 },
  speedFlipJump: { angle: -2, offsetY: -12 },
  apex: { angle: -1, offsetY: -5 },
  fall: { angle: 5, offsetY: 2 },
  wallSlide: { angle: 6, offsetY: 1 },
  wallKick: { angle: -9, offsetY: -2 },
  groundSlash: { angle: -3, offsetY: 1 },
  airSlash: { angle: -8, offsetY: -2 },
  hurt: { angle: 8, offsetY: 0 }
};

const PlayerVisualGroundOffsetY = 16;

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
  private lastWallKickMs = -Infinity;
  private jumpStartedMs = -Infinity;
  private jumpVisualVariant: JumpVisualVariant | null = null;
  private slashElapsedMs = -1;
  private slashStartedOnGround = true;
  private invulnerableUntilMs = 0;
  private lastDamageMs = -Infinity;
  private lastResolvedPose: PlayerVisualPose = 'idle';
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
    this.sprite = scene.add
      .sprite(this.x, this.y, RuntimePlayerVisualConfig.textureKey, 0)
      .setOrigin(0.5, 0.76)
      .setScale(RuntimePlayerVisualConfig.scale)
      .setDepth(30);
    this.slashSprite = scene.add.sprite(this.x, this.y, RuntimeSpriteAssetKey.Slash, 0).setScale(0.62).setDepth(31).setVisible(false);
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
        this.lastWallKickMs = nowMs;
        this.jumpStartedMs = nowMs;
        this.jumpVisualVariant = null;
      } else {
        this.jumpStartedMs = nowMs;
        this.jumpVisualVariant = resolveInitialJumpVisualVariant(this.vx);
        this.vy = Stage1Tuning.jumpVelocity;
      }
      this.onGround = false;
      this.lastJumpPressedMs = -Infinity;
    }

    if (input.jumpReleased && this.vy < -210) {
      if (
        this.jumpVisualVariant === 'big' &&
        shouldUseSmallJumpVariant({ elapsedMs: nowMs - this.jumpStartedMs, verticalVelocity: this.vy })
      ) {
        this.jumpVisualVariant = 'small';
      }
      this.vy = -210;
    }

    const dt = deltaMs / 1000;
    this.vx = resolveHorizontalVelocity({
      currentVx: this.vx,
      inputMoveX: input.moveX,
      onGround: this.onGround,
      dtSeconds: dt
    });

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
      this.slashStartedOnGround = this.onGround;
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
    this.wallSliding = false;
    this.jumpStartedMs = -Infinity;
    this.jumpVisualVariant = null;
    this.slashElapsedMs = -1;
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
    this.wallSliding = false;
    this.jumpStartedMs = -Infinity;
    this.jumpVisualVariant = null;
    this.slashElapsedMs = -1;
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
      vx: Math.round(this.vx),
      vy: Math.round(this.vy),
      hp: this.hp,
      maxHp: this.maxHp,
      facing: this.facing,
      onGround: this.onGround,
      wallSliding: this.wallSliding,
      slashing: this.slashElapsedMs >= 0,
      pose: this.lastResolvedPose,
      jumpVariant: this.jumpVisualVariant,
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
          this.jumpStartedMs = -Infinity;
          this.jumpVisualVariant = null;
        } else {
          this.y = platform.y + platform.height + this.getBody().height / 2;
          this.vy = 0;
        }
      }
    }
  }

  private syncVisuals(slash: SlashState | null): void {
    const nowMs = this.scene.time.now;
    const pose = this.resolveVisualPose(nowMs);
    this.lastResolvedPose = pose;
    const transform = PlayerPoseTransforms[pose];
    const baseScale = RuntimePlayerVisualConfig.scale;
    const motionBob = pose === 'run' ? Math.sin(nowMs / 70) * 1.4 : pose === 'idle' ? Math.sin(nowMs / 260) * 0.5 : 0;
    const flipProgress = clamp((nowMs - this.jumpStartedMs) / 560, 0, 1);
    const dynamicAngle = pose === 'speedFlipJump' ? transform.angle + 360 * flipProgress : transform.angle;
    const visualScale = pose === 'speedFlipJump' ? baseScale * 0.92 : baseScale;

    this.sprite.setPosition(this.x, this.y + PlayerVisualGroundOffsetY + transform.offsetY + motionBob);
    this.sprite.setOrigin(0.5, pose === 'speedFlipJump' ? 0.52 : 0.76);
    this.sprite.setFlipX(this.facing < 0);
    this.sprite.setScale(visualScale);
    this.sprite.setAngle(dynamicAngle * this.facing);
    this.sprite.play(`player-${pose}`, true);

    if (pose === 'hurt') {
      this.sprite.setTint(Palette.dangerCoral);
    } else {
      this.sprite.clearTint();
    }
    this.sprite.setAlpha(nowMs < this.invulnerableUntilMs && Math.floor(nowMs / 90) % 2 === 0 ? 0.64 : 1);

    if (!slash || slash.phase === 'idle') {
      this.slashSprite.setVisible(false);
      return;
    }

    const slashAnimation = this.slashStartedOnGround ? 'slash-ground' : 'slash-air';
    const slashOffsetY = this.slashStartedOnGround ? -16 : -30;
    this.slashSprite
      .setVisible(true)
      .setPosition(this.x + this.facing * 52, this.y + PlayerVisualGroundOffsetY + slashOffsetY)
      .setFlipX(this.facing < 0)
      .setScale(this.slashStartedOnGround ? 0.62 : 0.58)
      .setAlpha(slash.phase === 'active' ? 0.95 : 0.48)
      .setTint(slash.phase === 'active' ? Palette.neonMagenta : Palette.neonCyan);
    this.slashSprite.play(slashAnimation, true);
  }

  private resolveVisualPose(nowMs: number): PlayerVisualPose {
    if (nowMs < this.invulnerableUntilMs && nowMs - this.lastDamageMs < 260) return 'hurt';
    if (this.slashElapsedMs >= 0) return this.onGround ? 'groundSlash' : 'airSlash';
    if (nowMs - this.lastWallKickMs < 180) return 'wallKick';
    if (this.wallSliding) return 'wallSlide';
    if (!this.onGround) {
      if (this.jumpVisualVariant === 'speedFlip' && nowMs - this.jumpStartedMs < 680 && this.vy < Stage1Tuning.maxFallSpeed * 0.65) {
        return 'speedFlipJump';
      }
      if (this.vy < -55) return this.jumpVisualVariant === 'small' ? 'smallJump' : 'bigJumpRise';
      if (Math.abs(this.vy) <= 90) return 'apex';
      return 'fall';
    }
    if (Math.abs(this.vx) > 18) return 'run';
    return 'idle';
  }
}

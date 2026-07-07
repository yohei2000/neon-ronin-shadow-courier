import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import { RuntimePlayerVisualConfig, RuntimeSpriteAssetKey } from '../data/artAssets';
import { Stage1Data, Stage1Tuning, type RectData } from '../data/stage1';
import { Stage2Tuning } from '../data/stage2';
import type { Stage1InputSnapshot } from '../systems/InputSystem';
import { centerRect, clamp, rectsOverlap, type MutableRect } from '../systems/geometry';
import { resolveHorizontalVelocity } from '../systems/horizontalMotion';
import {
  resolveInitialJumpVisualVariant,
  shouldUseSmallJumpVariant,
  type JumpVisualVariant
} from '../systems/playerVisualState';
import { CombatSystem, type SlashMode, type SlashState } from '../systems/CombatSystem';
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
  | 'shadowThread'
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
  readonly slashMode: SlashMode;
  readonly pose: PlayerVisualPose;
  readonly jumpVariant: JumpVisualVariant | null;
  readonly shadowThreading: boolean;
  readonly shadowThreadCharge: boolean;
  readonly invulnerable: boolean;
  readonly damageTaken: number;
  readonly lastDamageSource: DamageSource | null;
  readonly lastDamageId: string | null;
};

export type PlayerActionEvent = 'jump' | 'speedFlipJump' | 'wallKick' | 'shadowThread' | 'attack' | 'spinAttack' | 'hurt';

export type PlayerFrameResult = {
  readonly slash: SlashState;
  readonly events: readonly PlayerActionEvent[];
};

export type PlayerStageBounds = {
  readonly worldWidth: number;
  readonly worldHeight: number;
};

export type ShadowThreadTarget = {
  readonly x: number;
  readonly y: number;
};

export type SlopeSurface = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly thickness: number;
  readonly direction: 'down-right' | 'down-left';
  readonly boost: number;
};

type ActiveShadowThread = {
  readonly startX: number;
  readonly startY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly durationMs: number;
  readonly direction: -1 | 1;
  elapsedMs: number;
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
  shadowThread: { angle: -16, offsetY: -10 },
  groundSlash: { angle: -3, offsetY: 1 },
  airSlash: { angle: -8, offsetY: -2 },
  hurt: { angle: 8, offsetY: 0 }
};

const PlayerVisualGroundOffsetY = 16;
const PlayerAfterimageCount = 4;
const PlayerAfterimageIntervalMs = 54;
const PlayerAfterimagePoses = new Set<PlayerVisualPose>([
  'run',
  'speedFlipJump',
  'wallKick',
  'shadowThread',
  'groundSlash',
  'airSlash'
]);

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly slashSprite: Phaser.GameObjects.Sprite;
  private readonly spinSlashSprite: Phaser.GameObjects.Sprite;
  private readonly afterimageSprites: Phaser.GameObjects.Sprite[] = [];
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
  private shadowThread: ActiveShadowThread | null = null;
  private shadowThreadChargeAvailable = true;
  private shadowThreadImpactUntilMs = -Infinity;
  private shadowThreadImpactRect: RectData | null = null;
  private slashElapsedMs = -1;
  private slashStartedOnGround = true;
  private slashMode: SlashMode = 'arc';
  private invulnerableUntilMs = 0;
  private lastDamageMs = -Infinity;
  private lastDamageSource: DamageSource | null = null;
  private lastDamageId: string | null = null;
  private knockbackControlUntilMs = 0;
  private lastResolvedPose: PlayerVisualPose = 'idle';
  private lastAfterimageMs = -Infinity;
  private respawnX: number;
  private respawnY: number;
  private hp = 30;
  private readonly maxHp = 30;
  private damageTaken = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    startX: number,
    startY: number,
    private readonly bounds: PlayerStageBounds = Stage1Data
  ) {
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
    this.spinSlashSprite = scene.add
      .sprite(this.x, this.y, RuntimeSpriteAssetKey.Slash, 14)
      .setScale(1.52)
      .setDepth(32)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    for (let index = 0; index < PlayerAfterimageCount; index += 1) {
      const afterimage = scene.add
        .sprite(this.x, this.y, RuntimePlayerVisualConfig.textureKey, 0)
        .setOrigin(0.5, 0.76)
        .setScale(RuntimePlayerVisualConfig.scale)
        .setDepth(29)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setVisible(false)
        .setAlpha(0);
      this.afterimageSprites.push(afterimage);
    }
    this.sprite.play('player-idle');
  }

  update(input: Stage1InputSnapshot, platforms: readonly RectData[], nowMs: number, deltaMs: number, paused = false): PlayerFrameResult {
    const events: PlayerActionEvent[] = [];

    if (paused) {
      this.syncVisuals(null);
      return { slash: CombatSystem.buildSlashState(this.x, this.y, this.facing, -1), events };
    }

    if (this.shadowThread !== null) {
      const slash = this.updateShadowThread(deltaMs, nowMs, events);
      this.syncVisuals(slash);
      return { slash, events };
    }

    if (input.jumpPressed) {
      this.lastJumpPressedMs = nowMs;
    }

    const controlLocked = nowMs < this.knockbackControlUntilMs;
    const effectiveMoveX = controlLocked ? 0 : input.moveX;

    if (effectiveMoveX !== 0) {
      this.facing = effectiveMoveX;
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
        events.push('wallKick');
      } else {
        this.jumpStartedMs = nowMs;
        const jumpVariant = resolveInitialJumpVisualVariant(this.vx);
        this.jumpVisualVariant = jumpVariant;
        if (jumpVariant === 'speedFlip') {
          const launchDirection = effectiveMoveX !== 0 ? effectiveMoveX : this.facing;
          this.facing = launchDirection;
          this.vx = launchDirection * Math.max(Math.abs(this.vx), Stage1Tuning.runSpeed) * Stage1Tuning.speedFlipHorizontalBoost;
          this.vy = Stage1Tuning.speedFlipJumpVelocity;
        } else {
          this.vy = Stage1Tuning.jumpVelocity;
        }
        events.push(jumpVariant === 'speedFlip' ? 'speedFlipJump' : 'jump');
      }
      this.onGround = false;
      this.lastJumpPressedMs = -Infinity;
    }

    const jumpCutVelocity =
      this.jumpVisualVariant === 'speedFlip' ? Stage1Tuning.speedFlipShortJumpCutVelocity : Stage1Tuning.shortJumpCutVelocity;
    if (input.jumpReleased && this.vy < jumpCutVelocity) {
      if (
        this.jumpVisualVariant === 'big' &&
        shouldUseSmallJumpVariant({ elapsedMs: nowMs - this.jumpStartedMs, verticalVelocity: this.vy })
      ) {
        this.jumpVisualVariant = 'small';
      }
      this.vy = jumpCutVelocity;
    }

    const dt = deltaMs / 1000;
    this.vx = resolveHorizontalVelocity({
      currentVx: this.vx,
      inputMoveX: effectiveMoveX,
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

    if (this.y > this.bounds.worldHeight - 48) {
      if (this.takeDamage(1, nowMs, 'fall', undefined, 'world-fall')) {
        events.push('hurt');
      }
      this.respawnAtCheckpoint();
    }

    if (input.attackPressed && this.slashElapsedMs < 0) {
      this.slashElapsedMs = 0;
      this.slashStartedOnGround = this.onGround;
      this.slashMode = this.isSpeedFlipActive(nowMs) ? 'spin' : 'arc';
      events.push(this.slashMode === 'spin' ? 'spinAttack' : 'attack');
    }

    let slash = CombatSystem.buildSlashState(this.x, this.y, this.facing, -1);
    if (this.slashElapsedMs >= 0) {
      this.slashElapsedMs += deltaMs;
      slash = CombatSystem.buildSlashState(this.x, this.y, this.facing, this.slashElapsedMs, this.slashMode);
      if (slash.phase === 'idle') {
        this.slashElapsedMs = -1;
        this.slashMode = 'arc';
      }
    }

    this.syncVisuals(slash);
    return { slash, events };
  }

  setCheckpoint(x: number, y: number): void {
    this.respawnX = x;
    this.respawnY = y;
  }

  applyUpdraft(strength: number): void {
    const liftVelocity = -Math.abs(strength);
    if (this.vy > liftVelocity) {
      this.vy = liftVelocity;
    }
    this.onGround = false;
    this.wallSliding = false;
    this.jumpStartedMs = this.scene.time.now;
    this.jumpVisualVariant = 'big';
  }

  applyCrosswind(strength: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    this.vx = clamp(this.vx + strength * dt, -Stage2Tuning.crosswindMaxVx, Stage2Tuning.crosswindMaxVx);
  }

  applySlopeSurface(surface: SlopeSurface, deltaMs: number): boolean {
    if (this.shadowThread !== null) return false;
    const minX = Math.min(surface.x1, surface.x2);
    const maxX = Math.max(surface.x1, surface.x2);
    const body = this.getBody();
    if (this.x < minX - body.width / 2 || this.x > maxX + body.width / 2) return false;
    const run = surface.x2 - surface.x1;
    if (Math.abs(run) < 1) return false;

    const progress = clamp((this.x - surface.x1) / run, 0, 1);
    const surfaceY = surface.y1 + (surface.y2 - surface.y1) * progress;
    const footY = body.y + body.height;
    const closeAbove = footY >= surfaceY - Stage2Tuning.slopeSnapTolerance;
    const notBuried = footY <= surfaceY + surface.thickness + Stage2Tuning.slopeSnapTolerance;
    const notRisingHard = this.vy >= -Stage2Tuning.slopeAttachMaxRiseSpeed;
    if (!closeAbove || !notBuried || !notRisingHard) return false;

    this.y = surfaceY - body.height / 2;
    this.vy = 0;
    this.onGround = true;
    this.wallSliding = false;
    this.shadowThreadChargeAvailable = true;
    this.lastGroundedMs = this.scene.time.now;
    this.jumpStartedMs = -Infinity;
    this.jumpVisualVariant = null;

    const slopeDirection = surface.direction === 'down-left' ? -1 : 1;
    this.vx = clamp(this.vx + slopeDirection * surface.boost * (deltaMs / 1000), -Stage2Tuning.slopeMaxVx, Stage2Tuning.slopeMaxVx);
    return true;
  }

  tryShadowThread(target: ShadowThreadTarget, nowMs: number): boolean {
    if (this.shadowThread !== null) return false;
    if (!this.onGround && !this.shadowThreadChargeAvailable) return false;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 32 || distance > Stage2Tuning.shadowThreadRange + 18) return false;
    const direction: -1 | 1 = dx < 0 ? -1 : 1;
    this.facing = direction;
    this.shadowThread = {
      startX: this.x,
      startY: this.y,
      targetX: target.x,
      targetY: target.y,
      durationMs: clamp(
        (distance / Stage2Tuning.shadowThreadSpeed) * 1000,
        Stage2Tuning.shadowThreadMinDurationMs,
        Stage2Tuning.shadowThreadMaxDurationMs
      ),
      direction,
      elapsedMs: 0
    };
    this.shadowThreadChargeAvailable = false;
    this.shadowThreadImpactRect = null;
    this.shadowThreadImpactUntilMs = -Infinity;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.wallSliding = false;
    this.jumpStartedMs = nowMs;
    this.jumpVisualVariant = null;
    this.slashElapsedMs = -1;
    this.slashMode = 'arc';
    return true;
  }

  rechargeShadowThread(): void {
    this.shadowThreadChargeAvailable = true;
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
    this.slashMode = 'arc';
    this.knockbackControlUntilMs = 0;
    this.shadowThread = null;
    this.shadowThreadChargeAvailable = true;
    this.shadowThreadImpactRect = null;
    this.shadowThreadImpactUntilMs = -Infinity;
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
    this.lastDamageSource = null;
    this.lastDamageId = null;
    this.wallSliding = false;
    this.jumpStartedMs = -Infinity;
    this.jumpVisualVariant = null;
    this.slashElapsedMs = -1;
    this.slashMode = 'arc';
    this.knockbackControlUntilMs = 0;
    this.shadowThread = null;
    this.shadowThreadChargeAvailable = true;
    this.shadowThreadImpactRect = null;
    this.shadowThreadImpactUntilMs = -Infinity;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  takeDamage(amount: number, nowMs: number, source: DamageSource, sourceX?: number, sourceId?: string): boolean {
    if (nowMs < this.invulnerableUntilMs || nowMs - this.lastDamageMs < Stage1Tuning.damageCooldownMs) {
      return false;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.damageTaken += amount;
    this.lastDamageMs = nowMs;
    this.lastDamageSource = source;
    this.lastDamageId = sourceId ?? null;
    this.invulnerableUntilMs = nowMs + Stage1Tuning.invulnerabilityMs;
    this.knockbackControlUntilMs = nowMs + Stage1Tuning.damageKnockbackControlLockMs;
    if (source === 'fall') {
      this.vx = 0;
      this.vy = 0;
      return true;
    }
    const awayDirection: -1 | 1 =
      sourceX === undefined || sourceX === this.x ? (this.facing > 0 ? -1 : 1) : this.x < sourceX ? -1 : 1;
    const knockbackX = source === 'hazard' ? Stage1Tuning.hazardKnockbackX : Stage1Tuning.damageKnockbackX;
    const knockbackY = source === 'hazard' ? Stage1Tuning.hazardKnockbackY : Stage1Tuning.damageKnockbackY;
    this.vx = awayDirection * knockbackX;
    this.vy = Math.min(this.vy, knockbackY);
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
      slashMode: this.slashMode,
      pose: this.lastResolvedPose,
      jumpVariant: this.jumpVisualVariant,
      shadowThreading: this.shadowThread !== null,
      shadowThreadCharge: this.shadowThreadChargeAvailable,
      invulnerable: this.scene.time.now < this.invulnerableUntilMs,
      damageTaken: this.damageTaken,
      lastDamageSource: this.lastDamageSource,
      lastDamageId: this.lastDamageId
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

  constrainRight(maxX: number): void {
    if (this.x <= maxX) return;
    this.x = maxX;
    this.vx = Math.min(0, this.vx);
  }

  getShadowThreadStrike(): RectData | null {
    return this.scene.time.now < this.shadowThreadImpactUntilMs ? this.shadowThreadImpactRect : null;
  }

  private updateShadowThread(deltaMs: number, nowMs: number, events: PlayerActionEvent[]): SlashState {
    const thread = this.shadowThread;
    if (thread === null) {
      return CombatSystem.buildSlashState(this.x, this.y, this.facing, -1);
    }

    thread.elapsedMs += deltaMs;
    const progress = clamp(thread.elapsedMs / thread.durationMs, 0, 1);
    const eased = 1 - (1 - progress) * (1 - progress);
    this.x = thread.startX + (thread.targetX - thread.startX) * eased;
    this.y = thread.startY + (thread.targetY - thread.startY) * eased;
    this.vx = 0;
    this.vy = 0;
    this.facing = thread.direction;

    const activeRect = centerRect(this.x, this.y, Stage2Tuning.shadowThreadStrikeSize, Stage2Tuning.shadowThreadStrikeSize);
    if (progress >= 1) {
      this.x = thread.targetX;
      this.y = thread.targetY;
      this.vx = thread.direction * Stage2Tuning.shadowThreadLaunchX;
      this.vy = Stage2Tuning.shadowThreadLaunchY;
      this.shadowThread = null;
      this.shadowThreadImpactRect = centerRect(this.x, this.y, Stage2Tuning.shadowThreadStrikeSize, Stage2Tuning.shadowThreadStrikeSize);
      this.shadowThreadImpactUntilMs = nowMs + Stage2Tuning.shadowThreadImpactMs;
      this.jumpStartedMs = nowMs;
      this.jumpVisualVariant = 'big';
      events.push('shadowThread');
    }

    return {
      phase: 'active',
      elapsedMs: thread.elapsedMs,
      mode: 'arc',
      activeRect
    };
  }

  private moveAndCollide(dx: number, dy: number, platforms: readonly RectData[]): void {
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
      this.x = clamp(this.x, 22, this.bounds.worldWidth - 22);
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
          this.shadowThreadChargeAvailable = true;
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
    const animationPose = pose === 'shadowThread' ? 'airSlash' : pose;
    const baseScale = RuntimePlayerVisualConfig.scale;
    const stride = Math.sin(nowMs / 58);
    const secondary = Math.sin(nowMs / 116 + 0.7);
    const motionBob =
      pose === 'run'
        ? stride * 1.8
        : pose === 'idle'
          ? Math.sin(nowMs / 260) * 0.5
          : pose === 'wallSlide'
            ? Math.sin(nowMs / 90) * 0.8
            : pose === 'fall'
              ? Math.sin(nowMs / 110) * 0.7
              : pose === 'airSlash' || pose === 'shadowThread'
                ? Math.sin(nowMs / 72) * 1.0
                : 0;
    const poseScaleX =
      pose === 'run'
        ? 1 + Math.abs(stride) * 0.018
        : pose === 'speedFlipJump'
          ? 1 + Math.sin(nowMs / 42) * 0.012
          : pose === 'groundSlash' || pose === 'airSlash' || pose === 'shadowThread'
            ? 1 + Math.abs(secondary) * 0.016
            : 1;
    const poseScaleY =
      pose === 'run'
        ? 1 - Math.abs(stride) * 0.012
        : pose === 'speedFlipJump'
          ? 1 - Math.sin(nowMs / 42) * 0.01
          : pose === 'groundSlash' || pose === 'airSlash' || pose === 'shadowThread'
            ? 1 - Math.abs(secondary) * 0.01
            : 1;
    const flipProgress = Math.max(0, (nowMs - this.jumpStartedMs) / Stage1Tuning.speedFlipRotationMs);
    const followThroughAngle =
      pose === 'run'
        ? stride * 1.2
        : pose === 'groundSlash' || pose === 'airSlash' || pose === 'shadowThread'
          ? secondary * 1.8
          : 0;
    const dynamicAngle = pose === 'speedFlipJump' ? transform.angle + 360 * flipProgress : transform.angle + followThroughAngle;
    const visualScale = pose === 'speedFlipJump' ? baseScale * 0.92 : baseScale;
    const scaleX = visualScale * poseScaleX;
    const scaleY = visualScale * poseScaleY;
    const visualOffsetY = PlayerVisualGroundOffsetY + transform.offsetY + motionBob;

    this.sprite.setPosition(this.x, this.y + visualOffsetY);
    this.sprite.setOrigin(0.5, pose === 'speedFlipJump' ? 0.52 : 0.76);
    this.sprite.setFlipX(this.facing < 0);
    this.sprite.setScale(scaleX, scaleY);
    this.sprite.setAngle(dynamicAngle * this.facing);
    this.sprite.play(`player-${animationPose}`, true);

    if (pose === 'hurt') {
      this.sprite.setTint(Palette.dangerCoral);
    } else {
      this.sprite.clearTint();
    }
    this.sprite.setAlpha(nowMs < this.invulnerableUntilMs && Math.floor(nowMs / 90) % 2 === 0 ? 0.64 : 1);
    this.maybeSpawnAfterimage(nowMs, pose, visualOffsetY, dynamicAngle, scaleX, scaleY);

    if (!slash || slash.phase === 'idle') {
      this.hideSlashEffects();
      return;
    }

    if (slash.mode === 'spin') {
      const spinElapsedMs = Math.max(0, nowMs - this.jumpStartedMs);
      this.slashSprite.setVisible(false);
      this.spinSlashSprite
        .setVisible(true)
        .setPosition(this.x, this.y + PlayerVisualGroundOffsetY - 32)
        .setScale(1.54, 1.48)
        .setAngle(spinElapsedMs * 1.05 * this.facing)
        .setAlpha(slash.phase === 'active' ? 0.96 : 0.54);
      this.spinSlashSprite.play('slash-spin', true);
      return;
    }

    this.hideSpinSlashEffects();
    const slashAnimation = this.slashStartedOnGround ? 'slash-ground' : 'slash-air';
    const slashOffsetY = this.slashStartedOnGround ? -16 : -30;
    this.slashSprite
      .setVisible(true)
      .setPosition(this.x + this.facing * 78, this.y + PlayerVisualGroundOffsetY + slashOffsetY)
      .setFlipX(this.facing < 0)
      .setScale(this.slashStartedOnGround ? 0.93 : 0.87, this.slashStartedOnGround ? 0.68 : 0.64)
      .setAngle(0)
      .setAlpha(slash.phase === 'active' ? 0.95 : 0.48)
      .setTint(slash.phase === 'active' ? Palette.neonMagenta : Palette.neonCyan);
    this.slashSprite.play(slashAnimation, true);
  }

  private resolveVisualPose(nowMs: number): PlayerVisualPose {
    if (nowMs < this.invulnerableUntilMs && nowMs - this.lastDamageMs < 260) return 'hurt';
    if (this.shadowThread !== null) return 'shadowThread';
    if (this.slashElapsedMs >= 0) {
      if (this.slashMode === 'spin' && !this.onGround) return 'speedFlipJump';
      return this.onGround ? 'groundSlash' : 'airSlash';
    }
    if (nowMs - this.lastWallKickMs < 180) return 'wallKick';
    if (this.wallSliding) return 'wallSlide';
    if (!this.onGround) {
      if (this.isSpeedFlipActive(nowMs)) {
        return 'speedFlipJump';
      }
      if (this.vy < -55) return this.jumpVisualVariant === 'small' ? 'smallJump' : 'bigJumpRise';
      if (Math.abs(this.vy) <= 90) return 'apex';
      return 'fall';
    }
    if (Math.abs(this.vx) > 18) return 'run';
    return 'idle';
  }

  private isSpeedFlipActive(nowMs: number): boolean {
    return (
      this.jumpVisualVariant === 'speedFlip' &&
      nowMs - this.jumpStartedMs < Stage1Tuning.speedFlipVisualMs &&
      this.vy < Stage1Tuning.maxFallSpeed * 0.75
    );
  }

  private hideSlashEffects(): void {
    this.slashSprite.setVisible(false);
    this.hideSpinSlashEffects();
  }

  private hideSpinSlashEffects(): void {
    this.spinSlashSprite.setVisible(false);
  }

  private maybeSpawnAfterimage(
    nowMs: number,
    pose: PlayerVisualPose,
    visualOffsetY: number,
    angle: number,
    scaleX: number,
    scaleY: number
  ): void {
    if (!PlayerAfterimagePoses.has(pose)) return;
    if (pose === 'run' && Math.abs(this.vx) < Stage1Tuning.runSpeed * 0.45) return;
    if (nowMs - this.lastAfterimageMs < PlayerAfterimageIntervalMs) return;

    this.lastAfterimageMs = nowMs;
    const afterimage = this.afterimageSprites.shift();
    if (!afterimage) return;
    this.afterimageSprites.push(afterimage);

    const speedLag = pose === 'run' || pose === 'speedFlipJump' || pose === 'shadowThread' ? clamp(Math.abs(this.vx) * 0.055, 8, 18) : 10;
    const frameName = this.sprite.frame.name;
    const tint = pose === 'groundSlash' || pose === 'airSlash' || pose === 'shadowThread' ? Palette.neonMagenta : Palette.neonCyan;
    const alpha = pose === 'run' ? 0.18 : 0.27;

    this.scene.tweens.killTweensOf(afterimage);
    afterimage
      .setTexture(RuntimePlayerVisualConfig.textureKey)
      .setFrame(frameName)
      .setOrigin(this.sprite.originX, this.sprite.originY)
      .setPosition(this.x - this.facing * speedLag, this.y + visualOffsetY)
      .setFlipX(this.facing < 0)
      .setScale(scaleX, scaleY)
      .setAngle(angle * this.facing)
      .setTint(tint)
      .setAlpha(alpha)
      .setVisible(true);

    this.scene.tweens.add({
      targets: afterimage,
      alpha: 0,
      x: afterimage.x - this.facing * 4,
      duration: pose === 'run' ? 150 : 190,
      ease: 'Quad.easeOut',
      onComplete: () => afterimage.setVisible(false)
    });
  }
}

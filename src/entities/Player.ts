import * as Phaser from 'phaser';
import { AudioKey, TextureKey } from '../config/keys';
import { PlayerBalance } from '../data/balance';
import type { AbilityId } from '../types/game';
import type { InputState } from '../types/input';
import type { GameSettings } from '../types/save';
import { applyDamageAssist } from '../systems/AssistSystem';
import type { AudioSystem } from '../systems/AudioSystem';

export interface CombatIntent {
  readonly slash: boolean;
  readonly chargedSlash: boolean;
  readonly projectile: boolean;
  readonly ultimate: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number = PlayerBalance.maxHp;
  energy: number = PlayerBalance.maxEnergy;
  facing: -1 | 1 = 1;
  private lastGroundedAt = 0;
  private jumpQueuedAt = -Infinity;
  private dashUntil = 0;
  private dashReadyAt = 0;
  private invulnerableUntil = 0;
  private attackReadyAt = 0;
  private chargeStartedAt: number | null = null;
  private ultimateReadyAt = 0;
  private dead = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly audio: AudioSystem
  ) {
    super(scene, x, y, TextureKey.PlayerIdle);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(20);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 42);
    body.setOffset(12, 6);
    body.setMaxVelocity(520, 760);
  }

  updatePlayer(
    input: InputState,
    time: number,
    deltaMs: number,
    abilities: ReadonlySet<AbilityId>,
    settings: GameSettings
  ): CombatIntent {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.dead) {
      body.setVelocityX(0);
      return { slash: false, chargedSlash: false, projectile: false, ultimate: false };
    }
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) {
      this.lastGroundedAt = time;
    }
    if (input.jump.pressed) {
      this.jumpQueuedAt = time;
    }
    const inDash = time < this.dashUntil;
    if (input.horizontal !== 0) {
      this.facing = input.horizontal > 0 ? 1 : -1;
      this.setFlipX(this.facing < 0);
    }
    if (input.dash.pressed && abilities.has('dash') && time >= this.dashReadyAt) {
      this.dashUntil = time + PlayerBalance.dashMs;
      this.dashReadyAt = time + PlayerBalance.dashCooldownMs;
      this.audio.play(AudioKey.Dash);
    }
    if (time < this.dashUntil) {
      body.setAllowGravity(false);
      body.setVelocity(this.facing * PlayerBalance.dashSpeed, 0);
      this.setTexture(TextureKey.PlayerDash);
    } else {
      body.setAllowGravity(true);
      body.setAccelerationX(input.horizontal * PlayerBalance.acceleration);
      body.setDragX(input.horizontal === 0 ? PlayerBalance.drag : 0);
      const canUseJump = time - this.jumpQueuedAt <= PlayerBalance.jumpBufferMs;
      const canCoyote = time - this.lastGroundedAt <= PlayerBalance.coyoteMs;
      const touchingWall = body.blocked.left || body.blocked.right || body.touching.left || body.touching.right;
      const wallSliding =
        abilities.has('wallKick') && !onGround && touchingWall && body.velocity.y > 0 && input.horizontal !== 0;
      if (wallSliding) {
        body.setVelocityY(Math.min(body.velocity.y, PlayerBalance.wallSlideSpeed));
      }
      if (canUseJump && (canCoyote || wallSliding)) {
        if (wallSliding) {
          const away = body.blocked.left || body.touching.left ? 1 : -1;
          this.facing = away as -1 | 1;
          body.setVelocity(PlayerBalance.wallJumpX * away, -PlayerBalance.wallJumpY);
          this.audio.play(AudioKey.WallJump);
        } else {
          body.setVelocityY(-PlayerBalance.jumpSpeed);
          this.audio.play(AudioKey.Jump);
        }
        this.jumpQueuedAt = -Infinity;
        this.lastGroundedAt = -Infinity;
      }
      if (input.jump.released && body.velocity.y < 0) {
        body.setVelocityY(body.velocity.y * PlayerBalance.jumpCutMultiplier);
      }
      this.applyTexture(onGround, wallSliding, body.velocity.y);
    }
    this.energy = Math.min(PlayerBalance.maxEnergy, this.energy + (deltaMs / 1000) * 7);
    return this.readCombatIntent(input, time, abilities);
  }

  takeDamage(rawDamage: number, sourceX: number, time: number, settings: GameSettings): boolean {
    if (this.dead || time < this.invulnerableUntil) {
      return false;
    }
    const damage = applyDamageAssist(rawDamage, settings);
    this.hp -= damage;
    this.invulnerableUntil =
      time + (settings.assist.longerInvulnerability ? PlayerBalance.longerInvulnerableMs : PlayerBalance.hurtInvulnerableMs);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(sourceX < this.x ? PlayerBalance.knockbackX : -PlayerBalance.knockbackX);
    body.setVelocityY(-PlayerBalance.knockbackY);
    this.setTexture(TextureKey.PlayerHurt);
    this.setTint(0xff5c7a);
    this.scene.time.delayedCall(140, () => this.clearTint());
    this.audio.play(AudioKey.PlayerHurt);
    if (this.hp <= 0) {
      this.dead = true;
      this.hp = 0;
      body.setVelocity(0, -220);
    }
    return true;
  }

  heal(amount: number): void {
    this.hp = Math.min(PlayerBalance.maxHp, this.hp + amount);
  }

  restoreEnergy(amount: number): void {
    this.energy = Math.min(PlayerBalance.maxEnergy, this.energy + amount);
  }

  revive(x: number, y: number, healToFull: boolean): void {
    this.dead = false;
    this.hp = healToFull ? PlayerBalance.maxHp : Math.max(1, this.hp);
    this.energy = Math.max(this.energy, 35);
    this.enableBody(false, x, y, true, true);
    this.setTexture(TextureKey.PlayerIdle);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  isDead(): boolean {
    return this.dead;
  }

  isInvulnerable(time: number): boolean {
    return time < this.invulnerableUntil;
  }

  private readCombatIntent(
    input: InputState,
    time: number,
    abilities: ReadonlySet<AbilityId>
  ): CombatIntent {
    let slash = false;
    let chargedSlash = false;
    let projectile = false;
    let ultimate = false;
    if (input.attack.pressed) {
      this.chargeStartedAt = time;
      if (!abilities.has('chargedSlash') && time >= this.attackReadyAt) {
        slash = true;
        this.attackReadyAt = time + PlayerBalance.attackCooldownMs;
        this.audio.play(AudioKey.Slash);
      }
    }
    if (input.attack.released && this.chargeStartedAt !== null && time >= this.attackReadyAt) {
      const charged =
        abilities.has('chargedSlash') && time - this.chargeStartedAt >= PlayerBalance.chargedAttackMs;
      chargedSlash = charged;
      slash = !charged;
      this.attackReadyAt = time + (charged ? 420 : PlayerBalance.attackCooldownMs);
      this.audio.play(charged ? AudioKey.ChargedSlash : AudioKey.Slash);
      this.chargeStartedAt = null;
    }
    if (input.art.pressed) {
      if (abilities.has('ultimateArt') && this.energy >= PlayerBalance.ultimateCost && time >= this.ultimateReadyAt) {
        this.energy -= PlayerBalance.ultimateCost;
        this.ultimateReadyAt = time + PlayerBalance.ultimateCooldownMs;
        ultimate = true;
      } else if (abilities.has('projectile') && this.energy >= PlayerBalance.projectileCost) {
        this.energy -= PlayerBalance.projectileCost;
        projectile = true;
        this.audio.play(AudioKey.Projectile);
      }
    }
    return { slash, chargedSlash, projectile, ultimate };
  }

  private applyTexture(onGround: boolean, wallSliding: boolean, velocityY: number): void {
    if (wallSliding) {
      this.setTexture(TextureKey.PlayerWall);
    } else if (!onGround && velocityY < 0) {
      this.setTexture(TextureKey.PlayerJump);
    } else if (!onGround) {
      this.setTexture(TextureKey.PlayerFall);
    } else {
      const body = this.body as Phaser.Physics.Arcade.Body;
      this.setTexture(Math.abs(body.velocity.x) > 30 ? TextureKey.PlayerRun : TextureKey.PlayerIdle);
    }
  }
}

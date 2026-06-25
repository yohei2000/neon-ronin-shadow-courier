import * as Phaser from 'phaser';
import { AudioKey, TextureKey } from '../config/keys';
import { PlayerBalance } from '../data/balance';
import type { InputState } from '../types/input';
import type { GameSettings } from '../types/save';
import { applyDamageAssist } from '../systems/AssistSystem';
import type { AudioSystem } from '../systems/AudioSystem';
import { canAcceptDamage, nextInvulnerabilityUntil } from '../utils/combat';

export interface PlayerSnapshot {
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly facing: -1 | 1;
  readonly attackActive: boolean;
  readonly grounded: boolean;
  readonly wallSliding: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number = PlayerBalance.maxHp;
  facing: -1 | 1 = 1;
  private lastGroundedAt = 0;
  private jumpQueuedAt = -Infinity;
  private invulnerableUntil = 0;
  private attackStartedAt = -Infinity;
  private attackReadyAt = 0;
  private dead = false;
  private runFrameTimer = 0;
  private runFrame = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly audio: AudioSystem
  ) {
    super(scene, x, y, TextureKey.PlayerIdle);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(30);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(25, 42);
    body.setOffset(19, 11);
    body.setMaxVelocity(430, 760);
  }

  updatePlayer(input: InputState, time: number, deltaMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.dead) {
      body.setAccelerationX(0);
      return;
    }
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) {
      this.lastGroundedAt = time;
    }
    if (input.jump.pressed) {
      this.jumpQueuedAt = time;
    }
    if (input.horizontal !== 0) {
      this.facing = input.horizontal > 0 ? 1 : -1;
      this.setFlipX(this.facing < 0);
    }
    body.setAccelerationX(input.horizontal * PlayerBalance.acceleration);
    body.setDragX(input.horizontal === 0 ? PlayerBalance.drag : 0);
    const touchingWall = !onGround && (body.blocked.left || body.blocked.right || body.touching.left || body.touching.right);
    const wallSliding = touchingWall && body.velocity.y > 0 && input.horizontal !== 0;
    if (wallSliding) {
      body.setVelocityY(Math.min(body.velocity.y, PlayerBalance.wallSlideSpeed));
    }
    const buffered = time - this.jumpQueuedAt <= PlayerBalance.jumpBufferMs;
    const coyote = time - this.lastGroundedAt <= PlayerBalance.coyoteMs;
    if (buffered && (coyote || wallSliding)) {
      if (wallSliding) {
        const away = body.blocked.left || body.touching.left ? 1 : -1;
        this.facing = away as -1 | 1;
        this.setFlipX(this.facing < 0);
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
    if (input.attack.pressed && time >= this.attackReadyAt) {
      this.attackStartedAt = time;
      this.attackReadyAt =
        time + PlayerBalance.attackStartupMs + PlayerBalance.attackActiveMs + PlayerBalance.attackRecoveryMs;
      this.audio.play(AudioKey.Slash);
    }
    this.applyTexture(onGround, wallSliding, body.velocity.y, deltaMs, time);
  }

  isAttackActive(time: number): boolean {
    return (
      time >= this.attackStartedAt + PlayerBalance.attackStartupMs &&
      time <= this.attackStartedAt + PlayerBalance.attackStartupMs + PlayerBalance.attackActiveMs
    );
  }

  attackRect(time: number): Phaser.Geom.Rectangle | null {
    if (!this.isAttackActive(time)) {
      return null;
    }
    return new Phaser.Geom.Rectangle(this.x + this.facing * 18 - 38, this.y - 32, 76, 48);
  }

  takeDamage(rawDamage: number, sourceX: number, time: number, settings: GameSettings): boolean {
    if (!canAcceptDamage({ dead: this.dead, time, invulnerableUntil: this.invulnerableUntil })) {
      return false;
    }
    const damage = applyDamageAssist(rawDamage, settings);
    this.hp = Math.max(0, this.hp - damage);
    this.invulnerableUntil = nextInvulnerabilityUntil(time, PlayerBalance.hurtInvulnerableMs);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(sourceX < this.x ? PlayerBalance.knockbackX : -PlayerBalance.knockbackX);
    body.setVelocityY(-PlayerBalance.knockbackY);
    this.setTint(0xff5c7a);
    this.audio.play(AudioKey.PlayerHurt);
    this.scene.time.delayedCall(160, () => this.clearTint());
    if (this.hp <= 0) {
      this.dead = true;
    }
    return true;
  }

  heal(amount: number): void {
    this.hp = Math.min(PlayerBalance.maxHp, this.hp + amount);
  }

  revive(x: number, y: number): void {
    this.dead = false;
    this.hp = Math.max(2, this.hp || 2);
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.clearTint();
  }

  isDead(): boolean {
    return this.dead;
  }

  snapshot(time: number): PlayerSnapshot {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return {
      x: this.x,
      y: this.y,
      hp: this.hp,
      facing: this.facing,
      attackActive: this.isAttackActive(time),
      grounded: body.blocked.down || body.touching.down,
      wallSliding: this.texture.key === TextureKey.PlayerWall
    };
  }

  private applyTexture(onGround: boolean, wallSliding: boolean, velocityY: number, deltaMs: number, time: number): void {
    if (this.isAttackActive(time)) {
      const activeElapsed = time - (this.attackStartedAt + PlayerBalance.attackStartupMs);
      const frame = activeElapsed < 40 ? TextureKey.PlayerSlash1 : activeElapsed < 82 ? TextureKey.PlayerSlash2 : TextureKey.PlayerSlash3;
      this.setTexture(frame);
      return;
    }
    if (wallSliding) {
      this.setTexture(TextureKey.PlayerWall);
    } else if (!onGround && velocityY < 0) {
      this.setTexture(TextureKey.PlayerJump);
    } else if (!onGround) {
      this.setTexture(TextureKey.PlayerFall);
    } else {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (Math.abs(body.velocity.x) > 30) {
        this.runFrameTimer += deltaMs;
        if (this.runFrameTimer > 90) {
          this.runFrameTimer = 0;
          this.runFrame = (this.runFrame + 1) % 4;
        }
        this.setTexture([TextureKey.PlayerRun1, TextureKey.PlayerRun2, TextureKey.PlayerRun3, TextureKey.PlayerRun4][this.runFrame]);
      } else {
        this.setTexture(TextureKey.PlayerIdle);
      }
    }
  }
}

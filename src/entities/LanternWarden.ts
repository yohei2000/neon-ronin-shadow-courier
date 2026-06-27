import * as Phaser from 'phaser';
import { Palette, PaletteHex } from '../config/palette';
import { ArtAssetKey } from '../data/artAssets';
import type { RectData, Stage1WardenDefinition } from '../data/stage1';
import { centerRect } from '../systems/geometry';
import type { StageEnemy } from './types';

type WardenState = 'idle' | 'telegraph' | 'active' | 'recovery' | 'defeated';

export class LanternWarden implements StageEnemy {
  readonly id: string;
  readonly kind = 'lantern-warden' as const;
  readonly damage = 1;
  dead = false;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly telegraph: Phaser.GameObjects.Image;
  private hp: number;
  private state: WardenState = 'idle';
  private stateMs = 0;
  private attackIndex = 0;
  private facing: -1 | 1 = -1;

  constructor(private readonly scene: Phaser.Scene, private readonly definition: Stage1WardenDefinition) {
    this.id = definition.id;
    this.hp = definition.hp;
    this.sprite = scene.add.sprite(definition.x, definition.y, ArtAssetKey.LanternWarden, 0).setScale(0.72).setDepth(26);
    this.telegraph = scene.add.image(definition.x, definition.y + 86, ArtAssetKey.Telegraph).setScale(0.22).setDepth(22).setVisible(false);
    this.sprite.play('warden-idle');
  }

  update(deltaMs: number, playerX: number): void {
    if (this.dead) return;
    this.stateMs += deltaMs;
    this.facing = playerX < this.sprite.x ? -1 : 1;
    this.sprite.setFlipX(this.facing > 0);

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

    const targetX = this.definition.x + Math.sin(this.scene.time.now / 900) * 38;
    this.sprite.x += (targetX - this.sprite.x) * 0.03;
    this.telegraph
      .setPosition(this.sprite.x + this.facing * 76, this.sprite.y + 84)
      .setVisible(this.state === 'telegraph' || this.state === 'active')
      .setAlpha(this.state === 'active' ? 0.65 : 0.38)
      .setTint(this.state === 'active' ? Palette.enemyVermilion : Palette.enemyAmber);
  }

  getBody(): RectData {
    return centerRect(this.sprite.x, this.sprite.y + 34, 74, 138);
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
      return true;
    }
    return false;
  }

  getHp(): { current: number; max: number; state: WardenState; attack: string } {
    return {
      current: this.hp,
      max: this.definition.hp,
      state: this.state,
      attack: this.definition.attackStates[this.attackIndex]
    };
  }

  setVisible(value: boolean): void {
    this.sprite.setVisible(value);
    this.telegraph.setVisible(false);
  }

  destroy(): void {
    this.sprite.destroy();
    this.telegraph.destroy();
  }

  private enterState(state: WardenState): void {
    this.state = state;
    this.stateMs = 0;
    if (state === 'idle') this.sprite.play('warden-idle', true);
    if (state === 'telegraph') this.sprite.play('warden-telegraph', true);
    if (state === 'active') this.sprite.play('warden-attack', true);
    if (state === 'recovery') this.sprite.play('warden-recovery', true);
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

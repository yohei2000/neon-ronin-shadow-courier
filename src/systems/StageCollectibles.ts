import * as Phaser from 'phaser';
import { AudioKey, TextureKey } from '../config/keys';
import { Palette } from '../config/palette';
import type { Player } from '../entities/Player';
import type { Stage1Definition } from '../types/stage';
import type { PickupType } from '../types/game';
import type { AudioSystem } from './AudioSystem';
import type { FXSystem } from './FXSystem';

export class StageCollectibles {
  private seals = 0;
  private readonly collectedPickups = new Set<string>();
  private readonly collectedScrolls = new Set<string>();
  private readonly scrollSprites = new Map<string, Phaser.Physics.Arcade.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: Stage1Definition,
    private readonly player: Player,
    private readonly audio: AudioSystem,
    private readonly fx: FXSystem
  ) {}

  get sealCount(): number {
    return this.seals;
  }

  get scrollCount(): number {
    return this.collectedScrolls.size;
  }

  get scrollIds(): string[] {
    return [...this.collectedScrolls];
  }

  create(): void {
    for (const pickup of this.stage.pickups) {
      const texture =
        pickup.type === 'seal' ? TextureKey.Seal : pickup.type === 'health' ? TextureKey.Health : TextureKey.Energy;
      const sprite = this.scene.physics.add.image(pickup.x, pickup.y, texture);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      sprite.setDepth(18);
      this.scene.tweens.add({ targets: sprite, y: pickup.y - 8, duration: 850, yoyo: true, repeat: -1 });
      this.scene.physics.add.overlap(this.player, sprite, () => this.collectPickup(pickup.id, pickup.type, sprite));
    }

    for (const scroll of this.stage.scrolls) {
      const sprite = this.scene.physics.add.image(scroll.x, scroll.y, TextureKey.Scroll);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      sprite.setDepth(19);
      if (scroll.route === 'combat') {
        sprite.disableBody(true, true);
      }
      this.scrollSprites.set(scroll.id, sprite);
      this.scene.tweens.add({ targets: sprite, angle: 8, duration: 700, yoyo: true, repeat: -1 });
      this.scene.physics.add.overlap(this.player, sprite, () => this.collectScroll(scroll.id, sprite));
    }
  }

  enableWardenReward(): void {
    const reward = this.scrollSprites.get('scroll-warden-reward');
    const rewardDefinition = this.stage.scrolls.find((scroll) => scroll.id === 'scroll-warden-reward');
    reward?.enableBody(false, rewardDefinition?.x ?? 6760, rewardDefinition?.y ?? 410, true, true);
  }

  private collectPickup(id: string, type: PickupType, sprite: Phaser.Physics.Arcade.Image): void {
    if (this.collectedPickups.has(id)) return;
    this.collectedPickups.add(id);
    sprite.disableBody(true, true);
    if (type === 'seal') {
      this.seals += 1;
      this.audio.play(AudioKey.PickupSeal);
      this.fx.burst(sprite.x, sprite.y, Palette.cyan, 8);
      return;
    }
    this.player.heal(1);
    this.audio.play(AudioKey.Confirm);
    this.fx.burst(sprite.x, sprite.y, type === 'health' ? Palette.red : Palette.magenta, 10);
  }

  private collectScroll(id: string, sprite: Phaser.Physics.Arcade.Image): void {
    if (this.collectedScrolls.has(id)) return;
    this.collectedScrolls.add(id);
    sprite.disableBody(true, true);
    this.audio.play(AudioKey.PickupScroll);
    this.fx.burst(sprite.x, sprite.y, Palette.gold, 18);
  }
}

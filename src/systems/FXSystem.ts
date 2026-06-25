import * as Phaser from 'phaser';
import { Palette } from '../config/palette';
import type { GameSettings } from '../types/save';

export class FXSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getSettings: () => GameSettings
  ) {}

  burst(x: number, y: number, color: number = Palette.cyan, count = 12): void {
    const settings = this.getSettings();
    const actualCount = settings.reducedParticles ? Math.ceil(count / 3) : count;
    for (let index = 0; index < actualCount; index += 1) {
      const dot = this.scene.add.circle(x, y, 2 + Math.random() * 2, color, 0.9);
      dot.setDepth(80);
      const angle = (Math.PI * 2 * index) / actualCount;
      const distance = 18 + Math.random() * 28;
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 260,
        onComplete: () => dot.destroy()
      });
    }
  }

  slash(x: number, y: number, facing: number, wide: boolean): void {
    const arc = this.scene.add.arc(
      x,
      y,
      wide ? 50 : 34,
      facing > 0 ? 310 : 130,
      facing > 0 ? 40 : 220,
      false,
      wide ? Palette.gold : Palette.magenta,
      0.45
    );
    arc.setStrokeStyle(wide ? 7 : 4, wide ? Palette.gold : Palette.cyan, 0.9);
    arc.setDepth(50);
    this.scene.tweens.add({
      targets: arc,
      alpha: 0,
      scale: 1.35,
      duration: wide ? 180 : 120,
      onComplete: () => arc.destroy()
    });
  }

  afterimage(sprite: Phaser.GameObjects.Sprite): void {
    if (this.getSettings().reducedParticles) {
      return;
    }
    const ghost = this.scene.add.image(sprite.x, sprite.y, sprite.texture.key);
    ghost.setFlipX(sprite.flipX);
    ghost.setAlpha(0.35);
    ghost.setTint(Palette.cyan);
    ghost.setDepth(sprite.depth - 1);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      x: sprite.x - (sprite.flipX ? -16 : 16),
      duration: 180,
      onComplete: () => ghost.destroy()
    });
  }

  shake(intensity = 0.004, duration = 110): void {
    if (this.getSettings().reducedShake) {
      return;
    }
    const camera = this.scene.cameras.main;
    camera.shake(duration, intensity);
  }
}

import * as Phaser from 'phaser';
import { BASE_HEIGHT } from '../config/dimensions';
import { TextureKey } from '../config/keys';
import { Palette } from '../config/palette';
import type { PlatformDefinition, Stage1Definition } from '../types/stage';

export class StageWorld {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: Stage1Definition,
    private readonly highContrast: boolean
  ) {}

  create(): Phaser.Physics.Arcade.StaticGroup {
    this.createBackground();
    const platforms = this.scene.physics.add.staticGroup();
    this.createPlatforms(platforms);
    this.createDecor();
    return platforms;
  }

  private createBackground(): void {
    this.scene.add.rectangle(this.stage.width / 2, BASE_HEIGHT / 2, this.stage.width, BASE_HEIGHT, Palette.ink0).setDepth(-80);
    for (let i = 0; i < 9; i += 1) {
      const x = 180 + i * 920;
      const moon = this.scene.add.circle(x, 86 + (i % 3) * 28, 34, i % 2 ? Palette.moon : Palette.violet, 0.11);
      moon.setDepth(-72).setScrollFactor(0.16);
    }
    for (let i = 0; i < 28; i += 1) {
      const width = 70 + (i % 5) * 18;
      const height = 120 + (i % 6) * 34;
      const x = i * 320 + 80;
      this.scene.add.rectangle(x, 498 - height / 2, width, height, i % 2 ? Palette.ink1 : Palette.ink2, 0.72)
        .setDepth(-60)
        .setScrollFactor(0.38);
      if (i % 3 === 0) {
        this.scene.add.rectangle(x, 420 - height * 0.38, width * 0.6, 8, Palette.cyan, 0.32)
          .setDepth(-58)
          .setScrollFactor(0.38);
      }
    }
    for (let i = 0; i < 70; i += 1) {
      const rain = this.scene.add.rectangle(i * 126, 20 + (i % 9) * 54, 2, 24, Palette.cyan, 0.23);
      rain.setAngle(-16).setDepth(-40).setScrollFactor(0.72);
      this.scene.tweens.add({
        targets: rain,
        y: rain.y + 70,
        alpha: 0.08,
        duration: 900 + (i % 6) * 130,
        yoyo: true,
        repeat: -1
      });
    }
  }

  private createPlatforms(platforms: Phaser.Physics.Arcade.StaticGroup): void {
    for (const platform of this.stage.platforms) {
      const visual = this.scene.add
        .tileSprite(
          platform.x + platform.width / 2,
          platform.y + platform.height / 2,
          platform.width,
          platform.height,
          this.platformTexture(platform)
        )
        .setDepth(platform.kind === 'wall' ? 5 : 4);
      if (this.highContrast) {
        visual.setTint(platform.kind === 'wall' ? Palette.magenta : Palette.white);
        const outline = this.scene.add.graphics().setDepth(visual.depth + 0.1);
        outline.lineStyle(2, platform.kind === 'wall' ? Palette.magenta : Palette.cyan, 0.95);
        outline.strokeRect(platform.x, platform.y, platform.width, platform.height);
      }
      platforms.add(visual);
      const body = visual.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(platform.width, platform.height);
      body.updateFromGameObject();
    }
  }

  private createDecor(): void {
    const decor = [
      { key: TextureKey.TileLantern, x: 520, y: 282 },
      { key: TextureKey.TileSign, x: 980, y: 250 },
      { key: TextureKey.TilePaint, x: 1716, y: 218 },
      { key: TextureKey.TilePipe, x: 2076, y: 174 },
      { key: TextureKey.TileWindow, x: 3050, y: 238 },
      { key: TextureKey.TileShrine, x: 3560, y: 432 },
      { key: TextureKey.TileSign, x: 5140, y: 300 },
      { key: TextureKey.TileLantern, x: 6100, y: 318 },
      { key: TextureKey.TileMoonGate, x: 7350, y: 420 }
    ] as const;
    for (const item of decor) {
      this.scene.add.image(item.x, item.y, item.key).setDepth(2);
    }
  }

  private platformTexture(platform: PlatformDefinition): TextureKey {
    if (platform.kind === 'wall') return TextureKey.TileWall;
    if (platform.kind === 'roof') return TextureKey.TileRoof;
    if (platform.kind === 'edge') return TextureKey.TileEdge;
    return TextureKey.TileFloor;
  }
}

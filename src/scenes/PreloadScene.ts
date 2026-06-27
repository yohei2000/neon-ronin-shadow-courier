import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { ArtAssetKey, ArtImageAssets, PlayerAnimationFrames } from '../data/artAssets';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.add.text(40, 252, 'Loading Art Lock assets...', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '28px',
      color: PaletteHex.warmPaper
    });

    this.load.spritesheet(ArtAssetKey.Player, ArtImageAssets[ArtAssetKey.Player], {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet(ArtAssetKey.Enemy, ArtImageAssets[ArtAssetKey.Enemy], {
      frameWidth: 128,
      frameHeight: 160
    });
    this.load.spritesheet(ArtAssetKey.LanternWarden, ArtImageAssets[ArtAssetKey.LanternWarden], {
      frameWidth: 128,
      frameHeight: 256
    });
    this.load.spritesheet(ArtAssetKey.Slash, ArtImageAssets[ArtAssetKey.Slash], {
      frameWidth: 128,
      frameHeight: 160
    });

    const spritesheetKeys = new Set<string>([
      ArtAssetKey.Player,
      ArtAssetKey.Enemy,
      ArtAssetKey.LanternWarden,
      ArtAssetKey.Slash
    ]);

    for (const [key, url] of Object.entries(ArtImageAssets)) {
      if (spritesheetKeys.has(key)) {
        continue;
      }
      this.load.image(key, url);
    }
  }

  create(): void {
    this.createAnimations();
    const params = new URLSearchParams(window.location.search);
    this.scene.start(params.get('scene') === 'artlab' ? SceneKey.ArtLab : SceneKey.Title);
  }

  private createAnimations(): void {
    for (const [name, config] of Object.entries(PlayerAnimationFrames)) {
      const key = `player-${name}`;
      if (this.anims.exists(key)) continue;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(ArtAssetKey.Player, {
          start: config.start,
          end: config.start + config.frames - 1
        }),
        frameRate: config.frameRate,
        repeat: config.repeat
      });
    }

    this.createAnimation('ink-crawler-patrol', ArtAssetKey.Enemy, 0, 3, 8, -1);
    this.createAnimation('warden-idle', ArtAssetKey.LanternWarden, 0, 1, 5, -1);
    this.createAnimation('warden-telegraph', ArtAssetKey.LanternWarden, 2, 3, 7, -1);
    this.createAnimation('warden-attack', ArtAssetKey.LanternWarden, 4, 5, 10, -1);
    this.createAnimation('warden-recovery', ArtAssetKey.LanternWarden, 6, 6, 6, -1);
    this.createAnimation('warden-defeat', ArtAssetKey.LanternWarden, 7, 7, 6, 0);
    this.createAnimation('slash-arc', ArtAssetKey.Slash, 0, 7, 18, 0);
  }

  private createAnimation(key: string, assetKey: ArtAssetKey, start: number, end: number, frameRate: number, repeat: number): void {
    if (this.anims.exists(key)) return;
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(assetKey, { start, end }),
      frameRate,
      repeat
    });
  }
}

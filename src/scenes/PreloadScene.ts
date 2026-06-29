import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import {
  ArtAssetKey,
  ArtImageAssets,
  InkCrawlerAnimationFrames,
  KiteWraithAnimationFrames,
  LanternWardenAnimationFrames,
  PlayerAnimationFrames,
  RuntimeEnvironmentAssetKey,
  RuntimeEnvironmentImageAssets,
  RuntimeSpriteAssetKey,
  RuntimeSpriteImageAssets,
  SlashAnimationFrames
} from '../data/artAssets';

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
      frameWidth: 256,
      frameHeight: 256
    });
    this.load.spritesheet(ArtAssetKey.Slash, ArtImageAssets[ArtAssetKey.Slash], {
      frameWidth: 128,
      frameHeight: 160
    });
    this.load.spritesheet(RuntimeSpriteAssetKey.Player, RuntimeSpriteImageAssets[RuntimeSpriteAssetKey.Player], {
      frameWidth: 256,
      frameHeight: 192
    });
    this.load.spritesheet(RuntimeSpriteAssetKey.InkCrawler, RuntimeSpriteImageAssets[RuntimeSpriteAssetKey.InkCrawler], {
      frameWidth: 192,
      frameHeight: 144
    });
    this.load.spritesheet(RuntimeSpriteAssetKey.KiteWraith, RuntimeSpriteImageAssets[RuntimeSpriteAssetKey.KiteWraith], {
      frameWidth: 192,
      frameHeight: 192
    });
    this.load.spritesheet(RuntimeSpriteAssetKey.Slash, RuntimeSpriteImageAssets[RuntimeSpriteAssetKey.Slash], {
      frameWidth: 192,
      frameHeight: 160
    });
    this.load.spritesheet(RuntimeSpriteAssetKey.Telegraph, RuntimeSpriteImageAssets[RuntimeSpriteAssetKey.Telegraph], {
      frameWidth: 160,
      frameHeight: 120
    });
    this.load.spritesheet(RuntimeSpriteAssetKey.LanternWarden, RuntimeSpriteImageAssets[RuntimeSpriteAssetKey.LanternWarden], {
      frameWidth: 256,
      frameHeight: 256
    });
    this.load.spritesheet(RuntimeEnvironmentAssetKey.ItemIcons, RuntimeEnvironmentImageAssets[RuntimeEnvironmentAssetKey.ItemIcons], {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet(RuntimeEnvironmentAssetKey.TouchControls, RuntimeEnvironmentImageAssets[RuntimeEnvironmentAssetKey.TouchControls], {
      frameWidth: 192,
      frameHeight: 160
    });

    for (const [key, url] of Object.entries(RuntimeEnvironmentImageAssets)) {
      if (key === RuntimeEnvironmentAssetKey.ItemIcons || key === RuntimeEnvironmentAssetKey.TouchControls) continue;
      this.load.image(key, url);
    }

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
        frames: config.frames.map((frame) => ({ key: RuntimeSpriteAssetKey.Player, frame })),
        frameRate: config.frameRate,
        repeat: config.repeat
      });
    }

    this.createFrameListAnimation('ink-crawler-patrol', RuntimeSpriteAssetKey.InkCrawler, InkCrawlerAnimationFrames.patrol.frames, InkCrawlerAnimationFrames.patrol.frameRate, InkCrawlerAnimationFrames.patrol.repeat);
    this.createFrameListAnimation('ink-crawler-hit', RuntimeSpriteAssetKey.InkCrawler, InkCrawlerAnimationFrames.hit.frames, InkCrawlerAnimationFrames.hit.frameRate, InkCrawlerAnimationFrames.hit.repeat);
    this.createFrameListAnimation('ink-crawler-defeat', RuntimeSpriteAssetKey.InkCrawler, InkCrawlerAnimationFrames.defeat.frames, InkCrawlerAnimationFrames.defeat.frameRate, InkCrawlerAnimationFrames.defeat.repeat);
    this.createFrameListAnimation('kite-wraith-drift', RuntimeSpriteAssetKey.KiteWraith, KiteWraithAnimationFrames.drift.frames, KiteWraithAnimationFrames.drift.frameRate, KiteWraithAnimationFrames.drift.repeat);
    this.createFrameListAnimation('kite-wraith-hit', RuntimeSpriteAssetKey.KiteWraith, KiteWraithAnimationFrames.hit.frames, KiteWraithAnimationFrames.hit.frameRate, KiteWraithAnimationFrames.hit.repeat);
    this.createFrameListAnimation('kite-wraith-defeat', RuntimeSpriteAssetKey.KiteWraith, KiteWraithAnimationFrames.defeat.frames, KiteWraithAnimationFrames.defeat.frameRate, KiteWraithAnimationFrames.defeat.repeat);
    this.createFrameListAnimation('warden-idle', RuntimeSpriteAssetKey.LanternWarden, LanternWardenAnimationFrames.idle.frames, LanternWardenAnimationFrames.idle.frameRate, LanternWardenAnimationFrames.idle.repeat);
    this.createFrameListAnimation('warden-telegraph', RuntimeSpriteAssetKey.LanternWarden, LanternWardenAnimationFrames.telegraph.frames, LanternWardenAnimationFrames.telegraph.frameRate, LanternWardenAnimationFrames.telegraph.repeat);
    this.createFrameListAnimation('warden-attack', RuntimeSpriteAssetKey.LanternWarden, LanternWardenAnimationFrames.attack.frames, LanternWardenAnimationFrames.attack.frameRate, LanternWardenAnimationFrames.attack.repeat);
    this.createFrameListAnimation('warden-recovery', RuntimeSpriteAssetKey.LanternWarden, LanternWardenAnimationFrames.recovery.frames, LanternWardenAnimationFrames.recovery.frameRate, LanternWardenAnimationFrames.recovery.repeat);
    this.createFrameListAnimation('warden-defeat', RuntimeSpriteAssetKey.LanternWarden, LanternWardenAnimationFrames.defeat.frames, LanternWardenAnimationFrames.defeat.frameRate, LanternWardenAnimationFrames.defeat.repeat);
    this.createFrameListAnimation('slash-ground', RuntimeSpriteAssetKey.Slash, SlashAnimationFrames.ground.frames, SlashAnimationFrames.ground.frameRate, SlashAnimationFrames.ground.repeat);
    this.createFrameListAnimation('slash-air', RuntimeSpriteAssetKey.Slash, SlashAnimationFrames.air.frames, SlashAnimationFrames.air.frameRate, SlashAnimationFrames.air.repeat);
    this.createFrameListAnimation('slash-spin', RuntimeSpriteAssetKey.Slash, SlashAnimationFrames.spin.frames, SlashAnimationFrames.spin.frameRate, SlashAnimationFrames.spin.repeat);
  }

  private createFrameListAnimation(key: string, assetKey: RuntimeSpriteAssetKey, frames: readonly number[], frameRate: number, repeat: number): void {
    if (this.anims.exists(key)) return;
    this.anims.create({
      key,
      frames: frames.map((frame) => ({ key: assetKey, frame })),
      frameRate,
      repeat
    });
  }
}

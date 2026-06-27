import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { ArtAssetKey } from '../data/artAssets';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Credits);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, ArtAssetKey.EnvironmentKey).setAlpha(0.62);
    this.add.image(BASE_WIDTH / 2, 296, ArtAssetKey.TitleMenuPanel).setScale(1.08).setAlpha(0.82);
    this.add.text(104, 92, 'ABOUT', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: PaletteHex.lanternGold
    });
    const lines = [
      'Neon Ronin: Shadow Courier',
      'Stage 1 - Neon Alley: First Delivery',
      'Gate B v2 art lock build',
      'Frozen runtime assets: src/assets/approved-art',
      'Stage1 implementation: title, controls, settings, gameplay, clear flow'
    ];
    lines.forEach((line, index) => {
      this.add.text(126, 176 + index * 40, line, {
        fontFamily: index === 0 ? 'Arial Black, Arial, sans-serif' : 'Consolas, monospace',
        fontSize: index === 0 ? '25px' : '18px',
        color: index === 0 ? PaletteHex.neonCyan : PaletteHex.warmPaper
      });
    });
    this.add.text(104, 490, 'Esc / click: title', {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    });
    this.input.keyboard?.removeAllListeners('keydown-ESC');
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SceneKey.Title));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.removeAllListeners('keydown-ESC'));
    this.input.on('pointerup', () => this.scene.start(SceneKey.Title));
    window.__NEON_RONIN_STAGE1_MENU__ = { scene: 'CreditsScene' };
  }
}

import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { GameAudioKey } from '../data/audioAssets';
import { RuntimeEnvironmentAssetKey } from '../data/artAssets';
import { SaveSystem } from '../systems/SaveSystem';
import { GameAudio } from '../systems/Stage1Audio';

export class CreditsScene extends Phaser.Scene {
  private audio!: GameAudio;
  private leaving = false;

  constructor() {
    super(SceneKey.Credits);
  }

  create(): void {
    this.audio = new GameAudio(this, SaveSystem.load().settings, 'menu');
    this.leaving = false;
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundFar).setAlpha(0.94);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundDistant).setAlpha(0.66);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundMid).setAlpha(0.76);
    this.add.tileSprite(BASE_WIDTH / 2, 296, 760, 344, RuntimeEnvironmentAssetKey.GroundTile).setAlpha(0.82);
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
    this.input.keyboard?.on('keydown-ESC', () => this.back());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.removeAllListeners('keydown-ESC'));
    this.input.on('pointerup', () => this.back());
    window.__NEON_RONIN_STAGE1_MENU__ = { scene: 'CreditsScene' };
  }

  update(_time: number, delta: number): void {
    this.audio.update({ bossIntensity: 0 }, delta);
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.audio.play(GameAudioKey.UiBack, { variation: false });
    this.time.delayedCall(240, () => this.scene.start(SceneKey.Title));
  }
}

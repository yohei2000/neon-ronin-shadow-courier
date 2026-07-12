import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { GameAudioKey } from '../data/audioAssets';
import { ArtAssetKey, RuntimeEnvironmentAssetKey } from '../data/artAssets';
import { SaveSystem } from '../systems/SaveSystem';
import { GameAudio } from '../systems/Stage1Audio';

export class ControlsScene extends Phaser.Scene {
  private audio!: GameAudio;
  private leaving = false;

  constructor() {
    super(SceneKey.Controls);
  }

  create(): void {
    this.audio = new GameAudio(this, SaveSystem.load().settings, 'menu');
    this.leaving = false;
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, ArtAssetKey.TitleComposition).setAlpha(0.62);
    this.add.tileSprite(BASE_WIDTH / 2, 282, 760, 350, RuntimeEnvironmentAssetKey.GroundTile).setAlpha(0.72);
    this.add.text(90, 78, 'CONTROLS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: PaletteHex.neonCyan
    });
    const lines = [
      'A / D or Arrows     Move',
      'W / Space / Up      Variable jump',
      'Wall contact + Jump Wall kick',
      'J / Z               Slash',
      'K / X               Kage-Ito thread slash',
      'Esc / P             Pause',
      'Enter               Confirm'
    ];
    lines.forEach((line, index) => {
      this.add.text(124, 158 + index * 38, line, {
        fontFamily: 'Consolas, monospace',
        fontSize: '22px',
        color: index % 2 === 0 ? PaletteHex.warmPaper : PaletteHex.paleMoonMist
      });
    });
    this.add.image(480, 462, ArtAssetKey.MobileControlsKit).setScale(0.46).setAlpha(0.78);
    this.add.text(78, 500, 'Back: Esc / click', {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    });
    this.input.keyboard?.removeAllListeners('keydown-ESC');
    this.input.keyboard?.on('keydown-ESC', () => this.back());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.removeAllListeners('keydown-ESC'));
    this.input.on('pointerup', () => this.back());
    window.__NEON_RONIN_STAGE1_MENU__ = { scene: 'ControlsScene' };
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

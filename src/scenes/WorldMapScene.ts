import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { Levels } from '../data/levels';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { formatTime } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.WorldMap);
  }

  create(): void {
    markSceneStatus(SceneKey.WorldMap);
    const save = getSaveSystem(this);
    this.cameras.main.setBackgroundColor(Palette.ink0);
    this.add
      .text(480, 36, 'World Map', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: PaletteCss.cyan
      })
      .setOrigin(0.5);
    Levels.forEach((level, index) => {
      const x = 110 + index * 185;
      const unlocked = save.data.unlockedStages.includes(level.id);
      const stats = save.data.stageStats[level.id];
      const g = this.add.graphics();
      g.fillStyle(unlocked ? Palette.ink2 : Palette.ink1, 0.95);
      g.fillRoundedRect(x - 76, 105, 152, 260, 8);
      g.lineStyle(3, unlocked ? Palette.cyan : Palette.smoke, unlocked ? 0.9 : 0.35);
      g.strokeRoundedRect(x - 76, 105, 152, 260, 8);
      const label = unlocked ? `Stage ${level.id}` : 'Locked';
      this.add
        .text(x, 130, label, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: unlocked ? PaletteCss.gold : PaletteCss.smoke
        })
        .setOrigin(0.5);
      this.add
        .text(x, 178, level.name, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: PaletteCss.white,
          align: 'center',
          wordWrap: { width: 128 }
        })
        .setOrigin(0.5);
      this.add
        .text(
          x,
          258,
          [
            `Best ${stats.bestTimeMs === null ? '--:--' : formatTime(stats.bestTimeMs)}`,
            `Rank ${stats.bestRank ?? '-'}`,
            `Scrolls ${stats.scrolls.length}/3`
          ],
          {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: unlocked ? PaletteCss.moon : PaletteCss.smoke,
            align: 'center',
            lineSpacing: 6
          }
        )
        .setOrigin(0.5);
      const start = this.add
        .text(x, 335, unlocked ? 'Start' : '---', {
          fontFamily: 'monospace',
          fontSize: '19px',
          color: unlocked ? PaletteCss.cyan : PaletteCss.smoke
        })
        .setOrigin(0.5);
      if (unlocked) {
        start.setInteractive({ useHandCursor: true });
        start.on('pointerdown', () => {
          getAudioSystem(this).play('confirm');
          this.scene.start(SceneKey.Game, { stageId: level.id });
        });
      }
    });
    this.add
      .text(480, 430, 'Click an unlocked stage to deploy from its first checkpoint.', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: PaletteCss.smoke
      })
      .setOrigin(0.5);
    this.addBackButton();
  }

  private addBackButton(): void {
    const back = this.add
      .text(480, 486, 'Back to Title', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: PaletteCss.cyan
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(SceneKey.Title));
    const esc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    esc?.on('down', () => this.scene.start(SceneKey.Title));
  }
}

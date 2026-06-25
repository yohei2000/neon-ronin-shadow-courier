import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { TitleCopy } from '../data/copy';
import { StageIds } from '../types/game';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { MenuList } from '../systems/MenuList';
import { SaveSystem } from '../systems/SaveSystem';
import { markSceneStatus } from '../utils/sceneStatus';

export class TitleScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    markSceneStatus(SceneKey.Title);
    const save = getSaveSystem(this);
    const audio = getAudioSystem(this);
    this.input.once('pointerdown', () => audio.unlock());
    this.drawBackground();
    this.add
      .text(480, 102, TitleCopy.title, {
        fontFamily: 'monospace',
        fontSize: '58px',
        color: PaletteCss.cyan
      })
      .setOrigin(0.5);
    this.add
      .text(480, 158, TitleCopy.subtitle, {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: PaletteCss.magenta
      })
      .setOrigin(0.5);
    this.add
      .text(480, 204, TitleCopy.prompt, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: PaletteCss.moon
      })
      .setOrigin(0.5);
    const highestStage = Math.max(...save.data.unlockedStages) as 1 | 2 | 3 | 4 | 5;
    this.menu = new MenuList(this, 480, 275, [
      {
        label: 'New Game',
        action: () => {
          save.reset();
          audio.play('confirm');
          this.scene.start(SceneKey.Game, { stageId: 1 });
        }
      },
      {
        label: `Continue Stage ${highestStage}`,
        action: () => {
          audio.play('confirm');
          this.scene.start(SceneKey.Game, { stageId: highestStage });
        }
      },
      {
        label: 'World Map',
        action: () => {
          audio.play('confirm');
          this.scene.start(SceneKey.WorldMap);
        }
      },
      {
        label: 'Settings',
        action: () => this.scene.start(SceneKey.Settings, { returnScene: SceneKey.Title })
      },
      {
        label: 'Controls',
        action: () => this.scene.start(SceneKey.Controls)
      },
      {
        label: 'Credits',
        action: () => this.scene.start(SceneKey.Ending, { creditsOnly: true })
      }
    ]);
    this.add
      .text(480, 510, `Unlocked stages: ${StageIds.filter((id) => save.data.unlockedStages.includes(id)).join(', ')}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: PaletteCss.smoke
      })
      .setOrigin(0.5);
  }

  update(): void {
    this.menu?.update();
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(Palette.ink0, Palette.ink0, Palette.ink1, Palette.ink2, 1);
    g.fillRect(0, 0, 960, 540);
    g.fillStyle(Palette.moon, 0.85);
    g.fillCircle(750, 110, 48);
    g.lineStyle(2, Palette.cyan, 0.28);
    for (let x = 0; x < 960; x += 80) {
      g.lineBetween(x, 380 + Math.sin(x) * 10, x + 60, 270);
    }
    g.fillStyle(Palette.magenta, 0.28);
    g.fillRect(0, 442, 960, 4);
    g.fillStyle(Palette.cyan, 0.2);
    g.fillRect(0, 456, 960, 2);
  }
}

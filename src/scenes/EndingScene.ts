import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { CreditsCopy, EndingCopy } from '../data/copy';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { MenuList } from '../systems/MenuList';
import type { EndingSceneData } from '../types/flow';
import { formatTime } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

export class EndingScene extends Phaser.Scene {
  private menu: MenuList | null = null;
  private dataIn: EndingSceneData = {};

  constructor() {
    super(SceneKey.Ending);
  }

  init(data: EndingSceneData): void {
    this.dataIn = data;
  }

  create(): void {
    markSceneStatus(SceneKey.Ending);
    getAudioSystem(this).play('victory');
    this.cameras.main.setBackgroundColor(Palette.ink0);
    const save = getSaveSystem(this).data;
    const g = this.add.graphics();
    g.fillStyle(Palette.moon, 0.8);
    g.fillCircle(480, 110, 58);
    g.lineStyle(2, Palette.cyan, 0.5);
    for (let index = 0; index < 15; index += 1) {
      g.lineBetween(160 + index * 44, 210, 128 + index * 44, 430);
    }
    this.add
      .text(480, 56, this.dataIn.creditsOnly ? 'Credits' : 'The Courier Arrives', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: PaletteCss.gold
      })
      .setOrigin(0.5);
    const story = this.dataIn.creditsOnly ? [] : EndingCopy;
    const resultLines = this.dataIn.result
      ? [
          '',
          `Final Stage Time ${formatTime(this.dataIn.result.elapsedMs)}`,
          `Final Rank ${this.dataIn.result.rank}`
        ]
      : [];
    this.add
      .text(480, 190, [...story, ...CreditsCopy, ...resultLines], {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: PaletteCss.white,
        align: 'center',
        lineSpacing: 9,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);
    this.add
      .text(480, 388, `Total clears ${save.completionStats.totalClears}  Total seals ${save.completionStats.totalSeals}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: PaletteCss.smoke
      })
      .setOrigin(0.5);
    this.menu = new MenuList(this, 480, 448, [
      {
        label: 'World Map',
        action: () => this.scene.start(SceneKey.WorldMap)
      },
      {
        label: 'Title',
        action: () => this.scene.start(SceneKey.Title)
      }
    ]);
  }

  update(): void {
    this.menu?.update();
  }
}

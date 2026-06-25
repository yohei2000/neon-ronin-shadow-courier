import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { MenuList } from '../systems/MenuList';
import type { StageClearSceneData } from '../types/flow';
import type { StageId } from '../types/game';
import { formatTime } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

export class StageClearScene extends Phaser.Scene {
  private dataIn!: StageClearSceneData;
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.StageClear);
  }

  init(data: StageClearSceneData): void {
    this.dataIn = data;
  }

  create(): void {
    markSceneStatus(SceneKey.StageClear);
    getSaveSystem(this).completeStage(this.dataIn);
    getAudioSystem(this).play('stage-clear');
    this.cameras.main.setBackgroundColor(Palette.ink0);
    const g = this.add.graphics();
    g.fillStyle(Palette.cyan, 0.2);
    g.fillCircle(480, 250, 170);
    this.add
      .text(480, 82, `Stage ${this.dataIn.stageId} Clear`, {
        fontFamily: 'monospace',
        fontSize: '38px',
        color: PaletteCss.gold
      })
      .setOrigin(0.5);
    this.add
      .text(
        480,
        180,
        [
          `Time ${formatTime(this.dataIn.elapsedMs)}`,
          `Scrolls ${this.dataIn.scrolls.length}/3`,
          `Damage Taken ${this.dataIn.damageTaken}`,
          `Defeats ${this.dataIn.defeats}`,
          `Seals ${this.dataIn.seals}`,
          `Rank ${this.dataIn.rank}`
        ],
        {
          fontFamily: 'monospace',
          fontSize: '23px',
          color: PaletteCss.white,
          align: 'center',
          lineSpacing: 8
        }
      )
      .setOrigin(0.5);
    const nextStage = (this.dataIn.stageId + 1) as StageId;
    this.menu = new MenuList(this, 480, 348, [
      {
        label: 'Next Stage',
        disabled: this.dataIn.stageId >= 5,
        action: () => this.scene.start(SceneKey.Game, { stageId: nextStage })
      },
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

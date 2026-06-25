import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { MenuList } from '../systems/MenuList';
import type { GameOverSceneData } from '../types/flow';
import type { StageId } from '../types/game';
import { markSceneStatus } from '../utils/sceneStatus';

export class GameOverScene extends Phaser.Scene {
  private stageId: StageId = 1;
  private checkpointIndex = 0;
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.GameOver);
  }

  init(data: GameOverSceneData): void {
    this.stageId = data.stageId;
    this.checkpointIndex = data.checkpointIndex;
  }

  create(): void {
    markSceneStatus(SceneKey.GameOver);
    const g = this.add.graphics();
    g.fillStyle(Palette.black, 0.74);
    g.fillRect(0, 0, 960, 540);
    this.add
      .text(480, 120, 'Courier Down', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: PaletteCss.red
      })
      .setOrigin(0.5);
    this.menu = new MenuList(this, 480, 210, [
      {
        label: 'Retry Checkpoint',
        action: () => this.scene.start(SceneKey.Game, { stageId: this.stageId, checkpointIndex: this.checkpointIndex })
      },
      {
        label: 'Retry Stage',
        action: () => this.scene.start(SceneKey.Game, { stageId: this.stageId, checkpointIndex: 0 })
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

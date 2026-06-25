import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import { MenuList } from '../systems/MenuList';
import { markSceneStatus } from '../utils/sceneStatus';
import type { Stage1Scene } from './Stage1Scene';

export class PauseScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Pause);
  }

  create(): void {
    markSceneStatus(SceneKey.Pause);
    const stageScene = this.scene.get(SceneKey.Stage1) as Stage1Scene;
    this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, Palette.ink0, 0.72);
    this.add.text(BASE_WIDTH / 2, 118, 'Paused', {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: PaletteCss.white
    }).setOrigin(0.5);
    this.menu = new MenuList(this, BASE_WIDTH / 2, 196, [
      {
        label: 'Resume',
        action: () => {
          this.scene.stop();
          this.scene.resume(SceneKey.Stage1);
        }
      },
      {
        label: 'Retry Checkpoint',
        action: () => {
          this.scene.stop();
          stageScene.restartFromCheckpoint();
        }
      },
      {
        label: 'Restart Stage',
        action: () => {
          this.scene.stop();
          stageScene.restartStage();
        }
      },
      { label: 'Settings', action: () => this.scene.start(SceneKey.Settings, { returnScene: SceneKey.Pause }) },
      {
        label: 'Title',
        action: () => {
          this.scene.stop(SceneKey.Stage1);
          this.scene.start(SceneKey.Title);
        }
      }
    ]);
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume(SceneKey.Stage1);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu?.destroy());
  }

  update(): void {
    this.menu?.update();
  }
}

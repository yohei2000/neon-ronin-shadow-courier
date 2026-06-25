import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { MenuList } from '../systems/MenuList';
import { getAudioSystem } from '../systems/Registry';
import type { GameScene } from './GameScene';
import { markSceneStatus } from '../utils/sceneStatus';

export class PauseScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Pause);
  }

  create(): void {
    markSceneStatus(SceneKey.Pause);
    const gameScene = this.scene.get(SceneKey.Game) as GameScene;
    const g = this.add.graphics();
    g.fillStyle(Palette.black, 0.68);
    g.fillRect(0, 0, 960, 540);
    this.add
      .text(480, 108, 'Paused', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: PaletteCss.cyan
      })
      .setOrigin(0.5);
    this.menu = new MenuList(this, 480, 182, [
      {
        label: 'Resume',
        action: () => {
          getAudioSystem(this).play('confirm');
          this.scene.stop();
          this.scene.resume(SceneKey.Game);
          gameScene.resumeFromPause();
        }
      },
      {
        label: 'Retry Checkpoint',
        action: () => {
          this.scene.stop();
          gameScene.restartFromCheckpoint();
        }
      },
      {
        label: 'Restart Stage',
        action: () => {
          this.scene.stop();
          gameScene.restartStage();
        }
      },
      {
        label: 'Settings',
        action: () => this.scene.start(SceneKey.Settings, { returnScene: SceneKey.Pause })
      },
      {
        label: 'World Map',
        action: () => {
          this.scene.stop(SceneKey.Game);
          this.scene.start(SceneKey.WorldMap);
        }
      },
      {
        label: 'Title',
        action: () => {
          this.scene.stop(SceneKey.Game);
          this.scene.start(SceneKey.Title);
        }
      }
    ]);
  }

  update(): void {
    this.menu?.update();
  }
}

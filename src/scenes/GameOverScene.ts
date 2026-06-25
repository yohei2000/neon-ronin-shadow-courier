import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import { MenuList } from '../systems/MenuList';
import type { GameOverSceneData } from '../types/flow';
import { markSceneStatus } from '../utils/sceneStatus';

export class GameOverScene extends Phaser.Scene {
  private checkpointIndex = 0;
  private reason: GameOverSceneData['reason'] = 'defeated';
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.GameOver);
  }

  init(data: GameOverSceneData): void {
    this.checkpointIndex = data.checkpointIndex ?? 0;
    this.reason = data.reason ?? 'defeated';
  }

  create(): void {
    markSceneStatus(SceneKey.GameOver);
    this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, Palette.ink0);
    this.add.text(BASE_WIDTH / 2, 124, 'Courier Down', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: PaletteCss.red
    }).setOrigin(0.5);
    this.add.text(BASE_WIDTH / 2, 178, this.reason === 'fall' ? 'The alley swallowed the route.' : 'The delivery can still be recovered.', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: PaletteCss.white
    }).setOrigin(0.5);
    this.menu = new MenuList(this, BASE_WIDTH / 2, 248, [
      { label: 'Retry Checkpoint', action: () => this.scene.start(SceneKey.Stage1, { checkpointIndex: this.checkpointIndex }) },
      { label: 'Restart Stage', action: () => this.scene.start(SceneKey.Stage1, { checkpointIndex: 0 }) },
      { label: 'Title', action: () => this.scene.start(SceneKey.Title) }
    ]);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SceneKey.Title));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu?.destroy());
  }

  update(): void {
    this.menu?.update();
  }
}

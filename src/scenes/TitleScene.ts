import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { MenuList } from '../systems/MenuList';
import { formatTime } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

export class TitleScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    markSceneStatus(SceneKey.Title);
    const audio = getAudioSystem(this);
    const save = getSaveSystem(this);
    this.input.once('pointerdown', () => audio.unlock());
    this.input.keyboard?.once('keydown', () => audio.unlock());
    this.drawBackdrop();
    this.add.text(BASE_WIDTH / 2, 76, 'Neon Ronin', {
      fontFamily: 'monospace',
      fontSize: '54px',
      color: PaletteCss.white,
      align: 'center'
    }).setOrigin(0.5);
    this.add.text(BASE_WIDTH / 2, 126, 'Shadow Courier: Stage 1', {
      fontFamily: 'monospace',
      fontSize: '21px',
      color: PaletteCss.cyan,
      align: 'center'
    }).setOrigin(0.5);
    const bestTime = save.data.stage1.bestTimeMs === null ? '--:--' : formatTime(save.data.stage1.bestTimeMs);
    const bestRank = save.data.stage1.bestRank ?? '-';
    this.add.text(BASE_WIDTH / 2, 176, `Neon Alley: First Delivery   Best ${bestTime} / ${bestRank}   Scrolls ${save.data.stage1.scrolls.length}/3`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: PaletteCss.gold,
      align: 'center'
    }).setOrigin(0.5);
    this.menu = new MenuList(this, BASE_WIDTH / 2, 246, [
      {
        label: save.data.stage1.cleared ? 'Replay Stage 1' : 'Start Stage 1',
        action: () => this.scene.start(SceneKey.Stage1, { checkpointIndex: 0 })
      },
      { label: 'Controls', action: () => this.scene.start(SceneKey.Controls) },
      { label: 'Settings', action: () => this.scene.start(SceneKey.Settings, { returnScene: SceneKey.Title }) },
      { label: 'Credits', action: () => this.scene.start(SceneKey.Credits, { creditsOnly: true }) },
      {
        label: 'Reset Save',
        action: () => {
          save.reset();
          this.scene.restart();
        }
      }
    ]);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu?.destroy());
  }

  update(): void {
    this.menu?.update();
  }

  private drawBackdrop(): void {
    this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, Palette.ink0);
    this.add.circle(720, 90, 62, Palette.moon, 0.18);
    for (let i = 0; i < 12; i += 1) {
      const x = i * 90 + 20;
      const height = 130 + (i % 5) * 38;
      this.add.rectangle(x, BASE_HEIGHT - height / 2, 64, height, i % 2 ? Palette.ink1 : Palette.ink2, 0.86);
      if (i % 3 === 0) {
        this.add.rectangle(x, BASE_HEIGHT - height + 42, 48, 8, i % 2 ? Palette.magenta : Palette.cyan, 0.68);
      }
    }
    this.add.line(BASE_WIDTH / 2, 212, 0, 0, 740, 0, Palette.cyan, 0.42);
  }
}

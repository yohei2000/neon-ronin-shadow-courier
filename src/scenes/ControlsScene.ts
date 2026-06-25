import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import { MenuList } from '../systems/MenuList';
import { markSceneStatus } from '../utils/sceneStatus';

export class ControlsScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Controls);
  }

  create(): void {
    markSceneStatus(SceneKey.Controls);
    this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, Palette.ink0);
    this.add.text(BASE_WIDTH / 2, 64, 'Controls', {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: PaletteCss.white
    }).setOrigin(0.5);

    const rows = [
      ['Move', 'A/D or Arrow Keys'],
      ['Jump / Wall Kick', 'W, Up, or Space'],
      ['Slash', 'J or Z'],
      ['Pause', 'Esc or P'],
      ['Mobile', 'Virtual pad and two action buttons']
    ];
    rows.forEach(([label, value], index) => {
      const y = 140 + index * 48;
      this.add.rectangle(BASE_WIDTH / 2, y, 650, 34, index % 2 ? Palette.ink1 : Palette.ink2, 0.72);
      this.add.text(210, y, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: PaletteCss.cyan
      }).setOrigin(0, 0.5);
      this.add.text(410, y, value, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: PaletteCss.white
      }).setOrigin(0, 0.5);
    });
    this.add.text(BASE_WIDTH / 2, 410, 'Stage 1 teaches every move inside the Neon Alley route.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: PaletteCss.gold
    }).setOrigin(0.5);
    this.menu = new MenuList(this, BASE_WIDTH / 2, 470, [
      { label: 'Back', action: () => this.scene.start(SceneKey.Title) }
    ]);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SceneKey.Title));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu?.destroy());
  }

  update(): void {
    this.menu?.update();
  }
}

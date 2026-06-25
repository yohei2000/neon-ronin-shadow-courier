import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { AbilityDescriptions, AbilityDisplay } from '../data/abilities';
import { MenuList } from '../systems/MenuList';
import { markSceneStatus } from '../utils/sceneStatus';

export class ControlsScene extends Phaser.Scene {
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Controls);
  }

  create(): void {
    markSceneStatus(SceneKey.Controls);
    this.cameras.main.setBackgroundColor(Palette.ink0);
    this.add
      .text(480, 48, 'Controls', {
        fontFamily: 'monospace',
        fontSize: '38px',
        color: PaletteCss.cyan
      })
      .setOrigin(0.5);
    this.add
      .text(
        90,
        98,
        [
          'Keyboard',
          'Move: A/D or Arrow keys',
          'Jump: W, Space, or Up',
          'Dash: Shift or L',
          'Attack: J or Z',
          'Art: K or X',
          'Pause: Esc or P',
          '',
          'Mobile',
          'Left D-pad moves. Right buttons are Jump, Attack, Dash, Art.'
        ],
        {
          fontFamily: 'monospace',
          fontSize: '19px',
          color: PaletteCss.white,
          lineSpacing: 8
        }
      );
    const abilityLines = Object.entries(AbilityDisplay).map(
      ([id, label]) => `${label}: ${AbilityDescriptions[id as keyof typeof AbilityDescriptions]}`
    );
    this.add
      .text(90, 325, ['Abilities', ...abilityLines, '', 'Assist settings can extend invulnerability, reduce damage, and rescue falls.'], {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: PaletteCss.moon,
        lineSpacing: 6,
        wordWrap: { width: 790 }
      });
    this.menu = new MenuList(this, 480, 500, [
      {
        label: 'Back',
        action: () => this.scene.start(SceneKey.Title)
      }
    ]);
  }

  update(): void {
    this.menu?.update();
  }
}

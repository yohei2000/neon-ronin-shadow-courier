import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import { MenuList } from '../systems/MenuList';
import type { CreditsSceneData } from '../types/flow';
import { formatTime } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

export class CreditsScene extends Phaser.Scene {
  private dataIn: CreditsSceneData = {};
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.Credits);
  }

  init(data: CreditsSceneData = {}): void {
    this.dataIn = data;
  }

  create(): void {
    markSceneStatus(SceneKey.Credits);
    this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, Palette.ink0);
    this.add.text(BASE_WIDTH / 2, 68, 'Neon Ronin', {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: PaletteCss.white
    }).setOrigin(0.5);
    this.add.text(BASE_WIDTH / 2, 118, 'Stage 1 Vertical Slice', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: PaletteCss.cyan
    }).setOrigin(0.5);
    const lines = this.dataIn.result
      ? [
          'The parcel reaches the Moon Gate.',
          `Delivery time ${formatTime(this.dataIn.result.elapsedMs)} / Rank ${this.dataIn.result.rank}.`,
          'Lantern Warden defeated. Neon Alley is complete.'
        ]
      : [
          'A compact browser action stage.',
          'Design goal: readable movement, one authored route, one boss.',
          'Built with Phaser, TypeScript, Vite, Vitest, and Playwright.'
        ];
    lines.forEach((line, index) => {
      this.add.text(BASE_WIDTH / 2, 190 + index * 38, line, {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: PaletteCss.white,
        align: 'center'
      }).setOrigin(0.5);
    });
    this.add.text(BASE_WIDTH / 2, 338, 'Code, procedural art, and QA automation by Codex.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: PaletteCss.gold
    }).setOrigin(0.5);
    this.menu = new MenuList(this, BASE_WIDTH / 2, 430, [
      { label: 'Replay Stage 1', action: () => this.scene.start(SceneKey.Stage1, { checkpointIndex: 0 }) },
      { label: 'Title', action: () => this.scene.start(SceneKey.Title) }
    ]);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SceneKey.Title));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu?.destroy());
  }

  update(): void {
    this.menu?.update();
  }
}

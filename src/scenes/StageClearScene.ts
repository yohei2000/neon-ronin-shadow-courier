import * as Phaser from 'phaser';
import { SceneKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import { getSaveSystem } from '../systems/Registry';
import { MenuList } from '../systems/MenuList';
import type { StageClearSceneData } from '../types/flow';
import { formatTime } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

export class StageClearScene extends Phaser.Scene {
  private dataIn: StageClearSceneData = {
    elapsedMs: 0,
    rank: 'C',
    scrolls: [],
    damageTaken: 0,
    seals: 0,
    checkpointIndex: 0
  };
  private menu: MenuList | null = null;

  constructor() {
    super(SceneKey.StageClear);
  }

  init(data: StageClearSceneData): void {
    this.dataIn = data;
  }

  create(): void {
    markSceneStatus(SceneKey.StageClear);
    if (typeof window !== 'undefined') {
      window.__NEON_RONIN_CLEAR__ = {
        elapsedMs: this.dataIn.elapsedMs,
        rank: this.dataIn.rank,
        scrolls: this.dataIn.scrolls,
        damageTaken: this.dataIn.damageTaken,
        seals: this.dataIn.seals
      };
    }
    const save = getSaveSystem(this);
    this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, Palette.ink0);
    this.add.circle(724, 94, 66, Palette.gold, 0.16);
    this.add.text(BASE_WIDTH / 2, 68, 'Delivery Complete', {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: PaletteCss.white
    }).setOrigin(0.5);
    this.add.text(BASE_WIDTH / 2, 128, `Rank ${this.dataIn.rank}`, {
      fontFamily: 'monospace',
      fontSize: '46px',
      color: this.dataIn.rank === 'S' ? PaletteCss.gold : PaletteCss.cyan
    }).setOrigin(0.5);
    const rows = [
      `Time ${formatTime(this.dataIn.elapsedMs)}`,
      `Scrolls ${this.dataIn.scrolls.length}/3`,
      `Seals ${this.dataIn.seals}/22`,
      `Damage Taken ${this.dataIn.damageTaken}`,
      `Best ${save.data.stage1.bestTimeMs === null ? '--:--' : formatTime(save.data.stage1.bestTimeMs)} / ${save.data.stage1.bestRank ?? '-'}`
    ];
    rows.forEach((row, index) => {
      this.add.text(BASE_WIDTH / 2, 196 + index * 30, row, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: index === 4 ? PaletteCss.gold : PaletteCss.white
      }).setOrigin(0.5);
    });
    this.menu = new MenuList(this, BASE_WIDTH / 2, 378, [
      { label: 'Replay Stage 1', action: () => this.scene.start(SceneKey.Stage1, { checkpointIndex: 0 }) },
      { label: 'Credits', action: () => this.scene.start(SceneKey.Credits, { result: this.dataIn }) },
      { label: 'Title', action: () => this.scene.start(SceneKey.Title) }
    ]);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu?.destroy());
  }

  update(): void {
    this.menu?.update();
  }
}

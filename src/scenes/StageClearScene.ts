import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { RuntimeEnvironmentAssetKey } from '../data/artAssets';
import { SaveSystem } from '../systems/SaveSystem';
import type { StageRank } from '../systems/rank';

export type StageClearData = {
  readonly timeMs: number;
  readonly rank: StageRank;
  readonly scrollsFound: number;
  readonly damageTaken: number;
  readonly bestTimeMs: number | null;
};

export class StageClearScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.StageClear);
  }

  create(data: StageClearData): void {
    const save = SaveSystem.load();
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundFar).setAlpha(0.98);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundDistant).setAlpha(0.72);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundMid).setAlpha(0.78);
    this.add.tileSprite(BASE_WIDTH / 2, 278, 760, 322, RuntimeEnvironmentAssetKey.GroundTile).setAlpha(0.88);
    this.add.text(112, 86, 'STAGE CLEAR', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: PaletteHex.neonCyan
    }).setShadow(0, 0, PaletteHex.neonCyan, 8);

    const rows = [
      ['Clear time', this.formatTime(data.timeMs)],
      ['Rank', data.rank],
      ['Scrolls found', `${data.scrollsFound}/3`],
      ['Damage taken', `${data.damageTaken}`],
      ['Best time', this.formatBest(save.stage1.bestTimeMs ?? data.bestTimeMs)]
    ];

    rows.forEach(([label, value], index) => {
      this.add.text(156, 174 + index * 42, `${label.padEnd(16)} ${value}`, {
        fontFamily: 'Consolas, monospace',
        fontSize: '24px',
        color: index === 1 ? PaletteHex.lanternGold : PaletteHex.warmPaper
      });
    });

    this.add.text(154, 428, 'ENTER: retry   T: title', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: PaletteHex.neonMagenta
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start(SceneKey.Stage1));
    this.input.keyboard?.on('keydown-T', () => this.scene.start(SceneKey.Title));
    window.__NEON_RONIN_STAGE1__ = {
      scene: 'StageClearScene',
      stageClear: true,
      rank: data.rank,
      timeMs: data.timeMs,
      scrollsFound: data.scrollsFound,
      damageTaken: data.damageTaken
    };
  }

  private formatTime(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private formatBest(ms: number | null): string {
    return ms === null ? '--:--' : this.formatTime(ms);
  }
}

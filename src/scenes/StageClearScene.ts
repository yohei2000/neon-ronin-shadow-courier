import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { GameAudioKey } from '../data/audioAssets';
import { RuntimeEnvironmentAssetKey } from '../data/artAssets';
import { SaveSystem } from '../systems/SaveSystem';
import { GameAudio } from '../systems/Stage1Audio';
import type { StageRank } from '../systems/rank';

export type StageClearData = {
  readonly stageLabel?: string;
  readonly retryScene?: SceneKey;
  readonly timeMs: number;
  readonly rank: StageRank;
  readonly scrollsFound: number;
  readonly sealsFound: number;
  readonly sealsTotal: number;
  readonly damageTaken: number;
  readonly bestTimeMs: number | null;
};

export class StageClearScene extends Phaser.Scene {
  private audio!: GameAudio;
  private leaving = false;

  constructor() {
    super(SceneKey.StageClear);
  }

  create(data: StageClearData): void {
    const save = SaveSystem.load();
    this.audio = new GameAudio(this, save.settings, 'clear');
    this.audio.play(GameAudioKey.StageClear, { variation: false });
    this.leaving = false;
    const retryScene = data.retryScene ?? SceneKey.Stage1;
    const persistedBest = retryScene === SceneKey.Stage2 ? save.stage2.bestTimeMs : save.stage1.bestTimeMs;
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundFar).setAlpha(0.98);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundDistant).setAlpha(0.72);
    this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, RuntimeEnvironmentAssetKey.BackgroundMid).setAlpha(0.78);
    this.add.tileSprite(BASE_WIDTH / 2, 278, 760, 322, RuntimeEnvironmentAssetKey.GroundTile).setAlpha(0.88);
    this.add.text(112, 86, data.stageLabel ?? 'STAGE CLEAR', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: PaletteHex.neonCyan
    }).setShadow(0, 0, PaletteHex.neonCyan, 8);

    const rows = [
      ['Clear time', this.formatTime(data.timeMs)],
      ['Rank', data.rank],
      ['Seals found', `${data.sealsFound}/${data.sealsTotal}`],
      ['Damage taken', `${data.damageTaken}`],
      ['Best time', this.formatBest(persistedBest ?? data.bestTimeMs)]
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
    this.input.keyboard?.on('keydown-ENTER', () => this.leave(retryScene, false));
    this.input.keyboard?.on('keydown-T', () => this.leave(SceneKey.Title, true));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners('keydown-ENTER');
      this.input.keyboard?.removeAllListeners('keydown-T');
    });
    window.__NEON_RONIN_STAGE1__ = {
      scene: 'StageClearScene',
      stageClear: true,
      rank: data.rank,
      timeMs: data.timeMs,
      scrollsFound: data.scrollsFound,
      sealsFound: data.sealsFound,
      damageTaken: data.damageTaken
    };
  }

  update(_time: number, delta: number): void {
    this.audio.update({ bossIntensity: 0 }, delta);
  }

  private leave(scene: SceneKey, back: boolean): void {
    if (this.leaving) return;
    this.leaving = true;
    this.audio.play(back ? GameAudioKey.UiBack : GameAudioKey.UiConfirm, { variation: false });
    this.time.delayedCall(back ? 240 : 300, () => this.scene.start(scene));
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

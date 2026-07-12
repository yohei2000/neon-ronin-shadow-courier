import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { GameAudioKey } from '../data/audioAssets';
import { ArtAssetKey, RuntimeEnvironmentAssetKey } from '../data/artAssets';
import { SaveSystem, type Stage1Settings, type TouchControlsMode } from '../systems/SaveSystem';
import { GameAudio } from '../systems/Stage1Audio';

type SettingRow = keyof Pick<
  Stage1Settings,
  'masterVolume' | 'musicVolume' | 'sfxVolume' | 'reducedShake' | 'reducedParticles' | 'highContrast' | 'touchControls' | 'touchOpacity'
>;

const rows: readonly SettingRow[] = [
  'masterVolume',
  'musicVolume',
  'sfxVolume',
  'reducedShake',
  'reducedParticles',
  'highContrast',
  'touchControls',
  'touchOpacity'
];

export class SettingsScene extends Phaser.Scene {
  private settings = SaveSystem.load().settings;
  private selected = 0;
  private rowTexts: Phaser.GameObjects.Text[] = [];
  private audio!: GameAudio;
  private leaving = false;

  constructor() {
    super(SceneKey.Settings);
  }

  create(): void {
    this.audio = new GameAudio(this, this.settings, 'menu');
    this.leaving = false;
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, ArtAssetKey.LightingWarmCool).setAlpha(0.45);
    this.add.tileSprite(BASE_WIDTH / 2, 292, 760, 360, RuntimeEnvironmentAssetKey.GroundTile).setAlpha(0.72);
    this.add.text(90, 74, 'SETTINGS', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: PaletteHex.neonMagenta
    });
    this.rowTexts = rows.map((row, index) =>
      this.add.text(136, 154 + index * 42, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '22px',
        color: PaletteHex.warmPaper
      })
    );
    this.renderRows();

    this.bindInput();
    this.add.text(92, 492, 'Esc: save and return', {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    });
    window.__NEON_RONIN_STAGE1_MENU__ = { scene: 'SettingsScene' };
  }

  update(_time: number, delta: number): void {
    this.audio.update({ bossIntensity: 0 }, delta);
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    for (const key of ['UP', 'W', 'DOWN', 'S', 'LEFT', 'A', 'RIGHT', 'D', 'ENTER', 'ESC']) {
      keyboard.removeAllListeners(`keydown-${key}`);
    }
    keyboard.on('keydown-UP', () => this.moveSelection(-1));
    keyboard.on('keydown-W', () => this.moveSelection(-1));
    keyboard.on('keydown-DOWN', () => this.moveSelection(1));
    keyboard.on('keydown-S', () => this.moveSelection(1));
    keyboard.on('keydown-LEFT', () => this.adjust(-1));
    keyboard.on('keydown-A', () => this.adjust(-1));
    keyboard.on('keydown-RIGHT', () => this.adjust(1));
    keyboard.on('keydown-D', () => this.adjust(1));
    keyboard.on('keydown-ENTER', () => this.adjust(1));
    keyboard.on('keydown-ESC', () => this.back());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const key of ['UP', 'W', 'DOWN', 'S', 'LEFT', 'A', 'RIGHT', 'D', 'ENTER', 'ESC']) {
        keyboard.removeAllListeners(`keydown-${key}`);
      }
    });
  }

  private moveSelection(delta: number): void {
    this.selected = (this.selected + rows.length + delta) % rows.length;
    this.audio.play(GameAudioKey.UiMove, { variation: false });
    this.renderRows();
  }

  private adjust(delta: -1 | 1): void {
    const row = rows[this.selected];
    const step = 0.05 * delta;
    if (row === 'masterVolume' || row === 'musicVolume' || row === 'sfxVolume' || row === 'touchOpacity') {
      this.settings = { ...this.settings, [row]: Math.max(row === 'touchOpacity' ? 0.35 : 0, Math.min(1, this.settings[row] + step)) };
    } else if (row === 'touchControls') {
      const modes: readonly TouchControlsMode[] = ['auto', 'on', 'off'];
      const next = modes[(modes.indexOf(this.settings.touchControls) + modes.length + delta) % modes.length];
      this.settings = { ...this.settings, touchControls: next };
    } else {
      this.settings = { ...this.settings, [row]: !this.settings[row] };
    }
    SaveSystem.saveSettings(this.settings);
    this.audio.updateSettings(this.settings);
    this.audio.play(GameAudioKey.UiConfirm, { detune: delta > 0 ? 80 : -80, volume: 0.72, variation: false });
    this.renderRows();
  }

  private renderRows(): void {
    rows.forEach((row, index) => {
      const marker = index === this.selected ? '>' : ' ';
      const value = this.formatValue(row);
      this.rowTexts[index].setText(`${marker} ${this.label(row).padEnd(18)} ${value}`);
      this.rowTexts[index].setColor(index === this.selected ? PaletteHex.neonCyan : PaletteHex.warmPaper);
    });
  }

  private label(row: SettingRow): string {
    return {
      masterVolume: 'Master volume',
      musicVolume: 'Music volume',
      sfxVolume: 'SFX volume',
      reducedShake: 'Reduced shake',
      reducedParticles: 'Reduced particles',
      highContrast: 'High contrast',
      touchControls: 'Touch controls',
      touchOpacity: 'Touch opacity'
    }[row];
  }

  private formatValue(row: SettingRow): string {
    const value = this.settings[row];
    return typeof value === 'number' ? `${Math.round(value * 100)}%` : String(value).toUpperCase();
  }

  private back(): void {
    if (this.leaving) return;
    this.leaving = true;
    SaveSystem.saveSettings(this.settings);
    this.audio.play(GameAudioKey.UiBack, { variation: false });
    this.time.delayedCall(240, () => this.scene.start(SceneKey.Title));
  }
}

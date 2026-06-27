import * as Phaser from 'phaser';
import { PaletteHex } from '../config/palette';
import { RuntimeEnvironmentAssetKey } from '../data/artAssets';
import { formatWardenHealth } from '../entities/LanternWarden';
import type { PlayerRuntimeState } from '../entities/Player';

export type HudUpdateState = {
  readonly player: PlayerRuntimeState;
  readonly elapsedMs: number;
  readonly scrollsFound: number;
  readonly sealsFound: number;
  readonly currentSection: string;
  readonly objective: string;
  readonly checkpointMessage: string;
  readonly warden: { readonly current: number; readonly max: number; readonly state: string; readonly attack: string } | null;
};

export class Hud {
  private readonly panel: Phaser.GameObjects.TileSprite;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly scrollText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly objectiveText: Phaser.GameObjects.Text;
  private readonly checkpointText: Phaser.GameObjects.Text;
  private readonly wardenText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.panel = scene.add.tileSprite(480, 42, 930, 82, RuntimeEnvironmentAssetKey.GroundTile).setAlpha(0.48).setDepth(80).setScrollFactor(0);
    this.hpText = scene.add.text(24, 18, '', this.style(PaletteHex.warmPaper)).setDepth(81).setScrollFactor(0);
    this.scrollText = scene.add.text(178, 18, '', this.style(PaletteHex.paleMoonMist)).setDepth(81).setScrollFactor(0);
    this.timerText = scene.add.text(330, 18, '', this.style(PaletteHex.neonCyan)).setDepth(81).setScrollFactor(0);
    this.objectiveText = scene.add.text(24, 50, '', this.smallStyle(PaletteHex.warmPaper)).setDepth(81).setScrollFactor(0);
    this.checkpointText = scene.add.text(650, 50, '', this.smallStyle(PaletteHex.lanternGold)).setDepth(81).setScrollFactor(0);
    this.wardenText = scene.add.text(610, 18, '', this.style(PaletteHex.enemyAmber)).setDepth(81).setScrollFactor(0);
  }

  update(state: HudUpdateState): void {
    this.hpText.setText(`HP ${state.player.hp}/${state.player.maxHp}`);
    this.scrollText.setText(`SCROLL ${state.scrollsFound}/3`);
    this.timerText.setText(`TIME ${this.formatTime(state.elapsedMs)}`);
    this.objectiveText.setText(`${state.currentSection} - ${state.objective}`);
    this.checkpointText.setText(state.checkpointMessage);
    this.wardenText.setText(
      state.warden ? `WARDEN ${formatWardenHealth(state.warden.current, state.warden.max)} ${state.warden.state}` : ''
    );
    this.panel.setTint(state.player.invulnerable ? 0xfff0c0 : 0xffffff);
  }

  private formatTime(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private style(color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Consolas, monospace',
      fontSize: '18px',
      color
    };
  }

  private smallStyle(color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Consolas, monospace',
      fontSize: '14px',
      color
    };
  }
}

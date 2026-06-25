import * as Phaser from 'phaser';
import { BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import { PlayerBalance } from '../data/balance';
import type { SectionDefinition } from '../types/stage';
import { formatTime } from '../utils/math';

export interface StageHudState {
  readonly elapsedMs: number;
  readonly hp: number;
  readonly seals: number;
  readonly scrolls: number;
  readonly section: SectionDefinition;
  readonly minibossStarted: boolean;
  readonly minibossDefeated: boolean;
  readonly minibossHealthRatio: number;
}

export class StageHud {
  private readonly hudText: Phaser.GameObjects.Text;
  private readonly sectionText: Phaser.GameObjects.Text;
  private readonly objectiveText: Phaser.GameObjects.Text;
  private readonly bossBar: Phaser.GameObjects.Graphics;
  private lastSectionId = '';

  constructor(private readonly scene: Phaser.Scene) {
    scene.add.rectangle(BASE_WIDTH / 2, 26, BASE_WIDTH, 52, Palette.ink0, 0.64).setDepth(998).setScrollFactor(0);
    this.hudText = scene.add.text(18, 10, '', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: PaletteCss.white
    }).setDepth(1000).setScrollFactor(0);
    this.sectionText = scene.add.text(BASE_WIDTH / 2, 74, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: PaletteCss.cyan,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000).setScrollFactor(0);
    this.objectiveText = scene.add.text(BASE_WIDTH - 18, 12, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: PaletteCss.gold,
      align: 'right',
      fixedWidth: 310
    }).setOrigin(1, 0).setDepth(1000).setScrollFactor(0);
    this.bossBar = scene.add.graphics().setDepth(1002).setScrollFactor(0);
  }

  update(state: StageHudState): void {
    if (state.section.id !== this.lastSectionId) {
      this.lastSectionId = state.section.id;
      this.sectionText.setText(state.section.name);
      this.sectionText.setAlpha(1);
      this.scene.tweens.add({ targets: this.sectionText, alpha: 0, duration: 1800, delay: 900 });
    }
    this.hudText.setText(
      `HP ${state.hp}/${PlayerBalance.maxHp}  Time ${formatTime(state.elapsedMs)}  Seals ${state.seals}/22  Scrolls ${state.scrolls}/3`
    );
    this.objectiveText.setText(this.objectiveForSection(state.section, state.minibossDefeated));
    this.drawBossBar(state);
  }

  setObjective(message: string): void {
    this.objectiveText.setText(message);
  }

  private drawBossBar(state: StageHudState): void {
    this.bossBar.clear();
    if (!state.minibossStarted || state.minibossDefeated) return;
    this.bossBar.fillStyle(Palette.ink0, 0.78);
    this.bossBar.fillRoundedRect(312, 48, 336, 18, 5);
    this.bossBar.fillStyle(Palette.red, 0.92);
    this.bossBar.fillRoundedRect(316, 52, 328 * state.minibossHealthRatio, 10, 4);
    this.bossBar.lineStyle(2, Palette.gold, 0.8);
    this.bossBar.strokeRoundedRect(312, 48, 336, 18, 5);
  }

  private objectiveForSection(section: SectionDefinition, minibossDefeated: boolean): string {
    if (section.id === 'lantern-warden-encounter') {
      return minibossDefeated ? 'Moon Gate unsealed' : 'Defeat Lantern Warden';
    }
    if (section.id === 'moon-gate-finish') {
      return minibossDefeated ? 'Enter the Moon Gate' : 'Return to the warden';
    }
    if (section.id.includes('hidden')) return 'Optional scroll route';
    if (section.id.includes('checkpoint')) return 'Touch the shrine';
    if (section.id.includes('wall')) return 'Climb the sign shaft';
    if (section.id.includes('thorn')) return 'Cross the neon thorns';
    return 'Deliver the shadow parcel';
  }
}

import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { Palette, PaletteHex } from '../config/palette';
import {
  ArtLockPhase,
  GateAApprovalStatus,
  GateAEvidenceFiles,
  GateBApprovalStatus,
  ReferenceIds,
  SelectedDirection
} from '../data/artLockGate';
import type { ArtLockQaState } from '../types/artLockQa';

export class GateAReviewScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.GateAReview);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.drawBackground();
    this.drawHeader();
    this.drawReferenceRail();
    this.drawSelectedDirection();
    this.drawEvidencePanel();
    this.drawApprovalNotice();
    this.publishQaState();
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(Palette.deepIndigo, Palette.deepIndigo, Palette.inkBlack, Palette.inkBlack, 1, 1, 1, 1);
    graphics.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    graphics.lineStyle(1, Palette.paleMoonMist, 0.16);
    for (let x = -40; x < BASE_WIDTH + 40; x += 34) {
      graphics.lineBetween(x, 0, x - 24, BASE_HEIGHT);
    }

    graphics.fillStyle(Palette.neonCyan, 0.12);
    graphics.fillCircle(734, 120, 84);
    graphics.lineStyle(2, Palette.neonMagenta, 0.26);
    graphics.strokeCircle(734, 120, 88);

    this.add.text(34, 498, 'Gate A review viewer only. Not final runtime art. Not a Stage 1 build.', {
      fontFamily: 'Consolas, monospace',
      fontSize: '14px',
      color: PaletteHex.paleMoonMist
    });
  }

  private drawHeader(): void {
    this.add.text(34, 30, 'NEON RONIN', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '54px',
      color: PaletteHex.neonCyan
    });
    this.add.text(456, 30, 'ART LOCK', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '54px',
      color: PaletteHex.neonMagenta
    });
    this.add.text(38, 92, 'Reference-driven visual production lock - Gate A package ready for explicit human approval.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: PaletteHex.warmPaper
    });
  }

  private drawReferenceRail(): void {
    const labels = [
      'Ink',
      'Light',
      'Signs',
      'Player',
      'Layers',
      'UI',
      'Slash',
      'Telegraph'
    ];

    ReferenceIds.forEach((id, index) => {
      const x = 40 + index * 108;
      const y = 136;
      const color = index % 2 === 0 ? Palette.neonCyan : Palette.neonMagenta;
      const hex = index % 2 === 0 ? PaletteHex.neonCyan : PaletteHex.neonMagenta;
      const graphics = this.add.graphics();
      graphics.lineStyle(2, color, 0.82);
      graphics.fillStyle(Palette.inkBlack, 0.74);
      graphics.fillRoundedRect(x, y, 84, 66, 6);
      graphics.strokeRoundedRect(x, y, 84, 66, 6);
      this.add.text(x + 13, y + 10, `Ref ${id}`, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color: hex
      });
      this.add.text(x + 12, y + 38, labels[index] ?? id, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: PaletteHex.warmPaper
      });
    });
  }

  private drawSelectedDirection(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(Palette.inkBlack, 0.76);
    graphics.fillRoundedRect(36, 232, 560, 220, 8);
    graphics.lineStyle(2, Palette.neutralGray, 0.5);
    graphics.strokeRoundedRect(36, 232, 560, 220, 8);

    this.add.text(58, 252, 'Selected Gate A Direction', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: PaletteHex.warmPaper
    });

    const rows = [
      ['Player', 'Candidate 2 courier body consistency.'],
      ['Title', 'Candidate 1 Moon Gate composition.'],
      ['Env', 'Candidate 1 seven-layer rainy alley.'],
      ['Enemies', 'Crawler 1, Kite 3, Warden 2.'],
      ['UI', 'Candidate 3 readable paper; strict cyan/magenta semantics.'],
      ['Gate', 'Gate A approval required before production work.']
    ];

    rows.forEach(([label, value], index) => {
      const y = 292 + index * 27;
      this.add.text(58, y, `${label}:`, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '14px',
        color: index % 2 === 0 ? PaletteHex.neonCyan : PaletteHex.neonMagenta
      });
      this.add.text(158, y, value, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: PaletteHex.paleMoonMist,
        wordWrap: { width: 390 }
      });
    });
  }

  private drawEvidencePanel(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(Palette.warmPaper, 0.9);
    graphics.fillRoundedRect(632, 232, 282, 220, 8);
    graphics.lineStyle(3, Palette.inkBlack, 0.86);
    graphics.strokeRoundedRect(632, 232, 282, 220, 8);

    this.add.text(654, 252, 'Gate A Evidence', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '23px',
      color: PaletteHex.inkBlack
    });

    GateAEvidenceFiles.slice(0, 8).forEach((file, index) => {
      this.add.text(656, 294 + index * 18, file, {
        fontFamily: 'Consolas, monospace',
        fontSize: '11px',
        color: PaletteHex.darkBlueGray
      });
    });

    this.add.text(656, 430, `+ ${GateAEvidenceFiles.length - 8} more evidence files`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: PaletteHex.darkBlueGray
    });
  }

  private drawApprovalNotice(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(Palette.neonMagenta, 0.18);
    graphics.fillRoundedRect(632, 462, 282, 42, 6);
    graphics.lineStyle(2, Palette.neonMagenta, 0.72);
    graphics.strokeRoundedRect(632, 462, 282, 42, 6);

    this.add.text(650, 474, 'Gate A: PENDING HUMAN APPROVAL', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color: PaletteHex.neonMagenta
    });
  }

  private publishQaState(): void {
    const state: ArtLockQaState = {
      scene: 'GateAReviewScene',
      phase: ArtLockPhase,
      gateAApproval: GateAApprovalStatus,
      gateBApproval: GateBApprovalStatus,
      references: ReferenceIds,
      evidenceFiles: GateAEvidenceFiles,
      selectedDirection: SelectedDirection,
      finalProductionRuntime: false
    };

    window.__NEON_RONIN_ART_LOCK__ = state;
  }
}

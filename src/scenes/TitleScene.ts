import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { ArtAssetKey, RuntimeAssetKeys } from '../data/artAssets';
import {
  ArtLockPhase,
  GateAApprovalStatus,
  GateAEvidenceFiles,
  GateBApprovalStatus,
  ReferenceIds,
  SelectedDirection
} from '../data/artLockGate';
import type { ArtLockQaState } from '../types/artLockQa';

export class TitleScene extends Phaser.Scene {
  private readonly layerKeys = [
    ArtAssetKey.LayerFarSky,
    ArtAssetKey.LayerDistantSkyline,
    ArtAssetKey.LayerMidRoofsSigns,
    ArtAssetKey.LayerGameplay,
    ArtAssetKey.LayerNearProps,
    ArtAssetKey.LayerNearPropsFront,
    ArtAssetKey.LayerForegroundOcclusion
  ];

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.drawParallaxTitle();
    this.drawLogo();
    this.drawMenu();
    this.publishQaState();
  }

  update(time: number): void {
    this.children.list.forEach((child) => {
      const tile = child as Phaser.GameObjects.TileSprite;
      if (tile instanceof Phaser.GameObjects.TileSprite && tile.getData('scrollSpeed')) {
        tile.tilePositionX = time * tile.getData('scrollSpeed');
      }
    });
  }

  private drawParallaxTitle(): void {
    const speeds = [0.004, 0.008, 0.014, 0.02, 0.028, 0.036, 0.044];
    this.layerKeys.forEach((key, index) => {
      const layer = this.add.tileSprite(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, key);
      layer.setAlpha([1, 0.86, 0.78, 0.9, 0.76, 0.58, 0.42][index] ?? 1);
      layer.setData('scrollSpeed', speeds[index]);
    });

    this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, ArtAssetKey.TitleComposition).setAlpha(0.34);
    this.add.image(696, 302, ArtAssetKey.PlayerMaster).setScale(0.28).setAlpha(0.92);
    this.add.sprite(642, 324, ArtAssetKey.Slash, 3).setScale(0.72).setAlpha(0.78);
  }

  private drawLogo(): void {
    const neon = this.add.text(54, 86, 'NEON', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '68px',
      color: PaletteHex.neonCyan
    });
    neon.setShadow(0, 0, PaletteHex.neonCyan, 14);

    const ronin = this.add.text(54, 154, 'RONIN', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '72px',
      color: PaletteHex.neonMagenta
    });
    ronin.setShadow(0, 0, PaletteHex.neonMagenta, 14);

    this.add.text(60, 226, 'SHADOW COURIER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: PaletteHex.warmPaper
    });

    this.add.text(60, 258, 'Reference-driven Art Lock build', {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    });
  }

  private drawMenu(): void {
    this.add.image(204, 426, ArtAssetKey.UiKit).setScale(0.34).setAlpha(0.64);
    const start = this.makeButton(74, 366, 'START REVIEW', () => this.scene.start(SceneKey.ArtLab));
    const lab = this.makeButton(74, 428, 'ART LAB', () => this.scene.start(SceneKey.ArtLab, { state: 'neutral' }));
    start.setData('defaultColor', PaletteHex.inkBlack);
    lab.setData('defaultColor', PaletteHex.neonCyan);

    this.add.text(60, 500, 'Gate A approved. Gate B pending explicit human approval.', {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: PaletteHex.paleMoonMist
    });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '25px',
      color: label === 'START REVIEW' ? PaletteHex.inkBlack : PaletteHex.neonCyan,
      backgroundColor: label === 'START REVIEW' ? PaletteHex.warmPaper : '#090C12',
      padding: { x: 18, y: 9 }
    });

    text.setInteractive({ useHandCursor: true })
      .on('pointerover', () => text.setColor(PaletteHex.neonMagenta))
      .on('pointerout', () => text.setColor(text.getData('defaultColor') as string))
      .on('pointerdown', () => text.setScale(0.97))
      .on('pointerup', () => {
        text.setScale(1);
        onClick();
      });

    return text;
  }

  private publishQaState(): void {
    const state: ArtLockQaState = {
      scene: 'TitleScene',
      phase: ArtLockPhase,
      gateAApproval: GateAApprovalStatus,
      gateBApproval: GateBApprovalStatus,
      references: ReferenceIds,
      evidenceFiles: GateAEvidenceFiles,
      selectedDirection: SelectedDirection,
      finalProductionRuntime: true,
      state: 'title',
      assetKeys: RuntimeAssetKeys,
      lightingPreset: 'warm-cool-alley',
      reducedFx: false,
      mobileReviewReady: true
    };

    window.__NEON_RONIN_ART_LOCK__ = state;
  }
}

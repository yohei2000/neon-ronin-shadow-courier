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
      layer.setAlpha([0.08, 0.08, 0.08, 0.10, 0.08, 0.06, 0.05][index] ?? 0.06);
      layer.setData('scrollSpeed', speeds[index]);
    });

    this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, ArtAssetKey.TitleComposition).setAlpha(1);
  }

  private drawLogo(): void {
    this.add.text(58, 296, 'Image-generated Gate B v2 Art Lock build', {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    });
  }

  private drawMenu(): void {
    this.add.image(724, 424, ArtAssetKey.TitleMenuPanel).setScale(0.54).setAlpha(0.94);
    this.add.text(632, 386, 'START REVIEW', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: PaletteHex.neonCyan
    }).setShadow(0, 0, PaletteHex.neonCyan, 8);
    this.add.text(632, 430, 'ART LAB', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: PaletteHex.warmPaper
    });
    this.add.zone(724, 388, 220, 42).setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start(SceneKey.ArtLab));
    this.add.zone(724, 432, 220, 42).setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start(SceneKey.ArtLab, { state: 'neutral' }));

    this.add.text(58, 504, 'Gate B v1 rejected. Gate B v2 pending explicit human approval.', {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: PaletteHex.paleMoonMist
    });
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

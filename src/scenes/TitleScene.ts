import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { Palette, PaletteHex } from '../config/palette';
import { ArtAssetKey, RuntimeAssetKeys } from '../data/artAssets';
import {
  ArtLockPhase,
  GateAApprovalStatus,
  GateAEvidenceFiles,
  GateBApprovalStatus,
  ReferenceIds,
  SelectedDirection
} from '../data/artLockGate';
import { SaveSystem } from '../systems/SaveSystem';
import type { ArtLockQaState } from '../types/artLockQa';
import '../types/stage1Qa';

type TitleMenuItem = {
  readonly label: string;
  readonly scene: SceneKey;
  readonly data?: Record<string, string>;
};

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
  private readonly menuItems: readonly TitleMenuItem[] = [
    { label: 'START STAGE 1', scene: SceneKey.Stage1 },
    { label: 'CONTROLS', scene: SceneKey.Controls },
    { label: 'SETTINGS', scene: SceneKey.Settings },
    { label: 'CREDITS / ABOUT', scene: SceneKey.Credits },
    { label: 'ART LAB', scene: SceneKey.ArtLab, data: { state: 'neutral' } }
  ];
  private selected = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private menuRows: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.selected = 0;
    this.menuTexts = [];
    this.menuRows = [];
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.drawParallaxTitle();
    this.drawLogo();
    this.drawMenu();
    this.bindInput();
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
    this.add.text(58, 282, 'NEON RONIN', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '54px',
      color: PaletteHex.neonCyan
    }).setShadow(0, 0, PaletteHex.neonCyan, 10);
    this.add.text(62, 338, 'Shadow Courier - Stage 1', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '25px',
      color: PaletteHex.neonMagenta
    }).setShadow(0, 0, PaletteHex.neonMagenta, 8);
    this.add.text(64, 374, 'Neon Alley: First Delivery', {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    });
  }

  private drawMenu(): void {
    this.add.image(724, 382, ArtAssetKey.TitleMenuPanel).setDisplaySize(472, 238).setAlpha(0.24);
    this.add
      .rectangle(724, 388, 384, 236, Palette.inkBlack, 0.84)
      .setStrokeStyle(2, Palette.neonCyan, 0.46);
    this.add.rectangle(724, 388, 404, 256, Palette.inkBlack, 0).setStrokeStyle(1, Palette.neonMagenta, 0.22);
    this.menuTexts = this.menuItems.map((item, index) => {
      const y = 304 + index * 42;
      const row = this.add
        .rectangle(724, y, 342, 34, Palette.inkBlack, 0.76)
        .setStrokeStyle(1, Palette.darkBlueGray, 0.92);
      const text = this.add.text(592, y, item.label, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '17px',
        color: PaletteHex.warmPaper
      }).setOrigin(0, 0.5);
      this.add.zone(724, y, 342, 38).setInteractive({ useHandCursor: true }).on('pointerup', () => this.activate(index));
      this.menuRows.push(row);
      return text;
    });
    this.renderMenu();

    const save = SaveSystem.load();
    this.add.text(58, 504, `Gate B v2 frozen. Stage1 best: ${save.stage1.bestTimeMs ? `${Math.floor(save.stage1.bestTimeMs / 1000)}s` : '--'}`, {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: PaletteHex.paleMoonMist
    });
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.removeAllListeners('keydown-UP');
    keyboard.removeAllListeners('keydown-W');
    keyboard.removeAllListeners('keydown-DOWN');
    keyboard.removeAllListeners('keydown-S');
    keyboard.removeAllListeners('keydown-ENTER');
    keyboard.on('keydown-UP', () => this.move(-1));
    keyboard.on('keydown-W', () => this.move(-1));
    keyboard.on('keydown-DOWN', () => this.move(1));
    keyboard.on('keydown-S', () => this.move(1));
    keyboard.on('keydown-ENTER', () => this.activate(this.selected));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.removeAllListeners('keydown-UP');
      keyboard.removeAllListeners('keydown-W');
      keyboard.removeAllListeners('keydown-DOWN');
      keyboard.removeAllListeners('keydown-S');
      keyboard.removeAllListeners('keydown-ENTER');
    });
  }

  private move(delta: number): void {
    this.selected = (this.selected + this.menuItems.length + delta) % this.menuItems.length;
    this.renderMenu();
  }

  private activate(index: number): void {
    const item = this.menuItems[index];
    this.scene.start(item.scene, item.data);
  }

  private renderMenu(): void {
    this.menuTexts.forEach((text, index) => {
      text.setColor(index === this.selected ? PaletteHex.neonCyan : PaletteHex.warmPaper);
      text.setText(`${index === this.selected ? '>' : ' '} ${this.menuItems[index].label}`);
      this.menuRows[index]?.setStrokeStyle(2, index === this.selected ? Palette.neonCyan : Palette.darkBlueGray, index === this.selected ? 0.96 : 0.76);
      this.menuRows[index]?.setFillStyle(Palette.inkBlack, index === this.selected ? 0.86 : 0.72);
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
    window.__NEON_RONIN_STAGE1_MENU__ = { scene: 'TitleScene' };
  }
}

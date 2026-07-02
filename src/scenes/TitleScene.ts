import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { ArtAssetKey, RuntimeAssetKeys, RuntimeSpriteAssetKey, RuntimeTitleAssetKey } from '../data/artAssets';
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
    { label: 'SETTINGS', scene: SceneKey.Settings }
  ];
  private selected = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private menuButtons: Phaser.GameObjects.Sprite[] = [];
  private selectionAura?: Phaser.GameObjects.Sprite;
  private activating = false;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.selected = 0;
    this.menuTexts = [];
    this.menuButtons = [];
    this.selectionAura = undefined;
    this.activating = false;
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.drawParallaxTitle();
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

  private drawMenu(): void {
    this.add.image(724, 388, ArtAssetKey.TitleMenuPanel).setDisplaySize(510, 254).setAlpha(0.1);
    this.add.image(724, 388, RuntimeTitleAssetKey.TitleMenuBacking).setDisplaySize(516, 254).setAlpha(0.95);
    this.add.sprite(244, 514, RuntimeTitleAssetKey.TitleMenuOptions, 0).setDisplaySize(392, 46).setAlpha(0.82);
    this.add.text(96, 514, 'NEON ALLEY: FIRST DELIVERY', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    }).setOrigin(0, 0.5);

    this.selectionAura = this.add
      .sprite(724, 318, RuntimeTitleAssetKey.TitleMenuOptions, 2)
      .setDisplaySize(430, 78)
      .setAlpha(0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.selectionAura,
      alpha: { from: 0.18, to: 0.36 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.menuTexts = this.menuItems.map((item, index) => {
      const y = 318 + index * 72;
      const button = this.add
        .sprite(724, y, RuntimeTitleAssetKey.TitleMenuOptions, 0)
        .setDisplaySize(404, 72)
        .setAlpha(0.9);
      const text = this.add.text(648, y, item.label, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '19px',
        color: PaletteHex.warmPaper
      }).setOrigin(0, 0.5).setShadow(0, 2, '#050508', 5, true, true);
      this.add.zone(724, y, 408, 74)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.select(index))
        .on('pointerdown', () => button.setFrame(3))
        .on('pointerout', () => this.renderMenu())
        .on('pointerup', () => this.activate(index));
      this.menuButtons.push(button);
      return text;
    });
    this.renderMenu();

    const save = SaveSystem.load();
    this.add.text(592, 506, `BEST ${save.stage1.bestTimeMs ? `${Math.floor(save.stage1.bestTimeMs / 1000)}s` : '--'}`, {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: PaletteHex.paleMoonMist
    });
  }

  private select(index: number): void {
    if (this.activating || index === this.selected) return;
    this.selected = index;
    this.renderMenu();
    this.spawnSelectionEffect(index);
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
    if (this.activating) return;
    this.selected = (this.selected + this.menuItems.length + delta) % this.menuItems.length;
    this.renderMenu();
    this.spawnSelectionEffect(this.selected);
  }

  private activate(index: number): void {
    if (this.activating) return;
    this.activating = true;
    this.selected = index;
    this.renderMenu();
    this.spawnConfirmEffect(index);
    this.menuButtons[index]?.play('title-menu-confirm', true);
    const item = this.menuItems[index];
    this.time.delayedCall(250, () => this.scene.start(item.scene, item.data));
  }

  private renderMenu(): void {
    this.menuTexts.forEach((text, index) => {
      const selected = index === this.selected;
      text.setColor(selected ? PaletteHex.neonCyan : PaletteHex.warmPaper);
      text.setText(this.menuItems[index].label);
      text.setAlpha(selected ? 1 : 0.84);
      const button = this.menuButtons[index];
      if (!button) return;
      if (selected && !this.activating) {
        button.play('title-menu-focus', true);
        button.setAlpha(1);
      } else {
        button.stop();
        button.setFrame(selected ? 2 : 0);
        button.setAlpha(selected ? 1 : 0.76);
      }
    });
    this.selectionAura?.setY(318 + this.selected * 72).setVisible(!this.activating);
  }

  private spawnSelectionEffect(index: number): void {
    const y = 318 + index * 72;
    const flare = this.add
      .sprite(724, y, RuntimeTitleAssetKey.TitleMenuOptions, 2)
      .setDisplaySize(420, 76)
      .setAlpha(0.42)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flare,
      alpha: 0,
      scaleX: flare.scaleX * 1.04,
      scaleY: flare.scaleY * 1.06,
      duration: 210,
      ease: 'Sine.easeOut',
      onComplete: () => flare.destroy()
    });
  }

  private spawnConfirmEffect(index: number): void {
    const y = 318 + index * 72;
    const flash = this.add
      .sprite(724, y, RuntimeTitleAssetKey.TitleMenuOptions, 3)
      .setDisplaySize(446, 84)
      .setAlpha(0.72)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: flash.scaleX * 1.08,
      scaleY: flash.scaleY * 1.08,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    const slash = this.add
      .sprite(812, y, RuntimeSpriteAssetKey.Slash)
      .setScale(1.18)
      .setAngle(-6)
      .setAlpha(0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    slash.play('slash-ground');
    slash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => slash.destroy());
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

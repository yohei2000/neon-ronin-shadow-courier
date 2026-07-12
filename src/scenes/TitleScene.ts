import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { PaletteHex } from '../config/palette';
import { GameAudioKey } from '../data/audioAssets';
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
import { GameAudio } from '../systems/Stage1Audio';
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
    { label: 'START STAGE 2', scene: SceneKey.Stage2 },
    { label: 'CONTROLS', scene: SceneKey.Controls },
    { label: 'SETTINGS', scene: SceneKey.Settings }
  ];
  private selected = 0;
  private menuButtons: Phaser.GameObjects.Sprite[] = [];
  private menuLabels: Phaser.GameObjects.Text[] = [];
  private selectionAura?: Phaser.GameObjects.Sprite;
  private activating = false;
  private audio!: GameAudio;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.audio = new GameAudio(this, SaveSystem.load().settings, 'menu');
    this.selected = 0;
    this.menuButtons = [];
    this.menuLabels = [];
    this.selectionAura = undefined;
    this.activating = false;
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.drawParallaxTitle();
    this.drawMenu();
    this.bindInput();
    this.publishQaState();
  }

  update(time: number, delta: number): void {
    this.audio.update({ bossIntensity: 0 }, delta);
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
    this.add.image(724, 388, ArtAssetKey.TitleMenuPanel)
      .setDisplaySize(510, 254)
      .setTintFill(0x030406)
      .setAlpha(0.22);
    this.add.image(244, 514, RuntimeTitleAssetKey.TitleMenuBacking).setDisplaySize(392, 46).setAlpha(0.38);
    this.add.text(96, 514, 'NEON ALLEY / NEON DRAIN', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color: PaletteHex.paleMoonMist
    }).setOrigin(0, 0.5);

    this.selectionAura = this.add
      .sprite(724, this.menuY(0), RuntimeTitleAssetKey.TitleMenuOptions, 2)
      .setDisplaySize(430, 78)
      .setAlpha(0.14)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.menuItems.forEach((item, index) => {
      const y = this.menuY(index);
      const visualIndex = this.visualMenuIndex(index);
      const button = this.add
        .sprite(724, y, RuntimeTitleAssetKey.TitleMenuOptions, visualIndex * 4)
        .setDisplaySize(404, 72)
        .setAlpha(0.9);
      const label = this.add.text(724, y, item.label, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color: PaletteHex.warmPaper,
        align: 'center'
      }).setOrigin(0.5);
      this.add.zone(724, y, 408, 74)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.select(index))
        .on('pointerdown', () => button.setFrame(visualIndex * 4 + 3))
        .on('pointerout', () => this.renderMenu())
        .on('pointerup', () => this.activate(index));
      this.menuButtons.push(button);
      this.menuLabels.push(label);
    });
    this.renderMenu();

    const save = SaveSystem.load();
    const stage1Best = save.stage1.bestTimeMs ? `${Math.floor(save.stage1.bestTimeMs / 1000)}s` : '--';
    const stage2Best = save.stage2.bestTimeMs ? `${Math.floor(save.stage2.bestTimeMs / 1000)}s` : '--';
    this.add.text(592, 506, `S1 ${stage1Best}   S2 ${stage2Best}`, {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: PaletteHex.paleMoonMist
    });
  }

  private select(index: number): void {
    if (this.activating || index === this.selected) return;
    this.selected = index;
    this.audio.play(GameAudioKey.UiMove, { variation: false });
    this.renderMenu();
    this.playSelectionAnimation(index);
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
    this.audio.play(GameAudioKey.UiMove, { variation: false });
    this.renderMenu();
    this.playSelectionAnimation(this.selected);
  }

  private activate(index: number): void {
    if (this.activating) return;
    this.activating = true;
    this.selected = index;
    this.renderMenu();
    this.spawnConfirmEffect(index);
    this.audio.play(GameAudioKey.UiConfirm, { variation: false });
    const visualIndex = this.visualMenuIndex(index);
    this.menuButtons[index]?.play(`title-menu-confirm-${visualIndex}`, true);
    const item = this.menuItems[index];
    this.time.delayedCall(300, () => this.scene.start(item.scene, item.data));
  }

  private renderMenu(): void {
    this.menuButtons.forEach((button, index) => {
      const selected = index === this.selected;
      const baseFrame = this.visualMenuIndex(index) * 4;
      if (!selected || this.activating || !button.anims.isPlaying) {
        button.stop();
        button.setFrame(selected ? baseFrame + 1 : baseFrame);
        button.setAlpha(selected ? 1 : 0.86);
      }
      this.menuLabels[index]?.setColor(selected ? PaletteHex.neonCyan : PaletteHex.warmPaper);
    });
    this.selectionAura?.setFrame(this.visualMenuIndex(this.selected) * 4 + 2).setY(this.menuY(this.selected)).setVisible(!this.activating);
    this.publishQaState();
  }

  private playSelectionAnimation(index: number): void {
    const button = this.menuButtons[index];
    if (!button) return;
    const visualIndex = this.visualMenuIndex(index);
    button.play(`title-menu-select-${visualIndex}`, true);
    button.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.selected === index && !this.activating) {
        button.setFrame(visualIndex * 4 + 1);
      }
    });

    const y = this.menuY(index);
    const flare = this.add
      .sprite(724, y, RuntimeTitleAssetKey.TitleMenuOptions, visualIndex * 4 + 2)
      .setDisplaySize(420, 76)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flare,
      alpha: 0,
      scaleX: flare.scaleX * 1.015,
      scaleY: flare.scaleY * 1.02,
      duration: 360,
      ease: 'Sine.easeOut',
      onComplete: () => flare.destroy()
    });
  }

  private spawnConfirmEffect(index: number): void {
    const y = this.menuY(index);
    const visualIndex = this.visualMenuIndex(index);
    const flash = this.add
      .sprite(724, y, RuntimeTitleAssetKey.TitleMenuOptions, visualIndex * 4 + 3)
      .setDisplaySize(446, 84)
      .setAlpha(0.46)
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
      .setScale(0.98)
      .setAngle(-6)
      .setAlpha(0.62)
      .setBlendMode(Phaser.BlendModes.ADD);
    slash.play('slash-ground');
    slash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => slash.destroy());
  }

  private menuY(index: number): number {
    return 286 + index * 58;
  }

  private visualMenuIndex(index: number): number {
    return index <= 1 ? 0 : index - 1;
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
    window.__NEON_RONIN_STAGE1_MENU__ = {
      scene: 'TitleScene',
      selectedIndex: this.selected,
      items: this.menuItems.map((item) => item.label),
      activating: this.activating
    };
  }
}

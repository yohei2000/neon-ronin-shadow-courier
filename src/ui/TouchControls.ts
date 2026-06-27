import * as Phaser from 'phaser';
import { PaletteHex } from '../config/palette';
import { RuntimeEnvironmentAssetKey, RuntimeItemFrame, RuntimeTouchFrame } from '../data/artAssets';
import type { Stage1Settings } from '../systems/SaveSystem';
import type { InputSystem } from '../systems/InputSystem';

type TouchButton = 'left' | 'right' | 'jump' | 'attack' | 'pause';

export class TouchControls {
  private readonly roots: Phaser.GameObjects.GameObject[] = [];
  private readonly labels = new Map<TouchButton, Phaser.GameObjects.Text>();
  private visible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly inputSystem: InputSystem,
    private readonly settings: Stage1Settings
  ) {
    this.visible = this.resolveVisible();
    this.create();
  }

  setEnabled(value: boolean): void {
    this.visible = value;
    for (const object of this.roots) {
      const item = object as unknown as { setVisible?: (visible: boolean) => void };
      item.setVisible?.(value);
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  updateOpacity(opacity: number): void {
    for (const object of this.roots) {
      const item = object as unknown as { setAlpha?: (alpha: number) => void };
      item.setAlpha?.(opacity);
    }
  }

  private create(): void {
    const opacity = this.settings.touchOpacity;
    const pad = this.scene.add
      .sprite(142, 452, RuntimeEnvironmentAssetKey.TouchControls, RuntimeTouchFrame.Dpad)
      .setDisplaySize(224, 156)
      .setDepth(90)
      .setScrollFactor(0)
      .setAlpha(opacity);
    const jump = this.scene.add
      .sprite(748, 454, RuntimeEnvironmentAssetKey.ItemIcons, RuntimeItemFrame.Energy)
      .setDisplaySize(86, 86)
      .setDepth(90)
      .setScrollFactor(0)
      .setAlpha(opacity);
    const attack = this.scene.add
      .sprite(866, 426, RuntimeEnvironmentAssetKey.TouchControls, RuntimeTouchFrame.Slash)
      .setDisplaySize(116, 104)
      .setDepth(90)
      .setScrollFactor(0)
      .setAlpha(opacity);
    this.roots.push(pad, jump, attack);

    this.addButton('left', 80, 452, 92, 92, '<');
    this.addButton('right', 205, 452, 92, 92, '>');
    this.addButton('jump', 748, 454, 96, 96, 'JUMP');
    this.addButton('attack', 866, 426, 104, 104, 'SLASH');
    this.addButton('pause', 900, 78, 78, 62, 'II');
    this.setEnabled(this.visible);
  }

  private addButton(button: TouchButton, x: number, y: number, width: number, height: number, label: string): void {
    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: button === 'pause' ? '18px' : '16px',
        color: PaletteHex.warmPaper,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(91)
      .setScrollFactor(0)
      .setAlpha(this.settings.touchOpacity);
    const zone = this.scene.add.zone(x, y, width, height).setInteractive({ useHandCursor: false }).setDepth(92).setScrollFactor(0);
    zone.on('pointerdown', () => this.press(button, true));
    zone.on('pointerup', () => this.press(button, false));
    zone.on('pointerout', () => this.press(button, false));
    zone.on('pointercancel', () => this.press(button, false));
    this.labels.set(button, text);
    this.roots.push(text, zone);
  }

  private press(button: TouchButton, pressed: boolean): void {
    this.inputSystem.setTouchButton(button, pressed);
    const label = this.labels.get(button);
    label?.setColor(pressed ? PaletteHex.neonCyan : PaletteHex.warmPaper);
    label?.setScale(pressed ? 1.08 : 1);
  }

  private resolveVisible(): boolean {
    if (this.settings.touchControls === 'on') return true;
    if (this.settings.touchControls === 'off') return false;
    return window.innerWidth <= 640 || window.matchMedia('(pointer: coarse)').matches;
  }
}

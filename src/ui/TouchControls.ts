import * as Phaser from 'phaser';
import { PaletteHex } from '../config/palette';
import { RuntimeEnvironmentAssetKey, RuntimeItemFrame, RuntimeTouchFrame } from '../data/artAssets';
import type { Stage1Settings } from '../systems/SaveSystem';
import type { InputSystem, TouchButton } from '../systems/InputSystem';

export class TouchControls {
  private readonly roots: Phaser.GameObjects.GameObject[] = [];
  private readonly zones: Phaser.GameObjects.Zone[] = [];
  private readonly labels = new Map<TouchButton, Phaser.GameObjects.Text>();
  private readonly activePointers = new Map<TouchButton, Set<number>>();
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
    if (!value) this.releaseAll();
    for (const object of this.roots) {
      const item = object as unknown as { setVisible?: (visible: boolean) => void };
      item.setVisible?.(value);
    }
    for (const zone of this.zones) {
      if (value) zone.setInteractive({ useHandCursor: false });
      else zone.disableInteractive();
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

    this.addButton('left', 80, 452, 112, 118, '<');
    this.addButton('right', 205, 452, 112, 118, '>');
    this.addButton('jump', 748, 454, 124, 124, 'JUMP');
    this.addButton('attack', 866, 426, 124, 124, 'SLASH');
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
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.press(button, pointer));
    zone.on('pointerup', (pointer: Phaser.Input.Pointer) => this.release(button, pointer));
    zone.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => this.release(button, pointer));
    zone.on('pointerout', (pointer: Phaser.Input.Pointer) => this.release(button, pointer));
    zone.on('pointercancel', (pointer: Phaser.Input.Pointer) => this.release(button, pointer));
    this.labels.set(button, text);
    this.activePointers.set(button, new Set());
    this.zones.push(zone);
    this.roots.push(text, zone);
  }

  private press(button: TouchButton, pointer: Phaser.Input.Pointer): void {
    this.activePointers.get(button)?.add(this.pointerId(pointer));
    this.syncButton(button);
  }

  private release(button: TouchButton, pointer: Phaser.Input.Pointer): void {
    this.activePointers.get(button)?.delete(this.pointerId(pointer));
    this.syncButton(button);
  }

  private syncButton(button: TouchButton): void {
    const pressed = (this.activePointers.get(button)?.size ?? 0) > 0;
    this.inputSystem.setTouchButton(button, pressed);
    const label = this.labels.get(button);
    label?.setColor(pressed ? PaletteHex.neonCyan : PaletteHex.warmPaper);
    label?.setScale(pressed ? 1.08 : 1);
  }

  private releaseAll(): void {
    for (const button of this.activePointers.keys()) {
      this.activePointers.get(button)?.clear();
      this.syncButton(button);
    }
  }

  private pointerId(pointer: Phaser.Input.Pointer): number {
    const pointerLike = pointer as unknown as { pointerId?: number };
    return typeof pointerLike.pointerId === 'number' ? pointerLike.pointerId : pointer.id;
  }

  private resolveVisible(): boolean {
    if (this.settings.touchControls === 'on') return true;
    if (this.settings.touchControls === 'off') return false;
    return window.innerWidth <= 640 || window.matchMedia('(pointer: coarse)').matches;
  }
}

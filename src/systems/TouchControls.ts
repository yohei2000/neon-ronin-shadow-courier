import * as Phaser from 'phaser';
import { TouchControlNames, type TouchControlName } from '../config/controls';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette } from '../config/palette';
import type { GameSettings } from '../types/save';

type TouchState = Record<TouchControlName, boolean>;
interface TouchHitArea {
  readonly name: TouchControlName;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly circle: Phaser.GameObjects.Arc;
}

export class TouchControls {
  private readonly state: TouchState = Object.fromEntries(
    TouchControlNames.map((name) => [name, false])
  ) as TouchState;
  private readonly container: Phaser.GameObjects.Container;
  private readonly buttons: Phaser.GameObjects.GameObject[] = [];
  private readonly hitAreas: TouchHitArea[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly settings: GameSettings
  ) {
    this.container = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0);
    this.build();
    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointerup', this.releaseAll, this);
    scene.input.on('pointerupoutside', this.releaseAll, this);
    this.setVisible(this.shouldShow());
  }

  isDown(name: string): boolean {
    return this.state[name as TouchControlName] ?? false;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
    if (typeof document !== 'undefined') {
      document.body.dataset.touchControls = visible ? 'visible' : 'hidden';
    }
  }

  destroy(): void {
    if (typeof document !== 'undefined') {
      delete document.body.dataset.touchControls;
    }
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointerup', this.releaseAll, this);
    this.scene.input.off('pointerupoutside', this.releaseAll, this);
    this.container.destroy(true);
  }

  private shouldShow(): boolean {
    if (this.settings.touchUiMode === 'on') {
      return true;
    }
    if (this.settings.touchUiMode === 'off') {
      return false;
    }
    const hasTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
    const narrowDisplay = this.scene.scale.displaySize.width <= 760;
    return hasTouch || narrowDisplay;
  }

  private build(): void {
    const opacity = this.settings.touchUiOpacity;
    this.addButton('left', 72, BASE_HEIGHT - 88, 44, '<', opacity);
    this.addButton('right', 168, BASE_HEIGHT - 88, 44, '>', opacity);
    this.addButton('up', 120, BASE_HEIGHT - 136, 38, '^', opacity);
    this.addButton('down', 120, BASE_HEIGHT - 40, 38, 'v', opacity);
    this.addButton('jump', BASE_WIDTH - 235, BASE_HEIGHT - 90, 44, 'JMP', opacity);
    this.addButton('attack', BASE_WIDTH - 124, BASE_HEIGHT - 104, 46, 'ATK', opacity);
    this.addButton('pause', BASE_WIDTH - 190, BASE_HEIGHT - 28, 30, 'II', opacity);
  }

  private addButton(
    name: TouchControlName,
    x: number,
    y: number,
    radius: number,
    label: string,
    opacity: number
  ): void {
    const circle = this.scene.add.circle(x, y, radius, Palette.ink2, opacity);
    circle.setStrokeStyle(3, Palette.cyan, 0.8);
    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: label.length > 1 ? '14px' : '24px',
        color: '#f8fbff'
      })
      .setOrigin(0.5);
    const hitZone = this.scene.add.zone(x, y, radius * 2, radius * 2).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      this.state[name] = true;
      circle.setFillStyle(Palette.magenta, Math.min(1, opacity + 0.15));
    });
    const release = () => {
      this.state[name] = false;
      circle.setFillStyle(Palette.ink2, opacity);
    };
    hitZone.on('pointerup', release);
    hitZone.on('pointerout', release);
    hitZone.on('pointerupoutside', release);
    this.container.add([circle, text, hitZone]);
    this.buttons.push(circle, text, hitZone);
    this.hitAreas.push({ name, x, y, radius: radius * 1.2, circle });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.container.visible) return;
    const area = this.hitAreas.find((hitArea) => {
      const dx = pointer.x - hitArea.x;
      const dy = pointer.y - hitArea.y;
      return dx * dx + dy * dy <= hitArea.radius * hitArea.radius;
    });
    if (!area) return;
    pointer.event?.preventDefault();
    this.state[area.name] = true;
    area.circle.setFillStyle(Palette.magenta, Math.min(1, this.settings.touchUiOpacity + 0.15));
  }

  private releaseAll(): void {
    for (const name of TouchControlNames) {
      this.state[name] = false;
    }
    for (const gameObject of this.buttons) {
      if (gameObject instanceof Phaser.GameObjects.Arc) {
        gameObject.setFillStyle(Palette.ink2, this.settings.touchUiOpacity);
      }
    }
  }
}

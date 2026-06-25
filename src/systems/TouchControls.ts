import * as Phaser from 'phaser';
import { TouchControlNames, type TouchControlName } from '../config/controls';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette } from '../config/palette';
import type { GameSettings } from '../types/save';

type TouchState = Record<TouchControlName, boolean>;

export class TouchControls {
  private readonly state: TouchState = Object.fromEntries(
    TouchControlNames.map((name) => [name, false])
  ) as TouchState;
  private readonly container: Phaser.GameObjects.Container;
  private readonly buttons: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly settings: GameSettings
  ) {
    this.container = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0);
    this.build();
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
    this.addButton('jump', BASE_WIDTH - 258, BASE_HEIGHT - 96, 42, 'JMP', opacity);
    this.addButton('attack', BASE_WIDTH - 162, BASE_HEIGHT - 120, 42, 'ATK', opacity);
    this.addButton('dash', BASE_WIDTH - 198, BASE_HEIGHT - 42, 39, 'DSH', opacity);
    this.addButton('art', BASE_WIDTH - 82, BASE_HEIGHT - 70, 42, 'ART', opacity);
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
    circle.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);
    circle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      this.state[name] = true;
      circle.setFillStyle(Palette.magenta, Math.min(1, opacity + 0.15));
    });
    const release = () => {
      this.state[name] = false;
      circle.setFillStyle(Palette.ink2, opacity);
    };
    circle.on('pointerup', release);
    circle.on('pointerout', release);
    circle.on('pointerupoutside', release);
    this.container.add([circle, text]);
    this.buttons.push(circle, text);
  }
}

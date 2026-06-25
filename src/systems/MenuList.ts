import * as Phaser from 'phaser';
import { PaletteCss } from '../config/palette';

export interface MenuItemDefinition {
  readonly label: string;
  readonly action: () => void;
  readonly disabled?: boolean;
}

export class MenuList {
  private readonly rows: Phaser.GameObjects.Text[] = [];
  private selected = 0;
  private readonly upKey: Phaser.Input.Keyboard.Key | null;
  private readonly downKey: Phaser.Input.Keyboard.Key | null;
  private readonly confirmKey: Phaser.Input.Keyboard.Key | null;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly items: readonly MenuItemDefinition[],
    fontSize = 24
  ) {
    this.upKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP) ?? null;
    this.downKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN) ?? null;
    this.confirmKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null;
    items.forEach((item, index) => {
      const row = scene.add
        .text(x, y + index * (fontSize + 13), item.label, {
          fontFamily: 'monospace',
          fontSize: `${fontSize}px`,
          color: item.disabled ? '#687083' : PaletteCss.white
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: !item.disabled });
      row.on('pointerover', () => {
        if (!item.disabled) {
          this.selected = index;
          this.render();
        }
      });
      row.on('pointerdown', () => {
        if (!item.disabled) {
          item.action();
        }
      });
      this.rows.push(row);
    });
    this.selected = Math.max(0, items.findIndex((item) => !item.disabled));
    this.render();
  }

  update(): void {
    if (this.upKey && Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.move(-1);
    }
    if (this.downKey && Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.move(1);
    }
    if (this.confirmKey && Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
      const item = this.items[this.selected];
      if (item && !item.disabled) {
        item.action();
      }
    }
  }

  destroy(): void {
    this.rows.forEach((row) => row.destroy());
  }

  private move(direction: number): void {
    let next = this.selected;
    for (let attempt = 0; attempt < this.items.length; attempt += 1) {
      next = (next + direction + this.items.length) % this.items.length;
      if (!this.items[next].disabled) {
        this.selected = next;
        this.render();
        return;
      }
    }
  }

  private render(): void {
    this.rows.forEach((row, index) => {
      const item = this.items[index];
      const prefix = index === this.selected && !item.disabled ? '> ' : '  ';
      row.setText(`${prefix}${item.label}`);
      row.setColor(item.disabled ? '#687083' : index === this.selected ? PaletteCss.cyan : PaletteCss.white);
    });
  }
}

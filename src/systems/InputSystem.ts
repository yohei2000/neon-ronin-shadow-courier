import * as Phaser from 'phaser';
import { KeyboardControls } from '../config/controls';
import type { ButtonState, InputState } from '../types/input';
import { TouchControls } from './TouchControls';

type ActionName = keyof Omit<InputState, 'horizontal' | 'vertical'>;
type KeyMap = Record<ActionName, Phaser.Input.Keyboard.Key[]>;
type DownMap = Record<ActionName, boolean>;

const keyCodes: Record<string, number> = {
  A: Phaser.Input.Keyboard.KeyCodes.A,
  D: Phaser.Input.Keyboard.KeyCodes.D,
  W: Phaser.Input.Keyboard.KeyCodes.W,
  J: Phaser.Input.Keyboard.KeyCodes.J,
  K: Phaser.Input.Keyboard.KeyCodes.K,
  L: Phaser.Input.Keyboard.KeyCodes.L,
  Z: Phaser.Input.Keyboard.KeyCodes.Z,
  X: Phaser.Input.Keyboard.KeyCodes.X,
  P: Phaser.Input.Keyboard.KeyCodes.P,
  LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
  RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
  UP: Phaser.Input.Keyboard.KeyCodes.UP,
  DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
  SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
  SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
  ESC: Phaser.Input.Keyboard.KeyCodes.ESC
};

const actionNames: readonly ActionName[] = [
  'left',
  'right',
  'up',
  'down',
  'jump',
  'dash',
  'attack',
  'art',
  'confirm',
  'pause'
];

export class InputSystem {
  private readonly keys: KeyMap;
  private previous: DownMap;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly touchControls: TouchControls | null = null
  ) {
    this.keys = Object.fromEntries(
      actionNames.map((action) => [action, this.makeKeys(action)])
    ) as KeyMap;
    this.keys.down = [this.scene.input.keyboard?.addKey(keyCodes.DOWN)].filter(
      (key): key is Phaser.Input.Keyboard.Key => Boolean(key)
    );
    this.previous = Object.fromEntries(actionNames.map((action) => [action, false])) as DownMap;
  }

  sample(): InputState {
    const buttons = Object.fromEntries(
      actionNames.map((action) => {
        const down = this.isKeyboardDown(action) || (this.touchControls?.isDown(action) ?? false);
        const previous = this.previous[action];
        this.previous[action] = down;
        return [action, { down, pressed: down && !previous, released: !down && previous }];
      })
    ) as Record<ActionName, ButtonState>;
    const horizontal = (buttons.right.down ? 1 : 0) - (buttons.left.down ? 1 : 0);
    const vertical = (buttons.down.down ? 1 : 0) - (buttons.up.down ? 1 : 0);
    return {
      ...buttons,
      horizontal,
      vertical
    };
  }

  destroy(): void {
    this.touchControls?.destroy();
  }

  private isKeyboardDown(action: ActionName): boolean {
    return this.keys[action].some((key) => key.isDown);
  }

  private makeKeys(action: ActionName): Phaser.Input.Keyboard.Key[] {
    if (!this.scene.input.keyboard) {
      return [];
    }
    const names =
      action === 'up'
        ? KeyboardControls.up
        : action === 'down'
          ? ['DOWN']
          : KeyboardControls[action as keyof typeof KeyboardControls] ?? [];
    return names.map((name) => this.scene.input.keyboard!.addKey(keyCodes[name]));
  }
}

import * as Phaser from 'phaser';

export type Stage1InputSnapshot = {
  readonly moveX: -1 | 0 | 1;
  readonly jumpDown: boolean;
  readonly jumpPressed: boolean;
  readonly jumpReleased: boolean;
  readonly attackDown: boolean;
  readonly attackPressed: boolean;
  readonly techniqueDown: boolean;
  readonly techniquePressed: boolean;
  readonly pausePressed: boolean;
  readonly confirmPressed: boolean;
  readonly retryPressed: boolean;
  readonly restartPressed: boolean;
};

export type TouchButton = 'left' | 'right' | 'jump' | 'attack' | 'technique' | 'pause';

export class InputSystem {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly touch = new Map<TouchButton, boolean>();
  private previousJump = false;
  private previousAttack = false;
  private previousTechnique = false;
  private previousPause = false;
  private previousConfirm = false;
  private previousRetry = false;
  private previousRestart = false;
  private snapshot: Stage1InputSnapshot = {
    moveX: 0,
    jumpDown: false,
    jumpPressed: false,
    jumpReleased: false,
    attackDown: false,
    attackPressed: false,
    techniqueDown: false,
    techniquePressed: false,
    pausePressed: false,
    confirmPressed: false,
    retryPressed: false,
    restartPressed: false
  };

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.keys = (keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attackJ: Phaser.Input.Keyboard.KeyCodes.J,
      attackZ: Phaser.Input.Keyboard.KeyCodes.Z,
      techniqueK: Phaser.Input.Keyboard.KeyCodes.K,
      techniqueX: Phaser.Input.Keyboard.KeyCodes.X,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      t: Phaser.Input.Keyboard.KeyCodes.T
    }) ?? {}) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  update(): Stage1InputSnapshot {
    const left = this.keyDown('left') || this.keyDown('a') || this.touch.get('left') === true;
    const right = this.keyDown('right') || this.keyDown('d') || this.touch.get('right') === true;
    const jump = this.keyDown('up') || this.keyDown('w') || this.keyDown('space') || this.touch.get('jump') === true;
    const attack = this.keyDown('attackJ') || this.keyDown('attackZ') || this.touch.get('attack') === true;
    const technique = this.keyDown('techniqueK') || this.keyDown('techniqueX') || this.touch.get('technique') === true;
    const pause = this.keyDown('escape') || this.keyDown('p') || this.touch.get('pause') === true;
    const confirm = this.keyDown('enter');
    const retry = this.keyDown('r');
    const restart = this.keyDown('t');

    this.snapshot = {
      moveX: left && !right ? -1 : right && !left ? 1 : 0,
      jumpDown: jump,
      jumpPressed: jump && !this.previousJump,
      jumpReleased: !jump && this.previousJump,
      attackDown: attack,
      attackPressed: attack && !this.previousAttack,
      techniqueDown: technique,
      techniquePressed: technique && !this.previousTechnique,
      pausePressed: pause && !this.previousPause,
      confirmPressed: confirm && !this.previousConfirm,
      retryPressed: retry && !this.previousRetry,
      restartPressed: restart && !this.previousRestart
    };

    this.previousJump = jump;
    this.previousAttack = attack;
    this.previousTechnique = technique;
    this.previousPause = pause;
    this.previousConfirm = confirm;
    this.previousRetry = retry;
    this.previousRestart = restart;

    return this.snapshot;
  }

  setTouchButton(button: TouchButton, pressed: boolean): void {
    this.touch.set(button, pressed);
  }

  getTouchButtons(): Record<TouchButton, boolean> {
    return {
      left: this.touch.get('left') === true,
      right: this.touch.get('right') === true,
      jump: this.touch.get('jump') === true,
      attack: this.touch.get('attack') === true,
      technique: this.touch.get('technique') === true,
      pause: this.touch.get('pause') === true
    };
  }

  getSnapshot(): Stage1InputSnapshot {
    return this.snapshot;
  }

  private keyDown(key: string): boolean {
    return this.keys[key]?.isDown === true;
  }
}

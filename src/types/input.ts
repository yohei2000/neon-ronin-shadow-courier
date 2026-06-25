export interface ButtonState {
  readonly down: boolean;
  readonly pressed: boolean;
  readonly released: boolean;
}

export interface InputState {
  readonly left: ButtonState;
  readonly right: ButtonState;
  readonly up: ButtonState;
  readonly down: ButtonState;
  readonly jump: ButtonState;
  readonly dash: ButtonState;
  readonly attack: ButtonState;
  readonly art: ButtonState;
  readonly confirm: ButtonState;
  readonly pause: ButtonState;
  readonly horizontal: number;
  readonly vertical: number;
}

export const emptyButton: ButtonState = {
  down: false,
  pressed: false,
  released: false
};

export const emptyInputState: InputState = {
  left: emptyButton,
  right: emptyButton,
  up: emptyButton,
  down: emptyButton,
  jump: emptyButton,
  dash: emptyButton,
  attack: emptyButton,
  art: emptyButton,
  confirm: emptyButton,
  pause: emptyButton,
  horizontal: 0,
  vertical: 0
};

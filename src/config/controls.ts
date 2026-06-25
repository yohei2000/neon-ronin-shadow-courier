export const KeyboardControls = {
  left: ['A', 'LEFT'],
  right: ['D', 'RIGHT'],
  up: ['W', 'UP'],
  jump: ['W', 'SPACE', 'UP'],
  attack: ['J', 'Z'],
  confirm: ['ENTER', 'SPACE'],
  pause: ['ESC', 'P']
} as const;

export const TouchControlNames = [
  'left',
  'right',
  'up',
  'down',
  'jump',
  'attack',
  'pause'
] as const;

export type TouchControlName = (typeof TouchControlNames)[number];

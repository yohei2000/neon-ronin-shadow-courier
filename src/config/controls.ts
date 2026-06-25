export const KeyboardControls = {
  left: ['A', 'LEFT'],
  right: ['D', 'RIGHT'],
  up: ['W', 'UP'],
  jump: ['W', 'SPACE', 'UP'],
  dash: ['SHIFT', 'L'],
  attack: ['J', 'Z'],
  art: ['K', 'X'],
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
  'dash',
  'art'
] as const;

export type TouchControlName = (typeof TouchControlNames)[number];

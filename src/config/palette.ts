export const Palette = {
  ink0: 0x05070f,
  ink1: 0x0b1020,
  ink2: 0x151b2e,
  moon: 0xdbeafe,
  smoke: 0x93a4ba,
  cyan: 0x26f8ff,
  cyanDark: 0x087d94,
  magenta: 0xff3df2,
  magentaDark: 0x97257e,
  gold: 0xffd166,
  green: 0x7dff9d,
  red: 0xff5c7a,
  violet: 0xa78bfa,
  white: 0xf8fbff,
  black: 0x000000
} as const;

export const PaletteCss = {
  ink0: '#05070f',
  ink1: '#0b1020',
  ink2: '#151b2e',
  moon: '#dbeafe',
  smoke: '#93a4ba',
  cyan: '#26f8ff',
  magenta: '#ff3df2',
  gold: '#ffd166',
  green: '#7dff9d',
  red: '#ff5c7a',
  violet: '#a78bfa',
  white: '#f8fbff'
} as const;

export const HighContrastPalette = {
  ...Palette,
  ink0: 0x000000,
  ink1: 0x080808,
  ink2: 0x181818,
  cyan: 0x00ffff,
  magenta: 0xff00ff,
  gold: 0xffff00,
  white: 0xffffff
} as const;

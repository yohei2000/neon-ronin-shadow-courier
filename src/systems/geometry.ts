import type { RectData } from '../data/stage1';

export type MutableRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const rectsOverlap = (a: RectData, b: RectData): boolean => {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

export const pointInRect = (x: number, y: number, rect: RectData): boolean => {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
};

export const centerRect = (x: number, y: number, width: number, height: number): MutableRect => ({
  x: x - width / 2,
  y: y - height / 2,
  width,
  height
});

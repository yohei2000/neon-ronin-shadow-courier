import type { GameSettings } from '../types/save';

export function applyDamageAssist(rawDamage: number, settings: GameSettings): number {
  void settings;
  return Math.max(1, rawDamage);
}

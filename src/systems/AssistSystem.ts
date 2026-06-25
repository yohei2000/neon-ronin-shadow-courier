import type { GameSettings } from '../types/save';

export function applyDamageAssist(rawDamage: number, settings: GameSettings): number {
  if (!settings.assist.reducedDamage) {
    return rawDamage;
  }
  return Math.max(1, rawDamage - 1);
}

export function checkpointHealAmount(settings: GameSettings): number {
  return settings.assist.checkpointHeal ? 2 : 0;
}

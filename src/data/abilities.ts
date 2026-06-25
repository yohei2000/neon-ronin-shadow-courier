import type { AbilityId, StageId } from '../types/game';

export const AbilityDisplay: Record<AbilityId, string> = {
  wallKick: 'Wall Kick',
  dash: 'Neon Dash',
  projectile: 'Kitsune Art',
  chargedSlash: 'Charged Slash',
  ultimateArt: 'Ultimate Art'
};

export const AbilityUnlockByStage: Record<StageId, AbilityId> = {
  1: 'wallKick',
  2: 'dash',
  3: 'projectile',
  4: 'chargedSlash',
  5: 'ultimateArt'
};

export const AbilityDescriptions: Record<AbilityId, string> = {
  wallKick: 'Kick away from walls while sliding.',
  dash: 'Burst through gaps and hazards with a short cooldown.',
  projectile: 'Spend energy to throw a neon seal projectile.',
  chargedSlash: 'Hold attack, then release for a shield-breaking slash.',
  ultimateArt: 'Spend high energy to damage the boss and erase nearby threats.'
};

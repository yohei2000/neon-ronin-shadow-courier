import { describe, expect, it } from 'vitest';
import { canAcceptDamage, nextInvulnerabilityUntil } from '../src/utils/combat';

describe('combat helpers', () => {
  it('blocks damage while the actor is dead', () => {
    expect(canAcceptDamage({ dead: true, time: 1200, invulnerableUntil: 0 })).toBe(false);
  });

  it('blocks damage during the invulnerability window', () => {
    expect(canAcceptDamage({ dead: false, time: 999, invulnerableUntil: 1000 })).toBe(false);
  });

  it('accepts damage when invulnerability has expired', () => {
    expect(canAcceptDamage({ dead: false, time: 1000, invulnerableUntil: 1000 })).toBe(true);
    expect(canAcceptDamage({ dead: false, time: 1100, invulnerableUntil: 1000 })).toBe(true);
  });

  it('computes non-negative invulnerability windows', () => {
    expect(nextInvulnerabilityUntil(500, 1000)).toBe(1500);
    expect(nextInvulnerabilityUntil(500, -1000)).toBe(500);
  });
});

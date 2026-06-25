export interface DamageGateInput {
  readonly dead: boolean;
  readonly time: number;
  readonly invulnerableUntil: number;
}

export function canAcceptDamage(input: DamageGateInput): boolean {
  return !input.dead && input.time >= input.invulnerableUntil;
}

export function nextInvulnerabilityUntil(time: number, durationMs: number): number {
  return time + Math.max(0, durationMs);
}

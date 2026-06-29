import type { RectData } from '../data/stage1';
import { Stage1Tuning } from '../data/stage1';
import { rectsOverlap } from './geometry';

export type SlashPhase = 'idle' | 'startup' | 'active' | 'recovery';
export type SlashMode = 'arc' | 'spin';

export type SlashState = {
  readonly phase: SlashPhase;
  readonly elapsedMs: number;
  readonly mode: SlashMode;
  readonly activeRect: RectData | null;
};

export const resolveSlashPhase = (elapsedMs: number): SlashPhase => {
  if (elapsedMs < 0) return 'idle';
  if (elapsedMs < Stage1Tuning.slashStartupMs) return 'startup';
  if (elapsedMs < Stage1Tuning.slashStartupMs + Stage1Tuning.slashActiveMs) return 'active';
  if (elapsedMs < Stage1Tuning.slashStartupMs + Stage1Tuning.slashActiveMs + Stage1Tuning.slashRecoveryMs) return 'recovery';
  return 'idle';
};

export const canTakeOverlapDamage = (nowMs: number, lastDamageMs: number, cooldownMs: number = Stage1Tuning.damageCooldownMs): boolean => {
  return nowMs - lastDamageMs >= cooldownMs;
};

export class CombatSystem {
  static buildSlashState(
    playerX: number,
    playerY: number,
    facing: -1 | 1,
    elapsedMs: number,
    mode: SlashMode = 'arc'
  ): SlashState {
    const phase = resolveSlashPhase(elapsedMs);
    return {
      phase,
      elapsedMs,
      mode,
      activeRect:
        phase === 'active'
          ? mode === 'spin'
            ? {
                x: playerX - 82,
                y: playerY - 104,
                width: 164,
                height: 164
              }
            : {
                x: playerX + facing * 18 + (facing > 0 ? 0 : -132),
                y: playerY - 58,
                width: 132,
                height: 92
              }
          : null
    };
  }

  static overlapsActiveSlash(slash: SlashState, target: RectData): boolean {
    return slash.phase === 'active' && slash.activeRect !== null && rectsOverlap(slash.activeRect, target);
  }
}

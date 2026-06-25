import type { StageRank } from './game';

export type TouchUiMode = 'auto' | 'on' | 'off';

export interface AssistSettings {
  readonly fallRescue: boolean;
}

export interface GameSettings {
  readonly masterVolume: number;
  readonly sfxVolume: number;
  readonly muted: boolean;
  readonly reducedShake: boolean;
  readonly reducedParticles: boolean;
  readonly highContrast: boolean;
  readonly touchUiMode: TouchUiMode;
  readonly touchUiOpacity: number;
  readonly assist: AssistSettings;
}

export interface StageStats {
  readonly bestTimeMs: number | null;
  readonly bestRank: StageRank | null;
  readonly scrolls: readonly string[];
  readonly cleared: boolean;
}

export interface SaveData {
  readonly schemaVersion: number;
  readonly stage1: StageStats;
  readonly settings: GameSettings;
}

export interface StageClearResult {
  readonly elapsedMs: number;
  readonly rank: StageRank;
  readonly scrolls: readonly string[];
  readonly damageTaken: number;
  readonly seals: number;
}

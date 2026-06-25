import type { AbilityId, StageId, StageRank } from './game';

export type TouchUiMode = 'auto' | 'on' | 'off';

export interface AssistSettings {
  readonly longerInvulnerability: boolean;
  readonly reducedDamage: boolean;
  readonly fallRescue: boolean;
  readonly checkpointHeal: boolean;
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
  readonly clears: number;
}

export type StageStatsRecord = Record<StageId, StageStats>;

export interface CompletionStats {
  readonly totalClears: number;
  readonly totalDefeats: number;
  readonly totalDamageTaken: number;
  readonly totalSeals: number;
}

export interface SaveData {
  readonly schemaVersion: number;
  readonly unlockedStages: readonly StageId[];
  readonly unlockedAbilities: readonly AbilityId[];
  readonly stageStats: StageStatsRecord;
  readonly settings: GameSettings;
  readonly hasClearedGame: boolean;
  readonly completionStats: CompletionStats;
}

export interface StageClearResult {
  readonly stageId: StageId;
  readonly elapsedMs: number;
  readonly rank: StageRank;
  readonly scrolls: readonly string[];
  readonly damageTaken: number;
  readonly defeats: number;
  readonly seals: number;
}

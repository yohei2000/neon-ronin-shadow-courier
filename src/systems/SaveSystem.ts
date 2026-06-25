import { AbilityUnlockByStage } from '../data/abilities';
import type { AbilityId, StageId } from '../types/game';
import { StageIds } from '../types/game';
import type {
  AssistSettings,
  CompletionStats,
  GameSettings,
  SaveData,
  StageClearResult,
  StageStats,
  StageStatsRecord
} from '../types/save';
import type { StorageLike } from '../utils/storage';
import { getBrowserStorage } from '../utils/storage';
import { clamp } from '../utils/math';

export const SAVE_KEY = 'neon-ronin-shadow-courier-save';
export const SAVE_SCHEMA_VERSION = 1;

const defaultAssist: AssistSettings = {
  longerInvulnerability: false,
  reducedDamage: false,
  fallRescue: true,
  checkpointHeal: true
};

const defaultSettings: GameSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  muted: false,
  reducedShake: false,
  reducedParticles: false,
  highContrast: false,
  touchUiMode: 'auto',
  touchUiOpacity: 0.72,
  assist: defaultAssist
};

const defaultCompletionStats: CompletionStats = {
  totalClears: 0,
  totalDefeats: 0,
  totalDamageTaken: 0,
  totalSeals: 0
};

function defaultStageStats(): StageStats {
  return {
    bestTimeMs: null,
    bestRank: null,
    scrolls: [],
    clears: 0
  };
}

function createStageStatsRecord(): StageStatsRecord {
  return {
    1: defaultStageStats(),
    2: defaultStageStats(),
    3: defaultStageStats(),
    4: defaultStageStats(),
    5: defaultStageStats()
  };
}

export function createDefaultSave(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    unlockedStages: [1],
    unlockedAbilities: [],
    stageStats: createStageStatsRecord(),
    settings: defaultSettings,
    hasClearedGame: false,
    completionStats: defaultCompletionStats
  };
}

function isStageId(value: unknown): value is StageId {
  return typeof value === 'number' && StageIds.includes(value as StageId);
}

function isAbilityId(value: unknown): value is AbilityId {
  return (
    value === 'wallKick' ||
    value === 'dash' ||
    value === 'projectile' ||
    value === 'chargedSlash' ||
    value === 'ultimateArt'
  );
}

function mergeSettings(value: unknown): GameSettings {
  const source = typeof value === 'object' && value !== null ? (value as Partial<GameSettings>) : {};
  const assistSource: Partial<AssistSettings> =
    typeof source.assist === 'object' && source.assist !== null ? source.assist : {};
  const mode =
    source.touchUiMode === 'on' || source.touchUiMode === 'off' || source.touchUiMode === 'auto'
      ? source.touchUiMode
      : defaultSettings.touchUiMode;
  return {
    masterVolume: clamp(Number(source.masterVolume ?? defaultSettings.masterVolume), 0, 1),
    sfxVolume: clamp(Number(source.sfxVolume ?? defaultSettings.sfxVolume), 0, 1),
    muted: Boolean(source.muted ?? defaultSettings.muted),
    reducedShake: Boolean(source.reducedShake ?? defaultSettings.reducedShake),
    reducedParticles: Boolean(source.reducedParticles ?? defaultSettings.reducedParticles),
    highContrast: Boolean(source.highContrast ?? defaultSettings.highContrast),
    touchUiMode: mode,
    touchUiOpacity: clamp(Number(source.touchUiOpacity ?? defaultSettings.touchUiOpacity), 0.25, 1),
    assist: {
      longerInvulnerability: Boolean(
        assistSource.longerInvulnerability ?? defaultAssist.longerInvulnerability
      ),
      reducedDamage: Boolean(assistSource.reducedDamage ?? defaultAssist.reducedDamage),
      fallRescue: Boolean(assistSource.fallRescue ?? defaultAssist.fallRescue),
      checkpointHeal: Boolean(assistSource.checkpointHeal ?? defaultAssist.checkpointHeal)
    }
  };
}

function mergeStageStats(value: unknown): StageStatsRecord {
  const result = createStageStatsRecord();
  const source = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  for (const stageId of StageIds) {
    const raw = source[String(stageId)];
    if (typeof raw !== 'object' || raw === null) {
      continue;
    }
    const stats = raw as Partial<StageStats>;
    result[stageId] = {
      bestTimeMs: typeof stats.bestTimeMs === 'number' ? Math.max(0, stats.bestTimeMs) : null,
      bestRank:
        stats.bestRank === 'S' || stats.bestRank === 'A' || stats.bestRank === 'B' || stats.bestRank === 'C'
          ? stats.bestRank
          : null,
      scrolls: Array.isArray(stats.scrolls)
        ? [...new Set(stats.scrolls.filter((item): item is string => typeof item === 'string'))]
        : [],
      clears: typeof stats.clears === 'number' ? Math.max(0, Math.floor(stats.clears)) : 0
    };
  }
  return result;
}

function mergeCompletionStats(value: unknown): CompletionStats {
  const source =
    typeof value === 'object' && value !== null ? (value as Partial<CompletionStats>) : {};
  return {
    totalClears: Math.max(0, Math.floor(Number(source.totalClears ?? 0))),
    totalDefeats: Math.max(0, Math.floor(Number(source.totalDefeats ?? 0))),
    totalDamageTaken: Math.max(0, Math.floor(Number(source.totalDamageTaken ?? 0))),
    totalSeals: Math.max(0, Math.floor(Number(source.totalSeals ?? 0)))
  };
}

export function normalizeSave(value: unknown): SaveData {
  if (typeof value !== 'object' || value === null) {
    return createDefaultSave();
  }
  const source = value as Partial<SaveData>;
  const unlockedStages: StageId[] = Array.isArray(source.unlockedStages)
    ? [...new Set(source.unlockedStages.filter(isStageId))]
    : [1];
  if (!unlockedStages.includes(1)) {
    unlockedStages.unshift(1);
  }
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    unlockedStages: unlockedStages.sort((a, b) => a - b),
    unlockedAbilities: Array.isArray(source.unlockedAbilities)
      ? [...new Set(source.unlockedAbilities.filter(isAbilityId))]
      : [],
    stageStats: mergeStageStats(source.stageStats),
    settings: mergeSettings(source.settings),
    hasClearedGame: Boolean(source.hasClearedGame),
    completionStats: mergeCompletionStats(source.completionStats)
  };
}

export class SaveSystem {
  private save: SaveData;

  constructor(private readonly storage: StorageLike = getBrowserStorage()) {
    this.save = this.load();
  }

  get data(): SaveData {
    return this.save;
  }

  load(): SaveData {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) {
      return createDefaultSave();
    }
    try {
      return normalizeSave(JSON.parse(raw));
    } catch {
      return createDefaultSave();
    }
  }

  write(next: SaveData): void {
    this.save = normalizeSave(next);
    this.storage.setItem(SAVE_KEY, JSON.stringify(this.save));
  }

  reset(): void {
    this.write(createDefaultSave());
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.write({
      ...this.save,
      settings: mergeSettings({
        ...this.save.settings,
        ...settings,
        assist: {
          ...this.save.settings.assist,
          ...(settings.assist ?? {})
        }
      })
    });
  }

  unlockAbility(ability: AbilityId): void {
    if (this.save.unlockedAbilities.includes(ability)) {
      return;
    }
    this.write({
      ...this.save,
      unlockedAbilities: [...this.save.unlockedAbilities, ability]
    });
  }

  unlockStage(stageId: StageId): void {
    if (this.save.unlockedStages.includes(stageId)) {
      return;
    }
    this.write({
      ...this.save,
      unlockedStages: [...this.save.unlockedStages, stageId].sort((a, b) => a - b)
    });
  }

  completeStage(result: StageClearResult): void {
    const stats = this.save.stageStats[result.stageId];
    const mergedScrolls = [...new Set([...stats.scrolls, ...result.scrolls])];
    const bestTimeMs =
      stats.bestTimeMs === null ? result.elapsedMs : Math.min(stats.bestTimeMs, result.elapsedMs);
    const nextStage = (result.stageId + 1) as StageId;
    const unlockedStages = new Set(this.save.unlockedStages);
    if (isStageId(nextStage)) {
      unlockedStages.add(nextStage);
    }
    const unlockedAbilities = new Set(this.save.unlockedAbilities);
    unlockedAbilities.add(AbilityUnlockByStage[result.stageId]);
    const nextStats: StageStatsRecord = {
      ...this.save.stageStats,
      [result.stageId]: {
        bestTimeMs,
        bestRank: chooseBestRank(stats.bestRank, result.rank),
        scrolls: mergedScrolls,
        clears: stats.clears + 1
      }
    };
    this.write({
      ...this.save,
      unlockedStages: [...unlockedStages].sort((a, b) => a - b),
      unlockedAbilities: [...unlockedAbilities],
      stageStats: nextStats,
      hasClearedGame: this.save.hasClearedGame || result.stageId === 5,
      completionStats: {
        totalClears: this.save.completionStats.totalClears + 1,
        totalDefeats: this.save.completionStats.totalDefeats + result.defeats,
        totalDamageTaken: this.save.completionStats.totalDamageTaken + result.damageTaken,
        totalSeals: this.save.completionStats.totalSeals + result.seals
      }
    });
  }
}

function chooseBestRank(current: StageStats['bestRank'], next: StageStats['bestRank']): StageStats['bestRank'] {
  if (!current) {
    return next;
  }
  if (!next) {
    return current;
  }
  const order = ['C', 'B', 'A', 'S'];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

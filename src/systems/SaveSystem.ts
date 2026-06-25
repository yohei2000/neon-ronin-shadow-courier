import type {
  AssistSettings,
  GameSettings,
  SaveData,
  StageClearResult,
  StageStats
} from '../types/save';
import type { StorageLike } from '../utils/storage';
import { getBrowserStorage } from '../utils/storage';
import { clamp } from '../utils/math';

export const SAVE_KEY = 'neon-ronin-shadow-courier-save';
export const SAVE_SCHEMA_VERSION = 1;

const defaultAssist: AssistSettings = {
  fallRescue: true
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

function defaultStageStats(): StageStats {
  return {
    bestTimeMs: null,
    bestRank: null,
    scrolls: [],
    cleared: false
  };
}

export function createDefaultSave(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    stage1: defaultStageStats(),
    settings: defaultSettings
  };
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
      fallRescue: Boolean(assistSource.fallRescue ?? defaultAssist.fallRescue)
    }
  };
}

function mergeStageStats(value: unknown): StageStats {
  const source = typeof value === 'object' && value !== null ? (value as Partial<StageStats>) : {};
  return {
    bestTimeMs: typeof source.bestTimeMs === 'number' ? Math.max(0, source.bestTimeMs) : null,
    bestRank:
      source.bestRank === 'S' || source.bestRank === 'A' || source.bestRank === 'B' || source.bestRank === 'C'
        ? source.bestRank
        : null,
    scrolls: Array.isArray(source.scrolls)
      ? [...new Set(source.scrolls.filter((item): item is string => typeof item === 'string'))]
      : [],
    cleared: Boolean(source.cleared)
  };
}

export function normalizeSave(value: unknown): SaveData {
  if (typeof value !== 'object' || value === null) {
    return createDefaultSave();
  }
  const source = value as Partial<SaveData>;
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    stage1: mergeStageStats(source.stage1),
    settings: mergeSettings(source.settings)
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

  completeStage(result: StageClearResult): void {
    const stats = this.save.stage1;
    const mergedScrolls = [...new Set([...stats.scrolls, ...result.scrolls])];
    const bestTimeMs =
      stats.bestTimeMs === null ? result.elapsedMs : Math.min(stats.bestTimeMs, result.elapsedMs);
    this.write({
      ...this.save,
      stage1: {
        bestTimeMs,
        bestRank: chooseBestRank(stats.bestRank, result.rank),
        scrolls: mergedScrolls,
        cleared: true
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

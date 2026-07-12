export type TouchControlsMode = 'auto' | 'on' | 'off';

export type Stage1Settings = {
  readonly masterVolume: number;
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly reducedShake: boolean;
  readonly reducedParticles: boolean;
  readonly highContrast: boolean;
  readonly touchControls: TouchControlsMode;
  readonly touchOpacity: number;
};

export type Stage1Progress = {
  readonly cleared: boolean;
  readonly bestTimeMs: number | null;
  readonly bestRank: 'S' | 'A' | 'B' | 'C' | null;
  readonly scrollsFound: readonly string[];
};

export type Stage1SaveData = {
  readonly schemaVersion: 1;
  readonly settings: Stage1Settings;
  readonly stage1: Stage1Progress;
  readonly stage2: Stage1Progress;
};

const STORAGE_KEY = 'neon-ronin-stage1-save';

export const DefaultStage1Settings: Stage1Settings = {
  masterVolume: 0.8,
  musicVolume: 0.68,
  sfxVolume: 0.8,
  reducedShake: false,
  reducedParticles: false,
  highContrast: false,
  touchControls: 'auto',
  touchOpacity: 0.78
};

export const createDefaultSave = (): Stage1SaveData => ({
  schemaVersion: 1,
  settings: DefaultStage1Settings,
  stage1: {
    cleared: false,
    bestTimeMs: null,
    bestRank: null,
    scrollsFound: []
  },
  stage2: {
    cleared: false,
    bestTimeMs: null,
    bestRank: null,
    scrollsFound: []
  }
});

const normalizeNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
};

const normalizeBoolean = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

const normalizeTouchMode = (value: unknown): TouchControlsMode => {
  return value === 'on' || value === 'off' || value === 'auto' ? value : DefaultStage1Settings.touchControls;
};

export const normalizeSaveData = (raw: unknown): Stage1SaveData => {
  const defaults = createDefaultSave();
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const candidate = raw as Record<string, unknown>;
  const settings = (candidate.settings ?? {}) as Record<string, unknown>;
  const stage1 = (candidate.stage1 ?? {}) as Record<string, unknown>;
  const stage2 = (candidate.stage2 ?? {}) as Record<string, unknown>;
  const normalizeProgress = (progress: Record<string, unknown>, fallback: Stage1Progress): Stage1Progress => {
    const scrollsFound = Array.isArray(progress.scrollsFound)
      ? Array.from(new Set(progress.scrollsFound.filter((item): item is string => typeof item === 'string'))).slice(0, 3)
      : fallback.scrollsFound;
    const bestRank = progress.bestRank === 'S' || progress.bestRank === 'A' || progress.bestRank === 'B' || progress.bestRank === 'C'
      ? progress.bestRank
      : null;
    return {
      cleared: normalizeBoolean(progress.cleared, fallback.cleared),
      bestTimeMs:
        typeof progress.bestTimeMs === 'number' && Number.isFinite(progress.bestTimeMs) ? Math.max(0, progress.bestTimeMs) : null,
      bestRank,
      scrollsFound
    };
  };

  return {
    schemaVersion: 1,
    settings: {
      masterVolume: normalizeNumber(settings.masterVolume, defaults.settings.masterVolume, 0, 1),
      musicVolume: normalizeNumber(settings.musicVolume, defaults.settings.musicVolume, 0, 1),
      sfxVolume: normalizeNumber(settings.sfxVolume, defaults.settings.sfxVolume, 0, 1),
      reducedShake: normalizeBoolean(settings.reducedShake, defaults.settings.reducedShake),
      reducedParticles: normalizeBoolean(settings.reducedParticles, defaults.settings.reducedParticles),
      highContrast: normalizeBoolean(settings.highContrast, defaults.settings.highContrast),
      touchControls: normalizeTouchMode(settings.touchControls),
      touchOpacity: normalizeNumber(settings.touchOpacity, defaults.settings.touchOpacity, 0.35, 1)
    },
    stage1: normalizeProgress(stage1, defaults.stage1),
    stage2: normalizeProgress(stage2, defaults.stage2)
  };
};

export class SaveSystem {
  static load(storage: Storage | undefined = globalThis.localStorage): Stage1SaveData {
    if (!storage) return createDefaultSave();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? normalizeSaveData(JSON.parse(raw)) : createDefaultSave();
    } catch {
      return createDefaultSave();
    }
  }

  static save(data: Stage1SaveData, storage: Storage | undefined = globalThis.localStorage): Stage1SaveData {
    const normalized = normalizeSaveData(data);
    storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  static saveSettings(settings: Stage1Settings, storage: Storage | undefined = globalThis.localStorage): Stage1SaveData {
    const current = SaveSystem.load(storage);
    return SaveSystem.save({ ...current, settings }, storage);
  }

  static recordStage1Clear(
    timeMs: number,
    rank: 'S' | 'A' | 'B' | 'C',
    scrollsFound: readonly string[],
    storage: Storage | undefined = globalThis.localStorage
  ): Stage1SaveData {
    const current = SaveSystem.load(storage);
    return SaveSystem.recordStageClear('stage1', current, timeMs, rank, scrollsFound, storage);
  }

  static recordStage2Clear(
    timeMs: number,
    rank: 'S' | 'A' | 'B' | 'C',
    scrollsFound: readonly string[] = [],
    storage: Storage | undefined = globalThis.localStorage
  ): Stage1SaveData {
    const current = SaveSystem.load(storage);
    return SaveSystem.recordStageClear('stage2', current, timeMs, rank, scrollsFound, storage);
  }

  private static recordStageClear(
    stageKey: 'stage1' | 'stage2',
    current: Stage1SaveData,
    timeMs: number,
    rank: 'S' | 'A' | 'B' | 'C',
    scrollsFound: readonly string[],
    storage: Storage | undefined
  ): Stage1SaveData {
    const currentProgress = current[stageKey];
    const bestTimeMs = currentProgress.bestTimeMs === null ? timeMs : Math.min(currentProgress.bestTimeMs, timeMs);
    const scrollUnion = Array.from(new Set([...currentProgress.scrollsFound, ...scrollsFound])).slice(0, 3);
    const rankScore = { S: 4, A: 3, B: 2, C: 1 } as const;
    const bestRank = currentProgress.bestRank && rankScore[currentProgress.bestRank] > rankScore[rank] ? currentProgress.bestRank : rank;
    return SaveSystem.save(
      {
        ...current,
        [stageKey]: {
          cleared: true,
          bestTimeMs,
          bestRank,
          scrollsFound: scrollUnion
        }
      },
      storage
    );
  }
}

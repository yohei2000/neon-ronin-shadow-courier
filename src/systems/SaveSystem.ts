export type TouchControlsMode = 'auto' | 'on' | 'off';

export type Stage1Settings = {
  readonly masterVolume: number;
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
};

const STORAGE_KEY = 'neon-ronin-stage1-save';

export const DefaultStage1Settings: Stage1Settings = {
  masterVolume: 0.8,
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
  const scrollsFound = Array.isArray(stage1.scrollsFound)
    ? Array.from(new Set(stage1.scrollsFound.filter((item): item is string => typeof item === 'string'))).slice(0, 3)
    : defaults.stage1.scrollsFound;
  const bestRank = stage1.bestRank === 'S' || stage1.bestRank === 'A' || stage1.bestRank === 'B' || stage1.bestRank === 'C'
    ? stage1.bestRank
    : null;

  return {
    schemaVersion: 1,
    settings: {
      masterVolume: normalizeNumber(settings.masterVolume, defaults.settings.masterVolume, 0, 1),
      sfxVolume: normalizeNumber(settings.sfxVolume, defaults.settings.sfxVolume, 0, 1),
      reducedShake: normalizeBoolean(settings.reducedShake, defaults.settings.reducedShake),
      reducedParticles: normalizeBoolean(settings.reducedParticles, defaults.settings.reducedParticles),
      highContrast: normalizeBoolean(settings.highContrast, defaults.settings.highContrast),
      touchControls: normalizeTouchMode(settings.touchControls),
      touchOpacity: normalizeNumber(settings.touchOpacity, defaults.settings.touchOpacity, 0.35, 1)
    },
    stage1: {
      cleared: normalizeBoolean(stage1.cleared, defaults.stage1.cleared),
      bestTimeMs: typeof stage1.bestTimeMs === 'number' && Number.isFinite(stage1.bestTimeMs) ? Math.max(0, stage1.bestTimeMs) : null,
      bestRank,
      scrollsFound
    }
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
    const bestTimeMs = current.stage1.bestTimeMs === null ? timeMs : Math.min(current.stage1.bestTimeMs, timeMs);
    const scrollUnion = Array.from(new Set([...current.stage1.scrollsFound, ...scrollsFound])).slice(0, 3);
    const rankScore = { S: 4, A: 3, B: 2, C: 1 } as const;
    const bestRank = current.stage1.bestRank && rankScore[current.stage1.bestRank] > rankScore[rank] ? current.stage1.bestRank : rank;
    return SaveSystem.save(
      {
        ...current,
        stage1: {
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

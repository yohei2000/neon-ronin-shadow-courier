import { describe, expect, it } from 'vitest';
import { createDefaultSave, normalizeSave, SAVE_KEY, SaveSystem } from '../src/systems/SaveSystem';
import { MemoryStorage } from '../src/utils/storage';

describe('SaveSystem', () => {
  it('creates valid default save data', () => {
    const save = createDefaultSave();
    expect(save.unlockedStages).toEqual([1]);
    expect(save.stageStats[1].scrolls).toEqual([]);
    expect(save.settings.assist.fallRescue).toBe(true);
  });

  it('falls back safely from corrupted JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, '{not-json');
    const saveSystem = new SaveSystem(storage);
    expect(saveSystem.data.unlockedStages).toEqual([1]);
  });

  it('persists stage unlocks and clear results', () => {
    const storage = new MemoryStorage();
    const saveSystem = new SaveSystem(storage);
    saveSystem.completeStage({
      stageId: 1,
      elapsedMs: 120000,
      rank: 'S',
      scrolls: ['1-a', '1-b'],
      damageTaken: 1,
      defeats: 0,
      seals: 4
    });
    const loaded = new SaveSystem(storage);
    expect(loaded.data.unlockedStages).toContain(2);
    expect(loaded.data.unlockedAbilities).toContain('wallKick');
    expect(loaded.data.stageStats[1].bestRank).toBe('S');
    expect(loaded.data.stageStats[1].scrolls).toEqual(['1-a', '1-b']);
  });

  it('merges old or partial settings safely', () => {
    const save = normalizeSave({
      settings: {
        masterVolume: 2,
        touchUiOpacity: -5,
        assist: {
          reducedDamage: true
        }
      }
    });
    expect(save.settings.masterVolume).toBe(1);
    expect(save.settings.touchUiOpacity).toBe(0.25);
    expect(save.settings.assist.reducedDamage).toBe(true);
    expect(save.settings.assist.fallRescue).toBe(true);
  });
});

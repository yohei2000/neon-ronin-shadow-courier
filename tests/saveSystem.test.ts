import { describe, expect, it } from 'vitest';
import { createDefaultSave, normalizeSave, SAVE_KEY, SaveSystem } from '../src/systems/SaveSystem';
import { MemoryStorage } from '../src/utils/storage';

describe('SaveSystem', () => {
  it('creates valid Stage 1 default save data', () => {
    const save = createDefaultSave();
    expect(save.stage1.cleared).toBe(false);
    expect(save.stage1.scrolls).toEqual([]);
    expect(save.stage1.bestRank).toBeNull();
    expect(save.settings.assist.fallRescue).toBe(true);
  });

  it('falls back safely from corrupted JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, '{not-json');
    const saveSystem = new SaveSystem(storage);
    expect(saveSystem.data.stage1.cleared).toBe(false);
  });

  it('persists Stage 1 clear results and merges best stats', () => {
    const storage = new MemoryStorage();
    const saveSystem = new SaveSystem(storage);
    saveSystem.completeStage({
      elapsedMs: 120000,
      rank: 'A',
      scrolls: ['scroll-wall-route', 'scroll-hidden-sign'],
      damageTaken: 1,
      seals: 12
    });
    saveSystem.completeStage({
      elapsedMs: 150000,
      rank: 'S',
      scrolls: ['scroll-warden-reward'],
      damageTaken: 0,
      seals: 8
    });
    const loaded = new SaveSystem(storage);
    expect(loaded.data.stage1.cleared).toBe(true);
    expect(loaded.data.stage1.bestTimeMs).toBe(120000);
    expect(loaded.data.stage1.bestRank).toBe('S');
    expect(loaded.data.stage1.scrolls).toEqual([
      'scroll-wall-route',
      'scroll-hidden-sign',
      'scroll-warden-reward'
    ]);
  });

  it('merges old or partial settings safely', () => {
    const save = normalizeSave({
      settings: {
        masterVolume: 2,
        touchUiOpacity: -5,
        touchUiMode: 'always',
        assist: {}
      }
    });
    expect(save.settings.masterVolume).toBe(1);
    expect(save.settings.touchUiOpacity).toBe(0.25);
    expect(save.settings.touchUiMode).toBe('auto');
    expect(save.settings.assist.fallRescue).toBe(true);
  });
});

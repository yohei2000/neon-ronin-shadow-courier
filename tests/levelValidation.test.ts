import { describe, expect, it } from 'vitest';
import { Levels } from '../src/data/levels';
import type { LevelDefinition } from '../src/types/levels';
import { validateAllLevels, validateLevel } from '../src/utils/levelValidation';

function cloneLevel(level: LevelDefinition, patch: Partial<LevelDefinition>): LevelDefinition {
  return {
    ...level,
    ...patch
  };
}

describe('level validation', () => {
  it('accepts every real stage', () => {
    const result = validateAllLevels(Levels);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('rejects unknown tiles', () => {
    const level = Levels[0];
    const tiles = [...level.tiles];
    tiles[0] = `?${tiles[0].slice(1)}`;
    expect(validateLevel(cloneLevel(level, { tiles })).valid).toBe(false);
  });

  it('rejects missing spawn', () => {
    expect(validateLevel(cloneLevel(Levels[0], { playerSpawn: null })).valid).toBe(false);
  });

  it('rejects missing goal', () => {
    expect(validateLevel(cloneLevel(Levels[0], { goal: null })).valid).toBe(false);
  });

  it('rejects invalid scroll count', () => {
    expect(validateLevel(cloneLevel(Levels[0], { scrolls: Levels[0].scrolls.slice(0, 2) })).valid).toBe(
      false
    );
  });

  it('rejects out-of-bounds enemies', () => {
    expect(
      validateLevel(
        cloneLevel(Levels[0], {
          enemies: [{ type: 'ShadowCrawler', x: -100, y: 0 }]
        })
      ).valid
    ).toBe(false);
  });

  it('validates boss stage requirements', () => {
    expect(validateLevel(Levels[4]).valid).toBe(true);
    expect(validateLevel(cloneLevel(Levels[4], { boss: undefined })).valid).toBe(false);
  });
});

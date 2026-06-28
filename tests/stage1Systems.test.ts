import { describe, expect, it } from 'vitest';
import { Stage1Data } from '../src/data/stage1';
import { validateStage1 } from '../src/data/stageValidation';
import { canTakeOverlapDamage, resolveSlashPhase } from '../src/systems/CombatSystem';
import { SaveSystem, createDefaultSave, normalizeSaveData } from '../src/systems/SaveSystem';
import { resolveHorizontalVelocity } from '../src/systems/horizontalMotion';
import { resolveInitialJumpVisualVariant, shouldUseSmallJumpVariant } from '../src/systems/playerVisualState';
import { calculateStageRank } from '../src/systems/rank';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear(): void {
    this.values.clear();
  }
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('Stage1 validation', () => {
  it('passes the Stage1 content acceptance rules', () => {
    const report = validateStage1(Stage1Data);
    expect(report.passed).toBe(true);
    expect(report.checks.filter((check) => !check.passed)).toEqual([]);
  });
});

describe('Stage1 save system', () => {
  it('loads defaults when JSON is corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem('neon-ronin-stage1-save', '{bad-json');
    expect(SaveSystem.load(storage)).toEqual(createDefaultSave());
  });

  it('normalizes schema and clamps settings', () => {
    const save = normalizeSaveData({
      schemaVersion: 99,
      settings: {
        masterVolume: 5,
        sfxVolume: -2,
        touchControls: 'sideways',
        touchOpacity: 0.1,
        reducedShake: true
      },
      stage1: {
        cleared: true,
        bestTimeMs: 90000,
        bestRank: 'A',
        scrollsFound: ['scroll-a', 'scroll-a', 'scroll-b']
      }
    });
    expect(save.schemaVersion).toBe(1);
    expect(save.settings.masterVolume).toBe(1);
    expect(save.settings.sfxVolume).toBe(0);
    expect(save.settings.touchControls).toBe('auto');
    expect(save.settings.touchOpacity).toBe(0.35);
    expect(save.stage1.scrollsFound).toEqual(['scroll-a', 'scroll-b']);
  });
});

describe('Stage1 pure combat and rank helpers', () => {
  it('uses the required slash startup, active, recovery phases', () => {
    expect(resolveSlashPhase(0)).toBe('startup');
    expect(resolveSlashPhase(90)).toBe('active');
    expect(resolveSlashPhase(230)).toBe('recovery');
    expect(resolveSlashPhase(500)).toBe('idle');
  });

  it('prevents repeated overlap damage during cooldown', () => {
    expect(canTakeOverlapDamage(1500, 400, 1050)).toBe(true);
    expect(canTakeOverlapDamage(1000, 400, 1050)).toBe(false);
  });

  it('calculates clear ranks from time, damage, and scrolls', () => {
    expect(calculateStageRank(100000, 0, 3)).toBe('S');
    expect(calculateStageRank(160000, 2, 2)).toBe('A');
    expect(calculateStageRank(230000, 5, 0)).toBe('B');
    expect(calculateStageRank(320000, 8, 0)).toBe('C');
  });
});

describe('Stage1 horizontal motion', () => {
  it('ramps up toward max speed instead of snapping immediately', () => {
    const firstFrame = resolveHorizontalVelocity({ currentVx: 0, inputMoveX: 1, onGround: true, dtSeconds: 0.032 });
    expect(firstFrame).toBeGreaterThan(0);
    expect(firstFrame).toBeLessThan(12);

    let vx = 0;
    for (let frame = 0; frame < 12; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: 1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBeGreaterThan(80);
    expect(vx).toBeLessThan(122);

    for (let frame = 0; frame < 8; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: 1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBe(122);
  });

  it('brakes to zero before accelerating in the opposite direction', () => {
    let vx = 122;
    vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    expect(vx).toBeGreaterThan(100);

    for (let frame = 0; frame < 14; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBeGreaterThanOrEqual(0);
    expect(vx).toBeLessThan(18);

    vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    expect(vx).toBeLessThan(0);
    expect(vx).toBeGreaterThan(-12);
  });
});

describe('Stage1 player visual state', () => {
  it('selects a speed flip jump only when horizontal speed is near max run speed', () => {
    expect(resolveInitialJumpVisualVariant(60, 122)).toBe('big');
    expect(resolveInitialJumpVisualVariant(104, 122)).toBe('speedFlip');
    expect(resolveInitialJumpVisualVariant(-104, 122)).toBe('speedFlip');
  });

  it('uses small jump visuals for early releases while still rising', () => {
    expect(shouldUseSmallJumpVariant({ elapsedMs: 90, verticalVelocity: -260 })).toBe(true);
    expect(shouldUseSmallJumpVariant({ elapsedMs: 260, verticalVelocity: -260 })).toBe(false);
    expect(shouldUseSmallJumpVariant({ elapsedMs: 90, verticalVelocity: 80 })).toBe(false);
  });
});

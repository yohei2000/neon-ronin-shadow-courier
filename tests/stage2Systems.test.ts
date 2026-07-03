import { describe, expect, it } from 'vitest';
import { Stage2Data, Stage2Tuning, validateStage2 } from '../src/data/stage2';
import { SaveSystem, createDefaultSave } from '../src/systems/SaveSystem';

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

describe('Stage2 validation', () => {
  it('passes the dynamic vertical Stage2 content rules', () => {
    const report = validateStage2(Stage2Data);
    expect(report.passed).toBe(true);
    expect(report.checks.filter((check) => !check.passed)).toEqual([]);
  });

  it('keeps Stage2 taller and more thread-driven than a flat side-scroller', () => {
    const platformYs = Stage2Data.platforms.map((platform) => platform.y);
    expect(Math.max(...platformYs) - Math.min(...platformYs)).toBeGreaterThanOrEqual(820);
    expect(Stage2Data.anchors.length).toBeGreaterThanOrEqual(16);
    expect(Stage2Data.anchors.some((anchor) => anchor.y < 420)).toBe(true);
    expect(Stage2Data.anchors.some((anchor) => anchor.y > 1000)).toBe(true);
    expect(Stage2Tuning.shadowThreadRange).toBeGreaterThanOrEqual(540);
  });

  it('requires spatial geometry beyond scattered platforms', () => {
    const shaftWalls = Stage2Data.walls.filter((wall) => wall.sectionId === 'drain-lantern-shaft' && wall.role !== 'back-wall');
    const downhill = Stage2Data.slopes.find((slope) => slope.id === 'billboard-diagonal-downhill');
    expect(shaftWalls.some((wall) => wall.role === 'left-wall')).toBe(true);
    expect(shaftWalls.some((wall) => wall.role === 'right-wall')).toBe(true);
    expect(shaftWalls.length).toBeGreaterThanOrEqual(6);
    expect(Stage2Data.walls.some((wall) => wall.role === 'back-wall')).toBe(true);
    expect(downhill).toBeDefined();
    expect(downhill ? downhill.y2 - downhill.y1 : 0).toBeGreaterThanOrEqual(420);
    expect(downhill ? Math.hypot(downhill.x2 - downhill.x1, downhill.y2 - downhill.y1) : 0).toBeGreaterThanOrEqual(980);
    expect(Stage2Tuning.slopeMaxVx).toBeGreaterThan(Stage2Tuning.crosswindMaxVx);
  });
});

describe('Stage2 save system', () => {
  it('records Stage2 clear progress without overwriting Stage1 progress', () => {
    const storage = new MemoryStorage();
    SaveSystem.save(createDefaultSave(), storage);

    const save = SaveSystem.recordStage2Clear(260000, 'A', [], storage);
    expect(save.stage1.cleared).toBe(false);
    expect(save.stage2.cleared).toBe(true);
    expect(save.stage2.bestTimeMs).toBe(260000);
    expect(save.stage2.bestRank).toBe('A');
  });
});

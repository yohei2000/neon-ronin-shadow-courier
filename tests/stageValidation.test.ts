import { describe, expect, it } from 'vitest';
import stage1Data from '../src/data/stage1.json';
import type { Stage1Definition } from '../src/types/stage';
import { validateStage1 } from '../src/utils/stageValidation';

const stage = stage1Data as Stage1Definition;

describe('stage 1 validation', () => {
  it('accepts the real Stage 1 definition', () => {
    const result = validateStage1(stage);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.metrics.criticalSections).toBeGreaterThanOrEqual(7);
    expect(result.metrics.verticalSections).toBeGreaterThanOrEqual(2);
    expect(result.metrics.optionalRoutes).toBeGreaterThanOrEqual(2);
    expect(result.metrics.scrolls).toBe(3);
    expect(result.metrics.seals).toBeGreaterThanOrEqual(20);
  });

  it('rejects a missing scroll', () => {
    const result = validateStage1({ ...stage, scrolls: stage.scrolls.slice(0, 2) });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('exactly 3'))).toBe(true);
  });

  it('rejects missing critical path sections', () => {
    const result = validateStage1({ ...stage, criticalPath: [...stage.criticalPath, 'missing-section'] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('critical-path'))).toBe(true);
  });

  it('rejects checkpoints that are not supported by a floor', () => {
    const result = validateStage1({
      ...stage,
      checkpoints: [{ id: 'bad', x: 2810, y: 438 }, ...stage.checkpoints.slice(1)]
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('not on a floor'))).toBe(true);
  });
});

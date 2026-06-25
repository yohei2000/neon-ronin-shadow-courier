import { describe, expect, it } from 'vitest';
import { TouchControlNames } from '../src/config/controls';
import { BASE_HEIGHT, BASE_WIDTH } from '../src/config/dimensions';
import { createTouchLayout, validateTouchLayout } from '../src/utils/touchLayout';

describe('touch layout helpers', () => {
  it('creates every virtual control exactly once', () => {
    const layout = createTouchLayout();
    expect(layout.map((button) => button.name).sort()).toEqual([...TouchControlNames].sort());
  });

  it('keeps the default mobile controls inside the game canvas and separated by cluster', () => {
    const layout = createTouchLayout();
    const validation = validateTouchLayout(layout);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.metrics).toMatchObject({
      buttonCount: 7,
      movementCount: 4,
      actionCount: 2,
      systemCount: 1
    });
    expect(validation.metrics.actionGap).toBeGreaterThanOrEqual(16);
    expect(validation.metrics.pauseNearestGap).toBeGreaterThanOrEqual(180);
  });

  it('keeps pause in the upper-right safe area and gameplay controls in the lower band', () => {
    const layout = createTouchLayout();
    const pause = layout.find((button) => button.name === 'pause');
    const gameplayButtons = layout.filter((button) => button.name !== 'pause');
    expect(pause?.x).toBeGreaterThanOrEqual(BASE_WIDTH - 100);
    expect(pause?.y).toBeLessThanOrEqual(100);
    for (const button of gameplayButtons) {
      expect(button.y).toBeGreaterThanOrEqual(BASE_HEIGHT * 0.7);
    }
  });

  it('reports regressions that make action controls unreliable', () => {
    const invalid = createTouchLayout().map((button) =>
      button.name === 'attack' ? { ...button, x: BASE_WIDTH - 210, y: BASE_HEIGHT - 90 } : button
    );
    const validation = validateTouchLayout(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Jump and attack controls are too close for reliable mobile input.');
  });
});

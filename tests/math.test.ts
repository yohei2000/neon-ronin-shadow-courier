import { describe, expect, it } from 'vitest';
import { clamp, formatTime, lerp, rankStage, sign } from '../src/utils/math';

describe('math utilities', () => {
  it('clamps into range', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-2, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it('lerps with clamped amount', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 2)).toBe(10);
  });

  it('returns stable signs', () => {
    expect(sign(10)).toBe(1);
    expect(sign(-10)).toBe(-1);
    expect(sign(0)).toBe(0);
  });

  it('formats mm:ss time', () => {
    expect(formatTime(65000)).toBe('01:05');
  });

  it('ranks deterministically', () => {
    expect(rankStage(120000, 3, 0)).toBe('S');
    expect(rankStage(240000, 2, 4)).toBe('A');
    expect(rankStage(360000, 1, 8)).toBe('B');
    expect(rankStage(700000, 0, 20)).toBe('C');
  });
});

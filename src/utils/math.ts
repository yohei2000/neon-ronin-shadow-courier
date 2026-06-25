import type { StageRank } from '../types/game';
import { RankThresholds } from '../data/balance';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

export function sign(value: number): -1 | 0 | 1 {
  if (value > 0) {
    return 1;
  }
  if (value < 0) {
    return -1;
  }
  return 0;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function rankStage(elapsedMs: number, scrolls: number, damageTaken: number): StageRank {
  if (
    elapsedMs <= RankThresholds.S.maxMs &&
    scrolls >= RankThresholds.S.minScrolls &&
    damageTaken <= RankThresholds.S.maxDamage
  ) {
    return 'S';
  }
  if (
    elapsedMs <= RankThresholds.A.maxMs &&
    scrolls >= RankThresholds.A.minScrolls &&
    damageTaken <= RankThresholds.A.maxDamage
  ) {
    return 'A';
  }
  if (
    elapsedMs <= RankThresholds.B.maxMs &&
    scrolls >= RankThresholds.B.minScrolls &&
    damageTaken <= RankThresholds.B.maxDamage
  ) {
    return 'B';
  }
  return 'C';
}

export function toWorld(tile: number, tileSize = 32): number {
  return tile * tileSize + tileSize / 2;
}

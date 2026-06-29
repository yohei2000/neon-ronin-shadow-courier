import { Stage1Tuning, type RectData } from '../data/stage1';

export type WardenProjectileMotion = {
  readonly vx: number;
  readonly vy: number;
  readonly angleDeg: number;
};

export const buildWardenProjectileRect = (x: number, y: number): RectData => ({
  x: x - Stage1Tuning.wardenProjectileWidth / 2,
  y: y - Stage1Tuning.wardenProjectileHeight / 2,
  width: Stage1Tuning.wardenProjectileWidth,
  height: Stage1Tuning.wardenProjectileHeight
});

export const resolveWardenProjectileMotion = (
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  speed: number = Stage1Tuning.wardenProjectileSpeed
): WardenProjectileMotion => {
  const dx = targetX - originX;
  const dy = targetY - originY;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    vx: (dx / length) * speed,
    vy: (dy / length) * speed,
    angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI
  };
};

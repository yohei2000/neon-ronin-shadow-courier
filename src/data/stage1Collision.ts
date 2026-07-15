import trialData from './stage1CollisionTrial.json';
import type { RectData, Stage1CollisionRect, Stage1CollisionSurfaceType } from './stage1';

type Point = readonly [number, number];

type TrialSurface = {
  readonly id: string;
  readonly type: Stage1CollisionSurfaceType;
  readonly points: readonly Point[];
  readonly thickness: number;
  readonly collisionMode: string;
  readonly oneWay: boolean;
};

const round = (value: number): number => Math.round(value * 10) / 10;

const rect = (
  id: string,
  sourceId: string,
  surfaceType: Stage1CollisionSurfaceType,
  oneWay: boolean,
  x: number,
  y: number,
  width: number,
  height: number
): Stage1CollisionRect => ({
  id,
  sourceId,
  source: 'trial',
  surfaceType,
  oneWay,
  x: round(x),
  y: round(y),
  width: round(Math.max(2, width)),
  height: round(Math.max(2, height))
});

const segmentRects = (surface: TrialSurface, segmentIndex: number, a: Point, b: Point): readonly Stage1CollisionRect[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length < 1 || surface.type === 'hazard' || surface.type === 'trigger') return [];

  const thickness = Math.max(2, surface.thickness);
  const baseId = `${surface.id}-segment-${segmentIndex}`;
  if (Math.abs(dx) <= 1.5) {
    if (Math.abs(dy) < 4 || surface.type === 'oneWay') return [];
    return [
      rect(
        baseId,
        surface.id,
        surface.type,
        false,
        a[0] - thickness / 2,
        Math.min(a[1], b[1]) - thickness / 2,
        thickness,
        Math.abs(dy) + thickness
      )
    ];
  }

  const surfaceOneWay = surface.oneWay || surface.collisionMode === 'one-way' || surface.type === 'oneWay';
  if (Math.abs(dy) <= 3) {
    return [
      rect(
        baseId,
        surface.id,
        surface.type,
        surfaceOneWay,
        Math.min(a[0], b[0]) - thickness / 2,
        (a[1] + b[1]) / 2 - thickness / 2,
        Math.abs(dx) + thickness,
        thickness
      )
    ];
  }

  const stepCount = Math.max(1, Math.ceil(Math.abs(dx) / 16));
  const steps: Stage1CollisionRect[] = [];
  for (let step = 0; step < stepCount; step += 1) {
    const startT = step / stepCount;
    const endT = (step + 1) / stepCount;
    const startX = a[0] + dx * startT;
    const endX = a[0] + dx * endT;
    const middleT = (startT + endT) / 2;
    const middleY = a[1] + dy * middleT;
    steps.push(
      rect(
        `${baseId}-step-${step}`,
        surface.id,
        surface.type,
        true,
        Math.min(startX, endX) - 1,
        middleY - thickness / 2,
        Math.abs(endX - startX) + 2,
        thickness
      )
    );
  }
  return steps;
};

const trialSurfaces = trialData.surfaces as unknown as readonly TrialSurface[];

export const Stage1TrialCollisionRects: readonly Stage1CollisionRect[] = trialSurfaces.flatMap((surface) =>
  surface.points.slice(0, -1).flatMap((point, index) => segmentRects(surface, index, point, surface.points[index + 1]))
);

const keepLegacyOutsideTrialRange = (legacy: readonly RectData[]): readonly Stage1CollisionRect[] => {
  const start = trialData.coverageRange.start;
  const end = trialData.coverageRange.end;
  return legacy.flatMap((platform, index) => {
    const left = platform.x;
    const right = platform.x + platform.width;
    const base = {
      id: `legacy-collider-${index}`,
      sourceId: `legacy-collider-${index}`,
      source: 'legacy' as const,
      surfaceType: 'ground' as const,
      oneWay: false
    };
    if (right <= start || left >= end) return [{ ...base, ...platform }];
    const fragments: Stage1CollisionRect[] = [];
    if (left < start) fragments.push({ ...base, ...platform, width: start - left });
    if (right > end) fragments.push({ ...base, ...platform, x: end, width: right - end });
    return fragments;
  });
};

export const buildStage1CollisionPlatforms = (legacy: readonly RectData[]): readonly Stage1CollisionRect[] => {
  if (!trialData.enabled) {
    return legacy.map((platform, index) => ({
      ...platform,
      id: `legacy-collider-${index}`,
      sourceId: `legacy-collider-${index}`,
      source: 'legacy',
      surfaceType: 'ground',
      oneWay: false
    }));
  }
  return [...Stage1TrialCollisionRects, ...keepLegacyOutsideTrialRange(legacy)];
};

export const Stage1CollisionTrialInfo = {
  enabled: trialData.enabled,
  source: trialData.source,
  coverageRange: trialData.coverageRange,
  surfaceCount: trialSurfaces.length,
  generatedRectCount: Stage1TrialCollisionRects.length
} as const;

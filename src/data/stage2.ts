import type { RectData, Stage1EnemyDefinition, Stage1WardenDefinition } from './stage1';

export type Stage2SectionName =
  | 'Moon Gate Drop'
  | 'Drain Lantern Shaft'
  | 'Hanging Market Switchback'
  | 'Billboard Fall Line'
  | 'Signal Spire Climb'
  | 'Relay Keeper Arena';

export type Stage2Section = {
  readonly id: string;
  readonly name: Stage2SectionName;
  readonly startX: number;
  readonly endX: number;
  readonly orientation: 'vertical' | 'switchback' | 'arena';
};

export type Stage2Platform = RectData & {
  readonly id: string;
};

export type Stage2Wall = RectData & {
  readonly id: string;
  readonly role: 'left-wall' | 'right-wall' | 'back-wall';
  readonly sectionId: string;
  readonly alpha: number;
};

export type Stage2Slope = {
  readonly id: string;
  readonly sectionId: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly thickness: number;
  readonly direction: 'down-right' | 'down-left';
  readonly boost: number;
};

export type Stage2Checkpoint = RectData & {
  readonly id: string;
  readonly name: string;
  readonly respawnX: number;
  readonly respawnY: number;
  readonly sectionId: string;
};

export type Stage2Hazard = RectData & {
  readonly id: string;
  readonly type: 'timed-spark' | 'fall-pit' | 'neon-thorn';
  readonly damage: number;
};

export type Stage2Gimmick = RectData & {
  readonly id: string;
  readonly type: 'updraft-vent' | 'crosswind-fan';
  readonly strength: number;
};

export type Stage2Anchor = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly sectionId: string;
};

export type Stage2Seal = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
};

export type Stage2Pickup = Stage2Seal & {
  readonly type: 'health' | 'energy';
};

export type Stage2Data = {
  readonly id: string;
  readonly title: string;
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly start: { readonly x: number; readonly y: number };
  readonly targetFirstClearSeconds: { readonly min: number; readonly max: number };
  readonly sections: readonly Stage2Section[];
  readonly platforms: readonly Stage2Platform[];
  readonly walls: readonly Stage2Wall[];
  readonly slopes: readonly Stage2Slope[];
  readonly checkpoints: readonly Stage2Checkpoint[];
  readonly hazards: readonly Stage2Hazard[];
  readonly gimmicks: readonly Stage2Gimmick[];
  readonly anchors: readonly Stage2Anchor[];
  readonly collectibles: {
    readonly seals: readonly Stage2Seal[];
    readonly pickups: readonly Stage2Pickup[];
  };
  readonly enemies: readonly Stage1EnemyDefinition[];
  readonly relayKeeper: Stage1WardenDefinition;
  readonly signalGate: RectData & { readonly id: string; readonly requiresRelayKeeperDefeated: boolean };
};

export const Stage2Tuning = {
  shadowThreadRange: 560,
  shadowThreadMinDurationMs: 110,
  shadowThreadMaxDurationMs: 240,
  shadowThreadSpeed: 2100,
  shadowThreadLaunchX: 240,
  shadowThreadLaunchY: -420,
  shadowThreadImpactMs: 150,
  shadowThreadStrikeSize: 92,
  crosswindMaxVx: 255,
  slopeSnapTolerance: 34,
  slopeAttachMaxRiseSpeed: 80,
  slopeMaxVx: 560
} as const;

export const RequiredStage2SectionNames = [
  'Moon Gate Drop',
  'Drain Lantern Shaft',
  'Hanging Market Switchback',
  'Billboard Fall Line',
  'Signal Spire Climb',
  'Relay Keeper Arena'
] as const satisfies readonly Stage2SectionName[];

export const Stage2Data = {
  id: 'stage2-neon-drain-signal-ascent',
  title: 'Stage 2 - Neon Drain: Signal Ascent',
  worldWidth: 7800,
  worldHeight: 1700,
  start: { x: 104, y: 382 },
  targetFirstClearSeconds: { min: 300, max: 600 },
  sections: [
    { id: 'moon-gate-drop', name: 'Moon Gate Drop', startX: 0, endX: 1300, orientation: 'vertical' },
    { id: 'drain-lantern-shaft', name: 'Drain Lantern Shaft', startX: 1300, endX: 2700, orientation: 'vertical' },
    { id: 'hanging-market-switchback', name: 'Hanging Market Switchback', startX: 2700, endX: 4000, orientation: 'switchback' },
    { id: 'billboard-fall-line', name: 'Billboard Fall Line', startX: 4000, endX: 5350, orientation: 'vertical' },
    { id: 'signal-spire-climb', name: 'Signal Spire Climb', startX: 5350, endX: 6700, orientation: 'vertical' },
    { id: 'relay-keeper-arena', name: 'Relay Keeper Arena', startX: 6700, endX: 7800, orientation: 'arena' }
  ],
  platforms: [
    { id: 'start-balcony', x: 0, y: 420, width: 610, height: 42 },
    { id: 'drop-catch-high', x: 720, y: 720, width: 300, height: 32 },
    { id: 'drop-catch-low', x: 1080, y: 1060, width: 430, height: 36 },
    { id: 'shaft-base', x: 1480, y: 1280, width: 410, height: 42 },
    { id: 'shaft-step-low', x: 1720, y: 1110, width: 250, height: 30 },
    { id: 'shaft-step-mid', x: 2060, y: 920, width: 240, height: 30 },
    { id: 'shaft-step-high', x: 2390, y: 730, width: 250, height: 30 },
    { id: 'shaft-exit-rail', x: 2600, y: 560, width: 440, height: 32 },
    { id: 'market-low-run', x: 2920, y: 990, width: 440, height: 38 },
    { id: 'market-high-run', x: 3060, y: 690, width: 390, height: 30 },
    { id: 'market-switch-roof', x: 3440, y: 835, width: 460, height: 34 },
    { id: 'billboard-top', x: 3890, y: 520, width: 410, height: 30 },
    { id: 'fall-catch-a', x: 4320, y: 860, width: 300, height: 32 },
    { id: 'fall-catch-b', x: 4660, y: 1180, width: 320, height: 34 },
    { id: 'fall-line-exit', x: 5050, y: 980, width: 420, height: 40 },
    { id: 'spire-base', x: 5400, y: 1180, width: 370, height: 40 },
    { id: 'spire-mid', x: 5720, y: 900, width: 330, height: 32 },
    { id: 'spire-high', x: 6040, y: 620, width: 330, height: 32 },
    { id: 'spire-crown', x: 6360, y: 360, width: 420, height: 34 },
    { id: 'arena-left-floor', x: 6740, y: 540, width: 430, height: 42 },
    { id: 'arena-right-floor', x: 7180, y: 540, width: 430, height: 42 },
    { id: 'signal-gate-floor', x: 7540, y: 540, width: 260, height: 42 }
  ],
  walls: [
    { id: 'drop-back-wall', role: 'back-wall', sectionId: 'moon-gate-drop', x: 590, y: 500, width: 720, height: 710, alpha: 0.26 },
    { id: 'shaft-back-wall-lower', role: 'back-wall', sectionId: 'drain-lantern-shaft', x: 1350, y: 620, width: 1310, height: 760, alpha: 0.34 },
    { id: 'shaft-back-wall-upper', role: 'back-wall', sectionId: 'drain-lantern-shaft', x: 1520, y: 230, width: 1180, height: 610, alpha: 0.3 },
    { id: 'shaft-left-wall-lower', role: 'left-wall', sectionId: 'drain-lantern-shaft', x: 1300, y: 650, width: 150, height: 730, alpha: 0.92 },
    { id: 'shaft-right-wall-lower', role: 'right-wall', sectionId: 'drain-lantern-shaft', x: 2540, y: 800, width: 150, height: 560, alpha: 0.9 },
    { id: 'shaft-left-wall-upper', role: 'left-wall', sectionId: 'drain-lantern-shaft', x: 1450, y: 295, width: 130, height: 525, alpha: 0.88 },
    { id: 'shaft-right-wall-upper', role: 'right-wall', sectionId: 'drain-lantern-shaft', x: 2700, y: 355, width: 130, height: 560, alpha: 0.88 },
    { id: 'shaft-left-cheek-gap', role: 'left-wall', sectionId: 'drain-lantern-shaft', x: 1540, y: 980, width: 120, height: 180, alpha: 0.86 },
    { id: 'shaft-right-cheek-gap', role: 'right-wall', sectionId: 'drain-lantern-shaft', x: 2290, y: 790, width: 125, height: 240, alpha: 0.86 },
    { id: 'market-back-wall', role: 'back-wall', sectionId: 'hanging-market-switchback', x: 2840, y: 560, width: 1060, height: 560, alpha: 0.28 },
    { id: 'billboard-back-facade', role: 'back-wall', sectionId: 'billboard-fall-line', x: 3980, y: 500, width: 1260, height: 620, alpha: 0.36 },
    { id: 'billboard-near-left-frame', role: 'left-wall', sectionId: 'billboard-fall-line', x: 3920, y: 560, width: 90, height: 480, alpha: 0.78 },
    { id: 'billboard-near-right-frame', role: 'right-wall', sectionId: 'billboard-fall-line', x: 5210, y: 1010, width: 90, height: 210, alpha: 0.78 },
    { id: 'spire-back-wall', role: 'back-wall', sectionId: 'signal-spire-climb', x: 5420, y: 350, width: 1130, height: 880, alpha: 0.3 },
    { id: 'spire-left-wall', role: 'left-wall', sectionId: 'signal-spire-climb', x: 5280, y: 680, width: 120, height: 570, alpha: 0.86 },
    { id: 'spire-right-wall', role: 'right-wall', sectionId: 'signal-spire-climb', x: 6620, y: 320, width: 120, height: 600, alpha: 0.86 }
  ],
  slopes: [
    {
      id: 'billboard-diagonal-downhill',
      sectionId: 'billboard-fall-line',
      x1: 4240,
      y1: 520,
      x2: 5120,
      y2: 980,
      thickness: 46,
      direction: 'down-right',
      boost: 240
    }
  ],
  checkpoints: [
    { id: 'checkpoint-drop', name: 'Moon Gate Drop Shrine', x: 210, y: 334, width: 78, height: 86, respawnX: 104, respawnY: 382, sectionId: 'moon-gate-drop' },
    { id: 'checkpoint-shaft', name: 'Drain Lantern Shrine', x: 1840, y: 1025, width: 78, height: 86, respawnX: 1840, respawnY: 1074, sectionId: 'drain-lantern-shaft' },
    { id: 'checkpoint-market', name: 'Hanging Market Shrine', x: 3260, y: 602, width: 78, height: 86, respawnX: 3260, respawnY: 652, sectionId: 'hanging-market-switchback' },
    { id: 'checkpoint-fall-exit', name: 'Billboard Catch Shrine', x: 5120, y: 892, width: 78, height: 86, respawnX: 5120, respawnY: 942, sectionId: 'billboard-fall-line' },
    { id: 'checkpoint-spire', name: 'Signal Spire Shrine', x: 6480, y: 274, width: 78, height: 86, respawnX: 6480, respawnY: 322, sectionId: 'signal-spire-climb' },
    { id: 'checkpoint-relay', name: 'Relay Rest Shrine', x: 6810, y: 452, width: 78, height: 86, respawnX: 6810, respawnY: 502, sectionId: 'relay-keeper-arena' }
  ],
  hazards: [
    { id: 'drop-miss-pit', type: 'fall-pit', x: 620, y: 1250, width: 260, height: 220, damage: 1 },
    { id: 'shaft-thorn-low', type: 'neon-thorn', x: 1620, y: 1268, width: 86, height: 18, damage: 1 },
    { id: 'shaft-spark-mid', type: 'timed-spark', x: 2200, y: 908, width: 86, height: 14, damage: 1 },
    { id: 'market-thorn-lower', type: 'neon-thorn', x: 3010, y: 978, width: 90, height: 18, damage: 1 },
    { id: 'market-spark-upper', type: 'timed-spark', x: 3350, y: 678, width: 86, height: 14, damage: 1 },
    { id: 'fall-line-pit', type: 'fall-pit', x: 4410, y: 1320, width: 360, height: 240, damage: 1 },
    { id: 'spire-thorn-mid', type: 'neon-thorn', x: 5840, y: 888, width: 92, height: 18, damage: 1 },
    { id: 'spire-spark-high', type: 'timed-spark', x: 6180, y: 608, width: 86, height: 14, damage: 1 },
    { id: 'arena-center-gap', type: 'fall-pit', x: 7100, y: 584, width: 92, height: 220, damage: 1 }
  ],
  gimmicks: [
    { id: 'drop-side-fan', type: 'crosswind-fan', x: 520, y: 450, width: 580, height: 360, strength: 210 },
    { id: 'shaft-updraft', type: 'updraft-vent', x: 1900, y: 840, width: 260, height: 390, strength: 690 },
    { id: 'market-crosswind', type: 'crosswind-fan', x: 3020, y: 560, width: 610, height: 360, strength: -185 },
    { id: 'fall-drift-fan', type: 'crosswind-fan', x: 4150, y: 590, width: 760, height: 560, strength: 250 },
    { id: 'spire-updraft-low', type: 'updraft-vent', x: 5480, y: 860, width: 280, height: 350, strength: 720 },
    { id: 'spire-updraft-high', type: 'updraft-vent', x: 6080, y: 430, width: 280, height: 350, strength: 760 }
  ],
  anchors: [
    { id: 'thread-drop-01', x: 610, y: 575, radius: 70, sectionId: 'moon-gate-drop' },
    { id: 'thread-drop-02', x: 1030, y: 880, radius: 70, sectionId: 'moon-gate-drop' },
    { id: 'thread-shaft-01', x: 1660, y: 1160, radius: 72, sectionId: 'drain-lantern-shaft' },
    { id: 'thread-shaft-02', x: 2020, y: 980, radius: 72, sectionId: 'drain-lantern-shaft' },
    { id: 'thread-shaft-03', x: 2340, y: 790, radius: 72, sectionId: 'drain-lantern-shaft' },
    { id: 'thread-shaft-04', x: 2640, y: 610, radius: 72, sectionId: 'drain-lantern-shaft' },
    { id: 'thread-market-01', x: 2980, y: 800, radius: 72, sectionId: 'hanging-market-switchback' },
    { id: 'thread-market-02', x: 3340, y: 610, radius: 72, sectionId: 'hanging-market-switchback' },
    { id: 'thread-market-03', x: 3690, y: 760, radius: 72, sectionId: 'hanging-market-switchback' },
    { id: 'thread-fall-01', x: 4140, y: 650, radius: 74, sectionId: 'billboard-fall-line' },
    { id: 'thread-fall-02', x: 4480, y: 910, radius: 74, sectionId: 'billboard-fall-line' },
    { id: 'thread-fall-03', x: 4800, y: 1120, radius: 74, sectionId: 'billboard-fall-line' },
    { id: 'thread-spire-01', x: 5600, y: 1040, radius: 74, sectionId: 'signal-spire-climb' },
    { id: 'thread-spire-02', x: 5900, y: 780, radius: 74, sectionId: 'signal-spire-climb' },
    { id: 'thread-spire-03', x: 6180, y: 520, radius: 74, sectionId: 'signal-spire-climb' },
    { id: 'thread-spire-04', x: 6520, y: 350, radius: 74, sectionId: 'signal-spire-climb' },
    { id: 'thread-arena-left', x: 6900, y: 390, radius: 78, sectionId: 'relay-keeper-arena' },
    { id: 'thread-arena-right', x: 7290, y: 390, radius: 78, sectionId: 'relay-keeper-arena' }
  ],
  collectibles: {
    seals: [
      { id: 's2-seal-01', x: 330, y: 346 },
      { id: 's2-seal-02', x: 720, y: 648 },
      { id: 's2-seal-03', x: 1100, y: 986 },
      { id: 's2-seal-04', x: 1550, y: 1210 },
      { id: 's2-seal-05', x: 1840, y: 1050 },
      { id: 's2-seal-06', x: 2140, y: 860 },
      { id: 's2-seal-07', x: 2440, y: 670 },
      { id: 's2-seal-08', x: 2700, y: 500 },
      { id: 's2-seal-09', x: 2980, y: 920 },
      { id: 's2-seal-10', x: 3180, y: 630 },
      { id: 's2-seal-11', x: 3520, y: 775 },
      { id: 's2-seal-12', x: 3940, y: 460 },
      { id: 's2-seal-13', x: 4300, y: 560 },
      { id: 's2-seal-14', x: 4620, y: 740 },
      { id: 's2-seal-15', x: 5120, y: 916 },
      { id: 's2-seal-16', x: 5480, y: 1106 },
      { id: 's2-seal-17', x: 5780, y: 840 },
      { id: 's2-seal-18', x: 6100, y: 560 },
      { id: 's2-seal-19', x: 6500, y: 300 },
      { id: 's2-seal-20', x: 6840, y: 486 },
      { id: 's2-seal-21', x: 7280, y: 486 },
      { id: 's2-seal-22', x: 7620, y: 486 }
    ],
    pickups: [
      { id: 's2-health-01', type: 'health', x: 1820, y: 1050 },
      { id: 's2-energy-01', type: 'energy', x: 3340, y: 630 },
      { id: 's2-health-02', type: 'health', x: 5120, y: 916 },
      { id: 's2-energy-02', type: 'energy', x: 6480, y: 300 }
    ]
  },
  enemies: [
    { id: 's2-ink-01', type: 'ink-crawler', x: 1780, y: 1218, patrolMinX: 1540, patrolMaxX: 1860, sectionId: 'drain-lantern-shaft' },
    { id: 's2-kite-01', type: 'kite-wraith', x: 2460, y: 650, patrolMinX: 2240, patrolMaxX: 2680, sectionId: 'drain-lantern-shaft' },
    { id: 's2-kite-02', type: 'kite-wraith', x: 3380, y: 610, patrolMinX: 3060, patrolMaxX: 3700, sectionId: 'hanging-market-switchback' },
    { id: 's2-ink-02', type: 'ink-crawler', x: 3600, y: 773, patrolMinX: 3460, patrolMaxX: 3860, sectionId: 'hanging-market-switchback' },
    { id: 's2-kite-03', type: 'kite-wraith', x: 4580, y: 1010, patrolMinX: 4300, patrolMaxX: 4960, sectionId: 'billboard-fall-line' },
    { id: 's2-kite-04', type: 'kite-wraith', x: 6160, y: 470, patrolMinX: 5880, patrolMaxX: 6540, sectionId: 'signal-spire-climb' }
  ],
  relayKeeper: {
    id: 'relay-keeper-01',
    x: 7110,
    y: 420,
    arena: { x: 6700, y: 320, width: 880, height: 262 },
    hp: 6,
    attackStates: ['lantern-sweep', 'spark-drop', 'rush-cut']
  },
  signalGate: { id: 'signal-gate', x: 7630, y: 392, width: 126, height: 184, requiresRelayKeeperDefeated: true }
} as const satisfies Stage2Data;

export const getStage2SectionForX = (x: number): Stage2Section => {
  return (
    Stage2Data.sections.find((section) => x >= section.startX && x < section.endX) ??
    Stage2Data.sections[Stage2Data.sections.length - 1]
  );
};

export type Stage2ValidationCheck = {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
};

export type Stage2ValidationReport = {
  readonly passed: boolean;
  readonly checks: readonly Stage2ValidationCheck[];
};

export const validateStage2 = (data: Stage2Data = Stage2Data): Stage2ValidationReport => {
  const checks: Stage2ValidationCheck[] = [];
  const check = (id: string, passed: boolean, detail: string): void => {
    checks.push({ id, passed, detail });
  };
  const names = data.sections.map((section) => section.name);
  const gaps = data.sections.filter((section, index) => {
    const expectedStart = index === 0 ? 0 : data.sections[index - 1].endX;
    return section.startX !== expectedStart || section.endX <= section.startX;
  });
  const verticalPlatforms = data.platforms.filter((platform) => platform.y < 760 || platform.y > 1020);
  const minY = Math.min(...data.platforms.map((platform) => platform.y));
  const maxY = Math.max(...data.platforms.map((platform) => platform.y));
  const sectionIds = new Set(data.sections.map((section) => section.id));
  const collidableWalls = data.walls.filter((wall) => wall.role !== 'back-wall');
  const shaftWalls = data.walls.filter((wall) => wall.sectionId === 'drain-lantern-shaft' && wall.role !== 'back-wall');
  const billboardSlope = data.slopes.find((slope) => slope.sectionId === 'billboard-fall-line' && slope.direction === 'down-right');
  const billboardSlopeDrop = billboardSlope ? billboardSlope.y2 - billboardSlope.y1 : 0;
  const billboardSlopeLength = billboardSlope ? Math.hypot(billboardSlope.x2 - billboardSlope.x1, billboardSlope.y2 - billboardSlope.y1) : 0;
  const orphanedAnchors = data.anchors.filter((anchor) => !sectionIds.has(anchor.sectionId));
  const orphanedEnemies = data.enemies.filter((enemy) => !sectionIds.has(enemy.sectionId));

  check(
    'six-dynamic-sections',
    data.sections.length === 6 && RequiredStage2SectionNames.every((name, index) => names[index] === name),
    `${data.sections.length} sections: ${names.join(', ')}`
  );
  check(
    'continuous-route',
    gaps.length === 0 && data.sections[0]?.startX === 0 && data.sections[data.sections.length - 1]?.endX === data.worldWidth,
    `${gaps.length} gaps`
  );
  check('large-vertical-range', data.worldHeight >= 1600 && maxY - minY >= 820, `worldHeight=${data.worldHeight}, platformRange=${maxY - minY}`);
  check('vertical-platform-density', verticalPlatforms.length >= 14, `${verticalPlatforms.length} high/low platforms`);
  check(
    'wall-gap-shaft',
    shaftWalls.length >= 6 && shaftWalls.some((wall) => wall.role === 'left-wall') && shaftWalls.some((wall) => wall.role === 'right-wall'),
    `${shaftWalls.length} collidable shaft walls`
  );
  check(
    'diagonal-downhill-slope',
    billboardSlopeDrop >= 420 && billboardSlopeLength >= 980,
    `drop=${Math.round(billboardSlopeDrop)}, length=${Math.round(billboardSlopeLength)}`
  );
  check('spatial-depth-geometry', collidableWalls.length >= 10 && data.walls.some((wall) => wall.role === 'back-wall'), `${collidableWalls.length} walls`);
  check('shadow-thread-anchors', data.anchors.length >= 16 && orphanedAnchors.length === 0, `${data.anchors.length} anchors, ${orphanedAnchors.length} orphaned`);
  check('new-technique-route-required', data.anchors.some((anchor) => anchor.y < 420) && data.anchors.some((anchor) => anchor.y > 1000), 'anchors cover high climb and long fall');
  check('airborne-enemy-lanes', data.enemies.filter((enemy) => enemy.type === 'kite-wraith').length >= 4 && orphanedEnemies.length === 0, `${data.enemies.length} enemies`);
  check('stage2-miniboss-not-final-boss', data.relayKeeper.id.includes('relay-keeper') && data.relayKeeper.hp <= 6, data.relayKeeper.id);

  return { passed: checks.every((item) => item.passed), checks };
};

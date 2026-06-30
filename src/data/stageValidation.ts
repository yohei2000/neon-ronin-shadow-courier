import { RequiredStage1SectionNames, Stage1Data, type RectData, type Stage1Data as Stage1DataType } from './stage1';

export type StageValidationReport = {
  readonly passed: boolean;
  readonly checks: readonly {
    readonly id: string;
    readonly passed: boolean;
    readonly detail: string;
  }[];
};

const overlaps = (a: RectData, b: RectData): boolean => {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

const check = (id: string, passed: boolean, detail: string) => ({ id, passed, detail });
const collectibleVisualBounds = {
  seals: { width: 28, height: 22 },
  scrolls: { width: 50, height: 32 },
  pickups: { width: 34, height: 34 }
} as const;
const scrollCollectBody = (x: number, y: number): RectData => ({ x: x - 41, y: y - 29, width: 82, height: 58 });
const playerStandingBody = (x: number, platformTop: number): RectData => ({ x: x - 21, y: platformTop - 72, width: 42, height: 72 });
const scrollHasCollectionLane = (data: Stage1DataType, scroll: { readonly x: number; readonly y: number }): boolean => {
  const scrollBody = scrollCollectBody(scroll.x, scroll.y);
  return data.platforms.some((platform) => {
    if (scroll.x < platform.x - 34 || scroll.x > platform.x + platform.width + 34) return false;
    return overlaps(scrollBody, playerStandingBody(scroll.x, platform.y));
  });
};
const firePassageCheck = (data: Stage1DataType): { readonly passed: boolean; readonly detail: string } => {
  const spark = data.hazards.find((hazard) => hazard.id === 'timed-spark');
  if (!spark) return { passed: false, detail: 'timed-spark missing' };
  const sparkCenterX = spark.x + spark.width / 2;
  const sparkBottom = spark.y + spark.height;
  const platform = data.platforms
    .filter((item) => sparkCenterX >= item.x && sparkCenterX <= item.x + item.width && item.y >= sparkBottom - 8)
    .sort((a, b) => Math.abs(a.y - sparkBottom) - Math.abs(b.y - sparkBottom))[0];
  if (!platform) return { passed: false, detail: 'no platform under timed-spark' };
  const groundBody = playerStandingBody(sparkCenterX, platform.y);
  const jumpBody = { ...groundBody, y: groundBody.y - 80 };
  const groundThreat = overlaps(groundBody, spark);
  const jumpClear = !overlaps(jumpBody, spark);
  return {
    passed: groundThreat && jumpClear,
    detail: `groundThreat=${groundThreat}, jumpClear=${jumpClear}`
  };
};
const collectibleVisualRect = (
  item: { readonly x: number; readonly y: number },
  bounds: { readonly width: number; readonly height: number }
): RectData => ({
  x: item.x - bounds.width / 2,
  y: item.y - bounds.height / 2,
  width: bounds.width,
  height: bounds.height
});
const collectiblePlatformOverlaps = (data: Stage1DataType): string[] => {
  const entries = [
    ...data.collectibles.seals.map((item) => ({ group: 'seal', item, bounds: collectibleVisualBounds.seals })),
    ...data.collectibles.scrolls.map((item) => ({ group: 'scroll', item, bounds: collectibleVisualBounds.scrolls })),
    ...data.collectibles.pickups.map((item) => ({ group: 'pickup', item, bounds: collectibleVisualBounds.pickups }))
  ];
  return entries.flatMap(({ group, item, bounds }) => {
    const rect = collectibleVisualRect(item, bounds);
    return data.platforms.filter((platform) => overlaps(rect, platform)).map((platform) => `${group}:${item.id}->${platform.id}`);
  });
};
const neonRunPlatformVariety = (data: Stage1DataType): { readonly passed: boolean; readonly detail: string } => {
  const runStartX = 3920;
  const runEndX = data.warden.arena.x - 480;
  const platforms = data.platforms.filter((platform) => platform.x < runEndX && platform.x + platform.width > runStartX);
  const maxWidth = platforms.reduce((longest, platform) => Math.max(longest, platform.width), 0);
  const elevatedCount = platforms.filter((platform) => platform.y <= 330).length;
  const fallPitCount = data.hazards.filter((hazard) => hazard.type === 'fall-pit' && hazard.x >= runStartX && hazard.x < runEndX).length;
  return {
    passed: platforms.length >= 16 && maxWidth <= 1200 && elevatedCount >= 4 && fallPitCount >= 6,
    detail: `${platforms.length} platforms, maxWidth=${maxWidth}, elevated=${elevatedCount}, fallPits=${fallPitCount}`
  };
};
const neonRunVerticalRoute = (data: Stage1DataType): { readonly passed: boolean; readonly detail: string } => {
  const runStartX = 3920;
  const runEndX = data.warden.arena.x - 480;
  const platforms = data.platforms.filter((platform) => platform.x < runEndX && platform.x + platform.width > runStartX);
  const highestTop = platforms.reduce((top, platform) => Math.min(top, platform.y), Infinity);
  const lowestTop = platforms.reduce((top, platform) => Math.max(top, platform.y), -Infinity);
  const highPlatforms = platforms.filter((platform) => platform.y <= 330).length;
  const lowerPlatforms = platforms.filter((platform) => platform.y >= 490).length;
  const middlePlatforms = platforms.filter((platform) => platform.y > 330 && platform.y < 490).length;
  const updrafts = data.gimmicks.filter((gimmick) => gimmick.type === 'updraft-vent' && gimmick.x >= runStartX && gimmick.x < runEndX);
  const verticalRange = lowestTop - highestTop;
  return {
    passed: verticalRange >= 190 && highPlatforms >= 6 && middlePlatforms >= 6 && lowerPlatforms >= 4 && updrafts.length >= 3,
    detail: `range=${verticalRange}, high=${highPlatforms}, mid=${middlePlatforms}, low=${lowerPlatforms}, updrafts=${updrafts.length}`
  };
};

export const validateStage1 = (data: Stage1DataType = Stage1Data): StageValidationReport => {
  const names = data.sections.map((section) => section.name);
  const verticalSections = data.sections.filter((section) => section.orientation === 'vertical');
  const optionalRoutes = data.sections.filter((section) => section.optionalRoute);
  const firstScreenDamageSources = [
    ...data.hazards,
    ...data.enemies.map((enemy) => ({ x: enemy.x - 36, y: enemy.y - 48, width: 72, height: 96 }))
  ].filter((rect) => overlaps(rect, data.safeFirstScreen));
  const restDamageSources = [
    ...data.hazards,
    ...data.enemies.map((enemy) => ({ x: enemy.x - 36, y: enemy.y - 48, width: 72, height: 96 }))
  ].filter((rect) => overlaps(rect, data.safeRestBeforeMiniboss));
  const healthOrEnergy = data.collectibles.pickups.filter((pickup) => pickup.type === 'health' || pickup.type === 'energy');
  const enemyEncounterCount = data.enemies.length;
  const sectionIdSet = new Set(data.sections.map((section) => section.id));
  const orphanedEnemies = data.enemies.filter((enemy) => !sectionIdSet.has(enemy.sectionId));
  const orphanedCheckpoints = data.checkpoints.filter((checkpoint) => !sectionIdSet.has(checkpoint.sectionId));
  const orphanedScrolls = data.collectibles.scrolls.filter((scroll) => !sectionIdSet.has(scroll.routeId));
  const unreachableScrolls = data.collectibles.scrolls.filter((scroll) => !scrollHasCollectionLane(data, scroll));
  const embeddedCollectibles = collectiblePlatformOverlaps(data);
  const firePassage = firePassageCheck(data);
  const runVariety = neonRunPlatformVariety(data);
  const verticalRoute = neonRunVerticalRoute(data);

  const checks = [
    check(
      'ten-named-sections',
      data.sections.length === 10 && RequiredStage1SectionNames.every((name, index) => names[index] === name),
      `${data.sections.length} sections: ${names.join(', ')}`
    ),
    check('two-vertical-sections', verticalSections.length >= 2, `${verticalSections.length} vertical sections`),
    check('two-optional-routes', optionalRoutes.length >= 2, `${optionalRoutes.length} optional routes`),
    check('two-checkpoints', data.checkpoints.length >= 2, `${data.checkpoints.length} checkpoints`),
    check('exactly-three-scrolls', data.collectibles.scrolls.length === 3, `${data.collectibles.scrolls.length} scrolls`),
    check('twenty-seals', data.collectibles.seals.length >= 20, `${data.collectibles.seals.length} seals`),
    check('three-pickups', healthOrEnergy.length >= 3, `${healthOrEnergy.length} health/energy pickups`),
    check('three-hazard-moments', data.hazards.length >= 3, `${data.hazards.length} hazards`),
    check('four-enemy-encounters', enemyEncounterCount >= 4, `${enemyEncounterCount} enemy encounters`),
    check('single-warden', data.warden.id.length > 0 && data.warden.attackStates.length === 3, data.warden.id),
    check('safe-first-screen', firstScreenDamageSources.length === 0, `${firstScreenDamageSources.length} first-screen damage sources`),
    check('safe-rest-before-miniboss', restDamageSources.length === 0, `${restDamageSources.length} rest-area damage sources`),
    check('moon-gate-requires-warden', data.moonGate.requiresWardenDefeated === true, data.moonGate.id),
    check(
      'section-references-valid',
      orphanedEnemies.length === 0 && orphanedCheckpoints.length === 0 && orphanedScrolls.length === 0,
      `${orphanedEnemies.length} orphaned enemies, ${orphanedCheckpoints.length} orphaned checkpoints, ${orphanedScrolls.length} orphaned scrolls`
    ),
    check('scroll-collection-lanes', unreachableScrolls.length === 0, unreachableScrolls.map((scroll) => scroll.id).join(', ') || 'all scrolls overlap reachable player lanes'),
    check('collectibles-clear-platforms', embeddedCollectibles.length === 0, embeddedCollectibles.join(', ') || 'no collectible visual overlaps platform geometry'),
    check('neon-run-platform-variety', runVariety.passed, runVariety.detail),
    check('neon-run-vertical-route', verticalRoute.passed, verticalRoute.detail),
    check('stage1-updraft-gimmicks', data.gimmicks.filter((gimmick) => gimmick.type === 'updraft-vent').length >= 3, `${data.gimmicks.length} gimmicks`),
    check('timed-spark-jump-clearance', firePassage.passed, firePassage.detail),
    check(
      'duration-targets',
      data.targetFirstClearSeconds.min === 540 &&
        data.targetFirstClearSeconds.max === 900 &&
        data.targetOptimizedSeconds.min === 180 &&
        data.targetOptimizedSeconds.max === 360,
      `human ${data.targetFirstClearSeconds.min}-${data.targetFirstClearSeconds.max}s, e2e ${data.targetOptimizedSeconds.min}-${data.targetOptimizedSeconds.max}s`
    )
  ];

  return {
    passed: checks.every((item) => item.passed),
    checks
  };
};

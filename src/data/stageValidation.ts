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
const linearStageRoute = (data: Stage1DataType): { readonly passed: boolean; readonly detail: string } => {
  const optionalRoutes = data.sections.filter((section) => section.optionalRoute);
  const gaps = data.sections.filter((section, index) => {
    const expectedStart = index === 0 ? 0 : data.sections[index - 1].endX;
    return section.startX !== expectedStart || section.endX <= section.startX;
  });
  const lastSection = data.sections[data.sections.length - 1];
  const covered = data.sections[0]?.startX === 0 && lastSection?.endX === data.worldWidth;
  return {
    passed: optionalRoutes.length === 0 && gaps.length === 0 && covered,
    detail: `${optionalRoutes.length} optional routes, ${gaps.length} discontinuities, covered=${covered}`
  };
};
const compactStagePlatformVariety = (data: Stage1DataType): { readonly passed: boolean; readonly detail: string } => {
  const platforms = data.platforms;
  const maxWidth = platforms.reduce((longest, platform) => Math.max(longest, platform.width), 0);
  const elevatedCount = platforms.filter((platform) => platform.y <= 390).length;
  const fallPitCount = data.hazards.filter((hazard) => hazard.type === 'fall-pit').length;
  return {
    passed: platforms.length >= 16 && platforms.length <= 24 && maxWidth <= 1200 && elevatedCount >= 5 && fallPitCount >= 1 && fallPitCount <= 3,
    detail: `${platforms.length} platforms, maxWidth=${maxWidth}, elevated=${elevatedCount}, fallPits=${fallPitCount}`
  };
};
const compactStageVerticality = (data: Stage1DataType): { readonly passed: boolean; readonly detail: string } => {
  const platforms = data.platforms;
  const highestTop = platforms.reduce((top, platform) => Math.min(top, platform.y), Infinity);
  const lowestTop = platforms.reduce((top, platform) => Math.max(top, platform.y), -Infinity);
  const highPlatforms = platforms.filter((platform) => platform.y <= 260).length;
  const middlePlatforms = platforms.filter((platform) => platform.y > 260 && platform.y < 535).length;
  const updrafts = data.gimmicks.filter((gimmick) => gimmick.type === 'updraft-vent');
  const verticalRange = lowestTop - highestTop;
  return {
    passed: verticalRange >= 330 && highPlatforms >= 4 && middlePlatforms >= 8 && updrafts.length === 2,
    detail: `range=${verticalRange}, high=${highPlatforms}, mid=${middlePlatforms}, updrafts=${updrafts.length}`
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
  const linearRoute = linearStageRoute(data);
  const platformVariety = compactStagePlatformVariety(data);
  const verticalRoute = compactStageVerticality(data);

  const checks = [
    check(
      'five-linear-sections',
      data.sections.length === 5 && RequiredStage1SectionNames.every((name, index) => names[index] === name),
      `${data.sections.length} sections: ${names.join(', ')}`
    ),
    check('single-continuous-route', linearRoute.passed, linearRoute.detail),
    check('stage-scope-1-5x', data.worldWidth >= 9500 && data.worldWidth <= 10550, `worldWidth=${data.worldWidth}`),
    check('two-vertical-sections', verticalSections.length >= 2, `${verticalSections.length} vertical sections`),
    check('no-optional-routes', optionalRoutes.length === 0, `${optionalRoutes.length} optional routes`),
    check('two-checkpoints', data.checkpoints.length >= 2, `${data.checkpoints.length} checkpoints`),
    check('no-hidden-scrolls', data.collectibles.scrolls.length === 0, `${data.collectibles.scrolls.length} scrolls`),
    check('twenty-four-seals', data.collectibles.seals.length >= 24, `${data.collectibles.seals.length} seals`),
    check('four-pickups', healthOrEnergy.length >= 4, `${healthOrEnergy.length} health/energy pickups`),
    check('six-hazard-moments', data.hazards.length >= 6, `${data.hazards.length} hazards`),
    check('five-enemy-encounters', enemyEncounterCount >= 5, `${enemyEncounterCount} enemy encounters`),
    check('single-warden', data.warden.id.length > 0 && data.warden.attackStates.length === 3, data.warden.id),
    check('safe-first-screen', firstScreenDamageSources.length === 0, `${firstScreenDamageSources.length} first-screen damage sources`),
    check('safe-rest-before-miniboss', restDamageSources.length === 0, `${restDamageSources.length} rest-area damage sources`),
    check('moon-gate-requires-warden', data.moonGate.requiresWardenDefeated === true, data.moonGate.id),
    check(
      'section-references-valid',
      orphanedEnemies.length === 0 && orphanedCheckpoints.length === 0 && orphanedScrolls.length === 0,
      `${orphanedEnemies.length} orphaned enemies, ${orphanedCheckpoints.length} orphaned checkpoints, ${orphanedScrolls.length} orphaned scrolls`
    ),
    check('scroll-collection-lanes', unreachableScrolls.length === 0, unreachableScrolls.map((scroll) => scroll.id).join(', ') || 'no scroll routes to validate'),
    check('collectibles-clear-platforms', embeddedCollectibles.length === 0, embeddedCollectibles.join(', ') || 'no collectible visual overlaps platform geometry'),
    check('compact-platform-variety', platformVariety.passed, platformVariety.detail),
    check('compact-vertical-route', verticalRoute.passed, verticalRoute.detail),
    check('two-updraft-gimmicks', data.gimmicks.filter((gimmick) => gimmick.type === 'updraft-vent').length === 2, `${data.gimmicks.length} gimmicks`),
    check('timed-spark-jump-clearance', firePassage.passed, firePassage.detail),
    check(
      'duration-targets',
        data.targetFirstClearSeconds.min === 240 &&
        data.targetFirstClearSeconds.max === 480 &&
        data.targetOptimizedSeconds.min === 105 &&
        data.targetOptimizedSeconds.max === 210,
      `human ${data.targetFirstClearSeconds.min}-${data.targetFirstClearSeconds.max}s, e2e ${data.targetOptimizedSeconds.min}-${data.targetOptimizedSeconds.max}s`
    )
  ];

  return {
    passed: checks.every((item) => item.passed),
    checks
  };
};

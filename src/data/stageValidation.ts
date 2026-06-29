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
  const platform = data.platforms.find((item) => sparkCenterX >= item.x && sparkCenterX <= item.x + item.width);
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
  const firePassage = firePassageCheck(data);

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
    check('timed-spark-jump-clearance', firePassage.passed, firePassage.detail),
    check(
      'duration-targets',
      data.targetFirstClearSeconds.min === 180 &&
        data.targetFirstClearSeconds.max === 300 &&
        data.targetOptimizedSeconds.min === 60 &&
        data.targetOptimizedSeconds.max === 120,
      `human ${data.targetFirstClearSeconds.min}-${data.targetFirstClearSeconds.max}s, e2e ${data.targetOptimizedSeconds.min}-${data.targetOptimizedSeconds.max}s`
    )
  ];

  return {
    passed: checks.every((item) => item.passed),
    checks
  };
};

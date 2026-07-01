import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });

const stage = JSON.parse(fs.readFileSync(path.resolve('src', 'data', 'stage1Content.json'), 'utf8'));
const requiredNames = [
  'Rain Lantern Start',
  'Wall-Kick Sign Shaft',
  'Rooftop Hazard Line',
  'Neon Thorn Climb',
  'Lantern Warden Gate'
];

const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const check = (id, passed, detail) => ({ id, passed, detail });
const collectibleVisualBounds = {
  seals: { width: 28, height: 22 },
  scrolls: { width: 50, height: 32 },
  pickups: { width: 34, height: 34 }
};
const scrollCollectBody = (scroll) => ({ x: scroll.x - 41, y: scroll.y - 29, width: 82, height: 58 });
const playerStandingBody = (x, platformTop) => ({ x: x - 21, y: platformTop - 72, width: 42, height: 72 });
const scrollHasCollectionLane = (scroll) =>
  (stage.platforms ?? []).some((platform) => {
    if (scroll.x < platform.x - 34 || scroll.x > platform.x + platform.width + 34) return false;
    return overlap(scrollCollectBody(scroll), playerStandingBody(scroll.x, platform.y));
  });
const firePassageCheck = () => {
  const spark = hazards.find((hazard) => hazard.id === 'timed-spark');
  if (!spark) return { passed: false, detail: 'timed-spark missing' };
  const sparkCenterX = spark.x + spark.width / 2;
  const sparkBottom = spark.y + spark.height;
  const platform = (stage.platforms ?? [])
    .filter((item) => sparkCenterX >= item.x && sparkCenterX <= item.x + item.width && item.y >= sparkBottom - 8)
    .sort((a, b) => Math.abs(a.y - sparkBottom) - Math.abs(b.y - sparkBottom))[0];
  if (!platform) return { passed: false, detail: 'no platform under timed-spark' };
  const groundBody = playerStandingBody(sparkCenterX, platform.y);
  const jumpBody = { ...groundBody, y: groundBody.y - 80 };
  const groundThreat = overlap(groundBody, spark);
  const jumpClear = !overlap(jumpBody, spark);
  return { passed: groundThreat && jumpClear, detail: `groundThreat=${groundThreat}, jumpClear=${jumpClear}` };
};
const collectibleVisualRect = (item, bounds) => ({
  x: item.x - bounds.width / 2,
  y: item.y - bounds.height / 2,
  width: bounds.width,
  height: bounds.height
});
const collectiblePlatformOverlaps = () => {
  const entries = [
    ...(stage.collectibles?.seals ?? []).map((item) => ({ group: 'seal', item, bounds: collectibleVisualBounds.seals })),
    ...(stage.collectibles?.scrolls ?? []).map((item) => ({ group: 'scroll', item, bounds: collectibleVisualBounds.scrolls })),
    ...(stage.collectibles?.pickups ?? []).map((item) => ({ group: 'pickup', item, bounds: collectibleVisualBounds.pickups }))
  ];
  return entries.flatMap(({ group, item, bounds }) => {
    const rect = collectibleVisualRect(item, bounds);
    return (stage.platforms ?? []).filter((platform) => overlap(rect, platform)).map((platform) => `${group}:${item.id}->${platform.id}`);
  });
};
const linearStageRoute = () => {
  const optionalRoutes = sections.filter((section) => section.optionalRoute === true);
  const gaps = sections.filter((section, index) => {
    const expectedStart = index === 0 ? 0 : sections[index - 1].endX;
    return section.startX !== expectedStart || section.endX <= section.startX;
  });
  const covered = sections[0]?.startX === 0 && sections.at(-1)?.endX === stage.worldWidth;
  return {
    passed: optionalRoutes.length === 0 && gaps.length === 0 && covered,
    detail: `${optionalRoutes.length} optional routes, ${gaps.length} discontinuities, covered=${covered}`
  };
};
const compactStagePlatformVariety = () => {
  const routePlatforms = stage.platforms ?? [];
  const maxWidth = routePlatforms.reduce((longest, platform) => Math.max(longest, platform.width), 0);
  const elevated = routePlatforms.filter((platform) => platform.y <= 330).length;
  const fallPits = hazards.filter((hazard) => hazard.type === 'fall-pit').length;
  return {
    passed: routePlatforms.length >= 10 && routePlatforms.length <= 16 && maxWidth <= 1200 && elevated >= 4 && fallPits >= 1 && fallPits <= 3,
    detail: `${routePlatforms.length} platforms, maxWidth=${maxWidth}, elevated=${elevated}, fallPits=${fallPits}`
  };
};
const compactStageVerticality = () => {
  const routePlatforms = stage.platforms ?? [];
  const highestTop = routePlatforms.reduce((top, platform) => Math.min(top, platform.y), Infinity);
  const lowestTop = routePlatforms.reduce((top, platform) => Math.max(top, platform.y), -Infinity);
  const high = routePlatforms.filter((platform) => platform.y <= 330).length;
  const mid = routePlatforms.filter((platform) => platform.y > 330 && platform.y < 490).length;
  const updrafts = (stage.gimmicks ?? []).filter((gimmick) => gimmick.type === 'updraft-vent');
  const range = lowestTop - highestTop;
  return {
    passed: range >= 170 && high >= 3 && mid >= 3 && updrafts.length === 1,
    detail: `range=${range}, high=${high}, mid=${mid}, updrafts=${updrafts.length}`
  };
};
const sections = stage.sections ?? [];
const hazards = stage.hazards ?? [];
const enemies = stage.enemies ?? [];
const unreachableScrolls = (stage.collectibles?.scrolls ?? []).filter((scroll) => !scrollHasCollectionLane(scroll));
const embeddedCollectibles = collectiblePlatformOverlaps();
const firePassage = firePassageCheck();
const linearRoute = linearStageRoute();
const platformVariety = compactStagePlatformVariety();
const verticalRoute = compactStageVerticality();
const damageRects = [
  ...hazards,
  ...enemies.map((enemy) => ({ x: enemy.x - 36, y: enemy.y - 48, width: 72, height: 96 }))
];
const sectionIds = new Set(sections.map((section) => section.id));
const checks = [
  check(
    'five-linear-sections',
    sections.length === 5 && requiredNames.every((name, index) => sections[index]?.name === name),
    sections.map((section) => section.name).join(', ')
  ),
  check('single-continuous-route', linearRoute.passed, linearRoute.detail),
  check('compact-stage-scope', stage.worldWidth >= 5600 && stage.worldWidth <= 7500, `worldWidth=${stage.worldWidth}`),
  check('two-vertical-sections', sections.filter((section) => section.orientation === 'vertical').length >= 2, 'vertical section count'),
  check('no-optional-routes', sections.filter((section) => section.optionalRoute === true).length === 0, 'optional route count'),
  check('two-checkpoints', (stage.checkpoints ?? []).length >= 2, `${(stage.checkpoints ?? []).length} checkpoints`),
  check('no-hidden-scrolls', (stage.collectibles?.scrolls ?? []).length === 0, `${stage.collectibles?.scrolls?.length ?? 0} scrolls`),
  check('twelve-seals', (stage.collectibles?.seals ?? []).length >= 12, `${stage.collectibles?.seals?.length ?? 0} seals`),
  check('three-health-energy-pickups', (stage.collectibles?.pickups ?? []).length >= 3, `${stage.collectibles?.pickups?.length ?? 0} pickups`),
  check('three-hazard-moments', hazards.length >= 3, `${hazards.length} hazards`),
  check('three-enemy-encounters', enemies.length >= 3, `${enemies.length} enemies`),
  check('single-lantern-warden', Boolean(stage.warden?.id) && stage.warden?.attackStates?.length === 3, stage.warden?.id ?? 'missing'),
  check('safe-first-screen', damageRects.filter((rect) => overlap(rect, stage.safeFirstScreen)).length === 0, 'first screen damage source overlap'),
  check('safe-rest-before-miniboss', damageRects.filter((rect) => overlap(rect, stage.safeRestBeforeMiniboss)).length === 0, 'pre-boss rest damage source overlap'),
  check('moon-gate-stage-clear', stage.moonGate?.requiresWardenDefeated === true, stage.moonGate?.id ?? 'missing'),
  check('no-orphan-section-refs', enemies.every((enemy) => sectionIds.has(enemy.sectionId)), 'enemy section references'),
  check('scroll-collection-lanes', unreachableScrolls.length === 0, unreachableScrolls.map((scroll) => scroll.id).join(', ') || 'no scroll routes to validate'),
  check('collectibles-clear-platforms', embeddedCollectibles.length === 0, embeddedCollectibles.join(', ') || 'no collectible visual overlaps platform geometry'),
  check('compact-platform-variety', platformVariety.passed, platformVariety.detail),
  check('compact-vertical-route', verticalRoute.passed, verticalRoute.detail),
  check('single-updraft-gimmick', (stage.gimmicks ?? []).filter((gimmick) => gimmick.type === 'updraft-vent').length === 1, `${stage.gimmicks?.length ?? 0} gimmicks`),
  check('timed-spark-jump-clearance', firePassage.passed, firePassage.detail),
  check(
      'target-duration-recorded',
    stage.targetFirstClearSeconds?.min === 180 &&
      stage.targetFirstClearSeconds?.max === 360 &&
      stage.targetOptimizedSeconds?.min === 75 &&
      stage.targetOptimizedSeconds?.max === 150,
    'human 180-360s, optimized 75-150s'
  )
];

const report = {
  generatedAt: new Date().toISOString(),
  passed: checks.every((item) => item.passed),
  checks
};
fs.writeFileSync(path.join(artifactDir, 'stage1-qa-report.json'), `${JSON.stringify(report, null, 2)}\n`);

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`qa:stage1 PASS ${checks.length} checks`);

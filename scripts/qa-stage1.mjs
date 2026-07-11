import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });

const stage = JSON.parse(fs.readFileSync(path.resolve('src', 'data', 'stage1Content.json'), 'utf8'));
const stageLandforms = JSON.parse(fs.readFileSync(path.resolve('src', 'data', 'stage1Landforms.json'), 'utf8'));
const requiredNames = [
  'Rain Lantern Start',
  'Neon Sign Run',
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
  const elevated = routePlatforms.filter((platform) => platform.y <= 390).length;
  const fallPits = hazards.filter((hazard) => hazard.type === 'fall-pit').length;
  return {
    passed: routePlatforms.length >= 16 && routePlatforms.length <= 24 && maxWidth <= 1200 && elevated >= 5 && fallPits >= 1 && fallPits <= 3,
    detail: `${routePlatforms.length} platforms, maxWidth=${maxWidth}, elevated=${elevated}, fallPits=${fallPits}`
  };
};
const compactStageVerticality = () => {
  const routePlatforms = stage.platforms ?? [];
  const highestTop = routePlatforms.reduce((top, platform) => Math.min(top, platform.y), Infinity);
  const lowestTop = routePlatforms.reduce((top, platform) => Math.max(top, platform.y), -Infinity);
  const high = routePlatforms.filter((platform) => platform.y <= 260).length;
  const mid = routePlatforms.filter((platform) => platform.y > 260 && platform.y < 535).length;
  const updrafts = (stage.gimmicks ?? []).filter((gimmick) => gimmick.type === 'updraft-vent');
  const range = lowestTop - highestTop;
  return {
    passed: range >= 330 && high >= 4 && mid >= 8 && updrafts.length === 2,
    detail: `range=${range}, high=${high}, mid=${mid}, updrafts=${updrafts.length}`
  };
};
const continuousTerrainSupport = () => {
  const supports = stage.terrainSupports ?? [];
  const unsupported = (stage.platforms ?? []).filter((platform) => {
    const platformBottom = platform.y + platform.height;
    const horizontalInset = Math.min(48, platform.width * 0.12);
    const requiredBottom = platform.y >= 500 ? stage.worldHeight - 2 : 500;
    return !supports.some((support) => {
      const coversPlatformWidth = support.x <= platform.x + horizontalInset && support.x + support.width >= platform.x + platform.width - horizontalInset;
      const touchesPlatformBottom = Math.abs(support.y - platformBottom) <= 4;
      const reachesGroundMass = support.y + support.height >= requiredBottom;
      return coversPlatformWidth && touchesPlatformBottom && reachesGroundMass;
    });
  });
  return {
    passed: supports.length >= 10 && unsupported.length === 0,
    detail: `${supports.length} supports, unsupported=${unsupported.map((platform) => platform.id).join(', ') || 'none'}`
  };
};
const imageFirstTerrain = () => {
  const terrain = stage.visualTerrain;
  const plates = terrain?.plates ?? [];
  const ordered = [...plates].sort((a, b) => a.usableRange.start - b.usableRange.start);
  const usableRangeBreaks = ordered.filter((plate, index) => {
    const expectedStart = index === 0 ? 0 : ordered[index - 1].usableRange.end;
    return plate.usableRange.start !== expectedStart || plate.usableRange.end <= plate.usableRange.start;
  });
  const placementMisses = ordered.filter((plate) => {
    const expectedX = plate.usableRange.start - plate.overlap.left;
    const expectedWidth = plate.usableRange.end - plate.usableRange.start + plate.overlap.left + plate.overlap.right;
    return plate.x !== expectedX || plate.width !== expectedWidth || plate.y !== 0 || plate.height !== stage.worldHeight;
  });
  const overlapMisses = ordered.slice(1).filter((plate, index) => {
    const previous = ordered[index];
    const sharedWidth = previous.x + previous.width - plate.x;
    const expectedSharedWidth = previous.overlap.right + plate.overlap.left;
    return sharedWidth !== expectedSharedWidth || expectedSharedWidth !== terrain.overlapPerUsableBoundaryPx * 2;
  });
  const sectionMisses = sections.filter(
    (section) => !plates.some((plate) => plate.usableRange.start === section.startX && plate.usableRange.end === section.endX)
  );
  const outOfBounds = plates.filter((plate) => plate.x < 0 || plate.x + plate.width > stage.worldWidth);
  const uncoveredColliders = (stage.platforms ?? []).filter((platform) => {
    const centerX = platform.x + platform.width / 2;
    const centerY = platform.y + platform.height / 2;
    return !plates.some((plate) => centerX >= plate.x && centerX <= plate.x + plate.width && centerY >= plate.y && centerY <= plate.y + plate.height);
  });
  const terrainAssets = plates.filter((plate) => String(plate.assetKey ?? '').startsWith('stage1-terrain-'));
  return {
    passed:
      terrain?.mode === 'image-first-overlap-v4' &&
      String(terrain?.sourceManifest ?? '').endsWith('stage1-continuous-background-manifest.json') &&
      terrain?.overlapPerUsableBoundaryPx === 256 &&
      terrain?.collisionSource === 'platforms+landform-colliders' &&
      plates.length === sections.length &&
      terrainAssets.length === plates.length &&
      ordered[0]?.x === 0 &&
      ordered.at(-1)?.x + ordered.at(-1)?.width === stage.worldWidth &&
      usableRangeBreaks.length === 0 &&
      placementMisses.length === 0 &&
      overlapMisses.length === 0 &&
      sectionMisses.length === 0 &&
      outOfBounds.length === 0 &&
      uncoveredColliders.length === 0,
    detail: `${plates.length} plates, usableRangeBreaks=${usableRangeBreaks.length}, placementMisses=${placementMisses.length}, overlapMisses=${overlapMisses.length}, sectionMisses=${sectionMisses.length}, outOfBounds=${outOfBounds.length}, uncoveredColliders=${uncoveredColliders.length}`
  };
};
const imageFirstTerrainLandforms = () => {
  const landforms = stageLandforms.landforms ?? [];
  const colliders = stageLandforms.colliders ?? [];
  const landformById = new Map(landforms.map((landform) => [landform.id, landform]));
  const coveredSections = new Set(landforms.map((landform) => landform.sectionId));
  const frames = new Set(landforms.map((landform) => landform.frame));
  const invalidFrames = landforms.filter((landform) => landform.frame < 0 || landform.frame >= 12);
  const outOfBounds = landforms.filter(
    (landform) => landform.x < 0 || landform.x + landform.width > stage.worldWidth || landform.y < 0 || landform.y + landform.height > stage.worldHeight
  );
  const orphaned = landforms.filter((landform) => !sectionIds.has(landform.sectionId));
  const collidersWithoutLandform = colliders.filter((collider) => !landformById.has(collider.landformId));
  const collidersOutOfBounds = colliders.filter(
    (collider) => collider.x < 0 || collider.x + collider.width > stage.worldWidth || collider.y < 0 || collider.y + collider.height > stage.worldHeight
  );
  const collidersOutsideLandform = colliders.filter((collider) => {
    const landform = landformById.get(collider.landformId);
    if (!landform) return true;
    const centerX = collider.x + collider.width / 2;
    const centerY = collider.y + collider.height / 2;
    return centerX < landform.x || centerX > landform.x + landform.width || centerY < landform.y || centerY > landform.y + landform.height;
  });
  const landformsWithoutCollider = landforms.filter((landform) => !colliders.some((collider) => collider.landformId === landform.id));
  const largeEnough = landforms.filter((landform) => landform.width >= 360 && landform.height >= 250);
  const landformsBySection = sections.map((section) => landforms.filter((landform) => landform.sectionId === section.id).length);
  const horizontalSpan =
    landforms.length > 0
      ? Math.max(...landforms.map((landform) => landform.x + landform.width)) - Math.min(...landforms.map((landform) => landform.x))
      : 0;
  return {
    passed:
      landforms.length >= 25 &&
      colliders.length >= 25 &&
      frames.size >= 12 &&
      coveredSections.size === sections.length &&
      landformsBySection.every((count) => count >= 4) &&
      horizontalSpan >= stage.worldWidth * 0.88 &&
      largeEnough.length === landforms.length &&
      invalidFrames.length === 0 &&
      outOfBounds.length === 0 &&
      orphaned.length === 0 &&
      collidersWithoutLandform.length === 0 &&
      collidersOutOfBounds.length === 0 &&
      collidersOutsideLandform.length === 0 &&
      landformsWithoutCollider.length === 0,
    detail: `${landforms.length} landforms, ${colliders.length} colliders, ${frames.size} frames, bySection=${landformsBySection.join('/')}, span=${Math.round(horizontalSpan)}, invalid=${invalidFrames.length}, outOfBounds=${outOfBounds.length}, detached=${collidersWithoutLandform.length}`
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
const terrainSupport = continuousTerrainSupport();
const visualTerrain = imageFirstTerrain();
const damageRects = [
  ...hazards,
  ...enemies.map((enemy) => ({ x: enemy.x - 36, y: enemy.y - 48, width: 72, height: 96 }))
];
const sectionIds = new Set(sections.map((section) => section.id));
const visualTerrainLandforms = imageFirstTerrainLandforms();
const checks = [
  check(
    'five-linear-sections',
    sections.length === 5 && requiredNames.every((name, index) => sections[index]?.name === name),
    sections.map((section) => section.name).join(', ')
  ),
  check('single-continuous-route', linearRoute.passed, linearRoute.detail),
  check('stage-scope-1-5x', stage.worldWidth >= 9500 && stage.worldWidth <= 10550, `worldWidth=${stage.worldWidth}`),
  check('two-vertical-sections', sections.filter((section) => section.orientation === 'vertical').length >= 2, 'vertical section count'),
  check('no-optional-routes', sections.filter((section) => section.optionalRoute === true).length === 0, 'optional route count'),
  check('two-checkpoints', (stage.checkpoints ?? []).length >= 2, `${(stage.checkpoints ?? []).length} checkpoints`),
  check('no-hidden-scrolls', (stage.collectibles?.scrolls ?? []).length === 0, `${stage.collectibles?.scrolls?.length ?? 0} scrolls`),
  check('twenty-four-seals', (stage.collectibles?.seals ?? []).length >= 24, `${stage.collectibles?.seals?.length ?? 0} seals`),
  check('four-health-energy-pickups', (stage.collectibles?.pickups ?? []).length >= 4, `${stage.collectibles?.pickups?.length ?? 0} pickups`),
  check('six-hazard-moments', hazards.length >= 6, `${hazards.length} hazards`),
  check('five-enemy-encounters', enemies.length >= 5, `${enemies.length} enemies`),
  check('single-lantern-warden', Boolean(stage.warden?.id) && stage.warden?.attackStates?.length === 3, stage.warden?.id ?? 'missing'),
  check('safe-first-screen', damageRects.filter((rect) => overlap(rect, stage.safeFirstScreen)).length === 0, 'first screen damage source overlap'),
  check('safe-rest-before-miniboss', damageRects.filter((rect) => overlap(rect, stage.safeRestBeforeMiniboss)).length === 0, 'pre-boss rest damage source overlap'),
  check('moon-gate-stage-clear', stage.moonGate?.requiresWardenDefeated === true, stage.moonGate?.id ?? 'missing'),
  check('no-orphan-section-refs', enemies.every((enemy) => sectionIds.has(enemy.sectionId)), 'enemy section references'),
  check('scroll-collection-lanes', unreachableScrolls.length === 0, unreachableScrolls.map((scroll) => scroll.id).join(', ') || 'no scroll routes to validate'),
  check('collectibles-clear-platforms', embeddedCollectibles.length === 0, embeddedCollectibles.join(', ') || 'no collectible visual overlaps platform geometry'),
  check('compact-platform-variety', platformVariety.passed, platformVariety.detail),
  check('compact-vertical-route', verticalRoute.passed, verticalRoute.detail),
  check('continuous-ground-supports', terrainSupport.passed, terrainSupport.detail),
  check('image-first-terrain-plates', visualTerrain.passed, visualTerrain.detail),
  check('image-first-large-landforms', visualTerrainLandforms.passed, visualTerrainLandforms.detail),
  check('two-updraft-gimmicks', (stage.gimmicks ?? []).filter((gimmick) => gimmick.type === 'updraft-vent').length === 2, `${stage.gimmicks?.length ?? 0} gimmicks`),
  check('timed-spark-jump-clearance', firePassage.passed, firePassage.detail),
  check(
      'target-duration-recorded',
    stage.targetFirstClearSeconds?.min === 240 &&
      stage.targetFirstClearSeconds?.max === 480 &&
      stage.targetOptimizedSeconds?.min === 105 &&
      stage.targetOptimizedSeconds?.max === 210,
    'human 240-480s, optimized 105-210s'
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

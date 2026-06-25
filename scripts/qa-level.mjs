import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const qaDir = path.resolve('artifacts', 'qa');
const stagePath = path.resolve('src', 'data', 'stage1.json');
const stage = JSON.parse(await readFile(stagePath, 'utf8'));
const errors = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function inBounds(point) {
  return point.x >= 0 && point.x <= stage.width && point.y >= 0 && point.y <= stage.height;
}

function rectInBounds(rect) {
  return rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= stage.width && rect.y + rect.height <= stage.height + 140;
}

function overlapsX(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width;
}

const sections = new Map(stage.sections.map((section) => [section.id, section]));
const pickupsByType = stage.pickups.reduce((acc, pickup) => {
  acc[pickup.type] = (acc[pickup.type] ?? 0) + 1;
  return acc;
}, {});
const firstDamageX = Math.min(
  ...stage.enemies.map((enemy) => enemy.x),
  ...stage.hazards.filter((hazard) => !hazard.safeIntro).map((hazard) => hazard.x)
);

assert(stage.id === 'stage1', 'Stage id must be stage1.');
assert(stage.name === 'Neon Alley: First Delivery', 'Stage name mismatch.');
assert(stage.sections.length >= 7, 'Fewer than 7 named sections.');
assert(stage.checkpoints.length >= 2, 'Fewer than 2 checkpoints.');
assert(stage.scrolls.length === 3, 'Scroll count is not exactly 3.');
assert((pickupsByType.seal ?? 0) >= 20, 'Fewer than 20 seal pickups.');
assert((pickupsByType.health ?? 0) + (pickupsByType.energy ?? 0) >= 3, 'Fewer than 3 health/energy pickups.');
assert(stage.hazards.length >= 3, 'Fewer than 3 hazard moments.');
assert(stage.enemies.length >= 4, 'Fewer than 4 enemy encounters.');
assert(typeof stage.minibossTriggerX === 'number' && stage.minibossTriggerX > 0, 'Missing miniboss trigger.');
assert(stage.sections.some((section) => section.id === 'rain-lantern-start' && section.safe), 'Missing safe start section.');
assert(inBounds(stage.goal), 'Missing or out-of-bounds stage clear goal.');
assert(stage.criticalPath.length >= 7, 'Critical path length is too short.');
assert(stage.sections.filter((section) => section.height >= 600).length >= 2, 'Fewer than 2 vertical sections.');
assert(stage.sections.filter((section) => section.id.includes('hidden')).length >= 2, 'Fewer than 2 optional side routes.');
assert(firstDamageX - stage.playerSpawn.x >= 650, 'First damage source is too close to spawn.');
assert(stage.goal.x > stage.minibossTriggerX, 'Goal must be after miniboss trigger.');

for (const id of stage.criticalPath) {
  assert(sections.has(id), `Critical path references missing section ${id}.`);
}
for (let index = 1; index < stage.criticalPath.length; index += 1) {
  const previous = sections.get(stage.criticalPath[index - 1]);
  const current = sections.get(stage.criticalPath[index]);
  assert(!previous || !current || current.x >= previous.x, `Tutorial/critical path order is wrong at ${stage.criticalPath[index]}.`);
}
for (const section of stage.sections) {
  assert(rectInBounds(section), `Section ${section.id} has invalid bounds.`);
}
for (const platform of stage.platforms) {
  assert(rectInBounds(platform), `Platform ${platform.kind} at ${platform.x} is out of bounds.`);
}
for (const hazard of stage.hazards) {
  assert(rectInBounds(hazard), `Hazard ${hazard.id} is out of bounds.`);
}
for (const pickup of stage.pickups) {
  assert(inBounds(pickup), `Pickup ${pickup.id} is out of bounds.`);
}
for (const scroll of stage.scrolls) {
  assert(/^scroll-[a-z0-9-]+$/.test(scroll.id), `Scroll id ${scroll.id} is not stable/named.`);
  assert(inBounds(scroll), `Scroll ${scroll.id} is out of bounds.`);
}
for (let index = 1; index < stage.checkpoints.length; index += 1) {
  assert(stage.checkpoints[index].x > stage.checkpoints[index - 1].x, 'Checkpoint order is invalid.');
}

const spawnRect = { x: stage.playerSpawn.x - 12, y: stage.playerSpawn.y - 22, width: 24, height: 44 };
assert(!stage.platforms.some((platform) => overlapsX(platform, spawnRect) && spawnRect.y + spawnRect.height > platform.y), 'Player spawn starts in a solid platform.');
assert(!stage.hazards.some((hazard) => overlapsX(hazard, spawnRect) && spawnRect.y < hazard.y + hazard.height), 'Player spawn starts in a hazard.');

const routeAnchors = [stage.playerSpawn.x, ...stage.criticalPath.map((id) => sections.get(id)?.x ?? 0), stage.minibossTriggerX, stage.goal.x];
for (let index = 1; index < routeAnchors.length; index += 1) {
  const gap = routeAnchors[index] - routeAnchors[index - 1];
  assert(gap <= 1600, `Coarse route gap ${gap} before x=${routeAnchors[index]} is too large.`);
}
const floorSupportsGoal = stage.platforms.some((platform) => platform.kind === 'floor' && overlapsX(platform, { x: stage.goal.x - 16, width: 32 }));
assert(floorSupportsGoal, 'Goal is not supported by coarse floor metadata.');

const tutorialOrder = ['move-jump', 'slash', 'wall-kick', 'checkpoint', 'thorn', 'warden'];
const tutorialIndexes = tutorialOrder.map((id) => stage.tutorials.findIndex((tutorial) => tutorial.id === id));
assert(tutorialIndexes.every((index) => index >= 0), 'One or more required tutorial markers are missing.');
for (let index = 1; index < tutorialIndexes.length; index += 1) {
  const previous = stage.tutorials[tutorialIndexes[index - 1]];
  const current = stage.tutorials[tutorialIndexes[index]];
  assert(!previous || !current || current.x > previous.x, `Tutorial order is wrong at ${current?.id}.`);
}

if (stage.hazards[0]?.safeIntro !== true) {
  warnings.push('First hazard is not marked safeIntro.');
}

const report = {
  valid: errors.length === 0,
  errors,
  warnings,
  metrics: {
    sections: stage.sections.length,
    criticalPath: stage.criticalPath.length,
    verticalSections: stage.sections.filter((section) => section.height >= 600).length,
    optionalRoutes: stage.sections.filter((section) => section.id.includes('hidden')).length,
    checkpoints: stage.checkpoints.length,
    scrolls: stage.scrolls.length,
    seals: pickupsByType.seal ?? 0,
    healthEnergy: (pickupsByType.health ?? 0) + (pickupsByType.energy ?? 0),
    hazards: stage.hazards.length,
    enemies: stage.enemies.length
  }
};

await mkdir(qaDir, { recursive: true });
await writeFile(path.join(qaDir, 'level-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`qa:level PASS ${JSON.stringify(report.metrics)}`);

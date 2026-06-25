import type { Stage1Definition } from '../types/stage';

export interface StageValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly metrics: {
    readonly criticalSections: number;
    readonly totalSections: number;
    readonly verticalSections: number;
    readonly optionalRoutes: number;
    readonly checkpoints: number;
    readonly scrolls: number;
    readonly seals: number;
    readonly enemies: number;
    readonly hazards: number;
  };
}

function overlaps(a: { x: number; width: number }, b: { x: number; width: number }): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width;
}

export function validateStage1(stage: Stage1Definition): StageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sectionIds = new Set(stage.sections.map((section) => section.id));
  const scrollIds = new Set<string>();
  const pickupIds = new Set<string>();
  const checkpointsByX = [...stage.checkpoints].sort((a, b) => a.x - b.x);
  const criticalSections = stage.sections.filter((section) => stage.criticalPath.includes(section.id));
  const verticalSections = stage.sections.filter((section) => section.height >= 600).length;
  const optionalRoutes = stage.sections.filter((section) => section.id.includes('hidden') || section.name.includes('Hidden')).length;
  const seals = stage.pickups.filter((pickup) => pickup.type === 'seal');

  if (stage.id !== 'stage1') errors.push('Stage id must be stage1.');
  if (stage.name !== 'Neon Alley: First Delivery') errors.push('Stage name must be Neon Alley: First Delivery.');
  if (stage.width < 7000 || stage.width > 9000) errors.push(`Stage width ${stage.width} is outside the vertical-slice target range.`);
  if (stage.height < 600) errors.push('Stage must include vertical play space.');
  if (stage.criticalPath.length < 7) errors.push('Critical path must include at least 7 named sections.');
  if (criticalSections.length !== stage.criticalPath.length) errors.push('Every critical-path id must resolve to a section.');
  if (verticalSections < 2) errors.push('Stage must include at least 2 vertical sections.');
  if (optionalRoutes < 2) errors.push('Stage must include at least 2 optional/hidden route sections.');
  if (stage.scrolls.length !== 3) errors.push('Stage 1 must include exactly 3 scrolls.');
  if (seals.length < 20) errors.push('Stage 1 must include at least 20 seal pickups.');
  if (stage.checkpoints.length < 3) errors.push('Stage 1 must include start, mid, and pre-miniboss checkpoints.');
  if (stage.enemies.some((enemy) => enemy.type === 'lanternWarden')) errors.push('Lantern Warden must be authored as the miniboss, not a regular enemy spawn.');
  if (stage.minibossTriggerX <= stage.checkpoints[0]?.x) errors.push('Miniboss trigger must be after the start checkpoint.');
  if (stage.goal.x <= stage.minibossTriggerX) errors.push('Goal must be after the miniboss trigger.');

  for (const id of stage.criticalPath) {
    if (!sectionIds.has(id)) {
      errors.push(`Missing critical-path section ${id}.`);
    }
  }
  for (let index = 1; index < stage.criticalPath.length; index += 1) {
    const previous = stage.sections.find((section) => section.id === stage.criticalPath[index - 1]);
    const current = stage.sections.find((section) => section.id === stage.criticalPath[index]);
    if (previous && current && current.x < previous.x) {
      errors.push(`Critical path is out of order at ${current.id}.`);
    }
  }
  for (const section of stage.sections) {
    if (section.x < 0 || section.x + section.width > stage.width) {
      errors.push(`Section ${section.id} is out of stage bounds.`);
    }
    if (section.height < 500 && stage.criticalPath.includes(section.id)) {
      warnings.push(`Critical section ${section.id} has limited vertical room.`);
    }
  }
  for (const platform of stage.platforms) {
    if (platform.width <= 0 || platform.height <= 0) errors.push('Platform has non-positive dimensions.');
    if (platform.x < 0 || platform.x + platform.width > stage.width) errors.push(`Platform ${platform.kind} at ${platform.x} is out of bounds.`);
  }
  for (const hazard of stage.hazards) {
    if (hazard.x < 0 || hazard.x + hazard.width > stage.width) errors.push(`Hazard ${hazard.id} is out of bounds.`);
  }
  for (const pickup of stage.pickups) {
    if (pickupIds.has(pickup.id)) errors.push(`Duplicate pickup id ${pickup.id}.`);
    pickupIds.add(pickup.id);
    if (pickup.x < 0 || pickup.x > stage.width || pickup.y < 0 || pickup.y > stage.height) {
      errors.push(`Pickup ${pickup.id} is out of bounds.`);
    }
  }
  for (const scroll of stage.scrolls) {
    if (scrollIds.has(scroll.id)) errors.push(`Duplicate scroll id ${scroll.id}.`);
    scrollIds.add(scroll.id);
    if (scroll.x < 0 || scroll.x > stage.width || scroll.y < 0 || scroll.y > stage.height) {
      errors.push(`Scroll ${scroll.id} is out of bounds.`);
    }
  }
  for (let index = 1; index < checkpointsByX.length; index += 1) {
    if (checkpointsByX[index].x - checkpointsByX[index - 1].x > 2800) {
      warnings.push(`Large checkpoint gap before ${checkpointsByX[index].id}.`);
    }
  }
  for (const checkpoint of checkpointsByX) {
    const supported = stage.platforms.some((platform) => platform.kind === 'floor' && overlaps(platform, { x: checkpoint.x - 12, width: 24 }));
    if (!supported) {
      errors.push(`Checkpoint ${checkpoint.id} is not on a floor platform.`);
    }
  }
  if (!stage.tutorials.some((tutorial) => tutorial.text.toLowerCase().includes('wall'))) {
    errors.push('A wall-kick tutorial marker is required.');
  }
  if (!stage.tutorials.some((tutorial) => tutorial.text.toLowerCase().includes('checkpoint'))) {
    errors.push('A checkpoint tutorial marker is required.');
  }
  if (!stage.tutorials.some((tutorial) => tutorial.text.toLowerCase().includes('lantern'))) {
    errors.push('A Lantern Warden tutorial marker is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      criticalSections: stage.criticalPath.length,
      totalSections: stage.sections.length,
      verticalSections,
      optionalRoutes,
      checkpoints: stage.checkpoints.length,
      scrolls: stage.scrolls.length,
      seals: seals.length,
      enemies: stage.enemies.length,
      hazards: stage.hazards.length
    }
  };
}

import { AbilityUnlockByStage } from '../data/abilities';
import type { StageId } from '../types/game';
import { StageIds } from '../types/game';
import type { LevelDefinition, TileSymbol } from '../types/levels';
import { TileSymbols } from '../types/levels';

export interface LevelValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const allowedTiles = new Set<string>(TileSymbols);

function pointInBounds(level: LevelDefinition, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < level.width && y < level.height;
}

function worldPointInBounds(level: LevelDefinition, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < level.width * 32 && y < level.height * 32;
}

function tileAt(level: LevelDefinition, x: number, y: number): TileSymbol | null {
  if (!pointInBounds(level, x, y)) {
    return null;
  }
  return level.tiles[y]?.[x] as TileSymbol | undefined ?? null;
}

export function validateLevel(level: LevelDefinition): LevelValidationResult {
  const errors: string[] = [];
  if (level.width <= 0 || level.height <= 0) {
    errors.push(`${level.name}: width and height must be positive`);
  }
  if (level.tiles.length !== level.height) {
    errors.push(`${level.name}: tile row count must match height`);
  }
  level.tiles.forEach((row, rowIndex) => {
    if (row.length !== level.width) {
      errors.push(`${level.name}: row ${rowIndex} width ${row.length} does not match ${level.width}`);
    }
    [...row].forEach((symbol, columnIndex) => {
      if (!allowedTiles.has(symbol)) {
        errors.push(`${level.name}: unknown tile "${symbol}" at ${columnIndex},${rowIndex}`);
      }
    });
  });
  if (!level.playerSpawn) {
    errors.push(`${level.name}: player spawn is missing`);
  } else if (!pointInBounds(level, level.playerSpawn.x, level.playerSpawn.y)) {
    errors.push(`${level.name}: player spawn is out of bounds`);
  }
  if (!level.goal) {
    errors.push(`${level.name}: goal is missing`);
  } else if (!pointInBounds(level, level.goal.x, level.goal.y)) {
    errors.push(`${level.name}: goal is out of bounds`);
  }
  level.checkpoints.forEach((checkpoint, index) => {
    if (!pointInBounds(level, checkpoint.x, checkpoint.y)) {
      errors.push(`${level.name}: checkpoint ${index} is out of bounds`);
    }
    if (index > 0 && checkpoint.x < level.checkpoints[index - 1].x) {
      errors.push(`${level.name}: checkpoint ${index} is before previous checkpoint`);
    }
  });
  if (level.scrolls.length !== 3) {
    errors.push(`${level.name}: must have exactly 3 hidden scrolls`);
  }
  level.scrolls.forEach((scroll) => {
    if (!worldPointInBounds(level, scroll.x, scroll.y)) {
      errors.push(`${level.name}: scroll ${scroll.id} is out of bounds`);
    }
  });
  level.enemies.forEach((enemy, index) => {
    if (!worldPointInBounds(level, enemy.x, enemy.y)) {
      errors.push(`${level.name}: enemy ${index} is out of bounds`);
    }
  });
  level.hazards.forEach((hazard) => {
    if (!worldPointInBounds(level, hazard.x, hazard.y)) {
      errors.push(`${level.name}: hazard ${hazard.id} is out of bounds`);
    }
  });
  level.pickups.forEach((pickup) => {
    if (!worldPointInBounds(level, pickup.x, pickup.y)) {
      errors.push(`${level.name}: pickup ${pickup.id} is out of bounds`);
    }
  });
  level.movingPlatforms.forEach((platform) => {
    if (!worldPointInBounds(level, platform.x, platform.y)) {
      errors.push(`${level.name}: moving platform ${platform.id} starts out of bounds`);
    }
    if (!worldPointInBounds(level, platform.x + platform.travelX, platform.y + platform.travelY)) {
      errors.push(`${level.name}: moving platform ${platform.id} ends out of bounds`);
    }
  });
  level.oneWayPlatforms.forEach((platform, index) => {
    if (!pointInBounds(level, platform.x, platform.y)) {
      errors.push(`${level.name}: one-way platform ${index} is out of bounds`);
    }
  });
  level.fallingPlatforms.forEach((platform, index) => {
    if (!pointInBounds(level, platform.x, platform.y)) {
      errors.push(`${level.name}: falling platform ${index} is out of bounds`);
    }
  });
  level.windZones.forEach((zone, index) => {
    if (!pointInBounds(level, zone.x, zone.y)) {
      errors.push(`${level.name}: wind zone ${index} is out of bounds`);
    }
  });
  const expectedUnlock = AbilityUnlockByStage[level.id];
  if (level.unlockAbility !== expectedUnlock) {
    errors.push(`${level.name}: expected unlock ${expectedUnlock}`);
  }
  const priorStages = StageIds.filter((stageId) => stageId < level.id);
  const possibleAbilities = priorStages.map((stageId) => AbilityUnlockByStage[stageId]);
  for (const required of level.requiredAbilities) {
    if (!possibleAbilities.includes(required)) {
      errors.push(`${level.name}: ability gate ${required} is not available before stage ${level.id}`);
    }
  }
  const hasBossTrigger = level.tiles.some((row) => row.includes('B'));
  if (level.id === 5) {
    if (!level.boss) {
      errors.push(`${level.name}: boss stage must define a boss`);
    }
    if (!hasBossTrigger) {
      errors.push(`${level.name}: boss stage must include a boss trigger tile`);
    }
  } else {
    if (level.boss) {
      errors.push(`${level.name}: non-boss stage has boss definition`);
    }
    if (hasBossTrigger) {
      errors.push(`${level.name}: non-boss stage has boss trigger tile`);
    }
  }
  if (level.goal) {
    const symbol = tileAt(level, level.goal.x, level.goal.y);
    if (symbol !== 'G') {
      errors.push(`${level.name}: goal tile must be marked G`);
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateAllLevels(levels: readonly LevelDefinition[]): LevelValidationResult {
  const errors: string[] = [];
  const ids = new Set<StageId>();
  for (const level of levels) {
    if (ids.has(level.id)) {
      errors.push(`duplicate stage id ${level.id}`);
    }
    ids.add(level.id);
    errors.push(...validateLevel(level).errors);
  }
  for (const stageId of StageIds) {
    if (!ids.has(stageId)) {
      errors.push(`missing stage id ${stageId}`);
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

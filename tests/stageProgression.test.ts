import { describe, expect, it } from 'vitest';
import {
  checkpointIndexAfterProgress,
  clampCheckpointIndex,
  sectionAtX,
  stageSpawnPoint
} from '../src/systems/StageProgression';
import type { CheckpointDefinition, SectionDefinition, Stage1Definition } from '../src/types/stage';

const checkpoints: CheckpointDefinition[] = [
  { id: 'start', x: 120, y: 420 },
  { id: 'mid', x: 1000, y: 380 },
  { id: 'late', x: 1800, y: 360 }
];

const sections: SectionDefinition[] = [
  { id: 'a', name: 'A', x: 0, y: 0, width: 500, height: 500 },
  { id: 'b', name: 'B', x: 450, y: 0, width: 500, height: 500 },
  { id: 'c', name: 'C', x: 900, y: 0, width: 500, height: 500 }
];

const stage = {
  id: 'stage1',
  name: 'test stage',
  width: 2000,
  height: 600,
  playerSpawn: { x: 88, y: 430 },
  goal: { x: 1900, y: 360 },
  minibossTriggerX: 1500,
  sections,
  criticalPath: [],
  platforms: [],
  hazards: [],
  pickups: [],
  scrolls: [],
  enemies: [],
  checkpoints,
  tutorials: []
} satisfies Stage1Definition;

describe('StageProgression helpers', () => {
  it('clamps checkpoint indices to valid stage bounds', () => {
    expect(clampCheckpointIndex(checkpoints, -4)).toBe(0);
    expect(clampCheckpointIndex(checkpoints, 1.8)).toBe(1);
    expect(clampCheckpointIndex(checkpoints, 99)).toBe(2);
    expect(clampCheckpointIndex([], 99)).toBe(0);
  });

  it('advances to the furthest reached checkpoint without going backwards', () => {
    expect(checkpointIndexAfterProgress(checkpoints, 0, 999)).toBe(1);
    expect(checkpointIndexAfterProgress(checkpoints, 0, 1800)).toBe(2);
    expect(checkpointIndexAfterProgress(checkpoints, 2, 130)).toBe(2);
  });

  it('uses the selected checkpoint as the respawn-adjusted player spawn point', () => {
    expect(stageSpawnPoint(stage, 1)).toEqual({ x: 1000, y: 358 });
    expect(stageSpawnPoint(stage, 99)).toEqual({ x: 1800, y: 338 });
  });

  it('prefers the latest overlapping section at the current player x position', () => {
    expect(sectionAtX(sections, 200).id).toBe('a');
    expect(sectionAtX(sections, 480).id).toBe('b');
    expect(sectionAtX(sections, 930).id).toBe('c');
  });
});

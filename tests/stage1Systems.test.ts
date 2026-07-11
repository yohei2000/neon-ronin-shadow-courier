import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Stage1AudioAssets, Stage1SfxKey } from '../src/data/audioAssets';
import { InkCrawlerAnimationFrames, KiteWraithAnimationFrames, LanternWardenAnimationFrames, PlayerAnimationFrames, SlashAnimationFrames } from '../src/data/artAssets';
import { Stage1CollisionPlatforms, Stage1Data, Stage1Tuning } from '../src/data/stage1';
import { validateStage1 } from '../src/data/stageValidation';
import { CombatSystem, canTakeOverlapDamage, resolveSlashPhase } from '../src/systems/CombatSystem';
import { SaveSystem, createDefaultSave, normalizeSaveData } from '../src/systems/SaveSystem';
import { resolveHorizontalVelocity } from '../src/systems/horizontalMotion';
import { resolveInitialJumpVisualVariant, shouldUseSmallJumpVariant } from '../src/systems/playerVisualState';
import { calculateStageRank } from '../src/systems/rank';
import { buildWardenProjectileRect, resolveWardenProjectileMotion } from '../src/systems/wardenRangedAttack';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear(): void {
    this.values.clear();
  }
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('Stage1 validation', () => {
  it('passes the Stage1 content acceptance rules', () => {
    const report = validateStage1(Stage1Data);
    expect(report.passed).toBe(true);
    expect(report.checks.filter((check) => !check.passed)).toEqual([]);
  });

  it('keeps Stage1 terrain image-first with large landform collision data', () => {
    expect(Stage1Data.visualTerrain.mode).toBe('image-first-overlap-v4');
    expect(Stage1Data.visualTerrain.overlapPerUsableBoundaryPx).toBe(256);
    expect(Stage1Data.visualTerrain.sourceManifest).toContain('continuous-background-v4-single-master');
    expect(Stage1Data.visualTerrain.collisionSource).toBe('platforms+landform-colliders');
    expect(Stage1Data.visualTerrain.plates).toHaveLength(Stage1Data.sections.length);
    expect(Stage1Data.visualTerrain.plates.every((plate) => plate.assetKey.startsWith('stage1-terrain-'))).toBe(true);
    const orderedPlates = [...Stage1Data.visualTerrain.plates].sort((left, right) => left.usableRange.start - right.usableRange.start);
    expect(orderedPlates[0].x).toBe(0);
    expect(orderedPlates.at(-1)!.x + orderedPlates.at(-1)!.width).toBe(Stage1Data.worldWidth);
    orderedPlates.forEach((plate, index) => {
      const section = Stage1Data.sections[index];
      expect(plate.usableRange).toEqual({ start: section.startX, end: section.endX });
      expect(plate.x).toBe(plate.usableRange.start - plate.overlap.left);
      expect(plate.width).toBe(plate.usableRange.end - plate.usableRange.start + plate.overlap.left + plate.overlap.right);
      if (index > 0) {
        const previous = orderedPlates[index - 1];
        expect(previous.x + previous.width - plate.x).toBe(previous.overlap.right + plate.overlap.left);
      }
    });
    expect(Stage1Data.visualTerrain.landforms.length).toBeGreaterThanOrEqual(25);
    expect(Stage1Data.visualTerrain.landformColliders.length).toBeGreaterThanOrEqual(25);
    expect(new Set(Stage1Data.visualTerrain.landforms.map((landform) => landform.frame)).size).toBeGreaterThanOrEqual(12);
    expect(new Set(Stage1Data.visualTerrain.landforms.map((landform) => landform.sectionId)).size).toBe(Stage1Data.sections.length);
    expect(Stage1CollisionPlatforms.length).toBe(Stage1Data.platforms.length + Stage1Data.visualTerrain.landformColliders.length);
    expect(Stage1Data.platforms.length).toBeGreaterThan(0);
  });
});

describe('Stage1 save system', () => {
  it('loads defaults when JSON is corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem('neon-ronin-stage1-save', '{bad-json');
    expect(SaveSystem.load(storage)).toEqual(createDefaultSave());
  });

  it('normalizes schema and clamps settings', () => {
    const save = normalizeSaveData({
      schemaVersion: 99,
      settings: {
        masterVolume: 5,
        sfxVolume: -2,
        touchControls: 'sideways',
        touchOpacity: 0.1,
        reducedShake: true
      },
      stage1: {
        cleared: true,
        bestTimeMs: 90000,
        bestRank: 'A',
        scrollsFound: ['scroll-a', 'scroll-a', 'scroll-b']
      }
    });
    expect(save.schemaVersion).toBe(1);
    expect(save.settings.masterVolume).toBe(1);
    expect(save.settings.sfxVolume).toBe(0);
    expect(save.settings.touchControls).toBe('auto');
    expect(save.settings.touchOpacity).toBe(0.35);
    expect(save.stage1.scrollsFound).toEqual(['scroll-a', 'scroll-b']);
  });
});

describe('Stage1 pure combat and rank helpers', () => {
  it('uses the required slash startup, active, recovery phases', () => {
    expect(resolveSlashPhase(0)).toBe('startup');
    expect(resolveSlashPhase(90)).toBe('active');
    expect(resolveSlashPhase(230)).toBe('recovery');
    expect(resolveSlashPhase(500)).toBe('idle');
  });

  it('prevents repeated overlap damage during cooldown', () => {
    expect(canTakeOverlapDamage(1500, 400, 1050)).toBe(true);
    expect(canTakeOverlapDamage(1000, 400, 1050)).toBe(false);
  });

  it('uses a surrounding active hitbox for speed flip spinning slash attacks', () => {
    const spinSlash = CombatSystem.buildSlashState(100, 200, 1, 90, 'spin');
    expect(spinSlash.mode).toBe('spin');
    expect(spinSlash.activeRect).toEqual({ x: -20, y: 68, width: 240, height: 240 });
    expect(CombatSystem.overlapsActiveSlash(spinSlash, { x: -4, y: 188, width: 26, height: 26 })).toBe(true);
    expect(CombatSystem.overlapsActiveSlash(spinSlash, { x: 226, y: 188, width: 26, height: 26 })).toBe(false);
  });

  it('extends forward slash reach by 1.5x', () => {
    const rightSlash = CombatSystem.buildSlashState(100, 200, 1, 90);
    const leftSlash = CombatSystem.buildSlashState(100, 200, -1, 90);
    expect(rightSlash.activeRect).toEqual({ x: 118, y: 142, width: 198, height: 92 });
    expect(leftSlash.activeRect).toEqual({ x: -116, y: 142, width: 198, height: 92 });
  });

  it('builds Lantern Warden ranged projectile motion and hitboxes', () => {
    const rect = buildWardenProjectileRect(300, 240);
    expect(rect).toEqual({ x: 277, y: 226, width: 46, height: 28 });
    const motion = resolveWardenProjectileMotion(100, 100, 200, 100);
    expect(motion.vx).toBe(Stage1Tuning.wardenProjectileSpeed);
    expect(motion.vy).toBe(0);
    expect(motion.angleDeg).toBe(0);
  });

  it('calculates clear ranks from time, damage, and seals', () => {
    expect(calculateStageRank(200000, 0, 18)).toBe('S');
    expect(calculateStageRank(320000, 2, 12)).toBe('A');
    expect(calculateStageRank(470000, 5, 0)).toBe('B');
    expect(calculateStageRank(490000, 8, 0)).toBe('C');
  });
});

describe('Stage1 horizontal motion', () => {
  it('ramps up toward max speed instead of snapping immediately', () => {
    const firstFrame = resolveHorizontalVelocity({ currentVx: 0, inputMoveX: 1, onGround: true, dtSeconds: 0.032 });
    expect(firstFrame).toBeGreaterThan(0);
    expect(firstFrame).toBeLessThan(6);

    let vx: number = 0;
    for (let frame = 0; frame < 12; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: 1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBeGreaterThan(45);
    expect(vx).toBeLessThan(70);

    for (let frame = 0; frame < 18; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: 1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBeGreaterThan(118);
    expect(vx).toBeLessThan(130);

    for (let frame = 0; frame < 15; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: 1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBe(Stage1Tuning.runSpeed);
  });

  it('brakes to zero before accelerating in the opposite direction', () => {
    let vx: number = Stage1Tuning.runSpeed;
    vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    expect(vx).toBeGreaterThan(Stage1Tuning.runSpeed - 6);

    for (let frame = 0; frame < 20; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBeGreaterThan(80);

    for (let frame = 0; frame < 20; frame += 1) {
      vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    }
    expect(vx).toBeGreaterThanOrEqual(0);
    expect(vx).toBeLessThan(8);

    vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    vx = resolveHorizontalVelocity({ currentVx: vx, inputMoveX: -1, onGround: true, dtSeconds: 0.032 });
    expect(vx).toBeLessThan(0);
    expect(vx).toBeGreaterThan(-9);
  });
});

describe('Stage1 player visual state', () => {
  it('tunes speed flip jumps to about 1.5x height and distance potential', () => {
    expect(Math.abs(Stage1Tuning.speedFlipJumpVelocity)).toBeCloseTo(Math.abs(Stage1Tuning.jumpVelocity) * Math.sqrt(1.5), 0);
    expect(Stage1Tuning.speedFlipHorizontalBoost).toBeCloseTo(Math.sqrt(1.5), 3);
    expect(Math.abs(Stage1Tuning.speedFlipShortJumpCutVelocity)).toBeGreaterThan(Math.abs(Stage1Tuning.shortJumpCutVelocity));
    expect(Stage1Tuning.runSpeed).toBe(183);
  });

  it('selects a speed flip jump only when horizontal speed is near max run speed', () => {
    expect(resolveInitialJumpVisualVariant(150, Stage1Tuning.runSpeed)).toBe('big');
    expect(resolveInitialJumpVisualVariant(154, Stage1Tuning.runSpeed)).toBe('speedFlip');
    expect(resolveInitialJumpVisualVariant(-154, Stage1Tuning.runSpeed)).toBe('speedFlip');
  });

  it('uses small jump visuals for early releases while still rising', () => {
    expect(shouldUseSmallJumpVariant({ elapsedMs: 90, verticalVelocity: -260 })).toBe(true);
    expect(shouldUseSmallJumpVariant({ elapsedMs: 260, verticalVelocity: -260 })).toBe(false);
    expect(shouldUseSmallJumpVariant({ elapsedMs: 90, verticalVelocity: 80 })).toBe(false);
  });
});

describe('Stage1 enemy animation coverage', () => {
  it('expands player action frame coverage for fluid runtime animation', () => {
    expect(PlayerAnimationFrames.idle.frames).toHaveLength(12);
    expect(PlayerAnimationFrames.run.frames).toHaveLength(32);
    expect(PlayerAnimationFrames.smallJump.frames).toHaveLength(16);
    expect(PlayerAnimationFrames.bigJumpRise.frames).toHaveLength(20);
    expect(PlayerAnimationFrames.speedFlipJump.frames).toHaveLength(32);
    expect(PlayerAnimationFrames.apex.frames).toHaveLength(8);
    expect(PlayerAnimationFrames.fall.frames).toHaveLength(12);
    expect(PlayerAnimationFrames.wallSlide.frames).toHaveLength(16);
    expect(PlayerAnimationFrames.wallKick.frames).toHaveLength(16);
    expect(PlayerAnimationFrames.groundSlash.frames).toHaveLength(32);
    expect(PlayerAnimationFrames.airSlash.frames).toHaveLength(24);
    expect(PlayerAnimationFrames.hurt.frames).toHaveLength(6);
    expect(PlayerAnimationFrames.checkpointRespawn.frames).toHaveLength(12);
  });

  it('gives small enemies multi-frame patrol, hit, and defeat motions', () => {
    expect(InkCrawlerAnimationFrames.patrol.frames).toHaveLength(32);
    expect(InkCrawlerAnimationFrames.hit.frames).toHaveLength(8);
    expect(InkCrawlerAnimationFrames.defeat.frames).toHaveLength(24);
    expect(KiteWraithAnimationFrames.drift.frames).toHaveLength(32);
    expect(KiteWraithAnimationFrames.hit.frames).toHaveLength(8);
    expect(KiteWraithAnimationFrames.defeat.frames).toHaveLength(24);
  });

  it('animates each Lantern Warden combat state with four runtime frames', () => {
    expect(LanternWardenAnimationFrames.idle.frames).toHaveLength(4);
    expect(LanternWardenAnimationFrames.telegraph.frames).toHaveLength(4);
    expect(LanternWardenAnimationFrames.attack.frames).toHaveLength(4);
    expect(LanternWardenAnimationFrames.recovery.frames).toHaveLength(4);
    expect(LanternWardenAnimationFrames.defeat.frames).toHaveLength(4);
  });

  it('keeps damage knockback strong enough to read before input resumes', () => {
    expect(Stage1Tuning.damageKnockbackX).toBe(155);
    expect(Stage1Tuning.hazardKnockbackX).toBe(185);
    expect(Stage1Tuning.damageKnockbackControlLockMs).toBe(140);
  });
});

describe('Stage1 audio assets', () => {
  it('loads one generated SFX asset for every Stage1 sound key', () => {
    expect(Object.keys(Stage1AudioAssets).sort()).toEqual(Object.values(Stage1SfxKey).sort());
    const audioDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/audio');
    const hashes = new Set<string>();

    for (const url of Object.values(Stage1AudioAssets)) {
      expect(url.endsWith('.wav')).toBe(true);
      const fileName = url.replace(/\\/g, '/').split('/').pop();
      expect(fileName).toBeTruthy();
      const data = readFileSync(resolve(audioDir, fileName ?? ''));
      let nonzeroSamples = 0;
      for (let index = 44; index < data.length; index += 2) {
        if (data.readInt16LE(index) !== 0) nonzeroSamples += 1;
      }
      expect(nonzeroSamples).toBeGreaterThan(1000);
      hashes.add(createHash('sha256').update(data).digest('hex'));
    }
    expect(hashes.size).toBe(Object.keys(Stage1AudioAssets).length);
  });
});

describe('Stage1 slash animation coverage', () => {
  it('adds a dedicated multi-frame flame ring for speed flip spinning slash', () => {
    expect(SlashAnimationFrames.spin.frames).toHaveLength(8);
    expect(SlashAnimationFrames.spin.frames[0]).toBe(14);
    expect(SlashAnimationFrames.spin.repeat).toBe(-1);
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ApprovedArtManifest } from '../src/data/approvedArtManifest';
import { ArtAssetKey, RuntimeEnvironmentAssetKey, RuntimePlayerVisualConfig, RuntimeSpriteAssetKey, RuntimeStage1AssetKeys, RuntimeStage1EnvironmentKeys, RuntimeStage1SpriteKeys } from '../src/data/artAssets';
import { GateAEvidenceFiles, GateAApprovalStatus, GateBApprovalStatus, ReferenceIds } from '../src/data/artLockGate';

describe('Art Lock scope', () => {
  it('boots the frozen-art Stage1 runtime while preserving Art Lab access', () => {
    const configText = fs.readFileSync(path.resolve('src', 'config', 'gameConfig.ts'), 'utf8');
    expect(configText).toContain('BootScene');
    expect(configText).toContain('PreloadScene');
    expect(configText).toContain('TitleScene');
    expect(configText).toContain('Stage1Scene');
    expect(configText).toContain('StageClearScene');
    expect(configText).toContain('ArtLabScene');
  });

  it('keeps approval gates explicit', () => {
    expect(GateAApprovalStatus).toBe('APPROVED_2026-06-26');
    expect(GateBApprovalStatus).toBe('APPROVED_2026-06-27');
    const gateBv2Status = JSON.parse(fs.readFileSync(path.resolve('art', 'approvals', 'GATE_B_V2_STATUS.json'), 'utf8'));
    expect(gateBv2Status.status).toBe('approved');
    expect(gateBv2Status.approved).toBe(true);
    expect(gateBv2Status.approvedBy).toBe('human-user');
  });

  it('tracks all A-H references and Gate A evidence files', () => {
    expect(ReferenceIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(GateAEvidenceFiles.length).toBeGreaterThanOrEqual(12);
    expect(GateAEvidenceFiles).toContain('art/approvals/GATE_A_REQUEST.md');
    expect(GateAEvidenceFiles).toContain('art/approvals/GATE_A_STATUS.json');
  });

  it('uses new typed Stage1 data instead of the removed legacy JSON runtime', () => {
    expect(fs.existsSync(path.resolve('src', 'data', 'stage1.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve('src', 'data', 'stage1Content.json'))).toBe(true);
    expect(fs.existsSync(path.resolve('src', 'data', 'stage1.json'))).toBe(false);
  });

  it('has real final art manifests after Gate A approval', () => {
    for (const file of [
      'asset-manifest.json',
      'animation-manifest.json',
      'vfx-manifest.json',
      'telegraph-manifest.json',
      'sign-density-scenes.json'
    ]) {
      expect(fs.existsSync(path.resolve('art', file))).toBe(true);
    }
  });

  it('freezes approved Stage1 runtime art into the production asset path', () => {
    expect(ApprovedArtManifest.length).toBe(24);
    for (const entry of ApprovedArtManifest) {
      expect(entry.stage1Runtime).toBe(true);
      expect(entry.productionPath).toBe(`src/assets/approved-art/${entry.fileName}`);
      expect(entry.approvedSourcePath).toBe(`art/final-v2/assets/${entry.fileName}`);
      expect(entry.lineagePath.startsWith('art/source/') || entry.lineagePath.startsWith('art/final-v2/')).toBe(true);
      expect(fs.existsSync(path.resolve(entry.productionPath))).toBe(true);
      expect(fs.existsSync(path.resolve(entry.approvedSourcePath))).toBe(true);
      expect(fs.existsSync(path.resolve(entry.lineagePath))).toBe(true);
    }
  });

  it('uses safe derived runtime sprite sheets for Stage1 gameplay animation', () => {
    expect(RuntimePlayerVisualConfig.textureKey).toBe(RuntimeSpriteAssetKey.Player);
    expect(RuntimePlayerVisualConfig.textureKey).not.toBe(ArtAssetKey.Player);
    expect(RuntimeStage1SpriteKeys).toEqual([
      'player-runtime-spritesheet',
      'ink-crawler-runtime-spritesheet',
      'kite-wraith-runtime-spritesheet',
      'slash-runtime-spritesheet',
      'telegraph-runtime-spritesheet',
      'lantern-warden-runtime-spritesheet'
    ]);
    expect(RuntimeStage1EnvironmentKeys).toEqual([
      'stage1-bg-far',
      'stage1-bg-distant',
      'stage1-bg-mid',
      'stage1-bg-near',
      'stage1-bg-front',
      'stage1-ground-tile',
      'stage1-platform-thin-tile',
      'stage1-terrain-rain-lantern-start',
      'stage1-terrain-neon-sign-run',
      'stage1-terrain-rooftop-hazard-line',
      'stage1-terrain-neon-thorn-climb',
      'stage1-terrain-lantern-warden-gate',
      'stage1-moon-gate',
      'stage1-item-icons',
      'stage1-touch-controls'
    ]);
    expect(RuntimeStage1AssetKeys).toContain(RuntimeEnvironmentAssetKey.GroundTile);
    expect(RuntimeStage1AssetKeys).toContain(RuntimeEnvironmentAssetKey.ItemIcons);
    for (const file of [
      'src/assets/runtime/player-runtime-spritesheet.png',
      'src/assets/runtime/ink-crawler-runtime-spritesheet.png',
      'src/assets/runtime/kite-wraith-runtime-spritesheet.png',
      'src/assets/runtime/slash-runtime-spritesheet.png',
      'src/assets/runtime/telegraph-runtime-spritesheet.png',
      'src/assets/runtime/lantern-warden-runtime-spritesheet.png',
      'src/assets/runtime/stage1-bg-far.png',
      'src/assets/runtime/stage1-bg-distant.png',
      'src/assets/runtime/stage1-bg-mid.png',
      'src/assets/runtime/stage1-bg-near.png',
      'src/assets/runtime/stage1-bg-front.png',
      'src/assets/runtime/stage1-ground-tile.png',
      'src/assets/runtime/stage1-platform-thin-tile.png',
      'src/assets/runtime/stage1-terrain-rain-lantern-start.png',
      'src/assets/runtime/stage1-terrain-neon-sign-run.png',
      'src/assets/runtime/stage1-terrain-rooftop-hazard-line.png',
      'src/assets/runtime/stage1-terrain-neon-thorn-climb.png',
      'src/assets/runtime/stage1-terrain-lantern-warden-gate.png',
      'src/assets/runtime/stage1-moon-gate.png',
      'src/assets/runtime/stage1-item-icons.png',
      'src/assets/runtime/stage1-touch-controls.png',
      'src/assets/runtime/runtime-sprite-sheets.json'
    ]) {
      expect(fs.existsSync(path.resolve(file))).toBe(true);
    }
  });
});

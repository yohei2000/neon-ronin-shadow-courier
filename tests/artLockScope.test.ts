import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ApprovedArtManifest } from '../src/data/approvedArtManifest';
import { ArtAssetKey, RuntimePlayerVisualConfig } from '../src/data/artAssets';
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

  it('keeps the runtime player body on one approved master texture', () => {
    expect(RuntimePlayerVisualConfig.textureKey).toBe(ArtAssetKey.PlayerMaster);
    expect(RuntimePlayerVisualConfig.textureKey).not.toBe(ArtAssetKey.Player);
  });
});

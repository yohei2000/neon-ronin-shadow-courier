import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GateAEvidenceFiles, GateAApprovalStatus, GateBApprovalStatus, ReferenceIds } from '../src/data/artLockGate';

describe('Art Lock scope', () => {
  it('boots the post-Gate-A Art Lock title and Art Lab runtime', () => {
    const configText = fs.readFileSync(path.resolve('src', 'config', 'gameConfig.ts'), 'utf8');
    expect(configText).toContain('Art Lock');
    expect(configText).toContain('BootScene');
    expect(configText).toContain('PreloadScene');
    expect(configText).toContain('TitleScene');
    expect(configText).toContain('ArtLabScene');
    expect(configText).not.toContain('Stage1Scene');
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

  it('has removed the legacy Stage 1 data file from the runnable source tree', () => {
    const stagePath = path.resolve('src', 'data', 'stage1.json');
    expect(fs.existsSync(stagePath)).toBe(false);
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
});

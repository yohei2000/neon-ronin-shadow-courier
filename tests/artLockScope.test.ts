import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GateAEvidenceFiles, GateAApprovalStatus, GateBApprovalStatus, ReferenceIds } from '../src/data/artLockGate';

describe('Art Lock scope', () => {
  it('boots only the pre-approval Gate A review runtime', () => {
    const configText = fs.readFileSync(path.resolve('src', 'config', 'gameConfig.ts'), 'utf8');
    expect(configText).toContain('Art Lock Gate A');
    expect(configText).toContain('BootScene');
    expect(configText).toContain('GateAReviewScene');
    expect(configText).not.toContain('Stage1Scene');
  });

  it('keeps approval gates explicit', () => {
    expect(GateAApprovalStatus).toBe('PENDING_HUMAN_APPROVAL');
    expect(GateBApprovalStatus).toBe('NOT_STARTED');
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
});

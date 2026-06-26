import { GateAEvidenceFiles, ReferenceIds, SelectedDirection } from '../data/artLockGate';

export interface ArtLockQaState {
  readonly scene: 'GateAReviewScene' | 'PreloadScene' | 'TitleScene' | 'ArtLabScene';
  readonly phase: 'gate-b-final-art-lock-review';
  readonly gateAApproval: 'APPROVED_2026-06-26';
  readonly gateBApproval: 'NOT_STARTED' | 'PENDING_HUMAN_APPROVAL';
  readonly references: typeof ReferenceIds;
  readonly evidenceFiles: typeof GateAEvidenceFiles;
  readonly selectedDirection: typeof SelectedDirection;
  readonly finalProductionRuntime: true;
  readonly state?: string;
  readonly assetKeys?: readonly string[];
  readonly lightingPreset?: string;
  readonly reducedFx?: boolean;
  readonly mobileReviewReady?: boolean;
}

declare global {
  interface Window {
    __NEON_RONIN_ART_LOCK__?: ArtLockQaState;
  }
}

import { GateAEvidenceFiles, ReferenceIds, SelectedDirection } from '../data/artLockGate';

export interface ArtLockQaState {
  readonly scene: 'GateAReviewScene';
  readonly phase: 'gate-a-style-lock';
  readonly gateAApproval: 'PENDING_HUMAN_APPROVAL';
  readonly gateBApproval: 'NOT_STARTED';
  readonly references: typeof ReferenceIds;
  readonly evidenceFiles: typeof GateAEvidenceFiles;
  readonly selectedDirection: typeof SelectedDirection;
  readonly finalProductionRuntime: false;
}

declare global {
  interface Window {
    __NEON_RONIN_ART_LOCK__?: ArtLockQaState;
  }
}

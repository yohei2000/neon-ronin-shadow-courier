export const ArtLockPhase = 'gate-a-style-lock' as const;
export const GateAApprovalStatus = 'PENDING_HUMAN_APPROVAL' as const;
export const GateBApprovalStatus = 'NOT_STARTED' as const;

export const ReferenceIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export const GateAEvidenceFiles = [
  'art/TOOL_CAPABILITY_REPORT.md',
  'art/REFERENCE_ANALYSIS.md',
  'art/REFERENCE_COMPLIANCE_MATRIX.md',
  'art/ART_BIBLE.md',
  'art/palette.png',
  'art/value-study.png',
  'art/shape-language.png',
  'art/player-silhouette-study.png',
  'art/environment-material-study.png',
  'art/ui-style-study.png',
  'art/vfx-style-study.png',
  'art/telegraph-style-study.png',
  'art/reviews/candidates/overview.png',
  'art/reviews/gate-a/representative-composite-960x540.png',
  'art/approvals/GATE_A_REQUEST.md',
  'art/approvals/GATE_A_STATUS.json',
  'art/reviews/gate-a/gate-status-report.json',
  'art/reviews/gate-a/browser-smoke-report.json',
  'art/reviews/gate-a/gate-a-viewer-960x540.png',
  'art/reviews/gate-a/gate-a-package-report.md'
] as const;

export const SelectedDirection = {
  player: 'Candidate 2 body consistency; Candidate 3 hat silhouette only if production frames remain stable.',
  title: 'Candidate 1 Moon Gate title composition.',
  environment: 'Candidate 1 seven-layer rainy alley.',
  inkCrawler: 'Candidate 1 low readable crawler.',
  kiteWraith: 'Candidate 3 forward fast-threat silhouette.',
  lanternWarden: 'Candidate 2 readable vertical warden with restrained Candidate 3 weight.',
  ui: 'Candidate 3 paper readability plus Candidate 2 cyan semantic discipline.',
  landmark: 'Moon Gate Candidate 1.'
} as const;

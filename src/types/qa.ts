export interface Stage1QaState {
  readonly scene: string;
  readonly player: {
    readonly x: number;
    readonly y: number;
    readonly hp: number;
    readonly facing: -1 | 1;
    readonly attackActive: boolean;
    readonly grounded: boolean;
    readonly wallSliding: boolean;
  };
  readonly sectionId: string;
  readonly sectionName: string;
  readonly checkpointIndex: number;
  readonly scrolls: readonly string[];
  readonly seals: number;
  readonly damageTaken: number;
  readonly minibossActive: boolean;
  readonly minibossDefeated: boolean;
  readonly minibossHealthRatio: number;
  readonly gateActive: boolean;
  readonly stageClear: boolean;
  readonly mobileControlsVisible: boolean;
  readonly touchControls: readonly Stage1TouchControlQa[];
  readonly elapsedMs: number;
}

export interface Stage1TouchControlQa {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hitRadius: number;
  readonly label: string;
  readonly cluster: string;
}

export interface StageClearQaState {
  readonly elapsedMs: number;
  readonly rank: string;
  readonly scrolls: readonly string[];
  readonly damageTaken: number;
  readonly seals: number;
}

declare global {
  interface Window {
    __NEON_RONIN_QA__?: Stage1QaState;
    __NEON_RONIN_CLEAR__?: StageClearQaState;
  }
}

export {};

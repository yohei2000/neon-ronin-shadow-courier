import type { PlayerRuntimeState } from '../entities/Player';
import type { TouchButton } from '../systems/InputSystem';

export type Stage1QaState = {
  readonly scene: 'Stage1Scene' | 'StageClearScene';
  readonly stageClear: boolean;
  readonly section?: string;
  readonly player?: PlayerRuntimeState;
  readonly checkpointCount?: number;
  readonly scrollsFound?: number;
  readonly sealsFound?: number;
  readonly warden?: { readonly current: number; readonly max: number; readonly state: string; readonly attack: string };
  readonly wardenDefeated?: boolean;
  readonly moonGateActive?: boolean;
  readonly paused?: boolean;
  readonly gameOver?: boolean;
  readonly touch?: { readonly visible: boolean; readonly buttons?: Record<TouchButton, boolean> };
  readonly e2eIntegrity?: {
    readonly debugTeleport: false;
    readonly hiddenClearStageCall: false;
  };
  readonly rank?: string;
  readonly timeMs?: number;
  readonly damageTaken?: number;
};

export type Stage1MenuQaState = {
  readonly scene: 'TitleScene' | 'ControlsScene' | 'SettingsScene' | 'CreditsScene';
};

declare global {
  interface Window {
    __NEON_RONIN_STAGE1__?: Stage1QaState;
    __NEON_RONIN_STAGE1_MENU__?: Stage1MenuQaState;
  }
}

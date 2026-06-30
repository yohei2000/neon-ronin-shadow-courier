import type { PlayerRuntimeState } from '../entities/Player';
import type { EnemyRuntimeState } from '../entities/types';
import type { TouchButton } from '../systems/InputSystem';

export type Stage1QaState = {
  readonly scene: 'Stage1Scene' | 'StageClearScene';
  readonly stageClear: boolean;
  readonly section?: string;
  readonly player?: PlayerRuntimeState;
  readonly checkpointCount?: number;
  readonly scrollsFound?: number;
  readonly sealsFound?: number;
  readonly hazards?: readonly {
    readonly id: string;
    readonly type: string;
    readonly active: boolean;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }[];
  readonly gimmicks?: readonly {
    readonly id: string;
    readonly type: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }[];
  readonly enemies?: readonly EnemyRuntimeState[];
  readonly warden?: { readonly current: number; readonly max: number; readonly state: string; readonly attack: string; readonly projectileCount?: number };
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

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
  readonly visualTerrain?: {
    readonly plates: number;
    readonly landforms: number;
    readonly landformFrames: number;
    readonly landformColliders: number;
  };
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
  readonly selectedIndex?: number;
  readonly items?: readonly string[];
  readonly activating?: boolean;
};

export type Stage2QaState = Omit<Stage1QaState, 'scene' | 'warden' | 'wardenDefeated' | 'moonGateActive'> & {
  readonly scene: 'Stage2Scene' | 'StageClearScene';
  readonly anchors?: readonly {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly radius: number;
  }[];
  readonly walls?: readonly {
    readonly id: string;
    readonly role: 'left-wall' | 'right-wall' | 'back-wall';
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }[];
  readonly slopes?: readonly {
    readonly id: string;
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    readonly direction: 'down-right' | 'down-left';
  }[];
  readonly activeThreadTarget?: string | null;
  readonly relayKeeper?: { readonly current: number; readonly max: number; readonly state: string; readonly attack: string; readonly projectileCount?: number };
  readonly relayKeeperDefeated?: boolean;
  readonly signalGateActive?: boolean;
};

export type GameAudioQaState = {
  readonly profile: 'menu' | 'stage1' | 'stage2' | 'clear' | null;
  readonly locked: boolean;
  readonly activeLoopKeys: readonly string[];
  readonly activeVoices: number;
  readonly limiterActive: boolean;
  readonly bossIntensity: number;
  readonly paused: boolean;
  readonly musicDuck: number;
};

declare global {
  interface Window {
    __NEON_RONIN_STAGE1__?: Stage1QaState;
    __NEON_RONIN_STAGE2__?: Stage2QaState;
    __NEON_RONIN_STAGE1_MENU__?: Stage1MenuQaState;
    __NEON_RONIN_AUDIO__?: GameAudioQaState;
  }
}

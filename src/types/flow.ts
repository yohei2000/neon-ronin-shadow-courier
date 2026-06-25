import type { StageClearResult } from './save';

export interface Stage1SceneData {
  readonly checkpointIndex?: number;
}

export interface StageClearSceneData extends StageClearResult {
  readonly checkpointIndex: number;
}

export interface GameOverSceneData {
  readonly checkpointIndex: number;
  readonly reason?: 'defeated' | 'fall';
}

export interface CreditsSceneData {
  readonly result?: StageClearResult;
  readonly creditsOnly?: boolean;
}

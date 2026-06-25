import type { StageId } from './game';
import type { StageClearResult } from './save';

export interface GameSceneData {
  readonly stageId?: StageId;
  readonly checkpointIndex?: number;
}

export interface StageClearSceneData extends StageClearResult {
  readonly checkpointIndex: number;
}

export interface GameOverSceneData {
  readonly stageId: StageId;
  readonly checkpointIndex: number;
}

export interface EndingSceneData {
  readonly result?: StageClearResult;
  readonly creditsOnly?: boolean;
}

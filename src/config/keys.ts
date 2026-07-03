export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  Controls: 'ControlsScene',
  Settings: 'SettingsScene',
  Credits: 'CreditsScene',
  Stage1: 'Stage1Scene',
  Stage2: 'Stage2Scene',
  StageClear: 'StageClearScene',
  ArtLab: 'ArtLabScene',
  GateAReview: 'GateAReviewScene'
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

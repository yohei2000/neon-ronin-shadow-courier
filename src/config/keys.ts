export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  ArtLab: 'ArtLabScene',
  GateAReview: 'GateAReviewScene'
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

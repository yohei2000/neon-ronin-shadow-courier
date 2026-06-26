export const SceneKey = {
  Boot: 'BootScene',
  GateAReview: 'GateAReviewScene'
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

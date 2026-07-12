export const DefaultAudioSpatialDistance = 900;
export const DefaultAudioPanDistance = 640;

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));

export const resolveSpatialMix = (
  sourceX: number,
  listenerX: number,
  maxDistance = DefaultAudioSpatialDistance
): { readonly pan: number; readonly attenuation: number } => {
  const safeMaxDistance = Math.max(1, Math.abs(maxDistance));
  const offset = sourceX - listenerX;
  const normalizedDistance = clamp(Math.abs(offset) / safeMaxDistance);
  const attenuation = Math.pow(1 - normalizedDistance, 1.35);
  const panDistance = Math.min(DefaultAudioPanDistance, safeMaxDistance);
  return {
    attenuation,
    pan: clamp(offset / panDistance, -1, 1) * 0.88
  };
};

export const resolveFootstepInterval = (absoluteVelocityX: number): number => {
  const speedAmount = clamp((Math.abs(absoluteVelocityX) - 52) / 430);
  return 350 - speedAmount * 172;
};

export const resolveAudioMixDelta = (frameDeltaMs: number, wallDeltaMs: number): number => {
  const safeFrameDeltaMs = clamp(Number.isFinite(frameDeltaMs) ? frameDeltaMs : 1000 / 60, 0, 100);
  const safeWallDeltaMs = clamp(Number.isFinite(wallDeltaMs) ? wallDeltaMs : 0, 0, 1000);
  return safeWallDeltaMs > 0 ? safeWallDeltaMs : safeFrameDeltaMs;
};

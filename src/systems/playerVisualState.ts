import { Stage1Tuning } from '../data/stage1';

export type JumpVisualVariant = 'small' | 'big' | 'speedFlip';

export const SpeedFlipMinRunSpeedRatio = 0.84;
export const SmallJumpReleaseWindowMs = 180;

export const resolveInitialJumpVisualVariant = (
  horizontalVelocity: number,
  runSpeed: number = Stage1Tuning.runSpeed
): JumpVisualVariant => {
  return Math.abs(horizontalVelocity) >= runSpeed * SpeedFlipMinRunSpeedRatio ? 'speedFlip' : 'big';
};

export const shouldUseSmallJumpVariant = ({
  elapsedMs,
  verticalVelocity
}: {
  readonly elapsedMs: number;
  readonly verticalVelocity: number;
}): boolean => {
  return elapsedMs >= 0 && elapsedMs <= SmallJumpReleaseWindowMs && verticalVelocity < 0;
};

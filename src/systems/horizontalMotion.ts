import { Stage1Tuning } from '../data/stage1';

type HorizontalVelocityParams = {
  readonly currentVx: number;
  readonly inputMoveX: -1 | 0 | 1;
  readonly onGround: boolean;
  readonly dtSeconds: number;
};

const horizontalDeadZone = 1;

const approach = (current: number, target: number, maxDelta: number): number => {
  if (current < target) return Math.min(target, current + maxDelta);
  if (current > target) return Math.max(target, current - maxDelta);
  return target;
};

const snapSmallVelocity = (velocity: number): number => (Math.abs(velocity) < horizontalDeadZone ? 0 : velocity);

export const resolveHorizontalVelocity = ({ currentVx, inputMoveX, onGround, dtSeconds }: HorizontalVelocityParams): number => {
  const current = snapSmallVelocity(currentVx);
  const inputDirection = Math.sign(inputMoveX) as -1 | 0 | 1;

  if (inputDirection === 0) {
    const deceleration = onGround ? Stage1Tuning.groundDeceleration : Stage1Tuning.airDeceleration;
    return snapSmallVelocity(approach(current, 0, deceleration * dtSeconds));
  }

  const currentDirection = Math.sign(current) as -1 | 0 | 1;
  if (currentDirection !== 0 && currentDirection !== inputDirection) {
    const turnDeceleration = onGround ? Stage1Tuning.groundTurnDeceleration : Stage1Tuning.airTurnDeceleration;
    return snapSmallVelocity(approach(current, 0, turnDeceleration * dtSeconds));
  }

  const acceleration = onGround ? Stage1Tuning.groundAcceleration : Stage1Tuning.airAcceleration;
  return snapSmallVelocity(approach(current, inputDirection * Stage1Tuning.runSpeed, acceleration * dtSeconds));
};

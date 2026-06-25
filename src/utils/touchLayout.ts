import { TouchControlNames, type TouchControlName } from '../config/controls';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';

export type TouchControlCluster = 'movement' | 'action' | 'system';

export interface TouchButtonLayout {
  readonly name: TouchControlName;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hitRadius: number;
  readonly label: string;
  readonly cluster: TouchControlCluster;
}

export interface TouchLayoutMetrics {
  readonly buttonCount: number;
  readonly movementCount: number;
  readonly actionCount: number;
  readonly systemCount: number;
  readonly actionGap: number;
  readonly pauseNearestGap: number;
}

export interface TouchLayoutValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly metrics: TouchLayoutMetrics;
}

const HIT_RADIUS_SCALE = 1.2;

export function createTouchLayout(width = BASE_WIDTH, height = BASE_HEIGHT): readonly TouchButtonLayout[] {
  const buttons: Array<Omit<TouchButtonLayout, 'hitRadius'>> = [
    { name: 'left', x: 72, y: height - 88, radius: 44, label: '<', cluster: 'movement' },
    { name: 'right', x: 168, y: height - 88, radius: 44, label: '>', cluster: 'movement' },
    { name: 'up', x: 120, y: height - 136, radius: 38, label: '^', cluster: 'movement' },
    { name: 'down', x: 120, y: height - 48, radius: 38, label: 'v', cluster: 'movement' },
    { name: 'jump', x: width - 235, y: height - 90, radius: 44, label: 'JMP', cluster: 'action' },
    { name: 'attack', x: width - 124, y: height - 104, radius: 46, label: 'ATK', cluster: 'action' },
    { name: 'pause', x: width - 52, y: 54, radius: 28, label: 'II', cluster: 'system' }
  ];
  return buttons.map((button) => ({
    ...button,
    hitRadius: button.radius * HIT_RADIUS_SCALE
  }));
}

export function validateTouchLayout(
  layout: readonly TouchButtonLayout[] = createTouchLayout(),
  width = BASE_WIDTH,
  height = BASE_HEIGHT
): TouchLayoutValidation {
  const errors: string[] = [];
  const names = new Set<TouchControlName>();

  for (const button of layout) {
    if (names.has(button.name)) {
      errors.push(`Duplicate touch control: ${button.name}.`);
    }
    names.add(button.name);
    if (button.x - button.radius < 0 || button.x + button.radius > width) {
      errors.push(`${button.name} is outside horizontal canvas bounds.`);
    }
    if (button.y - button.radius < 0 || button.y + button.radius > height) {
      errors.push(`${button.name} is outside vertical canvas bounds.`);
    }
    if (button.radius < 28) {
      errors.push(`${button.name} touch target is smaller than the minimum radius.`);
    }
    if (button.cluster !== 'system' && button.y < height * 0.7) {
      errors.push(`${button.name} should stay in the lower control band.`);
    }
    if (button.cluster === 'movement' && button.x > width * 0.3) {
      errors.push(`${button.name} should stay in the left movement cluster.`);
    }
    if (button.cluster === 'action' && button.x < width * 0.7) {
      errors.push(`${button.name} should stay in the right action cluster.`);
    }
  }

  for (const name of TouchControlNames) {
    if (!names.has(name)) {
      errors.push(`Missing touch control: ${name}.`);
    }
  }

  const jump = findButton(layout, 'jump');
  const attack = findButton(layout, 'attack');
  const pause = findButton(layout, 'pause');

  const actionGap = jump && attack ? gapBetween(jump, attack) : Number.NEGATIVE_INFINITY;
  if (actionGap < 16) {
    errors.push('Jump and attack controls are too close for reliable mobile input.');
  }

  const pauseNearestGap =
    pause === undefined
      ? Number.NEGATIVE_INFINITY
      : Math.min(...layout.filter((button) => button.name !== 'pause').map((button) => gapBetween(pause, button)));
  if (pause && (pause.x < width - 100 || pause.y > 100)) {
    errors.push('Pause control should stay in the upper-right safe area.');
  }
  if (pauseNearestGap < 180) {
    errors.push('Pause control is too close to active gameplay controls.');
  }

  const metrics = summarizeTouchLayout(layout, actionGap, pauseNearestGap);
  return { valid: errors.length === 0, errors, metrics };
}

function summarizeTouchLayout(
  layout: readonly TouchButtonLayout[],
  actionGap: number,
  pauseNearestGap: number
): TouchLayoutMetrics {
  return {
    buttonCount: layout.length,
    movementCount: layout.filter((button) => button.cluster === 'movement').length,
    actionCount: layout.filter((button) => button.cluster === 'action').length,
    systemCount: layout.filter((button) => button.cluster === 'system').length,
    actionGap: Math.round(actionGap * 10) / 10,
    pauseNearestGap: Math.round(pauseNearestGap * 10) / 10
  };
}

function findButton(layout: readonly TouchButtonLayout[], name: TouchControlName): TouchButtonLayout | undefined {
  return layout.find((button) => button.name === name);
}

function gapBetween(a: TouchButtonLayout, b: TouchButtonLayout): number {
  const centerDistance = Math.hypot(a.x - b.x, a.y - b.y);
  return centerDistance - a.radius - b.radius;
}

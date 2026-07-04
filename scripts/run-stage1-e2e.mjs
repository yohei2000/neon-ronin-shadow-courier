import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });
const stage = JSON.parse(fs.readFileSync(path.resolve('src', 'data', 'stage1Content.json'), 'utf8'));

const baseUrl = 'http://127.0.0.1:5175';
const server = await createServer({
  ...createInlineViteConfig(),
  server: {
    host: '127.0.0.1',
    port: 5175
  }
});
await server.listen();
console.log(`stage1-e2e server ${baseUrl}`);

const browser = await chromium.launch();
console.log('stage1-e2e browser launched');
const tests = [];
const shouldRun = (name) => !process.env.E2E_FILTER || name.includes(process.env.E2E_FILTER);
const routeTimeoutMs = Number(process.env.E2E_ROUTE_TIMEOUT_MS ?? 420000);
const wardenEngageX = stage.warden.arena.x + 160;
const wardenStopX = stage.warden.x - 120;
const wardenAdvanceX = stage.warden.x - 130;
const wardenRightRecoveryX = stage.warden.x + 130;
const wardenFarRightX = stage.warden.x + 260;
const wardenFaceLeftX = stage.warden.x - 40;
const verticalAssistZones = [
  { startX: 1500, endX: 2460, minY: 165, holdMs: 430 },
  { startX: 6100, endX: 6740, minY: 165, holdMs: 460 }
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const waitFor = async (predicate, message, timeoutMs = 12000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(message);
};
const state = async (page) => page.evaluate(() => window.__NEON_RONIN_STAGE1__ ?? {});
const menuState = async (page) => page.evaluate(() => window.__NEON_RONIN_STAGE1_MENU__ ?? {});
const withPage = async (viewport, fn) => {
  const page = await browser.newPage(viewport ? { viewport, isMobile: viewport.width <= 480, hasTouch: viewport.width <= 480 } : undefined);
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  try {
    const result = await fn(page, consoleErrors);
    assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join('\n')}`);
    return result;
  } finally {
    await page.close();
  }
};
const selectTitleMenuItem = async (page, label) => {
  await waitFor(async () => (await menuState(page)).scene === 'TitleScene', 'title did not open');
  const currentMenu = await menuState(page);
  const items = currentMenu.items ?? [];
  const targetIndex = items.indexOf(label);
  assert(targetIndex >= 0, `menu item not found: ${label}; items=${items.join(', ')}`);
  const selectedIndex = currentMenu.selectedIndex ?? 0;
  const forwardSteps = (targetIndex - selectedIndex + items.length) % items.length;
  const backwardSteps = (selectedIndex - targetIndex + items.length) % items.length;
  const key = forwardSteps <= backwardSteps ? 'ArrowDown' : 'ArrowUp';
  const stepCount = Math.min(forwardSteps, backwardSteps);
  for (let index = 0; index < stepCount; index += 1) {
    await page.keyboard.press(key);
    await page.waitForTimeout(80);
  }
  await waitFor(async () => (await menuState(page)).selectedIndex === targetIndex, `${label} was not selected`);
  await page.keyboard.press('Enter');
};
const record = async (name, fn) => {
  const started = Date.now();
  console.log(`START ${name}`);
  try {
    const details = await fn();
    tests.push({ name, status: 'passed', durationMs: Date.now() - started, details });
    console.log(`PASS ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    tests.push({ name, status: 'failed', durationMs: Date.now() - started, error: message });
    console.log(`FAIL ${name}`);
    console.error(message);
  }
};
const startStage1 = async (page) => {
  await page.goto(baseUrl);
  await selectTitleMenuItem(page, 'START STAGE 1');
  await waitFor(async () => (await state(page)).scene === 'Stage1Scene', 'Stage1 did not start');
};
const jump = async (page, holdMs = 95) => {
  await page.keyboard.down('Space');
  await page.waitForTimeout(holdMs);
  await page.keyboard.up('Space');
};
const releaseMovementKeys = async (page) => {
  await page.keyboard.up('a');
  await page.keyboard.up('d');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
};
const slash = async (page, holdMs = 70) => {
  await page.keyboard.down('J');
  await page.waitForTimeout(holdMs);
  await page.keyboard.up('J');
};
const verticalAssistFor = (player) =>
  verticalAssistZones.find((zone) => player.x > zone.startX && player.x < zone.endX && player.y > zone.minY);
const gamePoint = async (page, x, y) => {
  const rect = await page.locator('canvas').boundingBox();
  assert(rect, 'canvas not found');
  return {
    x: rect.x + (x / 960) * rect.width,
    y: rect.y + (y / 540) * rect.height
  };
};
const cdpTouchPoint = (point, id) => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
  radiusX: 12,
  radiusY: 12,
  rotationAngle: 0,
  force: 0.7,
  id
});
const holdTouchPoints = async (page, points, holdMs) => {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: points.map((point, index) => cdpTouchPoint(point, index + 1))
    });
    await page.waitForTimeout(holdMs);
  } finally {
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => undefined);
    await client.detach().catch(() => undefined);
  }
};
const runKeyboardRouteToClear = async (page, stopWhen) => {
  const started = Date.now();
  let rightDown = false;
  let lastJump = 0;
  let lastSlash = 0;
  let lastShaftRecovery = 0;
  let lastRightRefresh = 0;
  let lastProgressX = 0;
  let lastProgressAt = Date.now();
  let lastDamageSeen = 0;
  const setRight = async (down) => {
    const now = Date.now();
    if (down && rightDown && now - lastRightRefresh <= 650) return;
    if (!down && !rightDown) return;
    if (down) {
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.up('a');
      if (now - lastRightRefresh > 650) {
        await page.keyboard.up('ArrowRight');
        await page.keyboard.up('d');
        lastRightRefresh = now;
      }
      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('d');
      rightDown = true;
    } else {
      await page.keyboard.up('ArrowRight');
      await page.keyboard.up('d');
      rightDown = false;
    }
  };
  await setRight(true);
  while (Date.now() - started < routeTimeoutMs) {
    const current = await state(page);
    if (current.scene === 'StageClearScene' || current.stageClear) {
      await setRight(false);
      return current;
    }
    if (current.gameOver) {
      await setRight(false);
      throw new Error(`keyboard route game over at ${JSON.stringify(current)}`);
    }
    const player = current.player;
    if (!player) {
      await page.waitForTimeout(50);
      continue;
    }
    if (stopWhen?.(current) === true) {
      await setRight(false);
      return current;
    }
    if (process.env.E2E_TRACE && player.damageTaken !== lastDamageSeen) {
      console.log(`TRACE damage ${player.damageTaken} source=${player.lastDamageSource ?? 'unknown'} id=${player.lastDamageId ?? 'unknown'} x=${player.x} y=${player.y} hp=${player.hp} section=${current.section}`);
      lastDamageSeen = player.damageTaken;
    }
    const now = Date.now();
    if (player.x >= wardenStopX && !current.wardenDefeated) await setRight(false);
    else await setRight(true);
    if (current.wardenDefeated) {
      await setRight(true);
      if (player.x > lastProgressX + 6 || player.x < lastProgressX -120) {
        lastProgressX = player.x;
        lastProgressAt = now;
      } else if (now - lastProgressAt > 1800) {
        await releaseMovementKeys(page);
        await page.locator('canvas').click({ position: { x: 480, y: 270 } });
        await setRight(true);
        lastProgressX = player.x;
        lastProgressAt = now;
        lastJump = now;
        if (player.onGround) await jump(page, 120);
        else await page.waitForTimeout(120);
      } else {
        await page.waitForTimeout(80);
      }
      continue;
    }
    if (!current.wardenDefeated && player.x > wardenEngageX) {
      await setRight(false);
      if (current.warden?.state === 'active' && player.onGround && now - lastJump > 240) {
        lastJump = now;
        await jump(page, 145);
      }
      if (now - lastSlash > 240) {
        lastSlash = now;
        await slash(page);
      }
      if (player.x < wardenAdvanceX) {
        await setRight(true);
        await page.waitForTimeout(current.warden?.state === 'active' ? 35 : 70);
        await setRight(false);
      } else if (player.x > wardenRightRecoveryX) {
        await page.keyboard.up('ArrowRight');
        await page.keyboard.up('d');
        await page.keyboard.down('ArrowLeft');
        await page.keyboard.down('a');
        await page.waitForTimeout(player.x > wardenFarRightX ? 950 : 560);
        await page.keyboard.up('ArrowLeft');
        await page.keyboard.up('a');
      } else {
        const faceLeft = player.x > wardenFaceLeftX;
        await page.keyboard.down(faceLeft ? 'ArrowLeft' : 'ArrowRight');
        await page.keyboard.down(faceLeft ? 'a' : 'd');
        await page.waitForTimeout(35);
        await page.keyboard.up(faceLeft ? 'ArrowLeft' : 'ArrowRight');
        await page.keyboard.up(faceLeft ? 'a' : 'd');
        if (current.warden?.state === 'active' && player.onGround && now - lastJump > 260) {
          lastJump = now;
          await jump(page, 130);
        }
        if (now - lastSlash > 270) {
          lastSlash = now;
          await slash(page);
        }
      }
      await page.waitForTimeout(50);
      continue;
    }
    if (player.x > lastProgressX + 6) {
      lastProgressX = player.x;
      lastProgressAt = now;
    } else if (player.x < lastProgressX - 120) {
      lastProgressX = player.x;
      lastProgressAt = now;
    } else if (now - lastProgressAt > 2200 && (player.x < wardenEngageX || current.wardenDefeated)) {
      if (process.env.E2E_TRACE) {
        console.log(`TRACE recovery x=${player.x} y=${player.y} onGround=${player.onGround} section=${current.section}`);
      }
      await releaseMovementKeys(page);
      await page.locator('canvas').click({ position: { x: 480, y: 270 } });
      const recoveryAssist = verticalAssistFor(player);
      if (recoveryAssist && !current.wardenDefeated) {
        await setRight(true);
        lastProgressX = player.x;
        lastProgressAt = now;
        lastJump = now;
        if (player.onGround || player.y > recoveryAssist.minY) {
          await jump(page, recoveryAssist.holdMs);
        } else {
          await page.waitForTimeout(recoveryAssist.holdMs);
        }
        continue;
      }
      await setRight(true);
      lastProgressX = player.x;
      lastProgressAt = now;
      lastJump = now;
      const recoveryJumpMs =
        current.wardenDefeated
          ? 120
          : player.x > 1320 && player.x < 1520
            ? 240
            : player.x > 1500 && player.x < 2500
              ? 430
              : player.x > 3920 && player.x < 4200
                ? 260
                : player.x > 6800 && player.x < 7180
                  ? 520
                : player.x > 7300 && player.x < 7620
                  ? 260
                  : player.x <= 1200
                    ? 220
                    : 0;
      if (recoveryJumpMs > 0) await jump(page, recoveryJumpMs);
      else await page.waitForTimeout(120);
      continue;
    }

    if (player.x > 1080 && player.x < 1190 && player.y > 380 && now - lastShaftRecovery > 1400) {
      lastShaftRecovery = now;
      await setRight(false);
      await page.keyboard.down('ArrowLeft');
      await page.keyboard.down('a');
      await page.waitForTimeout(220);
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.up('a');
      await setRight(true);
      lastJump = Date.now();
      await jump(page, 260);
      continue;
    }

    const verticalAssist = verticalAssistFor(player);
    if (verticalAssist && (player.onGround || player.y > verticalAssist.minY) && now - lastJump > 300) {
      lastJump = now;
      await jump(page, verticalAssist.holdMs);
      continue;
    }

    const routeHazards = (current.hazards ?? []).filter((hazard) => {
      if (hazard.type === 'timed-spark') return hazard.y > 360 || Math.abs(hazard.y + hazard.height / 2 - player.y) < 105;
      if (hazard.type === 'fall-pit') return hazard.width > 40;
      return true;
    });
    const timedSparkAhead = routeHazards.find((hazard) => {
      if (hazard.type !== 'timed-spark') return false;
      const lead = hazard.y < 260 ? 380 : 260;
      return player.x > hazard.x - lead && player.x < hazard.x + hazard.width + 80;
    });
    if (timedSparkAhead && now - lastJump > 230 && (player.onGround || Math.abs(player.y - timedSparkAhead.y) < 92)) {
      lastJump = now;
      await setRight(true);
      await jump(page, timedSparkAhead.y < 260 ? 430 : 390);
      continue;
    }

    const hazardAhead = routeHazards.find((hazard) => {
      const lead = hazard.type === 'fall-pit' ? 150 : hazard.type === 'timed-spark' ? 240 : hazard.type === 'neon-thorn' ? 330 : 120;
      const tail = hazard.type === 'fall-pit' ? hazard.width + 44 : hazard.width + 110;
      return player.x > hazard.x - lead && player.x < hazard.x + tail;
    });
    if (hazardAhead && (player.onGround || player.y > 365) && now - lastJump > 260) {
      lastJump = now;
      await jump(page, hazardAhead.type === 'fall-pit' ? 230 : hazardAhead.type === 'timed-spark' ? 390 : hazardAhead.type === 'neon-thorn' ? 360 : 280);
    }
    const jumpNow =
      (player.x > 1320 && player.x < 1520 && player.y > 410) ||
      (player.x > 1500 && player.x < 2460 && player.y > 165) ||
      (player.x > 3920 && player.x < 4200 && player.y > 245) ||
      (player.x > 6080 && player.x < 6740 && player.y > 165) ||
      (player.x > 6800 && player.x < 7180 && player.y > 100) ||
      (player.x > 7280 && player.x < 7620 && player.y > 205);
    if (jumpNow && now - lastJump > 360) {
      lastJump = now;
      const assist = verticalAssistFor(player);
      await jump(page, assist ? assist.holdMs : player.x > 1500 && player.x < 2460 ? 430 : 180);
    }
    const enemyInReach = (current.enemies ?? []).some(
      (enemy) => enemy.visible !== false && !enemy.dead && Math.abs(enemy.x - player.x) < 260 && Math.abs(enemy.y - player.y) < 210
    );
    const attackNow =
      enemyInReach ||
      (player.x > 760 && player.x < 1060) ||
      (player.x > 3300 && player.x < 3820) ||
      (player.x > 4400 && player.x < 5000) ||
      (player.x > 6660 && player.x < 7240) ||
      (player.x > 7280 && player.x < 7860) ||
      (player.x > wardenEngageX && !current.wardenDefeated);
    if (attackNow && now - lastSlash > 300) {
      lastSlash = now;
      await slash(page);
    }
    await page.waitForTimeout(50);
  }
  await setRight(false);
  throw new Error(`keyboard route timed out at ${JSON.stringify(await state(page))}`);
};

if (shouldRun('title-flow')) await record('title-flow', () =>
  withPage(null, async (page) => {
    await page.goto(baseUrl);
    await selectTitleMenuItem(page, 'CONTROLS');
    await waitFor(async () => (await menuState(page)).scene === 'ControlsScene', 'controls did not open');
    await page.keyboard.press('Escape');
    await waitFor(async () => (await menuState(page)).scene === 'TitleScene', 'title did not reopen after controls');
    await selectTitleMenuItem(page, 'SETTINGS');
    await waitFor(async () => (await menuState(page)).scene === 'SettingsScene', 'settings did not open');
    await page.keyboard.press('Escape');
    await waitFor(async () => (await menuState(page)).scene === 'TitleScene', 'title did not reopen after settings');
    await selectTitleMenuItem(page, 'START STAGE 1');
    await waitFor(async () => (await state(page)).scene === 'Stage1Scene', 'Stage1 did not start from title');
    return { title: true, controls: true, settings: true, stage1: true };
  })
);

if (shouldRun('stage1-keyboard-clear')) await record('stage1-keyboard-clear', () =>
  withPage(null, async (page) => {
    await startStage1(page);
    const result = await runKeyboardRouteToClear(page);
    assert(result.scene === 'StageClearScene', 'StageClearScene not reached');
    assert(result.e2eIntegrity?.debugTeleport !== true, 'debug teleport flag set');
    assert(result.e2eIntegrity?.hiddenClearStageCall !== true, 'hidden clear-stage flag set');
    return {
      timeMs: result.timeMs,
      rank: result.rank,
      sealsFound: result.sealsFound,
      damageTaken: result.damageTaken
    };
  })
);

if (shouldRun('mobile-controls')) await record('mobile-controls', () =>
  withPage({ width: 390, height: 844 }, async (page) => {
    await startStage1(page);
    await waitFor(async () => (await state(page)).touch?.visible === true, 'mobile controls not visible');
    const before = (await state(page)).player;
    assert(before, 'player state missing before touch input');
    const left = await gamePoint(page, 80, 452);
    await page.mouse.move(left.x, left.y);
    await page.mouse.down();
    await page.waitForTimeout(220);
    await page.mouse.up();
    const afterLeft = (await state(page)).player;
    assert(afterLeft.x < before.x + 2, `left touch did not affect x: before ${before.x}, after ${afterLeft.x}`);
    const jumpButton = await gamePoint(page, 748, 454);
    await page.mouse.move(jumpButton.x, jumpButton.y);
    await page.mouse.down();
    await page.waitForTimeout(180);
    await page.mouse.up();
    const afterJump = (await state(page)).player;
    assert(afterJump.y < afterLeft.y, `jump touch did not affect y: before ${afterLeft.y}, after ${afterJump.y}`);
    await waitFor(async () => (await state(page)).player?.onGround === true, 'player did not land after jump touch', 3000);
    await waitFor(async () => Math.abs((await state(page)).player?.vx ?? 0) < 18, 'player horizontal inertia did not settle before simultaneous touch', 3000);
    const rightButton = await gamePoint(page, 205, 452);
    const simultaneousBefore = (await state(page)).player;
    await holdTouchPoints(page, [rightButton, jumpButton], 650);
    const simultaneousAfter = (await state(page)).player;
    const touchButtons = (await state(page)).touch?.buttons;
    assert(simultaneousAfter.x >= simultaneousBefore.x + 8, `right+jump touch did not preserve horizontal movement: before ${simultaneousBefore.x}, after ${simultaneousAfter.x}`);
    assert(simultaneousAfter.y < simultaneousBefore.y - 8, `right+jump touch did not jump: before ${simultaneousBefore.y}, after ${simultaneousAfter.y}`);
    assert(touchButtons?.right !== true && touchButtons?.jump !== true, 'right+jump touch buttons remained stuck after release');
    const attackButton = await gamePoint(page, 866, 426);
    await page.mouse.move(attackButton.x, attackButton.y);
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.up();
    await waitFor(async () => (await state(page)).player?.slashing === true, 'attack touch did not create slash state');
    return { viewport: '390x844', touchControls: true, simultaneousRightJump: true };
  })
);

if (shouldRun('checkpoint-retry')) await record('checkpoint-retry', () =>
  withPage(null, async (page) => {
    await startStage1(page);
    const reached = await runKeyboardRouteToClear(
      page,
      (current) => current.player?.x > 4480 && current.checkpointCount >= 3
    );
    assert(reached.checkpointCount >= 3, `checkpoint count too low: ${reached.checkpointCount}`);
    const checkpointX = reached.player?.x ?? 0;
    await releaseMovementKeys(page);
    await page.locator('canvas').click({ position: { x: 480, y: 270 } });
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('d');
    await waitFor(async () => {
      const current = await state(page);
      return (current.player?.x ?? 0) > checkpointX + 180;
    }, 'player did not move away from checkpoint before retry', 6000);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('d');
    await page.keyboard.press('p');
    await waitFor(async () => (await state(page)).paused === true, 'pause did not open before retry');
    await page.keyboard.press('r');
    await waitFor(async () => {
      const current = await state(page);
      return current.player?.x > 4400 && current.player?.x < 4560 && current.player.hp === current.player.maxHp;
    }, 'retry checkpoint did not respawn near checkpoint');
    return { checkpointRetry: true, checkpointCount: reached.checkpointCount };
  })
);

const report = {
  generatedAt: new Date().toISOString(),
  passed: tests.every((test) => test.status === 'passed'),
  tests
};
fs.writeFileSync(path.join(artifactDir, 'e2e-report.json'), `${JSON.stringify(report, null, 2)}\n`);

await browser.close();
await server.close();

for (const item of tests) {
  console.log(`${item.status === 'passed' ? 'PASS' : 'FAIL'} ${item.name} ${item.durationMs}ms`);
  if (item.status === 'failed') console.error(item.error);
}

if (!report.passed) {
  process.exit(1);
}

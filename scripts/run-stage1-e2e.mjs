import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });

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
  await waitFor(async () => (await menuState(page)).scene === 'TitleScene', 'title did not open');
  await page.keyboard.press('Enter');
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
const slash = async (page) => page.keyboard.press('J');
const gamePoint = async (page, x, y) => {
  const rect = await page.locator('canvas').boundingBox();
  assert(rect, 'canvas not found');
  return {
    x: rect.x + (x / 960) * rect.width,
    y: rect.y + (y / 540) * rect.height
  };
};
const runKeyboardRouteToClear = async (page) => {
  const started = Date.now();
  let rightDown = false;
  let lastJump = 0;
  let lastSlash = 0;
  let lastShaftRecovery = 0;
  let lastRightRefresh = 0;
  let lastProgressX = 0;
  let lastProgressAt = Date.now();
  const setRight = async (down) => {
    const now = Date.now();
    rightDown = down;
    if (down) {
      if (now - lastRightRefresh > 650) {
        await page.keyboard.up('ArrowRight');
        await page.keyboard.up('d');
        lastRightRefresh = now;
      }
      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('d');
    } else {
      await page.keyboard.up('ArrowRight');
      await page.keyboard.up('d');
    }
  };
  await setRight(true);
  while (Date.now() - started < 160000) {
    const current = await state(page);
    if (current.scene === 'StageClearScene' || current.stageClear) {
      await setRight(false);
      return current;
    }
    const player = current.player;
    if (!player) {
      await page.waitForTimeout(50);
      continue;
    }
    if (player.x >= 5580 && !current.wardenDefeated) await setRight(false);
    else await setRight(true);

    const now = Date.now();
    if (player.x > lastProgressX + 6) {
      lastProgressX = player.x;
      lastProgressAt = now;
    } else if (player.x < lastProgressX - 120) {
      lastProgressX = player.x;
      lastProgressAt = now;
    } else if (now - lastProgressAt > 2200 && (player.x < 5050 || current.wardenDefeated)) {
      await releaseMovementKeys(page);
      if (player.x > 4200 && player.x < 5050 && !current.wardenDefeated) {
        await page.keyboard.down('ArrowLeft');
        await page.keyboard.down('a');
        await page.waitForTimeout(220);
        await page.keyboard.up('ArrowLeft');
        await page.keyboard.up('a');
      }
      await setRight(true);
      lastProgressX = player.x;
      lastProgressAt = now;
      lastJump = now;
      const recoveryJumpMs =
        player.x > 4200 && player.x < 5050 ? 300 : current.wardenDefeated ? 120 : player.x > 1000 && player.x < 2310 ? 140 : player.x <= 1000 ? 240 : 0;
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

    const inThornRun = player.x > 4240 && player.x < 4940;
    const jumpNow =
      (player.x > 1030 && player.x < 1720 && player.y > 255) ||
      (player.x > 2040 && player.x < 2305) ||
      (player.x > 4080 && player.x < 4385) ||
      (inThornRun && player.y > 255);
    if (jumpNow && now - lastJump > (inThornRun ? 240 : 360)) {
      lastJump = now;
      await jump(page, player.x > 1030 && player.x < 1240 ? 220 : player.x > 1030 && player.x < 1720 ? 165 : inThornRun ? 260 : player.x > 4000 ? 180 : 110);
    }
    const attackNow =
      (player.x > 760 && player.x < 1060) ||
      (player.x > 1880 && player.x < 2180) ||
      (player.x > 2820 && player.x < 3060) ||
      (player.x > 4300 && player.x < 4840) ||
      (player.x > 5520 && !current.wardenDefeated);
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
    await waitFor(async () => (await menuState(page)).scene === 'TitleScene', 'title did not open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await waitFor(async () => (await menuState(page)).scene === 'ControlsScene', 'controls did not open');
    await page.keyboard.press('Escape');
    await waitFor(async () => (await menuState(page)).scene === 'TitleScene', 'title did not reopen after controls');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await waitFor(async () => (await menuState(page)).scene === 'SettingsScene', 'settings did not open');
    await page.keyboard.press('Escape');
    await waitFor(async () => (await menuState(page)).scene === 'TitleScene', 'title did not reopen after settings');
    await page.keyboard.press('Enter');
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
      scrollsFound: result.scrollsFound,
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
    const attackButton = await gamePoint(page, 866, 426);
    await page.mouse.move(attackButton.x, attackButton.y);
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.up();
    await waitFor(async () => (await state(page)).player?.slashing === true, 'attack touch did not create slash state');
    return { viewport: '390x844', touchControls: true };
  })
);

if (shouldRun('checkpoint-retry')) await record('checkpoint-retry', () =>
  withPage(null, async (page) => {
    await startStage1(page);
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('d');
    let lastJump = 0;
    let lastShaftRecovery = 0;
    let lastRightRefresh = Date.now();
    let lastProgressX = 0;
    let lastProgressAt = Date.now();
    for (let i = 0; i < 1000; i += 1) {
      const current = await state(page);
      const player = current.player;
      if (player && player.x > 3600 && current.checkpointCount >= 3) break;
      if (Date.now() - lastRightRefresh > 650) {
        await page.keyboard.up('ArrowRight');
        await page.keyboard.up('d');
        await page.keyboard.down('ArrowRight');
        await page.keyboard.down('d');
        lastRightRefresh = Date.now();
      }
      if (player && player.x > lastProgressX + 6) {
        lastProgressX = player.x;
        lastProgressAt = Date.now();
      } else if (player && player.x < lastProgressX - 120) {
        lastProgressX = player.x;
        lastProgressAt = Date.now();
      } else if (player && Date.now() - lastProgressAt > 2200 && player.x < 3600) {
        await releaseMovementKeys(page);
        await page.keyboard.down('ArrowRight');
        await page.keyboard.down('d');
        lastRightRefresh = Date.now();
        lastProgressX = player.x;
        lastProgressAt = Date.now();
        lastJump = Date.now();
        if (player.x < 2310) await jump(page, player.x > 1000 ? 140 : 240);
        else await page.waitForTimeout(120);
      }
      if (player && player.x > 1080 && player.x < 1190 && player.y > 380 && Date.now() - lastShaftRecovery > 1400) {
        lastShaftRecovery = Date.now();
        await page.keyboard.up('ArrowRight');
        await page.keyboard.up('d');
        await page.keyboard.down('ArrowLeft');
        await page.keyboard.down('a');
        await page.waitForTimeout(220);
        await page.keyboard.up('ArrowLeft');
        await page.keyboard.up('a');
        await page.keyboard.down('ArrowRight');
        await page.keyboard.down('d');
        lastJump = Date.now();
        await jump(page, 260);
      }
      if (player && player.x > 1030 && player.x < 1720 && player.y > 255 && Date.now() - lastJump > 360) {
        lastJump = Date.now();
        await jump(page, player.x < 1240 ? 220 : 165);
      }
      if (player && player.x > 2040 && player.x < 2305 && Date.now() - lastJump > 360) {
        lastJump = Date.now();
        await jump(page, 80);
      }
      await page.waitForTimeout(50);
    }
    const reached = await state(page);
    assert(reached.checkpointCount >= 3, `checkpoint count too low: ${reached.checkpointCount}`);
    const damageBefore = reached.player?.damageTaken ?? 0;
    for (let i = 0; i < 420; i += 1) {
      const current = await state(page);
      const player = current.player;
      if ((player?.damageTaken ?? 0) > damageBefore || player?.x > 4350) break;
      await page.waitForTimeout(50);
    }
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('d');
    const damaged = await state(page);
    assert((damaged.player?.damageTaken ?? 0) > damageBefore, 'hazard damage did not trigger before retry');
    await page.keyboard.press('p');
    await page.keyboard.press('r');
    await waitFor(async () => {
      const current = await state(page);
      return current.player?.x > 3440 && current.player?.x < 3610;
    }, 'retry checkpoint did not respawn near checkpoint');
    return { checkpointRetry: true };
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

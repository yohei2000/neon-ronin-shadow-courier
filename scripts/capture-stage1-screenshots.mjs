import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });

const server = await createServer({
  ...createInlineViteConfig(),
  server: {
    host: '127.0.0.1',
    port: 5174
  }
});
await server.listen();

const baseUrl = 'http://127.0.0.1:5174';
const browser = await chromium.launch();
const consoleMessages = [];
const routeTimeoutMs = 420000;

const state = async (page) => page.evaluate(() => window.__NEON_RONIN_STAGE1__ ?? {});
const menuState = async (page) => page.evaluate(() => window.__NEON_RONIN_STAGE1_MENU__ ?? {});
const waitFor = async (predicate, timeoutMs = 15000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for screenshot condition');
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
const startStage1 = async (page) => {
  await page.goto(baseUrl);
  await waitFor(async () => (await menuState(page)).scene === 'TitleScene');
  await page.keyboard.press('Enter');
  await waitFor(async () => (await state(page)).scene === 'Stage1Scene');
};

const captureRoute = async (page) => {
  const requiredShots = [
    ['stage-start.png', 120],
    ['combat.png', 850],
    ['wall-kick-shaft.png', 1300],
    ['checkpoint.png', 3480],
    ['neon-thorn-run.png', 4210],
    ['lantern-warden.png', 5530]
  ];
  const captured = new Set();
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
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.up('a');
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
  const started = Date.now();
  while (Date.now() - started < routeTimeoutMs) {
    const current = await state(page);
    if (current.scene === 'StageClearScene') {
      await setRight(false);
      await page.screenshot({ path: path.join(artifactDir, 'stage-clear.png') });
      return;
    }
    if (current.gameOver) {
      await setRight(false);
      throw new Error(`Screenshot route game over: ${JSON.stringify(current)}`);
    }
    const player = current.player;
    if (!player) {
      await page.waitForTimeout(50);
      continue;
    }
    for (const [file, x] of requiredShots) {
      if (!captured.has(file) && player.x >= x) {
        await page.screenshot({ path: path.join(artifactDir, file) });
        captured.add(file);
      }
    }
    if (player.x >= 5580 && !current.wardenDefeated) await setRight(false);
    else await setRight(true);

    const now = Date.now();
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
        if (player.onGround) await jump(page, 120);
        else await page.waitForTimeout(120);
      } else {
        await page.waitForTimeout(80);
      }
      continue;
    }
    if (!current.wardenDefeated && player.x > 5480) {
      await setRight(false);
      if (current.warden?.state === 'active' && player.onGround && now - lastJump > 240) {
        lastJump = now;
        await jump(page, 145);
      }
      if (now - lastSlash > 240) {
        lastSlash = now;
        await slash(page);
      }
      if (player.x < 5570) {
        await setRight(true);
        await page.waitForTimeout(current.warden?.state === 'active' ? 35 : 70);
        await setRight(false);
      } else if (player.x > 5830) {
        await page.keyboard.down('ArrowLeft');
        await page.keyboard.down('a');
        await page.waitForTimeout(110);
        await page.keyboard.up('ArrowLeft');
        await page.keyboard.up('a');
      } else {
        const faceLeft = player.x > 5660;
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
    } else if (now - lastProgressAt > 2200 && (player.x < 5480 || current.wardenDefeated)) {
      await releaseMovementKeys(page);
      await page.locator('canvas').click({ position: { x: 480, y: 270 } });
      if (player.x > 4200 && player.x < 5050 && !current.wardenDefeated) {
        await setRight(true);
        lastProgressX = player.x;
        lastProgressAt = now;
        lastJump = now;
        if (player.onGround || player.y > 390) {
          await jump(page, 360);
        } else {
          await page.waitForTimeout(360);
        }
        continue;
      }
      if (player.x >= 5050 && player.x < 5480 && !current.wardenDefeated) {
        await setRight(true);
        lastProgressX = player.x;
        lastProgressAt = now;
        await page.waitForTimeout(900);
        continue;
      }
      await setRight(true);
      lastProgressX = player.x;
      lastProgressAt = now;
      lastJump = now;
      const recoveryJumpMs =
        player.x > 4200 && player.x < 5050
          ? 300
          : player.x >= 5050 && player.x < 5480
            ? 160
            : current.wardenDefeated
              ? 120
              : player.x > 1000 && player.x < 2310
                ? 140
                : player.x <= 1000
                  ? 240
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

    const inThornRun = player.x > 4240 && player.x < 4940;
    if (
      ((player.x > 1030 && player.x < 1720 && player.y > 255) ||
        (player.x > 2040 && player.x < 2305) ||
        (player.x > 4080 && player.x < 4385) ||
        (player.x > 4440 && player.x < 4760) ||
        (player.x > 4760 && player.x < 4895)) &&
      now - lastJump > (inThornRun ? 240 : 360)
    ) {
      lastJump = now;
      const thornJumpMs = player.x > 4760 ? 285 : player.x > 4440 ? 255 : 240;
      await jump(page, player.x > 1030 && player.x < 1240 ? 220 : player.x > 1030 && player.x < 1720 ? 165 : inThornRun ? thornJumpMs : player.x > 4000 ? 180 : 110);
    }
    if (
      ((player.x > 760 && player.x < 1060) ||
        (player.x > 1880 && player.x < 2180) ||
        (player.x > 2540 && player.x < 3180) ||
        (player.x > 4300 && player.x < 4500) ||
        (player.x > 5520 && !current.wardenDefeated)) &&
      now - lastSlash > 300
    ) {
      lastSlash = now;
      await slash(page);
    }
    await page.waitForTimeout(50);
  }
  await setRight(false);
  throw new Error(`Screenshot route timed out: ${JSON.stringify(await state(page))}`);
};

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleMessages.push({ type: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => consoleMessages.push({ type: 'pageerror', text: error.message }));
  await page.goto(baseUrl);
  await waitFor(async () => (await menuState(page)).scene === 'TitleScene');
  await page.screenshot({ path: path.join(artifactDir, 'title.png') });
  await startStage1(page);
  await captureRoute(page);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('console', (message) => {
    if (message.type() === 'error') consoleMessages.push({ type: message.type(), text: message.text() });
  });
  mobile.on('pageerror', (error) => consoleMessages.push({ type: 'pageerror', text: error.message }));
  await startStage1(mobile);
  await waitFor(async () => (await state(mobile)).touch?.visible === true);
  await mobile.screenshot({ path: path.join(artifactDir, 'mobile-390x844.png') });
  await mobile.close();

  const report = {
    generatedAt: new Date().toISOString(),
    passed: consoleMessages.length === 0,
    consoleErrors: consoleMessages,
    screenshots: [
      'title.png',
      'stage-start.png',
      'wall-kick-shaft.png',
      'combat.png',
      'checkpoint.png',
      'neon-thorn-run.png',
      'lantern-warden.png',
      'stage-clear.png',
      'mobile-390x844.png'
    ]
  };
  fs.writeFileSync(path.join(artifactDir, 'console-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else {
    console.log('qa:screenshots-stage1 PASS 9 screenshots, console clean');
  }
} finally {
  await browser.close();
  await server.close();
}

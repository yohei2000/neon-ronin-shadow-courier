import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const artifactDir = path.resolve('artifacts', 'stage1');
fs.mkdirSync(artifactDir, { recursive: true });
const stage = JSON.parse(fs.readFileSync(path.resolve('src', 'data', 'stage1Content.json'), 'utf8'));

const server = await createServer({
  ...createInlineViteConfig(),
  server: {
    host: '127.0.0.1',
    port: 5174
  }
});
await server.listen();

const baseUrl = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') ?? 'http://127.0.0.1:5174';
const browser = await chromium.launch();
const consoleMessages = [];
const routeTimeoutMs = Number(process.env.E2E_ROUTE_TIMEOUT_MS ?? 420000);
const wardenEngageX = stage.warden.arena.x + 160;
const wardenStopX = stage.warden.x - 120;
const wardenAdvanceX = stage.warden.x - 130;
const wardenRightRecoveryX = stage.warden.x + 130;
const wardenFarRightX = stage.warden.x + 260;
const wardenFaceLeftX = stage.warden.x - 40;
const verticalAssistZones = [
  { startX: 1500, endX: 2460, minY: 165, holdMs: 430 },
  { startX: 6100, endX: 7240, minY: 135, holdMs: 520 }
];

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
const verticalAssistFor = (player) =>
  verticalAssistZones.find((zone) => player.x > zone.startX && player.x < zone.endX && player.y > zone.minY);
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
    ['wall-kick-shaft.png', 1900],
    ['checkpoint.png', 4480],
    ['neon-thorn-run.png', 6600],
    ['lantern-warden.png', wardenEngageX]
  ];
  const captured = new Set();
  let rightDown = false;
  let lastJump = 0;
  let lastSlash = 0;
  let lastShaftRecovery = 0;
  let lastRightRefresh = 0;
  let lastProgressX = 0;
  let lastProgressAt = Date.now();
  let highThornStaged = false;
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
    const now = Date.now();
    if (player.x >= wardenStopX && !current.wardenDefeated) await setRight(false);
    else await setRight(true);
    if (player.x > 7200) highThornStaged = true;
    if (!highThornStaged && player.x > 6680 && player.x < 6940 && player.y < 330 && !current.wardenDefeated) {
      await setRight(false);
      await page.keyboard.down('ArrowLeft');
      await page.keyboard.down('a');
      await page.waitForTimeout(180);
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.up('a');
      const braked = await state(page);
      if (braked.player?.onGround === true) {
        highThornStaged = true;
        await setRight(true);
        lastJump = Date.now();
        await jump(page, 680);
      } else {
        await page.waitForTimeout(120);
      }
      continue;
    }
    if (
      ((player.x > 6870 && player.x < 7045 && player.y > 90 && player.y < 210) ||
        (player.x > 7580 && player.x < 7755 && player.y > 160 && player.y < 290)) &&
      player.onGround
    ) {
      lastJump = now;
      await jump(page, 560);
      continue;
    }

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
                : player.x > 6880 && player.x < 7240
                  ? 560
                  : player.x > 7580 && player.x < 7860
                    ? 560
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
      const lead = hazard.type === 'fall-pit' ? 150 : hazard.type === 'timed-spark' ? 240 : hazard.type === 'neon-thorn' ? (hazard.y < 260 ? 145 : 330) : 120;
      const tail = hazard.type === 'fall-pit' ? hazard.width + 44 : hazard.width + 110;
      return player.x > hazard.x - lead && player.x < hazard.x + tail;
    });
    if (hazardAhead && (player.onGround || player.y > 365) && now - lastJump > 260) {
      lastJump = now;
      await jump(page, hazardAhead.type === 'fall-pit' ? 230 : hazardAhead.type === 'timed-spark' ? 390 : hazardAhead.type === 'neon-thorn' ? (hazardAhead.y < 260 ? 560 : 360) : 280);
    }
    const jumpNow =
      (player.x > 1320 && player.x < 1520 && player.y > 410) ||
      (player.x > 1500 && player.x < 2460 && player.y > 165) ||
      (player.x > 3920 && player.x < 4200 && player.y > 245) ||
      (player.x > 6080 && player.x < 7240 && player.y > 135) ||
      (player.x > 6880 && player.x < 7240 && player.y > 100) ||
      (player.x > 7580 && player.x < 7860 && player.y > 160);
    if (jumpNow && now - lastJump > 360) {
      lastJump = now;
      const assist = verticalAssistFor(player);
      await jump(page, assist ? assist.holdMs : player.x > 1500 && player.x < 2460 ? 430 : 180);
    }
    const enemyInReach = (current.enemies ?? []).some(
      (enemy) => enemy.visible !== false && !enemy.dead && Math.abs(enemy.x - player.x) < 260 && Math.abs(enemy.y - player.y) < 210
    );
    if (
        (enemyInReach ||
        (player.x > 760 && player.x < 1060) ||
        (player.x > 3300 && player.x < 3820) ||
        (player.x > 4400 && player.x < 5000) ||
        (player.x > 6660 && player.x < 7240) ||
        (player.x > 7280 && player.x < 7860) ||
        (player.x > wardenEngageX && !current.wardenDefeated)) &&
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

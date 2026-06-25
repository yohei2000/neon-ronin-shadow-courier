import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

export const qaDir = path.resolve('artifacts', 'qa');

export const requiredScreenshots = [
  'title.png',
  'controls.png',
  'settings.png',
  'stage-start.png',
  'movement-tutorial.png',
  'combat-encounter.png',
  'wall-kick-shaft.png',
  'checkpoint.png',
  'miniboss.png',
  'stage-clear.png',
  'mobile-controls-390x844.png'
];

export async function ensureQaDir() {
  await mkdir(qaDir, { recursive: true });
}

export async function startQaServer(port = 5317) {
  const server = await createServer({
    ...createInlineViteConfig(),
    logLevel: 'error',
    server: {
      host: '127.0.0.1',
      port,
      strictPort: false
    }
  });
  await server.listen();
  const address = server.httpServer?.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return {
    server,
    url: `http://127.0.0.1:${actualPort}/`
  };
}

export async function withBrowser(run, viewport = { width: 960, height: 540 }) {
  await ensureQaDir();
  const { server, url } = await startQaServer();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const capture = createConsoleCapture(page, viewport);
    await page.goto(url, { waitUntil: 'networkidle' });
    await run({ page, browser, context, url, capture });
    return capture;
  } finally {
    await browser.close();
    await server.close();
  }
}

export function createConsoleCapture(page, viewport) {
  const capture = {
    errors: [],
    warnings: [],
    pageErrors: [],
    failedRequests: [],
    viewport,
    userAgent: ''
  };
  page.on('console', (message) => {
    const entry = { type: message.type(), text: message.text() };
    if (message.type() === 'error') capture.errors.push(entry);
    if (message.type() === 'warning') capture.warnings.push(entry);
  });
  page.on('pageerror', (error) => {
    capture.pageErrors.push({ message: error.message, stack: error.stack ?? '' });
  });
  page.on('requestfailed', (request) => {
    capture.failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText ?? 'unknown'
    });
  });
  return capture;
}

export async function finalizeConsoleReport(page, capture) {
  capture.userAgent = await page.evaluate(() => navigator.userAgent);
  await writeJson('console-report.json', capture);
  if (capture.errors.length || capture.pageErrors.length || capture.failedRequests.length) {
    throw new Error(`Console quality failed: ${capture.errors.length} console errors, ${capture.pageErrors.length} page errors, ${capture.failedRequests.length} failed requests.`);
  }
}

export async function writeJson(name, data) {
  await ensureQaDir();
  await writeFile(path.join(qaDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function clickGame(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas not found.');
  await page.mouse.click(box.x + (x / 960) * box.width, box.y + (y / 540) * box.height);
}

export async function holdGame(page, x, y, duration = 400) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas not found.');
  const px = box.x + (x / 960) * box.width;
  const py = box.y + (y / 540) * box.height;
  const canvas = page.locator('canvas');
  await page.mouse.move(px, py);
  await page.mouse.down();
  await page.waitForTimeout(duration);
  await page.mouse.up();
  return;
  try {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: px, y: py, radiusX: 18, radiusY: 18, force: 1, id: 11 }]
    });
    await page.waitForTimeout(duration);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await session.detach();
    return;
  } catch {
    // Fall through to DOM pointer events in non-Chromium contexts.
  }
  const eventBase = {
    pointerId: 7,
    pointerType: 'touch',
    isPrimary: true,
    clientX: px,
    clientY: py,
    screenX: px,
    screenY: py,
    button: 0,
    buttons: 1,
    bubbles: true,
    cancelable: true
  };
  await canvas.dispatchEvent('pointerdown', eventBase);
  await page.waitForTimeout(duration);
  await canvas.dispatchEvent('pointerup', { ...eventBase, buttons: 0 });
}

export async function screenshotGame(page, name) {
  await ensureQaDir();
  await page.screenshot({ path: path.join(qaDir, name), fullPage: true });
}

export async function scene(page) {
  return page.evaluate(() => document.body.dataset.scene ?? '');
}

export async function qaState(page) {
  return page.evaluate(() => window.__NEON_RONIN_QA__ ?? null);
}

export async function waitForScene(page, expected, timeout = 10000) {
  await page.waitForFunction((sceneName) => document.body.dataset.scene === sceneName, expected, { timeout });
}

export async function waitForQa(page, predicateSource, timeout = 10000) {
  await page.waitForFunction(predicateSource, null, { timeout });
}

export async function startStageFromTitle(page) {
  await waitForScene(page, 'TitleScene');
  await clickGame(page, 480, 246);
  await waitForScene(page, 'Stage1Scene');
  await page.waitForFunction(() => Boolean(window.__NEON_RONIN_QA__));
}

async function setKey(page, key, down) {
  if (down) await page.keyboard.down(key);
  else await page.keyboard.up(key);
}

async function tap(page, key, delay = 80) {
  await page.keyboard.down(key);
  await page.waitForTimeout(delay);
  await page.keyboard.up(key);
}

export async function keyboardClearRoute(page, options = {}) {
  const milestones = new Set();
  const capture = options.captureScreenshot;
  const stopWhen = options.stopWhen;
  const started = Date.now();
  let rightDown = false;
  let leftDown = false;
  let attackCooldown = 0;
  let jumpCooldown = 0;

  const maybeShot = async (name, condition) => {
    if (!capture || milestones.has(name) || !condition) return;
    milestones.add(name);
    await screenshotGame(page, `${name}.png`);
  };

  while (Date.now() - started < 125000) {
    const currentScene = await scene(page);
    if (currentScene === 'StageClearScene') {
      await maybeShot('stage-clear', true);
      await setKey(page, 'ArrowRight', false);
      await setKey(page, 'ArrowLeft', false);
      return { cleared: true, elapsedMs: Date.now() - started, milestones: [...milestones] };
    }
    if (currentScene !== 'Stage1Scene') {
      await page.waitForTimeout(120);
      continue;
    }
    const qa = await qaState(page);
    if (!qa) {
      await page.waitForTimeout(80);
      continue;
    }
    if (stopWhen?.(qa)) {
      await setKey(page, 'ArrowRight', false);
      await setKey(page, 'ArrowLeft', false);
      return {
        cleared: false,
        stopped: true,
        elapsedMs: Date.now() - started,
        milestones: [...milestones],
        state: qa
      };
    }

    await maybeShot('stage-start', qa.player.x < 260);
    await maybeShot('movement-tutorial', qa.player.x > 320 && qa.player.x < 740);
    await maybeShot('combat-encounter', qa.player.x > 900 && qa.player.x < 1320);
    await maybeShot('wall-kick-shaft', qa.sectionId === 'wall-kick-sign-shaft');
    await maybeShot('checkpoint', qa.checkpointIndex >= 1);
    await maybeShot('miniboss', qa.minibossActive);

    let wantRight = true;
    let wantLeft = false;
    const x = qa.player.x;

    if (qa.minibossActive && !qa.minibossDefeated) {
      wantRight = x < 6380;
      wantLeft = x > 6450;
    }
    if (qa.minibossDefeated) {
      wantRight = true;
      wantLeft = false;
    }

    if (rightDown !== wantRight) {
      rightDown = wantRight;
      await setKey(page, 'ArrowRight', rightDown);
    }
    if (leftDown !== wantLeft) {
      leftDown = wantLeft;
      await setKey(page, 'ArrowLeft', leftDown);
    }

    const now = Date.now();
    const shouldJump =
      (x > 1500 && x < 2360) ||
      (x > 2460 && x < 3350) ||
      (x > 4240 && x < 5750) ||
      (qa.minibossActive && !qa.minibossDefeated && now % 1200 < 260);
    if (shouldJump && now >= jumpCooldown) {
      jumpCooldown = now + (x > 1500 && x < 2360 ? 240 : 520);
      await tap(page, 'Space', x > 1500 && x < 2360 ? 90 : 105);
    }

    const shouldAttack =
      (x > 930 && x < 1250) ||
      (x > 2920 && x < 3150) ||
      (x > 3480 && x < 3720) ||
      (x > 4800 && x < 5000) ||
      (x > 5420 && x < 5620) ||
      (qa.minibossActive && !qa.minibossDefeated);
    if (shouldAttack && now >= attackCooldown) {
      attackCooldown = now + 330;
      await tap(page, 'z', 65);
    }

    await page.waitForTimeout(70);
  }

  await setKey(page, 'ArrowRight', false);
  await setKey(page, 'ArrowLeft', false);
  const qa = await qaState(page);
  throw new Error(`Keyboard route timed out at ${JSON.stringify(qa)}`);
}

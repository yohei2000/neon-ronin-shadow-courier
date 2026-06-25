import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
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

export async function sampleGamePixel(page, x, y) {
  const viewport = page.viewportSize() ?? { width: 960, height: 540 };
  const screenshot = await page.screenshot({ fullPage: false });
  const image = decodePng(screenshot);
  const pixelX = Math.max(0, Math.min(image.width - 1, Math.round((x / 960) * viewport.width)));
  const pixelY = Math.max(0, Math.min(image.height - 1, Math.round((y / 540) * viewport.height)));
  const offset = (pixelY * image.width + pixelX) * 4;
  return {
    r: image.pixels[offset],
    g: image.pixels[offset + 1],
    b: image.pixels[offset + 2],
    a: image.pixels[offset + 3],
    x: pixelX,
    y: pixelY,
    width: image.width,
    height: image.height
  };
}

export async function findBrightGamePixel(page, area) {
  const viewport = page.viewportSize() ?? { width: 960, height: 540 };
  const screenshot = await page.screenshot({ fullPage: false });
  const image = decodePng(screenshot);
  const startX = Math.max(0, Math.min(image.width - 1, Math.round((area.x / 960) * viewport.width)));
  const endX = Math.max(startX, Math.min(image.width - 1, Math.round(((area.x + area.width) / 960) * viewport.width)));
  const startY = Math.max(0, Math.min(image.height - 1, Math.round((area.y / 540) * viewport.height)));
  const endY = Math.max(startY, Math.min(image.height - 1, Math.round(((area.y + area.height) / 540) * viewport.height)));
  const step = Math.max(1, area.step ?? 2);
  let best = { r: 0, g: 0, b: 0, a: 0, x: startX, y: startY, width: image.width, height: image.height, score: 0 };
  for (let pixelY = startY; pixelY <= endY; pixelY += step) {
    for (let pixelX = startX; pixelX <= endX; pixelX += step) {
      const offset = (pixelY * image.width + pixelX) * 4;
      const r = image.pixels[offset];
      const g = image.pixels[offset + 1];
      const b = image.pixels[offset + 2];
      const a = image.pixels[offset + 3];
      const score = r + g + b;
      if (score > best.score) {
        best = { r, g, b, a, x: pixelX, y: pixelY, width: image.width, height: image.height, score };
      }
    }
  }
  return best;
}

function decodePng(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Screenshot was not a PNG image.');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`Unsupported PNG format: bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace}`);
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += length + 12;
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const inflated = inflateSync(Buffer.concat(idat));
  const stride = width * bytesPerPixel;
  const raw = Buffer.alloc(height * stride);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source];
    source += 1;
    for (let x = 0; x < stride; x += 1) {
      const current = inflated[source + x];
      const left = x >= bytesPerPixel ? raw[y * stride + x - bytesPerPixel] : 0;
      const up = y > 0 ? raw[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? raw[(y - 1) * stride + x - bytesPerPixel] : 0;
      raw[y * stride + x] = unfilter(filter, current, left, up, upLeft);
    }
    source += stride;
  }

  const pixels = Buffer.alloc(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const sourceOffset = pixel * bytesPerPixel;
    const targetOffset = pixel * 4;
    pixels[targetOffset] = raw[sourceOffset];
    pixels[targetOffset + 1] = raw[sourceOffset + 1];
    pixels[targetOffset + 2] = raw[sourceOffset + 2];
    pixels[targetOffset + 3] = colorType === 6 ? raw[sourceOffset + 3] : 255;
  }
  return { width, height, pixels };
}

function unfilter(filter, value, left, up, upLeft) {
  if (filter === 0) return value;
  if (filter === 1) return (value + left) & 255;
  if (filter === 2) return (value + up) & 255;
  if (filter === 3) return (value + Math.floor((left + up) / 2)) & 255;
  if (filter === 4) return (value + paeth(left, up, upLeft)) & 255;
  throw new Error(`Unsupported PNG filter: ${filter}`);
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
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
  let minibossStartedAt = null;

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
    if (qa.player.hp <= 0) {
      await setKey(page, 'ArrowRight', false);
      await setKey(page, 'ArrowLeft', false);
      throw new Error(`Keyboard route player died at ${JSON.stringify(qa)}`);
    }
    if (qa.minibossActive && !qa.minibossDefeated && minibossStartedAt === null) {
      minibossStartedAt = qa.elapsedMs;
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
    await maybeShot('miniboss', qa.sectionId === 'lantern-warden-encounter' && qa.player.x > 6000);

    let wantRight = true;
    let wantLeft = false;
    const x = qa.player.x;

    const bossElapsed = minibossStartedAt === null ? 0 : qa.elapsedMs - minibossStartedAt;
    const bossPhase = bossElapsed >= 650 ? (bossElapsed - 900 + 1800) % 1800 : 900;
    const bossRetreatWindow = qa.minibossActive && !qa.minibossDefeated && (bossPhase < 700 || bossPhase > 1450);

    if (qa.minibossActive && !qa.minibossDefeated) {
      if (bossRetreatWindow) {
        wantRight = false;
        wantLeft = x > 6285;
      } else {
        wantRight = x < 6375 || (x <= 6460 && qa.player.facing < 0);
        wantLeft = x > 6390;
      }
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
    const forcedHazardJump =
      (x > 4560 && x < 4790) ||
      (x > 5250 && x < 5480) ||
      (x > 5620 && x < 5820);
    const shouldJump =
      (x > 1500 && x < 2360) ||
      (x > 2460 && x < 3350) ||
      (x > 4240 && x < 5750) ||
      forcedHazardJump ||
      (bossRetreatWindow && x > 6335 && now % 1600 < 220);
    if (shouldJump && (now >= jumpCooldown || forcedHazardJump)) {
      jumpCooldown = now + (x > 1500 && x < 2360 ? 240 : forcedHazardJump ? 180 : 520);
      await tap(page, 'Space', x > 1500 && x < 2360 ? 90 : 105);
    }

    const shouldAttack =
      (x > 930 && x < 1250) ||
      (x > 2920 && x < 3150) ||
      (x > 3480 && x < 3720) ||
      (x > 4800 && x < 5000) ||
      (x > 5420 && x < 5620) ||
      (qa.minibossActive && !qa.minibossDefeated && !bossRetreatWindow && x > 6365 && x < 6555);
    if (shouldAttack && now >= attackCooldown) {
      if (qa.minibossActive && !qa.minibossDefeated) {
        const shouldFaceRight = x <= 6460;
        const facingAway = shouldFaceRight ? qa.player.facing < 0 : qa.player.facing > 0;
        if (facingAway) {
          if (leftDown !== !shouldFaceRight) {
            leftDown = !shouldFaceRight;
            await setKey(page, 'ArrowLeft', leftDown);
          }
          if (rightDown !== shouldFaceRight) {
            rightDown = shouldFaceRight;
            await setKey(page, 'ArrowRight', rightDown);
          }
          await page.waitForTimeout(120);
        }
      }
      attackCooldown = now + (qa.minibossActive && !qa.minibossDefeated ? 285 : 330);
      await tap(page, 'z', 65);
    }

    await page.waitForTimeout(70);
  }

  await setKey(page, 'ArrowRight', false);
  await setKey(page, 'ArrowLeft', false);
  const qa = await qaState(page);
  throw new Error(`Keyboard route timed out at ${JSON.stringify(qa)}`);
}

import { chromium } from '@playwright/test';
import {
  clickGame,
  createConsoleCapture,
  ensureQaDir,
  qaState,
  startQaServer,
  startStageFromTitle,
  waitForScene,
  writeJson
} from './qa-browser.mjs';

await ensureQaDir();
const startedAt = Date.now();
const report = {
  valid: false,
  startedAt: new Date().toISOString(),
  tests: [],
  credits: null,
  gameOver: null
};

function addTest(name, status, details = {}) {
  report.tests.push({ name, status, ...details });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const { server, url } = await startQaServer(5326);
const browser = await chromium.launch();
const captures = [];

try {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();
  const capture = createConsoleCapture(page, { width: 960, height: 540 });
  captures.push(capture);
  await page.goto(url, { waitUntil: 'networkidle' });
  capture.userAgent = await page.evaluate(() => navigator.userAgent);

  await waitForScene(page, 'TitleScene');
  await clickGame(page, 480, 357);
  await waitForScene(page, 'CreditsScene');
  addTest('flow/title-to-credits', 'PASS');
  await clickGame(page, 480, 467);
  await waitForScene(page, 'TitleScene');
  report.credits = { titleCreditsRoundTrip: true };
  addTest('flow/credits-to-title', 'PASS', report.credits);

  await startStageFromTitle(page);
  const gameOverProbe = await triggerGameOver(page);
  await waitForScene(page, 'GameOverScene');
  report.gameOver = gameOverProbe;
  addTest('flow/stage-to-game-over-by-damage', 'PASS', gameOverProbe);
  await clickGame(page, 480, 322);
  await waitForScene(page, 'TitleScene');
  addTest('flow/game-over-to-title', 'PASS');

  const combined = {
    errors: captures.flatMap((item) => item.errors),
    warnings: captures.flatMap((item) => item.warnings),
    pageErrors: captures.flatMap((item) => item.pageErrors),
    failedRequests: captures.flatMap((item) => item.failedRequests),
    viewport: captures.map((item) => item.viewport),
    userAgent: captures.map((item) => item.userAgent)
  };
  report.console = combined;
  if (combined.errors.length || combined.pageErrors.length || combined.failedRequests.length) {
    throw new Error(`Flow QA console failed: ${combined.errors.length} console errors, ${combined.pageErrors.length} page errors, ${combined.failedRequests.length} failed requests.`);
  }
  report.valid = true;
  await context.close();
} catch (error) {
  report.valid = false;
  addTest('flow-qa-run', 'FAIL', { message: error instanceof Error ? error.message : String(error) });
  await writeJson('flow-report.json', report);
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - startedAt;
  await writeJson('flow-report.json', report);
  await browser.close();
  await server.close();
}

console.log(`qa:flow PASS ${JSON.stringify({ durationMs: report.durationMs, tests: report.tests.length })}`);

async function triggerGameOver(page) {
  const started = Date.now();
  let rightDown = false;
  let leftDown = false;
  const setRight = async (down) => {
    if (rightDown === down) return;
    rightDown = down;
    if (down) await page.keyboard.down('ArrowRight');
    else await page.keyboard.up('ArrowRight');
  };
  const setLeft = async (down) => {
    if (leftDown === down) return;
    leftDown = down;
    if (down) await page.keyboard.down('ArrowLeft');
    else await page.keyboard.up('ArrowLeft');
  };

  try {
    while (Date.now() - started < 24000) {
      const scene = await page.evaluate(() => document.body.dataset.scene ?? '');
      if (scene === 'GameOverScene') {
        return { reached: true, durationMs: Date.now() - started, method: 'first-crawler-contact' };
      }
      const qa = await qaState(page);
      if (!qa) {
        await page.waitForTimeout(100);
        continue;
      }
      const targetX = 1120;
      await setRight(qa.player.x < targetX - 18);
      await setLeft(qa.player.x > targetX + 28);
      await page.waitForTimeout(90);
    }
  } finally {
    await setRight(false);
    await setLeft(false);
  }
  throw new Error(`GameOver flow did not trigger within timeout: ${JSON.stringify(await qaState(page))}`);
}

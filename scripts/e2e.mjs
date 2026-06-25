import { chromium } from '@playwright/test';
import {
  clickGame,
  createConsoleCapture,
  ensureQaDir,
  finalizeConsoleReport,
  holdGame,
  keyboardClearRoute,
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
  route: 'Title -> Controls -> Settings -> Stage 1 -> keyboard clear -> mobile control probes',
  clear: null,
  mobile: null
};

function addTest(name, status, details = {}) {
  report.tests.push({ name, status, ...details });
}

const { server, url } = await startQaServer(5321);
const browser = await chromium.launch();
const captures = [];

try {
  const desktop = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await desktop.newPage();
  const desktopCapture = createConsoleCapture(page, { width: 960, height: 540 });
  captures.push(desktopCapture);
  await page.goto(url, { waitUntil: 'networkidle' });
  desktopCapture.userAgent = await page.evaluate(() => navigator.userAgent);

  await waitForScene(page, 'TitleScene');
  addTest('title-flow/title-visible', 'PASS');
  await clickGame(page, 480, 283);
  await waitForScene(page, 'ControlsScene');
  addTest('title-flow/controls-opens', 'PASS');
  await clickGame(page, 480, 470);
  await waitForScene(page, 'TitleScene');
  await clickGame(page, 480, 320);
  await waitForScene(page, 'SettingsScene');
  addTest('title-flow/settings-opens', 'PASS');
  await clickGame(page, 480, 287);
  const highContrastSaved = await page.evaluate(() => {
    const raw = window.localStorage.getItem('neon-ronin-shadow-courier-save');
    return raw ? JSON.parse(raw).settings?.highContrast === true : false;
  });
  if (!highContrastSaved) {
    throw new Error('High contrast setting did not persist after toggling.');
  }
  addTest('settings/high-contrast-toggle', 'PASS');
  await clickGame(page, 480, 419);
  await waitForScene(page, 'TitleScene');

  await startStageFromTitle(page);
  addTest('title-flow/start-stage', 'PASS');
  const clear = await keyboardClearRoute(page);
  await waitForScene(page, 'StageClearScene');
  const clearState = await page.evaluate(() => window.__NEON_RONIN_CLEAR__ ?? null);
  if (!clearState || !clearState.rank || typeof clearState.elapsedMs !== 'number') {
    throw new Error('Stage clear QA state is missing rank/time data.');
  }
  report.clear = { ...clear, result: clearState };
  addTest('stage1-keyboard-clear', 'PASS', report.clear);
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobile.newPage();
  const mobileCapture = createConsoleCapture(mobilePage, { width: 390, height: 844 });
  captures.push(mobileCapture);
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  mobileCapture.userAgent = await mobilePage.evaluate(() => navigator.userAgent);
  await startStageFromTitle(mobilePage);
  const initial = await qaState(mobilePage);
  if (!initial?.mobileControlsVisible) {
    throw new Error('Mobile controls are not visible in 390x844 viewport.');
  }
  await holdGame(mobilePage, 168, 452, 700);
  const afterRight = await qaState(mobilePage);
  if (!afterRight || afterRight.player.x <= initial.player.x + 8) {
    throw new Error('Mobile right button did not move player right.');
  }
  await holdGame(mobilePage, 725, 450, 220);
  await mobilePage.waitForFunction(
    (beforeY) => {
      const qa = window.__NEON_RONIN_QA__;
      return qa && qa.player.y < beforeY - 4;
    },
    afterRight.player.y,
    { timeout: 2500 }
  );
  await holdGame(mobilePage, 836, 436, 90);
  await mobilePage.waitForFunction(() => window.__NEON_RONIN_QA__?.player.attackActive === true, null, { timeout: 1200 });
  const afterAttack = await qaState(mobilePage);
  report.mobile = {
    visible: true,
    startX: initial.player.x,
    afterRightX: afterRight.player.x,
    attackActive: afterAttack?.player.attackActive === true
  };
  addTest('mobile-controls', 'PASS', report.mobile);
  await mobile.close();

  const combined = {
    errors: captures.flatMap((capture) => capture.errors),
    warnings: captures.flatMap((capture) => capture.warnings),
    pageErrors: captures.flatMap((capture) => capture.pageErrors),
    failedRequests: captures.flatMap((capture) => capture.failedRequests),
    viewport: captures.map((capture) => capture.viewport),
    userAgent: captures.map((capture) => capture.userAgent)
  };
  await writeJson('console-report.json', combined);
  if (combined.errors.length || combined.pageErrors.length || combined.failedRequests.length) {
    throw new Error(`Console quality failed: ${combined.errors.length} console errors, ${combined.pageErrors.length} page errors, ${combined.failedRequests.length} failed requests.`);
  }
  report.valid = true;
} catch (error) {
  report.valid = false;
  addTest('e2e-run', 'FAIL', { message: error instanceof Error ? error.message : String(error) });
  await writeJson('e2e-report.json', report);
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - startedAt;
  await writeJson('e2e-report.json', report);
  await browser.close();
  await server.close();
}

console.log(`e2e PASS ${JSON.stringify({ durationMs: report.durationMs, tests: report.tests.length })}`);

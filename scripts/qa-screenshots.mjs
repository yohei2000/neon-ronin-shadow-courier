import { chromium } from '@playwright/test';
import {
  clickGame,
  createConsoleCapture,
  ensureQaDir,
  keyboardClearRoute,
  screenshotGame,
  startQaServer,
  startStageFromTitle,
  waitForScene,
  writeJson
} from './qa-browser.mjs';
import { writeAcceptanceReport } from './qa-report.mjs';

await ensureQaDir();
const { server, url } = await startQaServer(5331);
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
  await screenshotGame(page, 'title.png');

  await clickGame(page, 480, 283);
  await waitForScene(page, 'ControlsScene');
  await screenshotGame(page, 'controls.png');
  await clickGame(page, 480, 470);
  await waitForScene(page, 'TitleScene');

  await clickGame(page, 480, 320);
  await waitForScene(page, 'SettingsScene');
  await screenshotGame(page, 'settings.png');
  await clickGame(page, 480, 419);
  await waitForScene(page, 'TitleScene');

  await startStageFromTitle(page);
  await keyboardClearRoute(page, { captureScreenshot: true });
  await waitForScene(page, 'StageClearScene');
  await screenshotGame(page, 'stage-clear.png');
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
  await mobilePage.waitForFunction(() => window.__NEON_RONIN_QA__?.mobileControlsVisible === true, null, { timeout: 5000 });
  await screenshotGame(mobilePage, 'mobile-controls-390x844.png');
  await mobile.close();

  const combined = {
    errors: captures.flatMap((capture) => capture.errors),
    warnings: captures.flatMap((capture) => capture.warnings),
    pageErrors: captures.flatMap((capture) => capture.pageErrors),
    failedRequests: captures.flatMap((capture) => capture.failedRequests),
    viewport: captures.map((capture) => capture.viewport),
    userAgent: captures.map((capture) => capture.userAgent)
  };
  await writeJson('screenshot-console-report.json', combined);
  if (combined.errors.length || combined.pageErrors.length || combined.failedRequests.length) {
    throw new Error(`Screenshot console quality failed: ${combined.errors.length} console errors, ${combined.pageErrors.length} page errors, ${combined.failedRequests.length} failed requests.`);
  }
  await writeAcceptanceReport({
    commands: [{ name: 'npm run qa:screenshots', status: 'PASS' }],
    consoleClean: true,
    readmeUpdated: false
  });
} finally {
  await browser.close();
  await server.close();
}

console.log('qa:screenshots PASS');

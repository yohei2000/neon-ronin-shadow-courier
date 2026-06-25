import { chromium } from '@playwright/test';
import {
  clickGame,
  createConsoleCapture,
  ensureQaDir,
  keyboardClearRoute,
  qaState,
  startQaServer,
  startStageFromTitle,
  waitForScene,
  writeJson
} from './qa-browser.mjs';

const saveKey = 'neon-ronin-shadow-courier-save';

await ensureQaDir();
const startedAt = Date.now();
const report = {
  valid: false,
  startedAt: new Date().toISOString(),
  tests: [],
  corruptedRecovery: null,
  settingsPersistence: null,
  stageClearPersistence: null
};

function addTest(name, status, details = {}) {
  report.tests.push({ name, status, ...details });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const { server, url } = await startQaServer(5324);
const browser = await chromium.launch();
const captures = [];

try {
  const recoveryContext = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await recoveryContext.addInitScript((key) => {
    if (!window.sessionStorage.getItem('neon-ronin-corrupt-save-seeded')) {
      window.localStorage.setItem(key, '{not-json');
      window.sessionStorage.setItem('neon-ronin-corrupt-save-seeded', '1');
    }
  }, saveKey);
  const recoveryPage = await recoveryContext.newPage();
  const recoveryCapture = createConsoleCapture(recoveryPage, { width: 960, height: 540 });
  captures.push(recoveryCapture);
  await recoveryPage.goto(url, { waitUntil: 'networkidle' });
  recoveryCapture.userAgent = await recoveryPage.evaluate(() => navigator.userAgent);
  await waitForScene(recoveryPage, 'TitleScene');
  addTest('save/corrupted-json-boots-title', 'PASS');
  await clickGame(recoveryPage, 480, 320);
  await waitForScene(recoveryPage, 'SettingsScene');
  await clickGame(recoveryPage, 480, 287);
  const repairedSave = await readSave(recoveryPage);
  assert(repairedSave?.schemaVersion === 1, 'Settings update did not repair save schema version after corrupted JSON.');
  assert(repairedSave?.settings?.highContrast === true, 'High contrast setting did not persist after corrupted-save recovery.');
  assert(repairedSave?.stage1?.cleared === false, 'Corrupted-save recovery should not mark Stage 1 cleared.');
  await recoveryPage.reload({ waitUntil: 'networkidle' });
  await waitForScene(recoveryPage, 'TitleScene');
  const reloadedRecoveredSave = await readSave(recoveryPage);
  assert(reloadedRecoveredSave?.settings?.highContrast === true, 'Recovered settings did not survive reload.');
  report.corruptedRecovery = {
    sceneAfterBoot: 'TitleScene',
    repairedSchemaVersion: repairedSave.schemaVersion,
    highContrast: reloadedRecoveredSave.settings.highContrast,
    cleared: reloadedRecoveredSave.stage1.cleared
  };
  report.settingsPersistence = {
    highContrast: reloadedRecoveredSave.settings.highContrast,
    touchUiMode: reloadedRecoveredSave.settings.touchUiMode,
    touchUiOpacity: reloadedRecoveredSave.settings.touchUiOpacity
  };
  addTest('save/settings-persist-after-reload', 'PASS', report.settingsPersistence);
  await recoveryContext.close();

  const clearContext = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const clearPage = await clearContext.newPage();
  const clearCapture = createConsoleCapture(clearPage, { width: 960, height: 540 });
  captures.push(clearCapture);
  await clearPage.goto(url, { waitUntil: 'networkidle' });
  clearCapture.userAgent = await clearPage.evaluate(() => navigator.userAgent);
  await startStageFromTitle(clearPage);
  const start = await qaState(clearPage);
  assert(start?.stageClear === false, 'Stage should not start in clear state.');
  const clear = await keyboardClearRoute(clearPage);
  await waitForScene(clearPage, 'StageClearScene');
  const clearState = await clearPage.evaluate(() => window.__NEON_RONIN_CLEAR__ ?? null);
  const clearSave = await readSave(clearPage);
  assert(clear.cleared === true, 'Keyboard clear route did not reach StageClearScene.');
  assert(clearState?.rank, 'Stage clear QA state is missing rank.');
  assert(clearSave?.stage1?.cleared === true, 'Stage clear did not mark Stage 1 cleared in localStorage.');
  assert(typeof clearSave.stage1.bestTimeMs === 'number' && clearSave.stage1.bestTimeMs > 0, 'Stage clear did not save a positive best time.');
  assert(clearSave.stage1.bestRank === clearState.rank, 'Saved best rank does not match clear result rank.');
  assert(Array.isArray(clearSave.stage1.scrolls), 'Saved scroll list is not an array.');
  await clearPage.reload({ waitUntil: 'networkidle' });
  await waitForScene(clearPage, 'TitleScene');
  const persistedClearSave = await readSave(clearPage);
  assert(persistedClearSave?.stage1?.cleared === true, 'Stage clear save did not survive reload.');
  assert(persistedClearSave.stage1.bestTimeMs === clearSave.stage1.bestTimeMs, 'Best time changed after reload.');
  report.stageClearPersistence = {
    elapsedMs: clearState.elapsedMs,
    rank: clearState.rank,
    savedBestTimeMs: persistedClearSave.stage1.bestTimeMs,
    savedBestRank: persistedClearSave.stage1.bestRank,
    savedScrolls: persistedClearSave.stage1.scrolls.length,
    savedCleared: persistedClearSave.stage1.cleared
  };
  addTest('save/stage-clear-persists-after-reload', 'PASS', report.stageClearPersistence);
  await clearContext.close();

  const combined = {
    errors: captures.flatMap((capture) => capture.errors),
    warnings: captures.flatMap((capture) => capture.warnings),
    pageErrors: captures.flatMap((capture) => capture.pageErrors),
    failedRequests: captures.flatMap((capture) => capture.failedRequests),
    viewport: captures.map((capture) => capture.viewport),
    userAgent: captures.map((capture) => capture.userAgent)
  };
  report.console = combined;
  if (combined.errors.length || combined.pageErrors.length || combined.failedRequests.length) {
    throw new Error(`Save QA console failed: ${combined.errors.length} console errors, ${combined.pageErrors.length} page errors, ${combined.failedRequests.length} failed requests.`);
  }
  report.valid = true;
} catch (error) {
  report.valid = false;
  addTest('save-qa-run', 'FAIL', { message: error instanceof Error ? error.message : String(error) });
  await writeJson('save-report.json', report);
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - startedAt;
  await writeJson('save-report.json', report);
  await browser.close();
  await server.close();
}

console.log(`qa:save PASS ${JSON.stringify({ durationMs: report.durationMs, tests: report.tests.length })}`);

async function readSave(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, saveKey);
}

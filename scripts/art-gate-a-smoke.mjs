import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';
import { ensureDir, rootDir, writeJson } from './art-lib.mjs';

const reportPath = path.join(rootDir, 'art', 'reviews', 'gate-a', 'browser-smoke-report.json');
const screenshotPath = path.join(rootDir, 'art', 'reviews', 'gate-a', 'gate-a-viewer-960x540.png');
const errors = [];
const failedRequests = [];

await ensureDir(path.dirname(reportPath));

const server = await createServer({
  ...createInlineViteConfig(),
  server: {
    host: '127.0.0.1',
    port: 0
  },
  logLevel: 'silent'
});

await server.listen();
const address = server.httpServer?.address();
if (!address || typeof address === 'string') {
  throw new Error('Could not determine Vite smoke server address.');
}

const url = `http://127.0.0.1:${address.port}/`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__NEON_RONIN_ART_LOCK__?.scene === 'GateAReviewScene', null, { timeout: 30000 });
  const qa = await page.evaluate(() => window.__NEON_RONIN_ART_LOCK__);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const report = {
    generatedAt: new Date().toISOString(),
    url,
    screenshot: path.relative(rootDir, screenshotPath).replaceAll('\\', '/'),
    qa,
    consoleErrors: errors,
    failedRequests,
    valid:
      qa?.scene === 'GateAReviewScene' &&
      qa?.gateAApproval === 'PENDING_HUMAN_APPROVAL' &&
      qa?.finalProductionRuntime === false &&
      errors.length === 0 &&
      failedRequests.length === 0
  };

  await writeJson(reportPath, report);
  if (!report.valid) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`art:gate-a-smoke PASS ${JSON.stringify({ screenshot: report.screenshot })}`);
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
  const report = {
    generatedAt: new Date().toISOString(),
    url,
    screenshot: null,
    qa: null,
    consoleErrors: errors,
    failedRequests,
    valid: false
  };
  await writeJson(reportPath, report);
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
  try {
    await fs.access(reportPath);
  } catch {
    await writeJson(reportPath, {
      generatedAt: new Date().toISOString(),
      url,
      consoleErrors: errors,
      failedRequests,
      valid: false
    });
  }
}

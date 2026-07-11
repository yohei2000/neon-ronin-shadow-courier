import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const outputDir = path.resolve('artifacts', 'stage1', 'continuous-background-v4-single-master', 'runtime-alignment');
fs.mkdirSync(outputDir, { recursive: true });

const stage = JSON.parse(fs.readFileSync(path.resolve('src', 'data', 'stage1Content.json'), 'utf8'));
const preferredPort = 5176;
const server = await createServer({
  ...createInlineViteConfig(),
  server: { host: '127.0.0.1', port: preferredPort }
});

await server.listen();
const address = server.httpServer?.address();
const actualPort = typeof address === 'object' && address ? address.port : preferredPort;
const baseUrl = `http://127.0.0.1:${actualPort}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const waitFor = async (predicate, timeoutMs = 15000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for Stage1 terrain review state');
};

const captures = [
  { id: '01-rain-lantern-start', centerX: 800 },
  { id: 'join-01-rain-lantern-to-neon-sign', centerX: 1600 },
  { id: '02-neon-sign-run', centerX: 2400 },
  { id: 'join-02-neon-sign-to-rooftop', centerX: 3200 },
  { id: '03-rooftop-hazard-line', centerX: 4400 },
  { id: 'join-03-rooftop-to-neon-thorn', centerX: 5600 },
  { id: '04-neon-thorn-climb', centerX: 6750 },
  { id: 'join-04-neon-thorn-to-warden-gate', centerX: 7900 },
  { id: '05-lantern-warden-gate', centerX: 9000 }
];

try {
  await page.goto(`${baseUrl}/?scene=stage1&debug=collision&showCollisionRects=1`);
  await waitFor(async () => {
    const state = await page.evaluate(() => window.__NEON_RONIN_STAGE1__ ?? {});
    return state.scene === 'Stage1Scene' && state.visualTerrain?.plates === 5;
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const game = window.__NEON_RONIN_GAME__;
    const scene = game?.scene?.getScene?.('Stage1Scene');
    if (scene) scene.paused = true;
  });

  for (const capture of captures) {
    const scrollX = Math.max(0, Math.min(stage.worldWidth - 960, capture.centerX - 480));
    await page.evaluate(({ scrollX }) => {
      const game = window.__NEON_RONIN_GAME__;
      const scene = game?.scene?.getScene?.('Stage1Scene');
      const camera = scene?.cameras?.main;
      camera?.setScroll?.(scrollX, 0);
    }, { scrollX });
    await page.waitForTimeout(180);
    await page.screenshot({ path: path.join(outputDir, `${capture.id}-collision.png`) });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    viewport: { width: 960, height: 540 },
    captures,
    consoleErrors,
    passed: consoleErrors.length === 0
  };
  fs.writeFileSync(path.join(outputDir, 'runtime-alignment-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed) throw new Error(`Console errors: ${consoleErrors.join('\n')}`);
  console.log(`qa:terrain-stage1 PASS ${captures.length} screenshots, console clean`);
} finally {
  await page.close();
  await browser.close();
  await server.close();
}

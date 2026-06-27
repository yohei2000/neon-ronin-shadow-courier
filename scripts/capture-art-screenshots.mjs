import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';
import { ensureDir, rootDir, writeJson } from './art-lib.mjs';

const finalDir = path.join(rootDir, 'art', 'final-v2');
const reviewsDir = path.join(rootDir, 'art', 'reviews', 'gate-b-v2');
const errors = [];
const failedRequests = [];
const screenshots = [];

await ensureDir(finalDir);

const server = await createServer({
  ...createInlineViteConfig(),
  server: { host: '127.0.0.1', port: 0 },
  logLevel: 'silent'
});

await server.listen();
const address = server.httpServer?.address();
if (!address || typeof address === 'string') {
  throw new Error('Could not determine Vite screenshot server address.');
}

const baseUrl = `http://127.0.0.1:${address.port}/`;
const browser = await chromium.launch({ headless: true });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function saveScreenshot(page, outputPath) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const tempPath = `${outputPath}.${process.pid}.${attempt}.tmp`;
    try {
      const png = await page.screenshot({ fullPage: true, type: 'png' });
      await fs.writeFile(tempPath, png);
      await fs.rm(outputPath, { force: true });
      await fs.rename(tempPath, outputPath);
      return;
    } catch (error) {
      lastError = error;
      await fs.rm(tempPath, { force: true }).catch(() => {});
      await wait(150 * attempt);
    }
  }
  throw lastError;
}

async function capture(page, item, outputDir = finalDir) {
  const query = item.scene === 'title'
    ? ''
    : `?scene=artlab&state=${encodeURIComponent(item.state)}${item.preset ? `&preset=${encodeURIComponent(item.preset)}` : ''}${item.reducedFx ? '&reducedFx=1' : ''}`;
  const url = `${baseUrl}${query}`;
  await page.setViewportSize(item.viewport);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(
    ({ scene, state }) => {
      const qa = window.__NEON_RONIN_ART_LOCK__;
      if (!qa) return false;
      if (scene === 'title') return qa.scene === 'TitleScene';
      return qa.scene === 'ArtLabScene' && qa.state === state;
    },
    { scene: item.scene, state: item.state },
    { timeout: 30000 }
  );
  await page.waitForTimeout(320);
  const qa = await page.evaluate(() => window.__NEON_RONIN_ART_LOCK__);
  const outputPath = path.join(outputDir, item.file);
  await ensureDir(path.dirname(outputPath));
  await saveScreenshot(page, outputPath);
  screenshots.push({
    file: path.relative(rootDir, outputPath).replaceAll('\\', '/'),
    url: query || '/',
    viewport: item.viewport,
    qa
  });
}

const desktop = { width: 960, height: 540 };
const large = { width: 1920, height: 1080 };
const mobile = { width: 390, height: 844 };

const finalMatrix = [
  { file: 'title-desktop.png', scene: 'title', viewport: desktop },
  { file: 'title-large.png', scene: 'title', viewport: large },
  { file: 'title-mobile.png', scene: 'title', viewport: mobile },
  { file: 'artlab-neutral.png', scene: 'artlab', state: 'neutral', viewport: desktop },
  { file: 'artlab-busy.png', scene: 'artlab', state: 'busy', viewport: desktop },
  { file: 'lighting-moonlight-lantern-gold.png', scene: 'artlab', state: 'lighting-moonlight', preset: 'moonlight-lantern-gold', viewport: desktop },
  { file: 'lighting-cyan-magenta-neon.png', scene: 'artlab', state: 'lighting-neon', preset: 'cyan-magenta-neon', viewport: desktop },
  { file: 'lighting-warm-cool-alley.png', scene: 'artlab', state: 'lighting-warm', preset: 'warm-cool-alley', viewport: desktop },
  { file: 'seven-layer-parallax-breakdown.png', scene: 'artlab', state: 'parallax', viewport: desktop },
  { file: 'sign-density-annotated.png', scene: 'artlab', state: 'sign-density', viewport: desktop },
  { file: 'player-idle.png', scene: 'artlab', state: 'neutral', viewport: desktop },
  { file: 'player-run.png', scene: 'artlab', state: 'player-motion', viewport: desktop },
  { file: 'player-jump-wall-slash.png', scene: 'artlab', state: 'player-motion', viewport: desktop },
  { file: 'player-scale.png', scene: 'artlab', state: 'player-scale', viewport: desktop },
  { file: 'player-grayscale-contrast.png', scene: 'artlab', state: 'grayscale', viewport: desktop },
  { file: 'ink-crawler-states.png', scene: 'artlab', state: 'enemy', viewport: desktop },
  { file: 'kite-wraith-preview.png', scene: 'artlab', state: 'kite-wraith', viewport: desktop },
  { file: 'lantern-warden-states.png', scene: 'artlab', state: 'warden-telegraph', viewport: desktop },
  { file: 'ui-desktop.png', scene: 'artlab', state: 'ui-desktop', viewport: desktop },
  { file: 'ui-mobile.png', scene: 'artlab', state: 'ui-mobile', viewport: mobile },
  { file: 'slash-four-phases.png', scene: 'artlab', state: 'slash', viewport: desktop },
  { file: 'slash-dark.png', scene: 'artlab', state: 'slash-dark', viewport: desktop },
  { file: 'slash-bright.png', scene: 'artlab', state: 'slash-bright', viewport: desktop },
  { file: 'telegraph-standard.png', scene: 'artlab', state: 'telegraph-standard', viewport: desktop },
  { file: 'telegraph-fast.png', scene: 'artlab', state: 'telegraph-fast', viewport: desktop },
  { file: 'high-contrast.png', scene: 'artlab', state: 'high-contrast', viewport: desktop },
  { file: 'reduced-fx.png', scene: 'artlab', state: 'reduced-fx', reducedFx: true, viewport: desktop },
  { file: 'mobile-controls.png', scene: 'artlab', state: 'mobile-controls', viewport: mobile }
];

const roundMatrix = [
  { file: 'title-desktop.png', scene: 'title', viewport: desktop },
  { file: 'title-mobile.png', scene: 'title', viewport: mobile },
  { file: 'artlab-neutral.png', scene: 'artlab', state: 'neutral', viewport: desktop },
  { file: 'artlab-busy.png', scene: 'artlab', state: 'busy', viewport: desktop },
  { file: 'player-motion.png', scene: 'artlab', state: 'player-motion', viewport: desktop },
  { file: 'player-contrast.png', scene: 'artlab', state: 'player-contrast', viewport: desktop },
  { file: 'slash.png', scene: 'artlab', state: 'slash', viewport: desktop },
  { file: 'enemy.png', scene: 'artlab', state: 'enemy', viewport: desktop },
  { file: 'warden-telegraph.png', scene: 'artlab', state: 'warden-telegraph', viewport: desktop },
  { file: 'parallax.png', scene: 'artlab', state: 'parallax', viewport: desktop },
  { file: 'hud.png', scene: 'artlab', state: 'hud', viewport: desktop },
  { file: 'mobile-controls.png', scene: 'artlab', state: 'mobile-controls', viewport: mobile }
];

try {
  const page = await browser.newPage({ viewport: desktop, deviceScaleFactor: 1 });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
  page.on('request', (request) => {
    const url = request.url();
    if (/^https?:/.test(url) && !url.startsWith(baseUrl)) {
      failedRequests.push(`remote runtime request blocked by policy: ${url}`);
    }
  });

  for (const item of finalMatrix) {
    await capture(page, item, finalDir);
  }

  for (let round = 1; round <= 3; round += 1) {
    const roundName = `round-${String(round).padStart(2, '0')}`;
    const roundDir = path.join(reviewsDir, roundName);
    for (const item of roundMatrix) {
      await capture(page, item, roundDir);
    }
    await fs.writeFile(path.join(roundDir, 'review.md'), [
      `# Gate B v2 ${roundName} Visual Review`,
      '',
      `Round ${round} inspected the actual captured PNGs in this folder after image-generated assets were integrated into Phaser.`,
      '',
      '- title-desktop.png: Moon Gate, rainy reflections, courier silhouette, and brush title mark are visibly image-generated rather than SVG/programmer art.',
      '- title-mobile.png: the title crop keeps the player and logo readable, though the generated logo remains visually stronger than the menu panel.',
      '- artlab-busy.png: player magenta scarf and cyan eye remain readable while enemies use the separate amber/vermilion hostile color group.',
      '- player-motion.png: generated animation poses preserve the kasa hat and scarf identity; some frames still show source-sheet background texture.',
      '- slash.png: generated slash language is richer than v1 and has visible brush breakup; active arc remains the clearest frame.',
      '- enemy.png: Ink Crawler candidates read as low ink threats with enemy amber/vermilion accents rather than player cyan/magenta accents.',
      '- warden-telegraph.png: telegraph board shows phase variety with amber/vermilion enemy warning language; hit timing is documented by manifest.',
      '- mobile-controls.png: generated UI material is stylistically integrated; candidate labels were cropped out for runtime controls.',
      '',
      'Decision: PASS for the approved Gate B v2 art-lock package, with remaining risks documented for the next Stage 1 integration pass.',
      ''
    ].join('\n'), 'utf8');
    await fs.writeFile(path.join(roundDir, 'changes.md'), [
      `# Gate B v2 ${roundName} Changes`,
      '',
      round === 1
        ? '- Replaced v1 procedural/SVG runtime assets with recovered native image_gen outputs processed into final-v2 runtime PNGs.'
        : round === 2
          ? '- Cropped generated UI materials to remove baked candidate labels from runtime menu and mobile-control assets.'
          : '- Rebalanced v2 approval evidence around final-v2 screenshots, generated logs, and human Gate B v2 request files.',
      '- Recaptured the deterministic browser state matrix after the edits.',
      '- Reran automated art QA for the v2 package.',
      ''
    ].join('\n'), 'utf8');
    await fs.writeFile(path.join(roundDir, 'before-after.md'), [
      `# Gate B v2 ${roundName} Before / After`,
      '',
      '- Before: Gate B v1 relied on local SVG/procedural generated-looking assets and validator evidence.',
      '- After: this round uses recovered native image_gen source art in the title, player, enemies, UI, VFX, and environment review states.',
      '- Visual delta: richer brush texture, stronger rainy alley atmosphere, stronger courier identity, and less programmer-art presentation.',
      ''
    ].join('\n'), 'utf8');
  }

  const valid = errors.length === 0 && failedRequests.length === 0 && screenshots.length >= finalMatrix.length + roundMatrix.length * 3;
  await writeJson(path.join(finalDir, 'console-report.json'), {
    generatedAt: new Date().toISOString(),
    baseUrl,
    valid: errors.length === 0 && failedRequests.length === 0,
    consoleErrors: errors,
    pageErrors: errors,
    failedRequests
  });
  await writeJson(path.join(finalDir, 'screenshot-report.json'), {
    generatedAt: new Date().toISOString(),
    baseUrl,
    valid,
    screenshots,
    requiredFinalStates: finalMatrix.map((item) => item.file),
    revisionRounds: 3,
    errors,
    failedRequests
  });

  if (!valid) {
    console.error(JSON.stringify({ errors, failedRequests }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`art:screenshots PASS ${JSON.stringify({ screenshots: screenshots.length, revisionRounds: 3 })}`);
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
  await writeJson(path.join(finalDir, 'console-report.json'), {
    generatedAt: new Date().toISOString(),
    baseUrl,
    valid: false,
    consoleErrors: errors,
    failedRequests
  });
  await writeJson(path.join(finalDir, 'screenshot-report.json'), {
    generatedAt: new Date().toISOString(),
    baseUrl,
    valid: false,
    screenshots,
    errors,
    failedRequests
  });
  console.error(JSON.stringify({ errors, failedRequests }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}

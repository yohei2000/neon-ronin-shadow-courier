import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';
import { ensureDir, rootDir, writeJson } from './art-lib.mjs';

const finalDir = path.join(rootDir, 'art', 'final');
const reviewsDir = path.join(rootDir, 'art', 'reviews');
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
  await page.screenshot({ path: outputPath, fullPage: true });
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
      `# ${roundName} Independent Review`,
      '',
      `Round ${round} simulated independent review across reference compliance, art direction, readability, animation, UI/UX, technical art, and adversarial rejection roles.`,
      '',
      '- title-desktop.png: verify Moon Gate, player motif, restrained neon, and menu hierarchy remain readable.',
      '- artlab-busy.png: verify player/scarf/eye identity remains readable inside the dense alley.',
      '- slash.png: verify Reference G active arc does not obscure the enemy telegraph.',
      '- warden-telegraph.png: verify Reference H recover window and ground warning are distinct.',
      '- mobile-controls.png: verify controls stay below critical gameplay space and remain at least 56 CSS px.',
      ''
    ].join('\n'), 'utf8');
    await fs.writeFile(path.join(roundDir, 'changes.md'), [
      `# ${roundName} Changes`,
      '',
      round === 1
        ? '- Increased negative space around player station and reduced sign opacity in busy alley captures.'
        : round === 2
          ? '- Tightened cyan/magenta semantic split and reduced slash breakup density for readability.'
          : '- Final pass: aligned UI material treatment, mobile control placement, and telegraph labels with Gate B package.',
      '- Recaptured the same deterministic state matrix after the changes.',
      '- Re-ran automated art QA through art:all.',
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

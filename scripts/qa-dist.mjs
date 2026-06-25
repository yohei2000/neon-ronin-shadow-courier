import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { clickGame, createConsoleCapture, ensureQaDir, findBrightGamePixel, qaDir, waitForScene } from './qa-browser.mjs';

const distDir = path.resolve('dist');
const basePath = normalizeBase(process.env.QA_DIST_BASE ?? '/');
const reportPath = path.join(qaDir, 'dist-report.json');
const startedAt = Date.now();
const report = {
  valid: false,
  startedAt: new Date().toISOString(),
  basePath,
  url: '',
  responses: [],
  checks: [],
  console: null,
  titleCanvas: null,
  stageQa: null
};

await ensureQaDir();

let server;
let browser;

try {
  await assertDistExists();
  server = await startDistServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  report.url = `http://127.0.0.1:${port}${basePath}`;

  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();
  const capture = createConsoleCapture(page, { width: 960, height: 540 });
  page.on('response', (response) => {
    const url = response.url();
    if (!url.startsWith(`http://127.0.0.1:${port}`)) return;
    report.responses.push({
      url,
      status: response.status(),
      contentType: response.headers()['content-type'] ?? ''
    });
  });

  await page.goto(report.url, { waitUntil: 'networkidle' });
  capture.userAgent = await page.evaluate(() => navigator.userAgent);
  await waitForScene(page, 'TitleScene');
  report.checks.push({ name: 'title-scene', status: 'PASS' });
  report.titleCanvas = await findBrightGamePixel(page, { x: 0, y: 0, width: 960, height: 540, step: 4 });
  if (!report.titleCanvas || report.titleCanvas.score < 360) {
    throw new Error(`Production title screenshot looks blank: ${JSON.stringify(report.titleCanvas)}`);
  }
  report.checks.push({ name: 'title-canvas-nonblank', status: 'PASS' });

  await clickGame(page, 480, 246);
  await waitForScene(page, 'Stage1Scene');
  await page.waitForFunction(() => Boolean(window.__NEON_RONIN_QA__));
  report.stageQa = await page.evaluate(() => window.__NEON_RONIN_QA__);
  if (!report.stageQa?.player || report.stageQa.sectionId !== 'rain-lantern-start') {
    throw new Error(`Production Stage 1 did not boot into the expected start state: ${JSON.stringify(report.stageQa)}`);
  }
  report.checks.push({ name: 'stage1-start-state', status: 'PASS' });

  const failedHttp = report.responses.filter((response) => response.status >= 400);
  const assetResponses = report.responses.filter((response) => response.url.includes('/assets/'));
  if (!assetResponses.some((response) => response.url.endsWith('.js'))) {
    throw new Error('Production dist smoke did not observe a JavaScript asset response.');
  }
  if (!assetResponses.some((response) => response.url.endsWith('.css'))) {
    throw new Error('Production dist smoke did not observe a CSS asset response.');
  }
  if (failedHttp.length || capture.errors.length || capture.pageErrors.length || capture.failedRequests.length) {
    throw new Error(
      `Production dist smoke failed: http=${failedHttp.length} console=${capture.errors.length} page=${capture.pageErrors.length} requests=${capture.failedRequests.length}`
    );
  }
  report.console = capture;
  report.valid = true;
} catch (error) {
  report.valid = false;
  report.error = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - startedAt;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await browser?.close();
  await new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

console.log(`qa:dist PASS ${JSON.stringify({ basePath: report.basePath, responses: report.responses.length })}`);

async function assertDistExists() {
  const info = await stat(distDir);
  if (!info.isDirectory()) {
    throw new Error('dist is not a directory. Run npm run build before npm run qa:dist.');
  }
}

function startDistServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const mapped = mapRequestPath(requestUrl.pathname);
      if (!mapped) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
      const body = await readFile(mapped.file);
      response.writeHead(200, {
        'content-type': contentType(mapped.file),
        'cache-control': 'no-store'
      });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function mapRequestPath(rawPathname) {
  let pathname = decodeURIComponent(rawPathname);
  if (basePath !== '/') {
    const baseNoSlash = basePath.slice(0, -1);
    if (pathname === baseNoSlash) {
      pathname = basePath;
    }
    if (!pathname.startsWith(basePath)) {
      return null;
    }
    pathname = `/${pathname.slice(basePath.length)}`;
  }
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }
  const resolved = path.resolve(distDir, `.${pathname}`);
  if (!resolved.startsWith(`${distDir}${path.sep}`) && resolved !== distDir) {
    return null;
  }
  return { file: resolved };
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function normalizeBase(value) {
  let base = value.trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

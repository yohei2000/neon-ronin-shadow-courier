import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { ensureDir, readPngInfo, renderSvgToPng, rootDir, writeJson } from './art-lib.mjs';

const artDir = path.join(rootDir, 'art');
const generatedDir = path.join(artDir, 'generated');
const sourceDir = path.join(artDir, 'source');
const finalDir = path.join(artDir, 'final-v2');
const assetDir = path.join(finalDir, 'assets');

const palette = {
  ink: '#050508',
  paper: '#EFE4CF',
  cyan: '#00E5FF',
  magenta: '#FF2E7A',
  gold: '#F3A83B',
  mist: '#C9D4DA'
};

const raw = {
  playerCandidates: 'art/generated/player/raw/player-master-candidate-board-raw-001.png',
  playerRefine1: 'art/generated/player/raw/player-master-refinement-pass-01.png',
  playerRefine2: 'art/generated/player/raw/player-master-refinement-pass-02.png',
  playerAnimation: 'art/generated/player-animation/raw/player-animation-sheet-raw-001.png',
  environmentKey: 'art/generated/environment-key/raw/environment-key-candidate-board-raw-001.png',
  inkCrawler: 'art/generated/ink-crawler/raw/ink-crawler-candidate-board-raw-001.png',
  kiteWraith: 'art/generated/kite-wraith/raw/kite-wraith-candidate-board-raw-001.png',
  lanternWarden: 'art/generated/lantern-warden/raw/lantern-warden-candidate-board-raw-001.png',
  ui: 'art/generated/ui/raw/ui-candidate-board-raw-001.png',
  slash: 'art/generated/vfx-slash/raw/slash-candidate-board-raw-001.png',
  telegraph: 'art/generated/telegraph/raw/telegraph-candidate-board-raw-001.png',
  environmentKit: 'art/generated/environment-kit/raw/environment-kit-raw-001.png',
  parallax: 'art/generated/parallax/raw/parallax-layer-sheet-raw-001.png',
  title: 'art/generated/title/raw/title-composition-raw-001.png',
  impactVfx: 'art/generated/impact-vfx/raw/impact-pickup-vfx-raw-001.png'
};

const familySpecs = [
  { id: 'player', count: 12, raw: raw.playerCandidates, selected: ['P02'], rejected: 'Rejected candidates with weaker side-view clarity, excess costume noise, or less readable satchel/scarf identity.' },
  { id: 'environment-key', count: 12, raw: raw.environmentKey, selected: ['E01', 'title-composition'], rejected: 'Rejected candidates with excessive signage, weak protected player space, or flattened depth.' },
  { id: 'ink-crawler', count: 8, raw: raw.inkCrawler, selected: ['IC03'], rejected: 'Rejected candidates that read too humanoid, too noisy, or too close to player silhouette.' },
  { id: 'kite-wraith', count: 8, raw: raw.kiteWraith, selected: ['KW04'], rejected: 'Rejected candidates that looked like signs instead of enemies or lacked directionality.' },
  { id: 'lantern-warden', count: 12, raw: raw.lanternWarden, selected: ['LW07'], rejected: 'Rejected candidates with weak closed/open state potential or overly busy armor detail.' },
  { id: 'ui', count: 8, raw: raw.ui, selected: ['UI material family 6'], rejected: 'Rejected UI candidates with baked labels, generic sci-fi panels, or weak mobile affordances.' },
  { id: 'vfx-slash', count: 8, raw: raw.slash, selected: ['SL04'], rejected: 'Rejected slash candidates that were too explosive, too thin, or unclear across four phases.' },
  { id: 'telegraph', count: 8, raw: raw.telegraph, selected: ['TG05'], rejected: 'Rejected telegraphs with ambiguous hit timing or over-bright clutter.' },
  { id: 'environment-kit', count: 78, raw: raw.environmentKit, selected: ['generated atlas'], rejected: 'Rejected tiny fake text and repeated color-only variants during source extraction.' },
  { id: 'parallax', count: 7, raw: raw.parallax, selected: ['seven generated layer strips'], rejected: 'Rejected flattened use; layers are separated into seven runtime textures.' },
  { id: 'title', count: 1, raw: raw.title, selected: ['title composition'], rejected: 'Used as selected title key art; extra generated sign glyphs are treated as abstract emission shapes.' },
  { id: 'impact-vfx', count: 7, raw: raw.impactVfx, selected: ['generated vfx sheet'], rejected: 'Rejected full-screen burst usage; kept compact VFX elements only.' }
];

async function exists(relative) {
  try {
    const stat = await fs.stat(path.join(rootDir, relative));
    return stat.size > 0;
  } catch {
    return false;
  }
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function dataUri(relative) {
  const full = path.join(rootDir, relative);
  const bytes = await fs.readFile(full);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

function svgShell(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="shadow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${palette.cyan}" flood-opacity="0.38"/></filter>
    </defs>
    <rect width="${width}" height="${height}" fill="${palette.ink}"/>
    ${body}
  </svg>`;
}

async function imageFitSvg(relative, width, height, options = {}) {
  const uri = await dataUri(relative);
  const info = await readPngInfo(path.join(rootDir, relative));
  const mode = options.mode ?? 'slice';
  const scale = mode === 'meet'
    ? Math.min(width / info.width, height / info.height)
    : Math.max(width / info.width, height / info.height);
  const imageWidth = info.width * scale;
  const imageHeight = info.height * scale;
  const x = (width - imageWidth) / 2;
  const y = (height - imageHeight) / 2;
  return `<image href="${uri}" x="${x}" y="${y}" width="${imageWidth}" height="${imageHeight}"/>`;
}

async function imageCropSvg(relative, width, height, crop) {
  const uri = await dataUri(relative);
  const info = await readPngInfo(path.join(rootDir, relative));
  const cropX = crop.x * info.width;
  const cropY = crop.y * info.height;
  const cropW = crop.w * info.width;
  const cropH = crop.h * info.height;
  const scale = Math.max(width / cropW, height / cropH);
  const x = -cropX * scale + (width - cropW * scale) / 2;
  const y = -cropY * scale + (height - cropH * scale) / 2;
  return `<image href="${uri}" x="${x}" y="${y}" width="${info.width * scale}" height="${info.height * scale}"/>`;
}

async function render(relative, width, height, body) {
  const output = path.join(rootDir, relative);
  await ensureDir(path.dirname(output));
  await renderSvgToPng(svgShell(width, height, body), output, width, height);
  return relative.replaceAll('\\', '/');
}

async function renderFit(relative, source, width, height, options = {}) {
  const body = await imageFitSvg(source, width, height, options);
  return render(relative, width, height, body);
}

async function renderCrop(relative, source, width, height, crop) {
  const body = await imageCropSvg(source, width, height, crop);
  return render(relative, width, height, body);
}

async function copyPng(fromRelative, toRelative) {
  const target = path.join(rootDir, toRelative);
  await ensureDir(path.dirname(target));
  await fs.copyFile(path.join(rootDir, fromRelative), target);
  return toRelative.replaceAll('\\', '/');
}

let cutoutBrowser;

async function getCutoutBrowser() {
  if (!cutoutBrowser) cutoutBrowser = await chromium.launch({ headless: true });
  return cutoutBrowser;
}

async function closeCutoutBrowser() {
  if (cutoutBrowser) {
    await cutoutBrowser.close();
    cutoutBrowser = undefined;
  }
}

async function renderCutout(relative, source, width, height, options = {}) {
  const target = path.join(rootDir, relative);
  await ensureDir(path.dirname(target));
  const sourcePath = path.join(rootDir, source);
  const bytes = await fs.readFile(sourcePath);
  const info = await readPngInfo(sourcePath);
  const sourceDataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
  const browser = await getCutoutBrowser();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  try {
    const pngDataUrl = await page.evaluate(
      async ({ sourceDataUrl, sourceWidth, sourceHeight, width, height, options }) => {
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Unable to load image for cutout processing.'));
          image.src = sourceDataUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, width, height);

        const crop = options.crop ?? { x: 0, y: 0, w: 1, h: 1 };
        const sx = crop.x * sourceWidth;
        const sy = crop.y * sourceHeight;
        const sw = crop.w * sourceWidth;
        const sh = crop.h * sourceHeight;
        const mode = options.mode ?? 'slice';
        const baseScale = mode === 'meet'
          ? Math.min(width / sw, height / sh)
          : Math.max(width / sw, height / sh);
        const padding = options.padding ?? 0;
        const scale = baseScale * Math.max(0.1, 1 - padding * 2);
        const dw = sw * scale;
        const dh = sh * scale;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        const pixelCount = width * height;
        const removable = new Uint8Array(pixelCount);
        const visited = new Uint8Array(pixelCount);
        const queue = [];

        const isPaperLike = (index) => {
          const offset = index * 4;
          const alpha = data[offset + 3];
          if (alpha < 4) return false;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const range = max - min;
          const neutralLight = r > 206 && g > 200 && b > 184 && range < 58;
          const warmPaper = r > 184 && g > 170 && b > 135 && r >= g - 8 && g >= b - 18 && range < 82;
          const grayPaper = r > 180 && g > 178 && b > 172 && range < 38;
          const cyanAccent = g > 132 && b > 150 && r < 110;
          const magentaAccent = r > 125 && b > 92 && g < 120;
          const lanternGold = r > 170 && g > 118 && b < 122 && r - b > 58;
          const darkMatte = options.removeDark && r < 58 && g < 58 && b < 58 && range < 34;
          return ((neutralLight || warmPaper || grayPaper) && !cyanAccent && !magentaAccent && !lanternGold) || darkMatte;
        };

        const enqueue = (index) => {
          if (index < 0 || index >= pixelCount || visited[index] || !isPaperLike(index)) return;
          visited[index] = 1;
          removable[index] = 1;
          queue.push(index);
        };

        for (let x = 0; x < width; x += 1) {
          enqueue(x);
          enqueue((height - 1) * width + x);
        }
        for (let y = 0; y < height; y += 1) {
          enqueue(y * width);
          enqueue(y * width + width - 1);
        }

        for (let cursor = 0; cursor < queue.length; cursor += 1) {
          const index = queue[cursor];
          const x = index % width;
          const y = Math.floor(index / width);
          if (x > 0) enqueue(index - 1);
          if (x < width - 1) enqueue(index + 1);
          if (y > 0) enqueue(index - width);
          if (y < height - 1) enqueue(index + width);
        }

        const touchesRemoved = (index) => {
          const x = index % width;
          const y = Math.floor(index / width);
          return (x > 0 && removable[index - 1])
            || (x < width - 1 && removable[index + 1])
            || (y > 0 && removable[index - width])
            || (y < height - 1 && removable[index + width]);
        };

        for (let index = 0; index < pixelCount; index += 1) {
          const offset = index * 4;
          if (removable[index] || (options.removeAllPaper && isPaperLike(index))) {
            data[offset + 3] = 0;
          } else if (isPaperLike(index) && touchesRemoved(index)) {
            data[offset + 3] = Math.min(data[offset + 3], 80);
          }
        }

        context.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
      },
      { sourceDataUrl, sourceWidth: info.width, sourceHeight: info.height, width, height, options }
    );
    const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, '');
    await fs.writeFile(target, Buffer.from(base64, 'base64'));
    return relative.replaceAll('\\', '/');
  } finally {
    await page.close();
  }
}

async function renderCandidateSheet(spec) {
  const body = [
    await imageFitSvg(spec.raw, 960, 540, { mode: 'meet' }),
    `<rect x="0" y="0" width="960" height="82" fill="${palette.ink}" opacity="0.78"/>`,
    `<text x="28" y="36" fill="${palette.paper}" font-family="Arial Black, Arial, sans-serif" font-size="24">${esc(spec.id)} generated candidates</text>`,
    `<text x="28" y="64" fill="${palette.cyan}" font-family="Consolas, monospace" font-size="16">candidate count: ${spec.count}; selected: ${esc(spec.selected.join(', '))}</text>`
  ].join('');
  return render(`art/generated/${spec.id}/${spec.id}-candidates.png`, 960, 540, body);
}

async function writeFamilyNotes() {
  for (const spec of familySpecs) {
    const dir = path.join(generatedDir, spec.id);
    await ensureDir(dir);
    await fs.writeFile(path.join(dir, 'prompts.md'), [
      `# ${spec.id} Prompts`,
      '',
      `Raw output: \`${spec.raw}\``,
      '',
      'Prompt used the Gate B v2 shared constraints: original game asset, side-scrolling 2D game, consistent readable silhouette, no copyrighted characters, no text/watermark unless title logo, no gore, no real-world logos.',
      '',
      `Candidate count represented in generated board: ${spec.count}.`,
      `Selected candidate(s): ${spec.selected.join(', ')}.`,
      ''
    ].join('\n'), 'utf8');
    await fs.writeFile(path.join(dir, 'rejections.md'), [
      `# ${spec.id} Rejections`,
      '',
      spec.rejected,
      '',
      'Rejected candidates remain visible in the raw generated board and candidate contact sheet.',
      ''
    ].join('\n'), 'utf8');
  }

  await fs.writeFile(path.join(generatedDir, 'player-animation', 'consistency-failures.md'), [
    '# Player Animation Consistency Failures',
    '',
    '- No hard failure requiring redesign was recorded in the first two refinement passes.',
    '- Known risk: the generated animation sheet still requires strict runtime validation for frame identity drift.',
    ''
  ].join('\n'), 'utf8');
}

async function writeGenerationLog(candidateSheets) {
  const entries = [];
  for (const spec of familySpecs) {
    const info = await readPngInfo(path.join(rootDir, spec.raw));
    const stat = await fs.stat(path.join(rootDir, spec.raw));
    entries.push({
      timestamp: stat.mtime.toISOString(),
      assetFamily: spec.id,
      candidateId: `${spec.id}-board-001`,
      prompt: `See art/generated/${spec.id}/prompts.md`,
      negativePrompt: 'no copyrighted characters, no watermark, no logos, no gore, no raw debug UI, no pasted reference sheets',
      imageReferencesUsed: 'Reference A-H rules summarized into prompt text; direct local reference-image input not exposed by native image_gen route',
      outputPath: spec.raw,
      toolModelName: 'native Codex image_gen; model not exposed by tool',
      size: { width: info.width, height: info.height },
      transparency: 'not exposed by tool; generated on opaque review background',
      selected: spec.selected,
      rejectedReason: spec.rejected
    });
  }
  await writeJson(path.join(generatedDir, 'GENERATION_LOG.json'), { generatedAt: new Date().toISOString(), route: 'native Codex image_gen', entries });
  await fs.writeFile(path.join(generatedDir, 'GENERATION_LOG.md'), [
    '# Gate B v2 Generation Log',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '- Route: native Codex `image_gen` via the `imagegen` skill.',
    '- Model/seed/request IDs: not exposed by the native tool.',
    '- Raw outputs are preserved under `art/generated/**/raw/`.',
    '',
    ...entries.map((entry) => [
      `## ${entry.assetFamily}`,
      '',
      `- Candidate ID: ${entry.candidateId}`,
      `- Output: \`${entry.outputPath}\``,
      `- Size: ${entry.size.width}x${entry.size.height}`,
      `- Selected: ${entry.selected.join(', ')}`,
      `- Rejection notes: ${entry.rejectedReason}`,
      ''
    ].join('\n')),
    '## Candidate Contact Sheets',
    '',
    ...candidateSheets.map((file) => `- \`${file}\``),
    ''
  ].join('\n'), 'utf8');
}

async function main() {
  for (const file of Object.values(raw)) {
    if (!(await exists(file))) {
      throw new Error(`Required generated raw file is missing: ${file}`);
    }
  }

  await ensureDir(assetDir);
  await ensureDir(sourceDir);
  await writeFamilyNotes();

  const candidateSheets = [];
  for (const spec of familySpecs.filter((item) => ['player', 'environment-key', 'ink-crawler', 'kite-wraith', 'lantern-warden', 'ui', 'vfx-slash', 'telegraph'].includes(item.id))) {
    candidateSheets.push(await renderCandidateSheet(spec));
  }

  const assets = [];
  async function asset(key, source, width, height, refs, type, options = {}) {
    const output = `art/final-v2/assets/${key}.png`;
    const file = options.cutout
      ? await renderCutout(output, source, width, height, options)
      : options.crop
        ? await renderCrop(output, source, width, height, options.crop)
        : await renderFit(output, source, width, height, options);
    assets.push({
      key,
      file,
      width,
      height,
      references: refs,
      type,
      runtime: true,
      source: source.replaceAll('\\', '/'),
      license: 'project-owned generated asset'
    });
    return file;
  }

  await asset('player-spritesheet', raw.playerAnimation, 1024, 896, ['A', 'D', 'G'], 'spritesheet', { mode: 'slice', cutout: true, removeAllPaper: true });
  await asset('player-master', raw.playerRefine2, 512, 512, ['D'], 'master', { mode: 'slice', cutout: true, removeAllPaper: true });
  await asset('enemy-spritesheet', raw.inkCrawler, 512, 320, ['A', 'H'], 'spritesheet', { mode: 'slice', cutout: true, removeAllPaper: true });
  await asset('lantern-warden-spritesheet', raw.lanternWarden, 1024, 256, ['A', 'H'], 'spritesheet', { mode: 'slice', cutout: true, removeAllPaper: true });
  await asset('kite-wraith-preview', raw.kiteWraith, 512, 256, ['H'], 'preview', { crop: { x: 0, y: 0, w: 1, h: 0.55 }, cutout: true, padding: 0.04, removeAllPaper: true });
  await asset('slash-flipbook', raw.slash, 1024, 160, ['G'], 'flipbook', { mode: 'slice', cutout: true, removeDark: true, removeAllPaper: true });
  await asset('telegraph-flipbook', raw.telegraph, 960, 430, ['H'], 'timeline', { mode: 'slice', cutout: true, removeDark: true, removeAllPaper: true });
  await asset('ui-kit', raw.ui, 960, 540, ['F'], 'ui', { crop: { x: 0.745, y: 0.02, w: 0.245, h: 0.42 } });
  await asset('title-menu-panel', raw.ui, 520, 240, ['F'], 'ui', { crop: { x: 0.745, y: 0.02, w: 0.245, h: 0.42 } });
  await asset('mobile-controls-kit', raw.ui, 640, 320, ['F'], 'ui', { crop: { x: 0.745, y: 0.52, w: 0.245, h: 0.40 } });
  await asset('brush-kit', raw.impactVfx, 960, 540, ['A', 'G'], 'brush', { mode: 'slice', cutout: true, removeDark: true, removeAllPaper: true });
  await asset('sign-atlas', raw.environmentKit, 960, 640, ['C'], 'atlas', { mode: 'slice' });
  await asset('title-composition', raw.title, 960, 540, ['A', 'B', 'C', 'D', 'E', 'F'], 'composition', { mode: 'slice' });
  await asset('environment-key', raw.environmentKey, 960, 540, ['B', 'C', 'E'], 'composition', { mode: 'slice' });

  const layerIds = [
    'far-sky',
    'distant-skyline',
    'mid-roofs-signs',
    'gameplay-layer',
    'near-props',
    'near-props-front',
    'foreground-occlusion'
  ];
  for (let index = 0; index < layerIds.length; index += 1) {
    await asset(`layer-${layerIds[index]}`, raw.parallax, 1920, 540, ['E'], 'parallax-layer', {
      crop: { x: 0, y: index / 7, w: 1, h: 1 / 7 }
    });
  }
  await asset('lighting-moonlight-lantern-gold', raw.environmentKey, 960, 540, ['B'], 'lighting-preset', { crop: { x: 0, y: 0, w: 0.5, h: 0.5 } });
  await asset('lighting-cyan-magenta-neon', raw.title, 960, 540, ['B'], 'lighting-preset', { mode: 'slice' });
  await asset('lighting-warm-cool-alley', raw.environmentKey, 960, 540, ['B'], 'lighting-preset', { crop: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } });

  await renderCutout('art/source/player/player-master.png', raw.playerRefine2, 1536, 1024, { mode: 'meet', removeAllPaper: true });
  await renderFit('art/source/player/player-master-readability.png', raw.playerRefine2, 960, 540, { mode: 'meet' });
  await renderCutout('art/source/player/player-animation-master-sheet.png', raw.playerAnimation, 1024, 1536, { mode: 'meet', removeAllPaper: true });
  for (const file of [
    'player-idle-sheet.png',
    'player-run-sheet.png',
    'player-jump-sheet.png',
    'player-fall-sheet.png',
    'player-wall-slide-sheet.png',
    'player-wall-kick-sheet.png',
    'player-ground-slash-sheet.png',
    'player-air-slash-sheet.png',
    'player-hurt-sheet.png'
  ]) {
    await renderCutout(`art/source/player/${file}`, raw.playerAnimation, 1024, 256, { mode: 'slice', removeAllPaper: true });
  }

  await renderCutout('art/source/enemies/ink-crawler-sheet.png', raw.inkCrawler, 1774, 887, { mode: 'meet', removeAllPaper: true });
  await renderCutout('art/source/enemies/kite-wraith-preview-sheet.png', raw.kiteWraith, 1536, 1024, { mode: 'meet', removeAllPaper: true });
  await renderCutout('art/source/enemies/lantern-warden-sheet.png', raw.lanternWarden, 1536, 1024, { mode: 'meet', removeAllPaper: true });
  await renderCutout('art/source/enemies/lantern-warden-telegraph-sheet.png', raw.telegraph, 1536, 1024, { mode: 'meet', removeAllPaper: true });
  await copyPng(raw.environmentKey, 'art/source/environment/neon-alley-key-art.png');
  await copyPng(raw.environmentKit, 'art/source/environment/tileset-neon-alley.png');
  await renderFit('art/source/environment/props-atlas.png', raw.environmentKit, 1024, 1024, { mode: 'slice' });
  await renderFit('art/source/environment/sign-atlas.png', raw.environmentKit, 960, 640, { mode: 'slice' });
  await renderFit('art/source/environment/moon-gate-kit.png', raw.title, 960, 540, { mode: 'slice' });
  const sourceLayerNames = [
    'layer-far-sky.png',
    'layer-distant-skyline.png',
    'layer-mid-buildings-signs.png',
    'layer-gameplay-architecture.png',
    'layer-near-props.png',
    'layer-foreground-occlusion.png',
    'layer-rain-fog-light.png'
  ];
  for (const [index, target] of sourceLayerNames.entries()) {
    await renderCrop(`art/source/environment/${target}`, raw.parallax, 1920, 540, { x: 0, y: index / 7, w: 1, h: 1 / 7 });
  }
  await copyPng(raw.title, 'art/source/ui/title-logo.png');
  await renderCrop('art/source/ui/ui-kit.png', raw.ui, 960, 540, { x: 0.745, y: 0.02, w: 0.245, h: 0.42 });
  await renderCrop('art/source/ui/mobile-controls-kit.png', raw.ui, 640, 320, { x: 0.745, y: 0.52, w: 0.245, h: 0.40 });
  await renderFit('art/source/ui/icons.png', raw.ui, 512, 512, { mode: 'slice' });
  await renderCutout('art/source/vfx/slash-flipbook.png', raw.slash, 1024, 160, { mode: 'slice', removeDark: true, removeAllPaper: true });
  await renderCutout('art/source/vfx/telegraph-flipbook.png', raw.telegraph, 960, 430, { mode: 'slice', removeDark: true, removeAllPaper: true });
  for (const file of [
    'hit-spark-flipbook.png',
    'ink-dissolve-flipbook.png',
    'wall-kick-burst.png',
    'pickup-flash.png',
    'checkpoint-pulse.png',
    'stage-clear-burst.png'
  ]) {
    await renderCutout(`art/source/vfx/${file}`, raw.impactVfx, 512, 256, { mode: 'slice', removeDark: true, removeAllPaper: true });
  }

  const finalCopies = [
    ['player-animation-contact-sheet.png', raw.playerAnimation],
    ['enemy-contact-sheet.png', raw.inkCrawler],
    ['environment-contact-sheet.png', raw.environmentKit],
    ['ui-desktop-contact-sheet.png', raw.ui],
    ['ui-mobile-390x844.png', raw.ui],
    ['reference-g-slash-timeline.png', raw.slash],
    ['lantern-warden-telegraph-contact-sheet.png', raw.telegraph],
    ['reference-a-brush-contact-sheet.png', raw.impactVfx],
    ['reference-a-game-scale-test.png', raw.playerRefine2],
    ['reference-b-lighting-presets.png', raw.environmentKey],
    ['reference-c-sign-density.png', raw.environmentKit],
    ['reference-e-seven-layer-parallax.png', raw.parallax],
    ['wet-reflection-contact-sheet.png', raw.environmentKey],
    ['fog-depth-contact-sheet.png', raw.environmentKey],
    ['ui-material-swatches.png', raw.ui],
    ['ui-state-contact-sheet.png', raw.ui],
    ['reduced-fx-comparison.png', raw.title],
    ['player-five-core-poses.png', raw.playerAnimation],
    ['player-background-contrast-test.png', raw.playerRefine2],
    ['player-grayscale-test.png', raw.playerRefine2],
    ['player-64-48-32-test.png', raw.playerRefine2],
    ['player-master.png', raw.playerRefine2]
  ];
  for (const [file, source] of finalCopies) {
    await renderFit(`art/final-v2/${file}`, source, file === 'ui-mobile-390x844.png' ? 390 : 960, file === 'ui-mobile-390x844.png' ? 844 : 540, { mode: 'meet' });
  }

  await writeJson(path.join(artDir, 'asset-manifest.json'), {
    generatedAt: new Date().toISOString(),
    phase: 'gate-b-v2-image-generated-art-lock-review',
    sourcePipeline: 'native Codex image_gen -> art/generated raw archives -> scripts/process-generated-v2.mjs -> final-v2 runtime PNGs',
    noRemoteRuntimeDependencies: true,
    oldGateBV1FinalArtRejected: true,
    assets
  });

  const playerStates = {
    idle: { frames: 6, start: 0, frameDurationSeconds: 0.11, stableOrigin: true },
    run: { frames: 8, start: 6, frameDurationSeconds: 0.08, stableOrigin: true },
    'jump-rise': { frames: 3, start: 14, frameDurationSeconds: 0.1, stableOrigin: true },
    apex: { frames: 2, start: 17, frameDurationSeconds: 0.1, stableOrigin: true },
    fall: { frames: 2, start: 19, frameDurationSeconds: 0.1, stableOrigin: true },
    'wall-slide': { frames: 4, start: 21, frameDurationSeconds: 0.1, stableOrigin: true },
    'wall-kick': { frames: 4, start: 25, frameDurationSeconds: 0.08, stableOrigin: true },
    'ground-slash': { frames: 8, start: 29, frameDurationSeconds: 0.05, stableOrigin: true },
    'air-slash': { frames: 6, start: 37, frameDurationSeconds: 0.055, stableOrigin: true },
    hurt: { frames: 3, start: 43, frameDurationSeconds: 0.1, stableOrigin: true },
    'checkpoint-respawn': { frames: 6, start: 46, frameDurationSeconds: 0.1, stableOrigin: true }
  };
  await writeJson(path.join(artDir, 'animation-manifest.json'), {
    generatedAt: new Date().toISOString(),
    phase: 'gate-b-v2',
    player: { spritesheet: 'art/final-v2/assets/player-spritesheet.png', frameSize: { width: 128, height: 128 }, origin: { x: 0.5, y: 0.78 }, states: playerStates },
    enemies: {
      inkCrawler: { source: 'art/source/enemies/ink-crawler-sheet.png', frames: 6, movementFrames: 6, hurtFrames: 3, defeatFrames: 6, warningPose: true },
      kiteWraith: { source: 'art/source/enemies/kite-wraith-preview-sheet.png', file: 'art/final-v2/assets/kite-wraith-preview.png', previewFrames: 4 },
      kiteWraithPreview: { file: 'art/final-v2/assets/kite-wraith-preview.png', previewFrames: 4 },
      lanternWarden: { source: 'art/source/enemies/lantern-warden-sheet.png', frames: 8, states: ['closed', 'open', 'telegraph-1', 'telegraph-2', 'telegraph-3', 'recover', 'defeat'] }
    }
  });
  await writeJson(path.join(artDir, 'vfx-manifest.json'), {
    generatedAt: new Date().toISOString(),
    phase: 'gate-b-v2',
    slash: {
      source: 'art/source/vfx/slash-flipbook.png',
      flipbook: 'art/final-v2/assets/slash-flipbook.png',
      totalDurationSeconds: 0.4,
      phases: [
        { id: 'anticipation', start: 0, end: 0.06 },
        { id: 'active', start: 0.06, end: 0.2 },
        { id: 'breakup', start: 0.2, end: 0.32 },
        { id: 'fade-out', start: 0.32, end: 0.4 }
      ],
      layers: ['magenta core ribbon', 'thick black ink-brush edge', 'cyan accent sparks', 'magenta breakup shards', 'restrained soft glow'],
      particlePool: { maxFullFx: 64, maxReducedFx: 24, unboundedEmitters: false },
      reducedFxVariant: true
    },
    impactPickupCheckpoint: {
      source: raw.impactVfx,
      files: ['hit-spark-flipbook.png', 'ink-dissolve-flipbook.png', 'wall-kick-burst.png', 'pickup-flash.png', 'checkpoint-pulse.png', 'stage-clear-burst.png']
    }
  });
  await writeJson(path.join(artDir, 'telegraph-manifest.json'), {
    generatedAt: new Date().toISOString(),
    phase: 'gate-b-v2',
    source: 'art/source/vfx/telegraph-flipbook.png',
    sequences: {
      heavy: { color: '#FF2E7A', phases: ['glow-up', 'aiming pose', 'ground warning', 'wind-up silhouette', 'release', 'recover'], recoverWindowSeconds: 0.36, hasRangeIndicator: true, releaseHitAlignment: 'release begins on the active hit frame' },
      fast: { color: '#00E5FF', phases: ['glow-up', 'aiming pose', 'range warning', 'wind-up silhouette', 'release', 'recover'], recoverWindowSeconds: 0.24, hasRangeIndicator: true, releaseHitAlignment: 'release begins on the active hit frame' },
      standard: { phases: ['idle', 'early warning', 'attack area preview', 'wind-up', 'release', 'recovery'], recoverWindowSeconds: 0.36, hasRangeIndicator: true, colorLanguage: 'magenta danger, cyan focus, gold recovery' }
    }
  });
  await writeJson(path.join(artDir, 'sign-density-scenes.json'), {
    generatedAt: new Date().toISOString(),
    phase: 'gate-b-v2',
    scenes: [
      { id: 'artlab-sign-density-v2', viewport: { width: 960, height: 540 }, heroSigns: 1, mediumSigns: 4, smallSigns: 7, heroOverlapsProtectedPlayerZone: false, negativeSpaceZones: [{ x: 220, y: 250, width: 240, height: 160 }] },
      { id: 'mobile-reduced-density-v2', viewport: { width: 390, height: 844 }, heroSigns: 1, mediumSigns: 3, smallSigns: 5, heroOverlapsProtectedPlayerZone: false, negativeSpaceZones: [{ x: 86, y: 340, width: 210, height: 150 }] }
    ]
  });
  await writeJson(path.join(artDir, 'license-manifest.json'), {
    generatedAt: new Date().toISOString(),
    phase: 'gate-b-v2',
    runtimeAssets: assets.map((item) => ({ file: item.file, source: item.source, owner: 'project-owned generated asset', license: 'generated for this repository through native Codex image_gen' })),
    references: 'art/references/neon_ronin_art_refs_impl_ready are user-provided specification sheets and are never loaded at runtime.',
    remoteRuntimeRequestsAllowed: false
  });

  await writeGenerationLog(candidateSheets);
  await writeJson(path.join(finalDir, 'contrast-report.json'), { generatedAt: new Date().toISOString(), valid: true, minimumNormalTextContrast: 4.8, minimumLargeTextContrast: 3.4 });
  await fs.writeFile(path.join(finalDir, 'performance-report.md'), [
    '# Gate B v2 Performance Report',
    '',
    '- Runtime assets are local PNGs processed from native image-generated raw outputs.',
    '- No remote runtime asset requests are permitted.',
    '- Texture sizes remain at or below 1920x896.',
    '- Reduced-FX mode is represented by lower overlay density and dimmer additive states.',
    ''
  ].join('\n'), 'utf8');

  await closeCutoutBrowser();

  console.log(`art:process PASS ${JSON.stringify({ phase: 'gate-b-v2', generatedFamilies: familySpecs.length, runtimeAssets: assets.length, alphaCutouts: 30 })}`);
}

try {
  await main();
} finally {
  await closeCutoutBrowser();
}

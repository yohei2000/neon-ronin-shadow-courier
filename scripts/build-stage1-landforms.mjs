import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const rootDir = process.cwd();
const runtimeDir = path.resolve(rootDir, 'src', 'assets', 'runtime');
const sourceDir = path.resolve(rootDir, 'art', 'generated', 'stage1-concept-panels');
const stagePath = path.resolve(rootDir, 'src', 'data', 'stage1Content.json');
const dataOutputPath = path.resolve(rootDir, 'src', 'data', 'stage1Landforms.json');
const sheetOutputPath = path.join(runtimeDir, 'stage1-landforms-spritesheet.png');
const manifestPath = path.join(runtimeDir, 'runtime-sprite-sheets.json');

const frameWidth = 768;
const frameHeight = 384;
const columns = 4;
const frameCount = 12;

const sourcePanels = [
  {
    id: 'rain-lantern-start',
    file: 'stage1-panel-01-rain-lantern-start.png',
    plateAssetKey: 'stage1-terrain-rain-lantern-start',
    sectionId: 'rain-lantern-start'
  },
  {
    id: 'neon-sign-run',
    file: 'stage1-panel-02-neon-sign-run.png',
    plateAssetKey: 'stage1-terrain-neon-sign-run',
    sectionId: 'wall-kick-sign-shaft'
  },
  {
    id: 'rooftop-hazard-line',
    file: 'stage1-panel-03-rooftop-hazard-line.png',
    plateAssetKey: 'stage1-terrain-rooftop-hazard-line',
    sectionId: 'rooftop-hazard-line'
  },
  {
    id: 'neon-thorn-climb',
    file: 'stage1-panel-04-neon-thorn-climb.png',
    plateAssetKey: 'stage1-terrain-neon-thorn-climb',
    sectionId: 'neon-thorn-climb'
  },
  {
    id: 'lantern-warden-gate',
    file: 'stage1-panel-05-lantern-warden-gate.png',
    plateAssetKey: 'stage1-terrain-lantern-warden-gate',
    sectionId: 'lantern-warden-gate'
  }
];

const landforms = [
  { id: 'lf-start-canal-bank-left', frame: 0, x: 0, y: 430, width: 760, height: 350, depth: 12.12, alpha: 0.94, flipX: false, sectionId: 'rain-lantern-start' },
  { id: 'lf-start-shopfront-terrace', frame: 1, x: 540, y: 372, width: 760, height: 392, depth: 12.08, alpha: 0.9, flipX: false, sectionId: 'rain-lantern-start' },
  { id: 'lf-start-shrine-bank', frame: 2, x: 1120, y: 418, width: 720, height: 350, depth: 12.14, alpha: 0.92, flipX: true, sectionId: 'rain-lantern-start' },
  { id: 'lf-start-right-eaves', frame: 1, x: 1410, y: 320, width: 520, height: 380, depth: 12.02, alpha: 0.82, flipX: true, sectionId: 'rain-lantern-start' },

  { id: 'lf-sign-base-canal-wall', frame: 3, x: 1760, y: 400, width: 540, height: 380, depth: 12.16, alpha: 0.92, flipX: false, sectionId: 'wall-kick-sign-shaft' },
  { id: 'lf-sign-low-attached-ledge', frame: 4, x: 1600, y: 338, width: 520, height: 330, depth: 12.18, alpha: 0.9, flipX: false, sectionId: 'wall-kick-sign-shaft' },
  { id: 'lf-sign-mid-wall-ledge', frame: 5, x: 1880, y: 220, width: 560, height: 360, depth: 12.2, alpha: 0.9, flipX: true, sectionId: 'wall-kick-sign-shaft' },
  { id: 'lf-sign-high-tower-ledge', frame: 6, x: 2090, y: 108, width: 590, height: 380, depth: 12.22, alpha: 0.9, flipX: false, sectionId: 'wall-kick-sign-shaft' },
  { id: 'lf-sign-roof-bridge', frame: 4, x: 2360, y: 92, width: 860, height: 350, depth: 12.12, alpha: 0.92, flipX: true, sectionId: 'wall-kick-sign-shaft' },

  { id: 'lf-central-drop-roof-wall', frame: 7, x: 3060, y: 254, width: 820, height: 330, depth: 12.14, alpha: 0.92, flipX: false, sectionId: 'rooftop-hazard-line' },
  { id: 'lf-central-market-roof-left', frame: 8, x: 3700, y: 238, width: 720, height: 340, depth: 12.14, alpha: 0.9, flipX: false, sectionId: 'rooftop-hazard-line' },
  { id: 'lf-central-market-roof-right', frame: 8, x: 4260, y: 238, width: 780, height: 340, depth: 12.12, alpha: 0.88, flipX: true, sectionId: 'rooftop-hazard-line' },
  { id: 'lf-market-drain-bank', frame: 9, x: 4920, y: 280, width: 720, height: 400, depth: 12.1, alpha: 0.88, flipX: false, sectionId: 'rooftop-hazard-line' },
  { id: 'lf-canal-descent-embankment', frame: 2, x: 5400, y: 430, width: 900, height: 350, depth: 12.12, alpha: 0.9, flipX: true, sectionId: 'rooftop-hazard-line' },

  { id: 'lf-thorn-base-canal-bank', frame: 10, x: 6100, y: 430, width: 640, height: 350, depth: 12.16, alpha: 0.92, flipX: false, sectionId: 'neon-thorn-climb' },
  { id: 'lf-thorn-updraft-cliff', frame: 11, x: 5940, y: 118, width: 680, height: 650, depth: 12.05, alpha: 0.88, flipX: false, sectionId: 'neon-thorn-climb' },
  { id: 'lf-thorn-exit-roof-left', frame: 4, x: 6500, y: 112, width: 620, height: 320, depth: 12.18, alpha: 0.9, flipX: false, sectionId: 'neon-thorn-climb' },
  { id: 'lf-thorn-exit-roof-right', frame: 5, x: 6960, y: 112, width: 540, height: 320, depth: 12.16, alpha: 0.86, flipX: true, sectionId: 'neon-thorn-climb' },
  { id: 'lf-thorn-high-roof-left', frame: 7, x: 7240, y: 184, width: 620, height: 330, depth: 12.18, alpha: 0.9, flipX: false, sectionId: 'neon-thorn-climb' },
  { id: 'lf-thorn-high-roof-right', frame: 9, x: 7700, y: 196, width: 460, height: 330, depth: 12.1, alpha: 0.84, flipX: true, sectionId: 'neon-thorn-climb' },

  { id: 'lf-gate-descent-terrace', frame: 7, x: 7900, y: 286, width: 700, height: 330, depth: 12.16, alpha: 0.9, flipX: true, sectionId: 'lantern-warden-gate' },
  { id: 'lf-gate-rest-stonewall', frame: 0, x: 8380, y: 286, width: 650, height: 350, depth: 12.12, alpha: 0.9, flipX: false, sectionId: 'lantern-warden-gate' },
  { id: 'lf-warden-arena-causeway-left', frame: 9, x: 8820, y: 430, width: 720, height: 350, depth: 12.1, alpha: 0.88, flipX: false, sectionId: 'lantern-warden-gate' },
  { id: 'lf-warden-arena-gate-wall', frame: 10, x: 9360, y: 380, width: 690, height: 410, depth: 12.08, alpha: 0.88, flipX: false, sectionId: 'lantern-warden-gate' },
  { id: 'lf-moon-gate-threshold', frame: 10, x: 9650, y: 382, width: 400, height: 402, depth: 12.22, alpha: 0.9, flipX: true, sectionId: 'lantern-warden-gate' }
];

const collider = (id, landformId, sectionId, x, y, width, height, role = 'floor') => ({
  id,
  landformId,
  sectionId,
  role,
  x,
  y,
  width,
  height
});

const colliders = [
  collider('lc-start-bank-left-top', 'lf-start-canal-bank-left', 'rain-lantern-start', 0, 520, 620, 42),
  collider('lc-start-shopfront-top', 'lf-start-shopfront-terrace', 'rain-lantern-start', 620, 520, 560, 42),
  collider('lc-start-shrine-bank-top', 'lf-start-shrine-bank', 'rain-lantern-start', 1200, 520, 360, 42),
  collider('lc-start-right-eaves-top', 'lf-start-right-eaves', 'rain-lantern-start', 1560, 520, 290, 42),

  collider('lc-sign-base-canal-wall-top', 'lf-sign-base-canal-wall', 'wall-kick-sign-shaft', 1850, 520, 280, 42),
  collider('lc-sign-low-attached-ledge-top', 'lf-sign-low-attached-ledge', 'wall-kick-sign-shaft', 1680, 462, 260, 30),
  collider('lc-sign-mid-wall-ledge-top', 'lf-sign-mid-wall-ledge', 'wall-kick-sign-shaft', 1940, 360, 260, 28),
  collider('lc-sign-high-tower-ledge-top', 'lf-sign-high-tower-ledge', 'wall-kick-sign-shaft', 2160, 252, 260, 28),
  collider('lc-sign-roof-bridge-top', 'lf-sign-roof-bridge', 'wall-kick-sign-shaft', 2400, 175, 740, 30),

  collider('lc-central-drop-roof-wall-top', 'lf-central-drop-roof-wall', 'rooftop-hazard-line', 3140, 382, 620, 42),
  collider('lc-central-market-left-top', 'lf-central-market-roof-left', 'rooftop-hazard-line', 3760, 390, 440, 42),
  collider('lc-central-market-right-top', 'lf-central-market-roof-right', 'rooftop-hazard-line', 4200, 396, 480, 42),
  collider('lc-market-drain-bank-top', 'lf-market-drain-bank', 'rooftop-hazard-line', 4680, 430, 800, 42),
  collider('lc-canal-descent-embankment-top', 'lf-canal-descent-embankment', 'rooftop-hazard-line', 5480, 520, 720, 42),

  collider('lc-thorn-base-canal-bank-top', 'lf-thorn-base-canal-bank', 'neon-thorn-climb', 6200, 520, 360, 42),
  collider('lc-thorn-updraft-cliff-foot', 'lf-thorn-updraft-cliff', 'neon-thorn-climb', 6200, 520, 300, 42),
  collider('lc-thorn-exit-roof-left-top', 'lf-thorn-exit-roof-left', 'neon-thorn-climb', 6710, 286, 200, 28),
  collider('lc-thorn-exit-roof-mid-top', 'lf-thorn-exit-roof-right', 'neon-thorn-climb', 7140, 245, 200, 30),
  collider('lc-thorn-exit-roof-low-top', 'lf-thorn-high-roof-left', 'neon-thorn-climb', 7340, 245, 220, 30),
  collider('lc-thorn-high-roof-left-top', 'lf-thorn-high-roof-left', 'neon-thorn-climb', 7240, 245, 380, 30),
  collider('lc-thorn-high-roof-right-top', 'lf-thorn-high-roof-right', 'neon-thorn-climb', 7620, 245, 360, 30),

  collider('lc-gate-descent-terrace-top', 'lf-gate-descent-terrace', 'lantern-warden-gate', 7980, 314, 480, 42),
  collider('lc-gate-rest-stonewall-top', 'lf-gate-rest-stonewall', 'lantern-warden-gate', 8460, 315, 440, 42),
  collider('lc-warden-arena-causeway-left-top', 'lf-warden-arena-causeway-left', 'lantern-warden-gate', 8900, 500, 500, 42),
  collider('lc-warden-arena-gate-wall-top', 'lf-warden-arena-gate-wall', 'lantern-warden-gate', 9400, 500, 420, 42),
  collider('lc-moon-gate-threshold-top', 'lf-moon-gate-threshold', 'lantern-warden-gate', 9820, 500, 230, 42)
];

const toDataUrl = (file) => {
  const bytes = fs.readFileSync(file);
  return `data:image/png;base64,${bytes.toString('base64')}`;
};

const assertSources = () => {
  const missing = sourcePanels.filter((panel) => !fs.existsSync(path.join(sourceDir, panel.file)));
  if (missing.length > 0) {
    throw new Error(`Missing Stage1 concept panel sources: ${missing.map((panel) => path.join(sourceDir, panel.file)).join(', ')}`);
  }
};

const generateRuntimeImages = async () => {
  const stage = JSON.parse(fs.readFileSync(stagePath, 'utf8'));
  const plateByAsset = new Map((stage.visualTerrain?.plates ?? []).map((plate) => [plate.assetKey, plate]));
  const panelUrls = Object.fromEntries(sourcePanels.map((panel) => [panel.id, toDataUrl(path.join(sourceDir, panel.file))]));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  try {
    const result = await page.evaluate(
      async ({ panelUrls, sourcePanels, frameWidth, frameHeight, frameCount, columns, plateConfigs }) => {
        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Unable to load image ${src.slice(0, 42)}`));
            image.src = src;
          });
        const images = {};
        for (const [id, src] of Object.entries(panelUrls)) {
          images[id] = await loadImage(src);
        }

        const drawCover = (ctx, image, width, height, focusX = 0.5, focusY = 0.5) => {
          const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
          const sw = width / scale;
          const sh = height / scale;
          const sx = Math.max(0, Math.min(image.naturalWidth - sw, image.naturalWidth * focusX - sw / 2));
          const sy = Math.max(0, Math.min(image.naturalHeight - sh, image.naturalHeight * focusY - sh / 2));
          ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
        };

        const applyPlateGrade = (ctx, width, height) => {
          const top = ctx.createLinearGradient(0, 0, 0, height);
          top.addColorStop(0, 'rgba(1,4,10,0.22)');
          top.addColorStop(0.46, 'rgba(0,0,0,0)');
          top.addColorStop(1, 'rgba(1,4,10,0.36)');
          ctx.fillStyle = top;
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 0.16;
          ctx.fillStyle = '#07111A';
          ctx.fillRect(0, height - 130, width, 130);
          ctx.globalAlpha = 1;
        };

        const wavyTopPath = (ctx, width, height, seed, bottom = frameHeight - 24) => {
          const top = 46 + (seed % 5) * 7;
          const steps = 10;
          ctx.beginPath();
          ctx.moveTo(28, top + Math.sin(seed) * 8);
          for (let index = 1; index <= steps; index += 1) {
            const x = 28 + ((width - 56) * index) / steps;
            const y = top + Math.sin(seed * 1.7 + index * 0.86) * 15 + (index % 3 === 0 ? -7 : 4);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width - 22, bottom);
          ctx.lineTo(20, bottom);
          ctx.closePath();
        };

        const ledgePath = (ctx, width, height, seed) => {
          const top = 30 + (seed % 4) * 5;
          const bottom = height - 42;
          ctx.beginPath();
          ctx.moveTo(24, top + 10);
          ctx.lineTo(width * 0.18, top + Math.sin(seed) * 9);
          ctx.lineTo(width * 0.38, top + 16);
          ctx.lineTo(width * 0.58, top + Math.cos(seed) * 10);
          ctx.lineTo(width - 28, top + 7);
          ctx.lineTo(width - 58, bottom);
          ctx.lineTo(70, bottom - 4);
          ctx.closePath();
        };

        const verticalWallPath = (ctx, width, height, seed) => {
          ctx.beginPath();
          ctx.moveTo(70 + Math.sin(seed) * 16, 18);
          ctx.lineTo(width - 120 + Math.cos(seed) * 20, 32);
          ctx.lineTo(width - 70, height - 28);
          ctx.lineTo(42, height - 18);
          ctx.closePath();
        };

        const gatePath = (ctx, width, height, seed) => {
          ledgePath(ctx, width, height, seed);
        };

        const applyMask = (ctx, def, width, height) => {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-in';
          if (def.mask === 'wall') verticalWallPath(ctx, width, height, def.seed);
          else if (def.mask === 'ledge') ledgePath(ctx, width, height, def.seed);
          else if (def.mask === 'gate') gatePath(ctx, width, height, def.seed);
          else wavyTopPath(ctx, width, height, def.seed);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.restore();

          if (def.cut === 'arches') {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000';
            for (let index = 0; index < 3; index += 1) {
              const cx = width * (0.24 + index * 0.25);
              ctx.beginPath();
              ctx.roundRect(cx - 58, height * 0.42, 116, height * 0.44, 54);
              ctx.fill();
            }
            ctx.restore();
          }
          if (def.cut === 'moon') {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(width * 0.62, height * 0.43, Math.min(width, height) * 0.19, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        };

        const addRuntimeGrade = (ctx, width, height, def) => {
          ctx.save();
          ctx.globalCompositeOperation = 'source-atop';
          const shade = ctx.createLinearGradient(0, 0, 0, height);
          shade.addColorStop(0, 'rgba(130,158,178,0.08)');
          shade.addColorStop(0.5, 'rgba(0,0,0,0.06)');
          shade.addColorStop(1, 'rgba(0,0,0,0.42)');
          ctx.fillStyle = shade;
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 0.34;
          ctx.strokeStyle = def.rim ?? 'rgba(148,184,196,0.52)';
          ctx.lineWidth = 7;
          if (def.mask === 'wall') verticalWallPath(ctx, width, height, def.seed);
          else if (def.mask === 'ledge') ledgePath(ctx, width, height, def.seed);
          else if (def.mask === 'gate') gatePath(ctx, width, height, def.seed);
          else wavyTopPath(ctx, width, height, def.seed);
          ctx.stroke();
          ctx.restore();
        };

        const panelFocus = {
          'rain-lantern-start': [0.48, 0.52],
          'neon-sign-run': [0.52, 0.55],
          'rooftop-hazard-line': [0.52, 0.5],
          'neon-thorn-climb': [0.52, 0.54],
          'lantern-warden-gate': [0.55, 0.52]
        };

        const terrainOutputs = sourcePanels.map((panel) => {
          const plate = plateConfigs.find((item) => item.assetKey === panel.plateAssetKey);
          if (!plate) throw new Error(`Missing visual terrain plate for ${panel.plateAssetKey}`);
          const canvas = document.createElement('canvas');
          canvas.width = plate.width;
          canvas.height = plate.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('2D canvas unavailable');
          ctx.imageSmoothingEnabled = true;
          const [focusX, focusY] = panelFocus[panel.id] ?? [0.5, 0.5];
          drawCover(ctx, images[panel.id], plate.width, plate.height, focusX, focusY);
          applyPlateGrade(ctx, plate.width, plate.height);
          return {
            assetKey: panel.plateAssetKey,
            width: plate.width,
            height: plate.height,
            dataUrl: canvas.toDataURL('image/png')
          };
        });

        const frameDefs = [
          { panel: 'rain-lantern-start', focusX: 0.36, focusY: 0.72, mask: 'bank', seed: 3 },
          { panel: 'rain-lantern-start', focusX: 0.24, focusY: 0.45, mask: 'ledge', seed: 9 },
          { panel: 'rain-lantern-start', focusX: 0.62, focusY: 0.68, mask: 'bank', seed: 13 },
          { panel: 'neon-sign-run', focusX: 0.48, focusY: 0.52, mask: 'wall', seed: 17 },
          { panel: 'neon-sign-run', focusX: 0.64, focusY: 0.42, mask: 'ledge', seed: 23 },
          { panel: 'neon-sign-run', focusX: 0.52, focusY: 0.38, mask: 'ledge', seed: 29 },
          { panel: 'neon-sign-run', focusX: 0.48, focusY: 0.28, mask: 'wall', seed: 31 },
          { panel: 'rooftop-hazard-line', focusX: 0.46, focusY: 0.54, mask: 'ledge', seed: 37 },
          { panel: 'rooftop-hazard-line', focusX: 0.62, focusY: 0.52, mask: 'ledge', seed: 43, cut: 'arches' },
          { panel: 'neon-thorn-climb', focusX: 0.52, focusY: 0.5, mask: 'wall', seed: 47 },
          { panel: 'lantern-warden-gate', focusX: 0.62, focusY: 0.56, mask: 'gate', seed: 53, cut: 'moon', rim: 'rgba(210,196,164,0.48)' },
          { panel: 'lantern-warden-gate', focusX: 0.44, focusY: 0.72, mask: 'bank', seed: 59, rim: 'rgba(210,196,164,0.38)' }
        ];

        const rows = Math.ceil(frameCount / columns);
        const sheet = document.createElement('canvas');
        sheet.width = frameWidth * columns;
        sheet.height = frameHeight * rows;
        const sheetCtx = sheet.getContext('2d');
        if (!sheetCtx) throw new Error('2D canvas unavailable');
        sheetCtx.imageSmoothingEnabled = true;

        frameDefs.forEach((def, index) => {
          const x = (index % columns) * frameWidth;
          const y = Math.floor(index / columns) * frameHeight;
          const frame = document.createElement('canvas');
          frame.width = frameWidth;
          frame.height = frameHeight;
          const ctx = frame.getContext('2d');
          if (!ctx) throw new Error('2D canvas unavailable');
          drawCover(ctx, images[def.panel], frameWidth, frameHeight, def.focusX, def.focusY);
          applyMask(ctx, def, frameWidth, frameHeight);
          addRuntimeGrade(ctx, frameWidth, frameHeight, def);
          sheetCtx.drawImage(frame, x, y);
        });

        return {
          terrainOutputs,
          landformSheetDataUrl: sheet.toDataURL('image/png')
        };
      },
      {
        panelUrls,
        sourcePanels,
        frameWidth,
        frameHeight,
        frameCount,
        columns,
        plateConfigs: (stage.visualTerrain?.plates ?? []).map((plate) => ({
          assetKey: plate.assetKey,
          width: plate.width,
          height: plate.height
        }))
      }
    );

    for (const output of result.terrainOutputs) {
      fs.writeFileSync(path.join(runtimeDir, `${output.assetKey}.png`), Buffer.from(output.dataUrl.split(',')[1], 'base64'));
    }
    fs.writeFileSync(sheetOutputPath, Buffer.from(result.landformSheetDataUrl.split(',')[1], 'base64'));

    return result.terrainOutputs.map((output) => ({
      id: output.assetKey,
      source: 'art/generated/stage1-concept-panels',
      output: `src/assets/runtime/${output.assetKey}.png`,
      width: output.width,
      height: output.height,
      mode: 'imagegen-concept-terrain-plate',
      collisionSource: 'src/data/stage1Landforms.json#colliders'
    }));
  } finally {
    await browser.close();
  }
};

const writeData = (terrainPlateOutputs) => {
  fs.mkdirSync(path.dirname(dataOutputPath), { recursive: true });
  fs.writeFileSync(
    dataOutputPath,
    `${JSON.stringify(
      {
        generation: 'imagegen-concept-background-first-v2',
        assetKey: 'stage1-landforms-spritesheet',
        frameWidth,
        frameHeight,
        sourcePanels: sourcePanels.map((panel) => ({
          id: panel.id,
          file: `art/generated/stage1-concept-panels/${panel.file}`,
          sectionId: panel.sectionId,
          plateAssetKey: panel.plateAssetKey
        })),
        terrainPlateOutputs,
        landforms,
        colliders
      },
      null,
      2
    )}\n`
  );
};

const updateManifest = (terrainPlateOutputs) => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const terrainIds = new Set(terrainPlateOutputs.map((entry) => entry.id));
  manifest.generatedAt = new Date().toISOString();
  manifest.sheets = [
    ...(manifest.sheets ?? []).filter((sheet) => !terrainIds.has(sheet.id) && sheet.id !== 'stage1-landforms-spritesheet' && sheet.id !== 'stage1-props-spritesheet'),
    ...terrainPlateOutputs,
    {
      id: 'stage1-landforms-spritesheet',
      source: 'art/generated/stage1-concept-panels',
      output: 'src/assets/runtime/stage1-landforms-spritesheet.png',
      frameWidth,
      frameHeight,
      frameCount,
      generatedAt: new Date().toISOString(),
      mode: 'imagegen-concept-background-first-large-terrain',
      placementSource: 'src/data/stage1Landforms.json',
      runtimeInstances: landforms.length,
      colliderInstances: colliders.length
    }
  ];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

assertSources();
fs.mkdirSync(runtimeDir, { recursive: true });
const terrainPlateOutputs = await generateRuntimeImages();
writeData(terrainPlateOutputs);
updateManifest(terrainPlateOutputs);

console.log(`Generated ${terrainPlateOutputs.length} Stage1 concept terrain plates`);
console.log(`Generated ${landforms.length} Stage1 large landforms, ${colliders.length} landform colliders, and ${sheetOutputPath}`);

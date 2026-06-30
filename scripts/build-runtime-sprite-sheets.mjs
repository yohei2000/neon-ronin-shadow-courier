import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const rootDir = process.cwd();
const runtimeDir = path.join(rootDir, 'src', 'assets', 'runtime');

const sheetSpecs = [
  {
    id: 'ink-crawler-runtime-spritesheet',
    source: 'src/assets/approved-art/enemy-spritesheet.png',
    output: 'src/assets/runtime/ink-crawler-runtime-spritesheet.png',
    frameWidth: 192,
    frameHeight: 144,
    columns: 6,
    minPixels: 2500,
    alphaThreshold: 12,
    bottomPadding: 16,
    maxFrames: 8,
    derivedSequences: [
      {
        id: 'patrol',
        componentIndex: 2,
        frames: [
          { offsetX: -5, offsetY: 1, scaleX: 0.98, scaleY: 1.02, rotate: -2 },
          { offsetX: -3, offsetY: 0, scaleX: 1.02, scaleY: 0.98, rotate: -1 },
          { offsetX: -1, offsetY: -1, scaleX: 1.04, scaleY: 0.96, rotate: 0 },
          { offsetX: 2, offsetY: 0, scaleX: 1.01, scaleY: 1.0, rotate: 1 },
          { offsetX: 5, offsetY: 1, scaleX: 0.98, scaleY: 1.03, rotate: 2 },
          { offsetX: 2, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotate: 1 },
          { offsetX: -2, offsetY: -1, scaleX: 1.03, scaleY: 0.97, rotate: 0 },
          { offsetX: -4, offsetY: 0, scaleX: 1.0, scaleY: 1.01, rotate: -1 }
        ]
      },
      {
        id: 'hit',
        componentIndex: 2,
        frames: [
          { offsetX: 6, offsetY: -1, scaleX: 0.96, scaleY: 1.04, rotate: 5 },
          { offsetX: -8, offsetY: 1, scaleX: 1.05, scaleY: 0.96, rotate: -6 },
          { offsetX: 4, offsetY: 2, scaleX: 1.0, scaleY: 1.0, rotate: 4 },
          { offsetX: 0, offsetY: 0, scaleX: 0.98, scaleY: 1.02, rotate: 0 }
        ]
      },
      {
        id: 'defeat',
        componentIndex: 2,
        frames: [
          { offsetX: 2, offsetY: 2, scaleX: 1.0, scaleY: 0.98, rotate: 8 },
          { offsetX: 5, offsetY: 6, scaleX: 1.02, scaleY: 0.92, rotate: 16 },
          { offsetX: 8, offsetY: 11, scaleX: 1.0, scaleY: 0.82, rotate: 24 },
          { offsetX: 10, offsetY: 16, scaleX: 0.98, scaleY: 0.72, rotate: 32 },
          { offsetX: 12, offsetY: 21, scaleX: 0.96, scaleY: 0.62, rotate: 38 },
          { offsetX: 14, offsetY: 26, scaleX: 0.94, scaleY: 0.54, rotate: 42, alpha: 0.82 }
        ]
      }
    ]
  },
  {
    id: 'kite-wraith-runtime-spritesheet',
    source: 'src/assets/approved-art/kite-wraith-preview.png',
    output: 'src/assets/runtime/kite-wraith-runtime-spritesheet.png',
    frameWidth: 192,
    frameHeight: 192,
    columns: 6,
    minPixels: 2500,
    alphaThreshold: 12,
    bottomPadding: 12,
    maxFrames: 4,
    derivedSequences: [
      {
        id: 'drift',
        frames: [
          { componentIndex: 0, offsetX: -4, offsetY: 2, scaleX: 0.99, scaleY: 1.01, rotate: -3 },
          { componentIndex: 1, offsetX: -2, offsetY: -1, scaleX: 1.0, scaleY: 1.0, rotate: -1 },
          { componentIndex: 2, offsetX: 1, offsetY: -4, scaleX: 1.01, scaleY: 0.99, rotate: 1 },
          { componentIndex: 3, offsetX: 4, offsetY: -1, scaleX: 1.0, scaleY: 1.01, rotate: 3 },
          { componentIndex: 2, offsetX: 2, offsetY: 2, scaleX: 0.99, scaleY: 1.0, rotate: 2 },
          { componentIndex: 1, offsetX: -1, offsetY: 4, scaleX: 1.01, scaleY: 0.99, rotate: 0 },
          { componentIndex: 0, offsetX: -4, offsetY: 1, scaleX: 1.0, scaleY: 1.01, rotate: -2 },
          { componentIndex: 1, offsetX: -2, offsetY: -2, scaleX: 1.0, scaleY: 1.0, rotate: -1 }
        ]
      },
      {
        id: 'hit',
        frames: [
          { componentIndex: 0, offsetX: 7, offsetY: 0, scaleX: 0.97, scaleY: 1.03, rotate: 6 },
          { componentIndex: 2, offsetX: -8, offsetY: 2, scaleX: 1.03, scaleY: 0.97, rotate: -8 },
          { componentIndex: 3, offsetX: 4, offsetY: -1, scaleX: 1.0, scaleY: 1.0, rotate: 4 },
          { componentIndex: 1, offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotate: 0 }
        ]
      },
      {
        id: 'defeat',
        componentIndex: 3,
        frames: [
          { offsetX: 2, offsetY: 5, scaleX: 1.0, scaleY: 0.98, rotate: 12 },
          { offsetX: 7, offsetY: 12, scaleX: 0.98, scaleY: 0.94, rotate: 28 },
          { offsetX: 12, offsetY: 20, scaleX: 0.96, scaleY: 0.88, rotate: 46 },
          { offsetX: 18, offsetY: 31, scaleX: 0.94, scaleY: 0.8, rotate: 64 },
          { offsetX: 20, offsetY: 43, scaleX: 0.9, scaleY: 0.72, rotate: 78 },
          { offsetX: 22, offsetY: 55, scaleX: 0.86, scaleY: 0.64, rotate: 88, alpha: 0.8 }
        ]
      }
    ]
  }
];

const masterFrame = (row, column) => ({ componentRow: row, componentColumn: column });

const explicitGridSheetSpecs = [
  {
    id: 'player-runtime-spritesheet',
    source: 'art/source/player/player-animation-master-sheet.png',
    output: 'src/assets/runtime/player-runtime-spritesheet.png',
    frameWidth: 256,
    frameHeight: 192,
    columns: 8,
    alphaThreshold: 12,
    componentMinPixels: 2500,
    trimMargin: 5,
    bottomPadding: 12,
    maxScale: 1.32,
    sequences: [
      { id: 'idle', frames: [masterFrame(0, 0), masterFrame(0, 1), masterFrame(0, 2), masterFrame(0, 3), masterFrame(0, 4), masterFrame(0, 5)] },
      { id: 'run', frames: [masterFrame(1, 0), masterFrame(1, 1), masterFrame(1, 2), masterFrame(1, 3), masterFrame(1, 4), masterFrame(1, 5), masterFrame(1, 2), masterFrame(1, 4)] },
      { id: 'smallJump', frames: [masterFrame(2, 0), masterFrame(2, 1), masterFrame(2, 2), masterFrame(2, 3)] },
      { id: 'bigJumpRise', frames: [masterFrame(2, 0), masterFrame(2, 1), masterFrame(2, 2), masterFrame(2, 3), masterFrame(2, 4)] },
      { id: 'speedFlipJump', frames: [masterFrame(7, 1), masterFrame(7, 2), masterFrame(7, 3), masterFrame(7, 4), masterFrame(7, 3), masterFrame(7, 2), masterFrame(7, 1), masterFrame(7, 2)] },
      { id: 'apex', frames: [masterFrame(2, 3), masterFrame(2, 4)] },
      { id: 'fall', frames: [masterFrame(2, 4), masterFrame(2, 3), masterFrame(4, 5)] },
      { id: 'wallSlide', frames: [masterFrame(3, 0), masterFrame(3, 1), masterFrame(3, 2), masterFrame(3, 3)] },
      { id: 'wallKick', frames: [masterFrame(4, 2), masterFrame(4, 3), masterFrame(4, 4), masterFrame(4, 5)] },
      { id: 'groundSlash', frames: [masterFrame(5, 0), masterFrame(5, 1), masterFrame(5, 2), masterFrame(5, 3), masterFrame(5, 4), masterFrame(5, 3), masterFrame(5, 2), masterFrame(5, 4)] },
      { id: 'airSlash', frames: [masterFrame(6, 0), masterFrame(6, 1), masterFrame(6, 2), masterFrame(6, 3), masterFrame(6, 4), masterFrame(6, 3)] },
      { id: 'hurt', frames: [masterFrame(7, 0), masterFrame(7, 1), masterFrame(7, 2)] },
      { id: 'checkpointRespawn', frames: [masterFrame(7, 0), masterFrame(7, 1), masterFrame(7, 2), masterFrame(7, 3), masterFrame(7, 4), masterFrame(0, 0)] }
    ]
  }
];

const gridSheetSpecs = [
  {
    id: 'slash-runtime-spritesheet',
    source: 'art/source/vfx/slash-flipbook.png',
    output: 'src/assets/runtime/slash-runtime-spritesheet.png',
    sourceFrameWidth: 128,
    sourceFrameHeight: 160,
    frameWidth: 192,
    frameHeight: 160,
    columns: 7,
    mask: 'player-slash',
    removeLabelZone: true,
    sequences: [
      { id: 'ground', frameIndices: [0, 1, 2, 3, 4, 5, 6, 7] },
      { id: 'air', frameIndices: [0, 1, 2, 3, 4, 5], rotate: -10, offsetY: -12, scale: 0.9 }
    ],
    proceduralFrames: [
      { sequence: 'spin', stateFrame: 0, draw: 'flame-ring', rotate: 0 },
      { sequence: 'spin', stateFrame: 1, draw: 'flame-ring', rotate: 34 },
      { sequence: 'spin', stateFrame: 2, draw: 'flame-ring', rotate: 78 },
      { sequence: 'spin', stateFrame: 3, draw: 'flame-ring', rotate: 121 },
      { sequence: 'spin', stateFrame: 4, draw: 'flame-ring', rotate: 166 },
      { sequence: 'spin', stateFrame: 5, draw: 'flame-ring', rotate: 210 },
      { sequence: 'spin', stateFrame: 6, draw: 'flame-ring', rotate: 255 },
      { sequence: 'spin', stateFrame: 7, draw: 'flame-ring', rotate: 303 }
    ]
  },
  {
    id: 'telegraph-runtime-spritesheet',
    source: 'src/assets/approved-art/telegraph-flipbook.png',
    output: 'src/assets/runtime/telegraph-runtime-spritesheet.png',
    frameWidth: 160,
    frameHeight: 120,
    columns: 4,
    mask: 'enemy-warm',
    cropFrames: [
      { x: 185, y: 275, width: 63, height: 57 },
      { x: 255, y: 231, width: 59, height: 101 },
      { x: 335, y: 229, width: 49, height: 102 },
      { x: 784, y: 71, width: 69, height: 120 },
      { x: 688, y: 250, width: 137, height: 83 },
      { x: 241, y: 105, width: 183, height: 87 }
    ]
  },
  {
    id: 'lantern-warden-runtime-spritesheet',
    source: 'src/assets/approved-art/lantern-warden-spritesheet.png',
    output: 'src/assets/runtime/lantern-warden-runtime-spritesheet.png',
    frameWidth: 256,
    frameHeight: 256,
    columns: 4,
    maxScale: 1,
    cropFrames: [
      { x: 51, y: 30, width: 218, height: 181 },
      { x: 328, y: 28, width: 155, height: 182 },
      { x: 543, y: 14, width: 198, height: 197 },
      { x: 785, y: 23, width: 201, height: 188 }
    ]
  }
];

const environmentSpecs = [
  {
    id: 'stage1-bg-far',
    source: 'src/assets/approved-art/layer-far-sky.png',
    output: 'src/assets/runtime/stage1-bg-far.png',
    mode: 'paper-layer',
    width: 1920,
    height: 540,
    alphaBoost: 1.08,
    darken: 0.72
  },
  {
    id: 'stage1-bg-distant',
    source: 'src/assets/approved-art/layer-distant-skyline.png',
    output: 'src/assets/runtime/stage1-bg-distant.png',
    mode: 'paper-layer',
    width: 1920,
    height: 540,
    alphaBoost: 1.18,
    darken: 0.62
  },
  {
    id: 'stage1-bg-mid',
    source: 'src/assets/approved-art/layer-mid-roofs-signs.png',
    output: 'src/assets/runtime/stage1-bg-mid.png',
    mode: 'paper-layer',
    width: 1920,
    height: 540,
    alphaBoost: 1.24,
    darken: 0.58
  },
  {
    id: 'stage1-bg-near',
    source: 'src/assets/approved-art/layer-near-props.png',
    output: 'src/assets/runtime/stage1-bg-near.png',
    mode: 'paper-layer',
    width: 1920,
    height: 540,
    alphaBoost: 1.10,
    darken: 0.50
  },
  {
    id: 'stage1-bg-front',
    source: 'src/assets/approved-art/layer-foreground-occlusion.png',
    output: 'src/assets/runtime/stage1-bg-front.png',
    mode: 'paper-layer',
    width: 1920,
    height: 540,
    alphaBoost: 0.82,
    darken: 0.46
  },
  {
    id: 'stage1-ground-tile',
    source: 'src/assets/approved-art/layer-foreground-occlusion.png',
    output: 'src/assets/runtime/stage1-ground-tile.png',
    mode: 'ground-tile',
    crop: { x: 0, y: 210, width: 1920, height: 220 },
    width: 256,
    height: 64
  },
  {
    id: 'stage1-platform-thin-tile',
    source: 'src/assets/approved-art/layer-gameplay-layer.png',
    output: 'src/assets/runtime/stage1-platform-thin-tile.png',
    mode: 'ground-tile',
    crop: { x: 0, y: 330, width: 1920, height: 128 },
    width: 256,
    height: 36
  },
  {
    id: 'stage1-moon-gate',
    source: 'src/assets/approved-art/title-composition.png',
    output: 'src/assets/runtime/stage1-moon-gate.png',
    mode: 'paper-cutout',
    crop: { x: 486, y: 0, width: 430, height: 515 },
    width: 320,
    height: 300,
    alphaBoost: 1.16,
    darken: 0.64
  }
];

const itemSheetSpec = {
  id: 'stage1-item-icons',
  sources: {
    ui: 'src/assets/approved-art/ui-kit.png',
    brush: 'src/assets/approved-art/brush-kit.png'
  },
  output: 'src/assets/runtime/stage1-item-icons.png',
  frameWidth: 128,
  frameHeight: 128,
  columns: 5,
  frames: [
    { name: 'seal', draw: 'koban' },
    { name: 'scroll', draw: 'makimono' },
    { name: 'health', source: 'ui', x: 536, y: 360, width: 158, height: 160 },
    { name: 'energy', source: 'brush', x: 188, y: 372, width: 110, height: 88 },
    { name: 'checkpoint', source: 'ui', x: 350, y: 0, width: 310, height: 165 }
  ]
};

const touchSheetSpec = {
  id: 'stage1-touch-controls',
  source: 'src/assets/approved-art/mobile-controls-kit.png',
  output: 'src/assets/runtime/stage1-touch-controls.png',
  frameWidth: 192,
  frameHeight: 160,
  columns: 3,
  frames: [
    { name: 'dpad', x: 34, y: 112, width: 302, height: 208 },
    { name: 'jump', draw: 'jump-button' },
    { name: 'slash', x: 354, y: 44, width: 190, height: 170 }
  ]
};

await fs.mkdir(runtimeDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const matteCleanupSource = String.raw`
  (canvas, frameWidth, frameHeight) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('2D canvas unavailable');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    let source = new Uint8ClampedArray(data);
    let removed = 0;
    let darkened = 0;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const offsetAt = (x, y) => (y * width + x) * 4;
    const statsAt = (offset) => {
      const red = source[offset];
      const green = source[offset + 1];
      const blue = source[offset + 2];
      return {
        red,
        green,
        blue,
        alpha: source[offset + 3],
        luma: (red + green + blue) / 3,
        saturation: Math.max(red, green, blue) - Math.min(red, green, blue)
      };
    };
    const frameBounds = (x, y) => ({
      left: Math.floor(x / frameWidth) * frameWidth,
      right: Math.min(width - 1, Math.floor(x / frameWidth) * frameWidth + frameWidth - 1),
      top: Math.floor(y / frameHeight) * frameHeight,
      bottom: Math.min(height - 1, Math.floor(y / frameHeight) * frameHeight + frameHeight - 1)
    });
    const hasTransparentNeighbor = (x, y, radius) => {
      const bounds = frameBounds(x, y);
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < bounds.left || nx > bounds.right || ny < bounds.top || ny > bounds.bottom) continue;
          if (source[offsetAt(nx, ny) + 3] <= 10) return true;
        }
      }
      return false;
    };
    const solidNeighborCount = (x, y) => {
      const bounds = frameBounds(x, y);
      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < bounds.left || nx > bounds.right || ny < bounds.top || ny > bounds.bottom) continue;
          if (source[offsetAt(nx, ny) + 3] > 80) count += 1;
        }
      }
      return count;
    };

    for (let pass = 0; pass < 2; pass += 1) {
      source = new Uint8ClampedArray(data);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = offsetAt(x, y);
          const { alpha, luma, saturation } = statsAt(offset);
          if (alpha <= 0) continue;

          const boundary = hasTransparentNeighbor(x, y, 4);
          const isolated = solidNeighborCount(x, y) <= 2;
          const grayMatte = luma > 82 && saturation < 48;
          const whiteMatte = luma > 152 && saturation < 70;
          const palePaperEdge = luma > 124 && saturation < 42 && alpha < 220;
          if (!((boundary && (grayMatte || whiteMatte || palePaperEdge)) || (isolated && whiteMatte))) continue;

          if (boundary || luma > 168 || alpha < 170 || isolated) {
            data[offset + 3] = 0;
            removed += 1;
            continue;
          }

          data[offset] = Math.floor(data[offset] * 0.34);
          data[offset + 1] = Math.floor(data[offset + 1] * 0.34);
          data[offset + 2] = Math.floor(data[offset + 2] * 0.34);
          data[offset + 3] = clamp(Math.floor(alpha * 0.64), 0, 190);
          darkened += 1;
        }
      }
    }

    context.putImageData(imageData, 0, 0);
    return { removed, darkened };
  }
`;

const results = [];
try {
  for (const spec of explicitGridSheetSpecs) {
    const sourcePath = path.join(rootDir, spec.source);
    const outputPath = path.join(rootDir, spec.output);
    const bytes = await fs.readFile(sourcePath);
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    const result = await page.evaluate(async ({ spec, dataUrl, matteCleanupSource }) => {
      const cleanCharacterMatte = eval(matteCleanupSource);
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Unable to load ${spec.source}`));
        img.src = dataUrl;
      });

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (!sourceContext) throw new Error('2D canvas unavailable');
      sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      sourceContext.drawImage(image, 0, 0);

      const detectComponents = () => {
        const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const { data, width, height } = imageData;
        const visited = new Uint8Array(width * height);
        const solid = new Uint8Array(width * height);
        const queue = [];
        for (let index = 0; index < solid.length; index += 1) {
          solid[index] = data[index * 4 + 3] > (spec.alphaThreshold ?? 12) ? 1 : 0;
        }
        const enqueue = (index) => {
          if (index < 0 || index >= solid.length || !solid[index] || visited[index]) return;
          visited[index] = 1;
          queue.push(index);
        };
        const components = [];
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const start = y * width + x;
            if (!solid[start] || visited[start]) continue;
            let minX = x;
            let minY = y;
            let maxX = x;
            let maxY = y;
            let pixels = 0;
            queue.length = 0;
            enqueue(start);
            for (let cursor = 0; cursor < queue.length; cursor += 1) {
              const index = queue[cursor];
              const cx = index % width;
              const cy = Math.floor(index / width);
              pixels += 1;
              minX = Math.min(minX, cx);
              minY = Math.min(minY, cy);
              maxX = Math.max(maxX, cx);
              maxY = Math.max(maxY, cy);
              if (cx > 0) enqueue(index - 1);
              if (cx < width - 1) enqueue(index + 1);
              if (cy > 0) enqueue(index - width);
              if (cy < height - 1) enqueue(index + width);
            }
            if (pixels >= (spec.componentMinPixels ?? 2500)) {
              components.push({
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1,
                pixels,
                row: Math.floor(((minY + maxY) / 2) / 192)
              });
            }
          }
        }
        return components
          .sort((a, b) => (a.row - b.row) || (a.x - b.x))
          .reduce((byRow, component) => {
            if (!byRow[component.row]) byRow[component.row] = [];
            byRow[component.row].push(component);
            return byRow;
          }, {});
      };
      const componentsByRow = detectComponents();

      const frames = spec.sequences.flatMap((sequence) =>
        sequence.frames.map((frame, stateFrame) => ({
          ...frame,
          sequence: sequence.id,
          stateFrame
        }))
      );
      const rows = Math.ceil(frames.length / spec.columns);
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = spec.frameWidth * spec.columns;
      targetCanvas.height = spec.frameHeight * rows;
      const targetContext = targetCanvas.getContext('2d', { willReadFrequently: true });
      if (!targetContext) throw new Error('2D canvas unavailable');
      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.imageSmoothingEnabled = true;
      targetContext.imageSmoothingQuality = 'high';

      const trimSourceFrame = (frame) => {
        const component = componentsByRow[frame.componentRow]?.[frame.componentColumn];
        if (!component) {
          throw new Error(`Missing player component row ${frame.componentRow} column ${frame.componentColumn}`);
        }
        const componentMargin = spec.trimMargin ?? 0;
        const sourceX = Math.max(0, component.x - componentMargin);
        const sourceY = Math.max(0, component.y - componentMargin);
        const sourceRight = Math.min(sourceCanvas.width - 1, component.x + component.width - 1 + componentMargin);
        const sourceBottom = Math.min(sourceCanvas.height - 1, component.y + component.height - 1 + componentMargin);
        const sourceWidth = sourceRight - sourceX + 1;
        const sourceHeight = sourceBottom - sourceY + 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(sourceWidth);
        canvas.height = Math.ceil(sourceHeight);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('2D canvas unavailable');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha <= (spec.alphaThreshold ?? 12)) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
        if (maxX < minX || maxY < minY) {
          return { canvas, sourceX, sourceY, sourceWidth, sourceHeight, trimX: 0, trimY: 0, trimWidth: 1, trimHeight: 1, empty: true };
        }
        const margin = spec.trimMargin ?? 0;
        const trimX = Math.max(0, minX - margin);
        const trimY = Math.max(0, minY - margin);
        const trimRight = Math.min(width - 1, maxX + margin);
        const trimBottom = Math.min(height - 1, maxY + margin);
        return {
          canvas,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          trimX,
          trimY,
          trimWidth: trimRight - trimX + 1,
          trimHeight: trimBottom - trimY + 1,
          empty: false
        };
      };

      const renderedFrames = frames.map((frame, index) => {
        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
        const trimmed = trimSourceFrame(frame);
        if (!trimmed.empty) {
          const fitScale = Math.min(
            (spec.frameWidth - 18) / trimmed.trimWidth,
            (spec.frameHeight - spec.bottomPadding - 8) / trimmed.trimHeight,
            spec.maxScale ?? 1.35
          );
          const drawWidth = trimmed.trimWidth * fitScale;
          const drawHeight = trimmed.trimHeight * fitScale;
          const dx = column * spec.frameWidth + (spec.frameWidth - drawWidth) / 2;
          const dy = row * spec.frameHeight + spec.frameHeight - spec.bottomPadding - drawHeight;
          targetContext.drawImage(
            trimmed.canvas,
            trimmed.trimX,
            trimmed.trimY,
            trimmed.trimWidth,
            trimmed.trimHeight,
            dx,
            dy,
            drawWidth,
            drawHeight
          );
        }
        return {
          sequence: frame.sequence,
          stateFrame: frame.stateFrame,
          componentRow: frame.componentRow,
          componentColumn: frame.componentColumn,
          x: trimmed.sourceX,
          y: trimmed.sourceY,
          width: trimmed.sourceWidth,
          height: trimmed.sourceHeight,
          trim: {
            x: trimmed.trimX,
            y: trimmed.trimY,
            width: trimmed.trimWidth,
            height: trimmed.trimHeight
          }
        };
      });
      const matteCleanup = cleanCharacterMatte(targetCanvas, spec.frameWidth, spec.frameHeight);

      return {
        id: spec.id,
        width: targetCanvas.width,
        height: targetCanvas.height,
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
        sequences: spec.sequences.map((sequence) => ({ id: sequence.id, frames: sequence.frames.length })),
        frames: renderedFrames,
        matteCleanup,
        dataUrl: targetCanvas.toDataURL('image/png')
      };
    }, { spec, dataUrl, matteCleanupSource });

    await fs.writeFile(outputPath, Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    results.push({
      id: result.id,
      source: spec.source,
      output: spec.output,
      width: result.width,
      height: result.height,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      sequences: result.sequences,
      matteCleanup: result.matteCleanup,
      frames: result.frames
    });
  }

  for (const spec of sheetSpecs) {
    const sourcePath = path.join(rootDir, spec.source);
    const outputPath = path.join(rootDir, spec.output);
    const bytes = await fs.readFile(sourcePath);
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    const result = await page.evaluate(async ({ spec, dataUrl, matteCleanupSource }) => {
      const cleanCharacterMatte = eval(matteCleanupSource);
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Unable to load ${spec.source}`));
        img.src = dataUrl;
      });

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (!sourceContext) throw new Error('2D canvas unavailable');
      sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      sourceContext.drawImage(image, 0, 0);
      const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const { data, width, height } = imageData;
      const visited = new Uint8Array(width * height);
      const solid = new Uint8Array(width * height);

      for (let index = 0; index < solid.length; index += 1) {
        solid[index] = data[index * 4 + 3] > spec.alphaThreshold ? 1 : 0;
      }

      const components = [];
      const queue = [];
      const enqueue = (index) => {
        if (index < 0 || index >= solid.length || !solid[index] || visited[index]) return;
        visited[index] = 1;
        queue.push(index);
      };

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const start = y * width + x;
          if (!solid[start] || visited[start]) continue;
          let minX = x;
          let minY = y;
          let maxX = x;
          let maxY = y;
          let pixels = 0;
          queue.length = 0;
          enqueue(start);
          for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const index = queue[cursor];
            const cx = index % width;
            const cy = Math.floor(index / width);
            pixels += 1;
            minX = Math.min(minX, cx);
            minY = Math.min(minY, cy);
            maxX = Math.max(maxX, cx);
            maxY = Math.max(maxY, cy);
            if (cx > 0) enqueue(index - 1);
            if (cx < width - 1) enqueue(index + 1);
            if (cy > 0) enqueue(index - width);
            if (cy < height - 1) enqueue(index + width);
          }
          if (pixels >= spec.minPixels) {
            components.push({
              x: minX,
              y: minY,
              width: maxX - minX + 1,
              height: maxY - minY + 1,
              pixels
            });
          }
        }
      }

      const sourceFrames = components
        .sort((a, b) => (Math.floor(a.y / 40) - Math.floor(b.y / 40)) || a.y - b.y || a.x - b.x)
        .slice(0, spec.maxFrames);
      const frames = spec.derivedSequences
        ? spec.derivedSequences.flatMap((sequence) =>
            sequence.frames.map((variant, stateFrame) => {
              const componentIndex = variant.componentIndex ?? sequence.componentIndex ?? 0;
              const component = sourceFrames[componentIndex] ?? sourceFrames[0];
              if (!component) throw new Error(`No source component for ${spec.id}`);
              return {
                ...component,
                sequence: sequence.id,
                stateFrame,
                sourceComponent: componentIndex,
                offsetX: variant.offsetX ?? 0,
                offsetY: variant.offsetY ?? 0,
                scaleX: variant.scaleX ?? 1,
                scaleY: variant.scaleY ?? 1,
                rotate: variant.rotate ?? 0,
                alpha: variant.alpha ?? 1
              };
            })
          )
        : sourceFrames;
      const rows = Math.ceil(frames.length / spec.columns);
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = spec.frameWidth * spec.columns;
      targetCanvas.height = spec.frameHeight * rows;
      const targetContext = targetCanvas.getContext('2d');
      if (!targetContext) throw new Error('2D canvas unavailable');
      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.imageSmoothingEnabled = true;
      targetContext.imageSmoothingQuality = 'high';

      frames.forEach((frame, index) => {
        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
        const fitScale = Math.min(
          (spec.frameWidth - 18) / frame.width,
          (spec.frameHeight - spec.bottomPadding - 8) / frame.height,
          1.25
        );
        const drawWidth = frame.width * fitScale * Math.abs(frame.scaleX ?? 1);
        const drawHeight = frame.height * fitScale * Math.abs(frame.scaleY ?? 1);
        const centerX = column * spec.frameWidth + spec.frameWidth / 2 + (frame.offsetX ?? 0);
        const centerY = row * spec.frameHeight + spec.frameHeight - spec.bottomPadding - drawHeight / 2 + (frame.offsetY ?? 0);
        targetContext.save();
        targetContext.globalAlpha = frame.alpha ?? 1;
        targetContext.translate(centerX, centerY);
        targetContext.rotate(((frame.rotate ?? 0) * Math.PI) / 180);
        targetContext.drawImage(
          sourceCanvas,
          frame.x,
          frame.y,
          frame.width,
          frame.height,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
        targetContext.restore();
      });
      const matteCleanup = cleanCharacterMatte(targetCanvas, spec.frameWidth, spec.frameHeight);

      return {
        id: spec.id,
        width: targetCanvas.width,
        height: targetCanvas.height,
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
        sequences: spec.derivedSequences?.map((sequence) => ({ id: sequence.id, frames: sequence.frames.length })) ?? [],
        sourceFrames,
        frames,
        matteCleanup,
        dataUrl: targetCanvas.toDataURL('image/png')
      };
    }, { spec, dataUrl, matteCleanupSource });

    await fs.writeFile(outputPath, Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    results.push({
      id: result.id,
      source: spec.source,
      output: spec.output,
      width: result.width,
      height: result.height,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      sequences: result.sequences,
      sourceFrames: result.sourceFrames.map(({ x, y, width, height, pixels }) => ({ x, y, width, height, pixels })),
      matteCleanup: result.matteCleanup,
      frames: result.frames.map(({ sequence, stateFrame, sourceComponent, x, y, width, height, pixels, offsetX, offsetY, scaleX, scaleY, rotate, alpha }) => ({
        sequence,
        stateFrame,
        sourceComponent,
        x,
        y,
        width,
        height,
        pixels,
        offsetX,
        offsetY,
        scaleX,
        scaleY,
        rotate,
        alpha
      }))
    });
  }

  for (const spec of gridSheetSpecs) {
    const sourcePath = path.join(rootDir, spec.source);
    const outputPath = path.join(rootDir, spec.output);
    const bytes = await fs.readFile(sourcePath);
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    const result = await page.evaluate(async ({ spec, dataUrl, matteCleanupSource }) => {
      const cleanCharacterMatte = eval(matteCleanupSource);
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Unable to load ${spec.source}`));
        img.src = dataUrl;
      });

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const sourceContext = sourceCanvas.getContext('2d');
      if (!sourceContext) throw new Error('2D canvas unavailable');
      sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      sourceContext.drawImage(image, 0, 0);

      const sequenceFrames = spec.sequences?.flatMap((sequence) =>
        sequence.frameIndices.map((sourceFrame, stateFrame) => ({
          sourceFrame,
          sequence: sequence.id,
          stateFrame,
          rotate: sequence.rotate ?? 0,
          offsetY: sequence.offsetY ?? 0,
          scale: sequence.scale ?? 1
        }))
      );
      const rasterFrameCount = spec.cropFrames?.length ?? sequenceFrames?.length ?? spec.frameIndices?.length ?? 0;
      const frameCount = rasterFrameCount + (spec.proceduralFrames?.length ?? 0);
      const rows = Math.ceil(frameCount / spec.columns);
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = spec.frameWidth * spec.columns;
      targetCanvas.height = spec.frameHeight * rows;
      const targetContext = targetCanvas.getContext('2d');
      if (!targetContext) throw new Error('2D canvas unavailable');
      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.imageSmoothingEnabled = true;
      targetContext.imageSmoothingQuality = 'high';

      const sourceColumns = spec.sourceFrameWidth ? Math.floor(sourceCanvas.width / spec.sourceFrameWidth) : 0;
      const rasterSourceFrames =
        spec.cropFrames ??
        sequenceFrames?.map((frame) => ({
          ...frame,
          x: (frame.sourceFrame % sourceColumns) * spec.sourceFrameWidth,
          y: Math.floor(frame.sourceFrame / sourceColumns) * spec.sourceFrameHeight,
          width: spec.sourceFrameWidth,
          height: spec.sourceFrameHeight
        })) ??
        spec.frameIndices.map((sourceFrame) => ({
          sourceFrame,
          x: (sourceFrame % sourceColumns) * spec.sourceFrameWidth,
          y: Math.floor(sourceFrame / sourceColumns) * spec.sourceFrameHeight,
          width: spec.sourceFrameWidth,
          height: spec.sourceFrameHeight
        })) ??
        [];
      const sourceFrames = [
        ...rasterSourceFrames,
        ...(spec.proceduralFrames ?? []).map((frame) => ({
          ...frame,
          procedural: true,
          sourceFrame: null,
          x: 0,
          y: 0,
          width: spec.frameWidth,
          height: spec.frameHeight
        }))
      ];
      const shouldKeepPixel = (red, green, blue, alpha) => {
        if (spec.mask === 'player-slash') {
          const luma = (red + green + blue) / 3;
          const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
          const magentaSlash = red > 112 && blue > 72 && red > green * 1.25;
          const cyanSpark = green > 92 && blue > 118 && blue > red * 0.95;
          return alpha > 14 && saturation > 34 && luma > 38 && (magentaSlash || cyanSpark);
        }
        if (spec.mask !== 'enemy-warm') return alpha > 0;
        return alpha > 20 && red > 90 && red > blue * 1.25 && (green > 25 || red > 150);
      };
      const drawFlameRing = (context, x, y, width, height, rotationDeg, stateFrame) => {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const tau = Math.PI * 2;
        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        const pointOnEllipse = (angle, rx, ry) => ({
          x: Math.cos(angle) * rx,
          y: Math.sin(angle) * ry
        });
        const tangentOnEllipse = (angle) => {
          const tx = -Math.sin(angle);
          const ty = Math.cos(angle);
          const length = Math.hypot(tx, ty) || 1;
          return { x: tx / length, y: ty / length };
        };
        const drawTaperedFlame = (angle, length, thickness, lean, alpha, hotCore) => {
          const root = pointOnEllipse(angle - 0.08, 37, 29);
          const base = pointOnEllipse(angle, 54, 43);
          const tip = pointOnEllipse(angle + lean, 72 + length, 56 + length * 0.64);
          const tangent = tangentOnEllipse(angle);
          const baseBack = {
            x: base.x - tangent.x * thickness,
            y: base.y - tangent.y * thickness * 0.78
          };
          const baseFront = {
            x: base.x + tangent.x * thickness * 0.74,
            y: base.y + tangent.y * thickness * 0.56
          };
          const lead = pointOnEllipse(angle + lean * 0.62, 65 + length * 0.45, 50 + length * 0.32);
          const trail = pointOnEllipse(angle - 0.16, 50, 40);
          const fill = context.createLinearGradient(root.x, root.y, tip.x, tip.y);
          fill.addColorStop(0, `rgba(150, 0, 20, ${0.14 * alpha})`);
          fill.addColorStop(0.28, `rgba(255, 32, 28, ${0.74 * alpha})`);
          fill.addColorStop(0.66, `rgba(255, 118, 22, ${0.82 * alpha})`);
          fill.addColorStop(1, `rgba(255, 238, 120, ${0.68 * alpha})`);

          context.fillStyle = fill;
          context.beginPath();
          context.moveTo(root.x, root.y);
          context.quadraticCurveTo(trail.x - tangent.x * 12, trail.y - tangent.y * 10, baseBack.x, baseBack.y);
          context.bezierCurveTo(
            lead.x - tangent.x * 18,
            lead.y - tangent.y * 14,
            tip.x - tangent.x * 9,
            tip.y - tangent.y * 8,
            tip.x,
            tip.y
          );
          context.bezierCurveTo(
            tip.x + tangent.x * 8,
            tip.y + tangent.y * 7,
            lead.x + tangent.x * 14,
            lead.y + tangent.y * 11,
            baseFront.x,
            baseFront.y
          );
          context.quadraticCurveTo(root.x + tangent.x * 16, root.y + tangent.y * 10, root.x, root.y);
          context.fill();

          if (!hotCore) return;
          const core = context.createLinearGradient(root.x, root.y, tip.x, tip.y);
          core.addColorStop(0, `rgba(255, 78, 28, ${0.24 * alpha})`);
          core.addColorStop(0.62, `rgba(255, 210, 72, ${0.68 * alpha})`);
          core.addColorStop(1, `rgba(255, 255, 205, ${0.54 * alpha})`);
          context.fillStyle = core;
          context.beginPath();
          context.moveTo(pointOnEllipse(angle - 0.04, 48, 38).x, pointOnEllipse(angle - 0.04, 48, 38).y);
          context.quadraticCurveTo(
            pointOnEllipse(angle + lean * 0.45, 61 + length * 0.24, 47 + length * 0.16).x,
            pointOnEllipse(angle + lean * 0.45, 61 + length * 0.24, 47 + length * 0.16).y,
            pointOnEllipse(angle + lean, 65 + length * 0.58, 50 + length * 0.38).x,
            pointOnEllipse(angle + lean, 65 + length * 0.58, 50 + length * 0.38).y
          );
          context.quadraticCurveTo(
            pointOnEllipse(angle + lean * 0.28, 58, 44).x + tangent.x * 7,
            pointOnEllipse(angle + lean * 0.28, 58, 44).y + tangent.y * 6,
            pointOnEllipse(angle + 0.07, 48, 38).x,
            pointOnEllipse(angle + 0.07, 48, 38).y
          );
          context.quadraticCurveTo(base.x, base.y, pointOnEllipse(angle - 0.04, 48, 38).x, pointOnEllipse(angle - 0.04, 48, 38).y);
          context.fill();
        };

        context.save();
        context.translate(cx, cy);
        context.rotate((rotationDeg * Math.PI) / 180);
        context.scale(0.86, 0.86);
        context.globalCompositeOperation = 'lighter';
        context.lineCap = 'round';
        context.lineJoin = 'round';

        const glow = context.createRadialGradient(0, 0, 24, 0, 0, 91);
        glow.addColorStop(0, 'rgba(255, 46, 46, 0)');
        glow.addColorStop(0.42, 'rgba(255, 36, 36, 0.08)');
        glow.addColorStop(0.7, 'rgba(255, 86, 16, 0.22)');
        glow.addColorStop(0.92, 'rgba(255, 184, 44, 0.12)');
        glow.addColorStop(1, 'rgba(255, 238, 96, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.ellipse(0, 0, 88, 70, 0, 0, tau);
        context.fill();

        context.shadowColor = 'rgba(255, 38, 24, 0.58)';
        context.shadowBlur = 13;
        for (let i = 0; i < 10; i += 1) {
          const stagger = Math.sin(i * 2.31 + stateFrame * 0.92);
          const angle = (i / 10) * tau + stateFrame * 0.17 + stagger * 0.025;
          const length = 8 + Math.max(0, stagger) * 8 + ((i + stateFrame) % 4) * 2.2;
          const thickness = 8 + ((i * 3 + stateFrame) % 5) * 1.2;
          drawTaperedFlame(angle, length, thickness, 0.18 + stagger * 0.04, 0.64, i % 3 === stateFrame % 3);
        }

        context.shadowColor = 'rgba(255, 118, 20, 0.64)';
        context.shadowBlur = 8;
        for (let i = 0; i < 5; i += 1) {
          const wave = Math.sin(i * 1.97 + stateFrame * 1.22);
          const angle = (i / 5) * tau + stateFrame * 0.29 + 0.09;
          drawTaperedFlame(angle, 13 + wave * 4, 6, 0.24, 0.5, true);
        }

        context.shadowBlur = 6;
        const drawBrokenArc = (radiusX, radiusY, start, span, widthLine, color) => {
          context.strokeStyle = color;
          context.lineWidth = widthLine;
          context.beginPath();
          for (let step = 0; step <= 28; step += 1) {
            const t = start + (span * step) / 28;
            const wobble = Math.sin(t * 5 + stateFrame * 0.7) * 2.2;
            const point = pointOnEllipse(t, radiusX + wobble, radiusY + wobble * 0.7);
            if (step === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
          }
          context.stroke();
        };
        drawBrokenArc(63, 49, -0.34, tau * 0.24, 5, 'rgba(255, 46, 28, 0.68)');
        drawBrokenArc(55, 43, 2.58, tau * 0.18, 3, 'rgba(255, 230, 92, 0.58)');
        drawBrokenArc(77, 61, 3.8, tau * 0.14, 4, 'rgba(255, 42, 104, 0.34)');

        context.shadowBlur = 3;
        for (let i = 0; i < 9; i += 1) {
          const angle = (i / 9) * tau + stateFrame * 0.31;
          const jitter = Math.sin(i * 5.1 + stateFrame) * 4;
          const spark = pointOnEllipse(angle, clamp(78 + jitter, 68, 88), clamp(61 + jitter * 0.5, 50, 71));
          context.fillStyle = i % 3 === 0 ? 'rgba(255, 237, 128, 0.56)' : 'rgba(255, 70, 26, 0.42)';
          context.beginPath();
          context.ellipse(spark.x, spark.y, i % 3 === 0 ? 2.6 : 1.8, i % 3 === 0 ? 1.7 : 1.2, angle, 0, tau);
          context.fill();
        }
        context.restore();
      };
      const frames = sourceFrames.map((sourceFrame, index) => {
        const sourceX = sourceFrame.x;
        const sourceY = sourceFrame.y;
        const sourceWidth = sourceFrame.width;
        const sourceHeight = sourceFrame.height;
        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
        const fitScale = Math.min((spec.frameWidth - 14) / sourceWidth, (spec.frameHeight - 14) / sourceHeight, spec.maxScale ?? 1.35);
        const drawWidth = sourceWidth * fitScale * (sourceFrame.scale ?? 1);
        const drawHeight = sourceHeight * fitScale * (sourceFrame.scale ?? 1);
        const dx = column * spec.frameWidth + (spec.frameWidth - drawWidth) / 2;
        const dy = row * spec.frameHeight + (spec.frameHeight - drawHeight) / 2 + (sourceFrame.offsetY ?? 0);
        const drawFrameCanvas = (canvas) => {
          const angleRadians = ((sourceFrame.rotate ?? 0) * Math.PI) / 180;
          if (angleRadians === 0) {
            targetContext.drawImage(canvas, 0, 0, sourceWidth, sourceHeight, dx, dy, drawWidth, drawHeight);
            return;
          }
          targetContext.save();
          targetContext.translate(column * spec.frameWidth + spec.frameWidth / 2, row * spec.frameHeight + spec.frameHeight / 2 + (sourceFrame.offsetY ?? 0));
          targetContext.rotate(angleRadians);
          targetContext.drawImage(canvas, 0, 0, sourceWidth, sourceHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          targetContext.restore();
        };
        if (sourceFrame.procedural && sourceFrame.draw === 'flame-ring') {
          drawFlameRing(
            targetContext,
            column * spec.frameWidth,
            row * spec.frameHeight,
            spec.frameWidth,
            spec.frameHeight,
            sourceFrame.rotate ?? 0,
            sourceFrame.stateFrame ?? 0
          );
          return {
            sequence: sourceFrame.sequence,
            stateFrame: sourceFrame.stateFrame,
            sourceFrame: sourceFrame.sourceFrame,
            procedural: sourceFrame.draw,
            x: sourceX,
            y: sourceY,
            width: sourceWidth,
            height: sourceHeight
          };
        }
        if (spec.mask) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = sourceWidth;
          maskCanvas.height = sourceHeight;
          const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
          if (!maskContext) throw new Error('2D canvas unavailable');
          maskContext.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
          const imageData = maskContext.getImageData(0, 0, sourceWidth, sourceHeight);
          for (let pixel = 0; pixel < imageData.data.length; pixel += 4) {
            const localPixel = pixel / 4;
            const localX = localPixel % sourceWidth;
            const localY = Math.floor(localPixel / sourceWidth);
            const removeLabelZone = spec.removeLabelZone && localX < 42 && localY > 82 && localY < 137;
            if (
              removeLabelZone ||
              !shouldKeepPixel(imageData.data[pixel], imageData.data[pixel + 1], imageData.data[pixel + 2], imageData.data[pixel + 3])
            ) {
              imageData.data[pixel + 3] = 0;
            }
          }
          maskContext.putImageData(imageData, 0, 0);
          drawFrameCanvas(maskCanvas);
        } else {
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = sourceWidth;
          cropCanvas.height = sourceHeight;
          const cropContext = cropCanvas.getContext('2d');
          if (!cropContext) throw new Error('2D canvas unavailable');
          cropContext.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
          drawFrameCanvas(cropCanvas);
        }
        return {
          sequence: sourceFrame.sequence,
          stateFrame: sourceFrame.stateFrame,
          sourceFrame: sourceFrame.sourceFrame,
          procedural: sourceFrame.procedural ? sourceFrame.draw : undefined,
          x: sourceX,
          y: sourceY,
          width: sourceWidth,
          height: sourceHeight
        };
      });
      const matteCleanup = spec.id === 'lantern-warden-runtime-spritesheet'
        ? cleanCharacterMatte(targetCanvas, spec.frameWidth, spec.frameHeight)
        : { removed: 0, darkened: 0 };

      return {
        id: spec.id,
        width: targetCanvas.width,
        height: targetCanvas.height,
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
        frames,
        matteCleanup,
        dataUrl: targetCanvas.toDataURL('image/png')
      };
    }, { spec, dataUrl, matteCleanupSource });

    await fs.writeFile(outputPath, Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    results.push({
      id: result.id,
      source: spec.source,
      output: spec.output,
      width: result.width,
      height: result.height,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      matteCleanup: result.matteCleanup,
      frames: result.frames
    });
  }

  for (const spec of environmentSpecs) {
    const sourcePath = path.join(rootDir, spec.source);
    const outputPath = path.join(rootDir, spec.output);
    const bytes = await fs.readFile(sourcePath);
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    const result = await page.evaluate(async ({ spec, dataUrl }) => {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Unable to load ${spec.source}`));
        img.src = dataUrl;
      });

      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = spec.width;
      targetCanvas.height = spec.height;
      const targetContext = targetCanvas.getContext('2d', { willReadFrequently: true });
      if (!targetContext) throw new Error('2D canvas unavailable');
      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.imageSmoothingEnabled = true;
      targetContext.imageSmoothingQuality = 'high';

      const crop = spec.crop ?? { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
      if (spec.mode === 'paper-cutout') {
        const fitScale = Math.min((spec.width - 10) / crop.width, (spec.height - 10) / crop.height);
        const drawWidth = crop.width * fitScale;
        const drawHeight = crop.height * fitScale;
        targetContext.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          (spec.width - drawWidth) / 2,
          spec.height - drawHeight - 2,
          drawWidth,
          drawHeight
        );
      } else {
        targetContext.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, spec.width, spec.height);
      }

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      const imageData = targetContext.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
      const { data, width, height } = imageData;
      let opaquePixels = 0;
      let beigePixels = 0;

      for (let pixel = 0; pixel < data.length; pixel += 4) {
        const red = data[pixel];
        const green = data[pixel + 1];
        const blue = data[pixel + 2];
        const alpha = data[pixel + 3];
        const luma = (red + green + blue) / 3;
        const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
        const paper = luma > 132 && saturation < 52;

        if (spec.mode === 'ground-tile') {
          const y = Math.floor(pixel / 4 / width);
          const depth = y / Math.max(1, height - 1);
          const sourceStrength = paper ? 0.08 : 0.34;
          const baseRed = 8 + 7 * (1 - depth);
          const baseGreen = 11 + 8 * (1 - depth);
          const baseBlue = 14 + 12 * (1 - depth);
          data[pixel] = clamp(baseRed + red * sourceStrength, 0, 78);
          data[pixel + 1] = clamp(baseGreen + green * sourceStrength, 0, 84);
          data[pixel + 2] = clamp(baseBlue + blue * sourceStrength, 0, 92);
          data[pixel + 3] = 255;
          if (y < 4) {
            data[pixel] = clamp(data[pixel] + 14, 0, 95);
            data[pixel + 1] = clamp(data[pixel + 1] + 28, 0, 120);
            data[pixel + 2] = clamp(data[pixel + 2] + 34, 0, 136);
          }
          if (y > height - 9) {
            data[pixel] = Math.floor(data[pixel] * 0.52);
            data[pixel + 1] = Math.floor(data[pixel + 1] * 0.52);
            data[pixel + 2] = Math.floor(data[pixel + 2] * 0.52);
          }
          opaquePixels += 1;
          continue;
        }

        if (paper || alpha < 8) {
          data[pixel + 3] = 0;
          if (paper && alpha > 20) beigePixels += 1;
          continue;
        }

        const darknessAlpha = clamp((210 - luma) / 170, 0, 1);
        const colorAlpha = saturation > 34 && luma > 24 ? 0.78 : 0;
        const nextAlpha = clamp(Math.max(darknessAlpha, colorAlpha) * (spec.alphaBoost ?? 1), 0, 1);
        data[pixel + 3] = Math.floor(Math.min(alpha, nextAlpha * 255));
        data[pixel] = Math.floor(red * (spec.darken ?? 0.7));
        data[pixel + 1] = Math.floor(green * (spec.darken ?? 0.7));
        data[pixel + 2] = Math.floor(blue * (spec.darken ?? 0.7));
        if (data[pixel + 3] > 20) opaquePixels += 1;
      }

      targetContext.putImageData(imageData, 0, 0);

      return {
        id: spec.id,
        width: targetCanvas.width,
        height: targetCanvas.height,
        mode: spec.mode,
        crop,
        opaquePixels,
        beigePixels,
        dataUrl: targetCanvas.toDataURL('image/png')
      };
    }, { spec, dataUrl });

    await fs.writeFile(outputPath, Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    results.push({
      id: result.id,
      source: spec.source,
      output: spec.output,
      width: result.width,
      height: result.height,
      mode: result.mode,
      crop: result.crop,
      opaquePixels: result.opaquePixels,
      beigePixels: result.beigePixels
    });
  }

  {
    const outputPath = path.join(rootDir, itemSheetSpec.output);
    const dataUrls = Object.fromEntries(
      await Promise.all(
        Object.entries(itemSheetSpec.sources).map(async ([id, source]) => {
          const bytes = await fs.readFile(path.join(rootDir, source));
          return [id, `data:image/png;base64,${bytes.toString('base64')}`];
        })
      )
    );
    const result = await page.evaluate(async ({ spec, dataUrls }) => {
      const images = {};
      for (const [id, dataUrl] of Object.entries(dataUrls)) {
        images[id] = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Unable to load item source ${id}`));
          img.src = dataUrl;
        });
      }

      const rows = Math.ceil(spec.frames.length / spec.columns);
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = spec.frameWidth * spec.columns;
      targetCanvas.height = spec.frameHeight * rows;
      const targetContext = targetCanvas.getContext('2d', { willReadFrequently: true });
      if (!targetContext) throw new Error('2D canvas unavailable');
      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.imageSmoothingEnabled = true;
      targetContext.imageSmoothingQuality = 'high';

      const drawKoban = (context, x, y, width, height) => {
        const cx = x + width / 2;
        const cy = y + height / 2;
        context.save();
        context.translate(cx, cy);
        context.rotate(-0.16);
        context.shadowColor = 'rgba(255, 177, 46, 0.65)';
        context.shadowBlur = 12;
        const fill = context.createRadialGradient(-14, -18, 4, 0, 0, 54);
        fill.addColorStop(0, '#FFE45A');
        fill.addColorStop(0.52, '#E7A83B');
        fill.addColorStop(1, '#8C4E18');
        context.fillStyle = fill;
        context.beginPath();
        context.ellipse(0, 0, 43, 28, 0, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
        context.lineWidth = 5;
        context.strokeStyle = '#2D1A0B';
        context.stroke();
        context.lineWidth = 2;
        context.strokeStyle = '#FFD24A';
        context.stroke();
        context.fillStyle = '#3A1D0D';
        context.fillRect(-7, -12, 14, 24);
        context.strokeStyle = '#FFD24A';
        context.lineWidth = 2;
        context.strokeRect(-7, -12, 14, 24);
        context.strokeStyle = 'rgba(0, 229, 255, 0.45)';
        context.lineWidth = 3;
        context.beginPath();
        context.ellipse(0, 0, 50, 33, 0, 0.14, Math.PI * 1.65);
        context.stroke();
        context.restore();
      };

      const drawMakimono = (context, x, y, width, height) => {
        context.save();
        context.translate(x + width / 2, y + height / 2);
        context.rotate(-0.08);
        context.shadowColor = 'rgba(0, 229, 255, 0.42)';
        context.shadowBlur = 9;
        const paper = context.createLinearGradient(-46, 0, 46, 0);
        paper.addColorStop(0, '#5A2E15');
        paper.addColorStop(0.18, '#F0A64A');
        paper.addColorStop(0.82, '#BD6A22');
        paper.addColorStop(1, '#3A1D0D');
        context.fillStyle = paper;
        context.fillRect(-42, -19, 84, 38);
        context.fillStyle = '#1A1110';
        context.beginPath();
        context.ellipse(-42, 0, 13, 22, 0, 0, Math.PI * 2);
        context.ellipse(42, 0, 13, 22, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#F0A64A';
        context.lineWidth = 3;
        context.strokeRect(-42, -19, 84, 38);
        context.strokeStyle = '#1C1614';
        context.lineWidth = 2;
        for (const yLine of [-8, 0, 8]) {
          context.beginPath();
          context.moveTo(-26, yLine);
          context.quadraticCurveTo(-5, yLine + 3, 22, yLine - 2);
          context.stroke();
        }
        context.strokeStyle = '#FF2E7A';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(-14, -23);
        context.lineTo(-9, 23);
        context.moveTo(15, -22);
        context.lineTo(10, 22);
        context.stroke();
        context.shadowBlur = 0;
        context.strokeStyle = 'rgba(0, 229, 255, 0.55)';
        context.lineWidth = 2;
        context.strokeRect(-48, -25, 96, 50);
        context.restore();
      };

      const frames = spec.frames.map((frame, index) => {
        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
        if (frame.draw === 'koban') {
          drawKoban(targetContext, column * spec.frameWidth, row * spec.frameHeight, spec.frameWidth, spec.frameHeight);
          return frame;
        }
        if (frame.draw === 'makimono') {
          drawMakimono(targetContext, column * spec.frameWidth, row * spec.frameHeight, spec.frameWidth, spec.frameHeight);
          return frame;
        }

        const image = images[frame.source];
        if (!image) throw new Error(`Missing item source ${frame.source}`);
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = frame.width;
        maskCanvas.height = frame.height;
        const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (!maskContext) throw new Error('2D canvas unavailable');
        maskContext.drawImage(image, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
        const imageData = maskContext.getImageData(0, 0, frame.width, frame.height);
        for (let pixel = 0; pixel < imageData.data.length; pixel += 4) {
          const red = imageData.data[pixel];
          const green = imageData.data[pixel + 1];
          const blue = imageData.data[pixel + 2];
          const alpha = imageData.data[pixel + 3];
          const luma = (red + green + blue) / 3;
          const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
          if (alpha < 8 || (luma > 135 && saturation < 52)) {
            imageData.data[pixel + 3] = 0;
          }
        }
        maskContext.putImageData(imageData, 0, 0);

        const fitScale = Math.min((spec.frameWidth - 18) / frame.width, (spec.frameHeight - 18) / frame.height, 1.5);
        const drawWidth = frame.width * fitScale;
        const drawHeight = frame.height * fitScale;
        targetContext.drawImage(
          maskCanvas,
          0,
          0,
          frame.width,
          frame.height,
          column * spec.frameWidth + (spec.frameWidth - drawWidth) / 2,
          row * spec.frameHeight + (spec.frameHeight - drawHeight) / 2,
          drawWidth,
          drawHeight
        );
        return frame;
      });

      return {
        id: spec.id,
        width: targetCanvas.width,
        height: targetCanvas.height,
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
        frames,
        dataUrl: targetCanvas.toDataURL('image/png')
      };
    }, { spec: itemSheetSpec, dataUrls });

    await fs.writeFile(outputPath, Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    results.push({
      id: result.id,
      source: Object.values(itemSheetSpec.sources).join(', '),
      output: itemSheetSpec.output,
      width: result.width,
      height: result.height,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      frames: result.frames
    });
  }

  {
    const outputPath = path.join(rootDir, touchSheetSpec.output);
    const bytes = await fs.readFile(path.join(rootDir, touchSheetSpec.source));
    const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
    const result = await page.evaluate(async ({ spec, dataUrl }) => {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Unable to load ${spec.source}`));
        img.src = dataUrl;
      });

      const rows = Math.ceil(spec.frames.length / spec.columns);
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = spec.frameWidth * spec.columns;
      targetCanvas.height = spec.frameHeight * rows;
      const targetContext = targetCanvas.getContext('2d', { willReadFrequently: true });
      if (!targetContext) throw new Error('2D canvas unavailable');
      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.imageSmoothingEnabled = true;
      targetContext.imageSmoothingQuality = 'high';

      const drawJumpButton = (context, x, y, width, height) => {
        const cx = x + width / 2;
        const cy = y + height / 2;
        context.save();
        context.translate(cx, cy);
        context.shadowColor = 'rgba(0, 229, 255, 0.62)';
        context.shadowBlur = 12;
        context.fillStyle = '#12161B';
        context.beginPath();
        context.arc(0, 0, 48, 0, Math.PI * 2);
        context.fill();
        context.lineWidth = 7;
        context.strokeStyle = '#2E393F';
        context.stroke();
        context.lineWidth = 4;
        context.strokeStyle = '#00E5FF';
        context.stroke();
        context.shadowBlur = 0;
        context.fillStyle = 'rgba(0, 229, 255, 0.16)';
        context.beginPath();
        context.arc(0, 0, 32, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#00E5FF';
        context.beginPath();
        context.moveTo(0, -25);
        context.lineTo(20, -2);
        context.lineTo(9, -2);
        context.lineTo(9, 22);
        context.lineTo(-9, 22);
        context.lineTo(-9, -2);
        context.lineTo(-20, -2);
        context.closePath();
        context.fill();
        context.restore();
      };

      const frames = spec.frames.map((frame, index) => {
        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
        if (frame.draw === 'jump-button') {
          drawJumpButton(targetContext, column * spec.frameWidth, row * spec.frameHeight, spec.frameWidth, spec.frameHeight);
          return frame;
        }

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = frame.width;
        maskCanvas.height = frame.height;
        const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (!maskContext) throw new Error('2D canvas unavailable');
        maskContext.drawImage(image, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
        const imageData = maskContext.getImageData(0, 0, frame.width, frame.height);
        for (let pixel = 0; pixel < imageData.data.length; pixel += 4) {
          const red = imageData.data[pixel];
          const green = imageData.data[pixel + 1];
          const blue = imageData.data[pixel + 2];
          const alpha = imageData.data[pixel + 3];
          const luma = (red + green + blue) / 3;
          const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
          if (alpha < 8 || (luma > 135 && saturation < 52)) {
            imageData.data[pixel + 3] = 0;
          }
        }
        maskContext.putImageData(imageData, 0, 0);

        const fitScale = Math.min((spec.frameWidth - 14) / frame.width, (spec.frameHeight - 14) / frame.height, 1.35);
        const drawWidth = frame.width * fitScale;
        const drawHeight = frame.height * fitScale;
        targetContext.drawImage(
          maskCanvas,
          0,
          0,
          frame.width,
          frame.height,
          column * spec.frameWidth + (spec.frameWidth - drawWidth) / 2,
          row * spec.frameHeight + (spec.frameHeight - drawHeight) / 2,
          drawWidth,
          drawHeight
        );
        return frame;
      });

      return {
        id: spec.id,
        width: targetCanvas.width,
        height: targetCanvas.height,
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
        frames,
        dataUrl: targetCanvas.toDataURL('image/png')
      };
    }, { spec: touchSheetSpec, dataUrl });

    await fs.writeFile(outputPath, Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    results.push({
      id: result.id,
      source: touchSheetSpec.source,
      output: touchSheetSpec.output,
      width: result.width,
      height: result.height,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      frames: result.frames
    });
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(runtimeDir, 'runtime-sprite-sheets.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), derivedFromApprovedArt: true, sheets: results }, null, 2)}\n`,
  'utf8'
);

console.log(`runtime:sheets PASS ${JSON.stringify({ sheets: results.length })}`);

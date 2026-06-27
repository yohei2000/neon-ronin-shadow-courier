import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const rootDir = process.cwd();
const runtimeDir = path.join(rootDir, 'src', 'assets', 'runtime');

const sheetSpecs = [
  {
    id: 'player-runtime-spritesheet',
    source: 'src/assets/approved-art/player-spritesheet.png',
    output: 'src/assets/runtime/player-runtime-spritesheet.png',
    frameWidth: 256,
    frameHeight: 192,
    columns: 6,
    minPixels: 3000,
    alphaThreshold: 12,
    bottomPadding: 12,
    maxFrames: 27
  },
  {
    id: 'ink-crawler-runtime-spritesheet',
    source: 'src/assets/approved-art/enemy-spritesheet.png',
    output: 'src/assets/runtime/ink-crawler-runtime-spritesheet.png',
    frameWidth: 192,
    frameHeight: 144,
    columns: 4,
    minPixels: 2500,
    alphaThreshold: 12,
    bottomPadding: 16,
    maxFrames: 8
  },
  {
    id: 'kite-wraith-runtime-spritesheet',
    source: 'src/assets/approved-art/kite-wraith-preview.png',
    output: 'src/assets/runtime/kite-wraith-runtime-spritesheet.png',
    frameWidth: 192,
    frameHeight: 192,
    columns: 4,
    minPixels: 2500,
    alphaThreshold: 12,
    bottomPadding: 12,
    maxFrames: 4
  }
];

await fs.mkdir(runtimeDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const results = [];
try {
  for (const spec of sheetSpecs) {
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

      const frames = components
        .sort((a, b) => (Math.floor(a.y / 40) - Math.floor(b.y / 40)) || a.y - b.y || a.x - b.x)
        .slice(0, spec.maxFrames);
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
        const drawWidth = frame.width * fitScale;
        const drawHeight = frame.height * fitScale;
        const dx = column * spec.frameWidth + (spec.frameWidth - drawWidth) / 2;
        const dy = row * spec.frameHeight + spec.frameHeight - spec.bottomPadding - drawHeight;
        targetContext.drawImage(
          sourceCanvas,
          frame.x,
          frame.y,
          frame.width,
          frame.height,
          dx,
          dy,
          drawWidth,
          drawHeight
        );
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
    }, { spec, dataUrl });

    await fs.writeFile(outputPath, Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    results.push({
      id: result.id,
      source: spec.source,
      output: spec.output,
      width: result.width,
      height: result.height,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      frames: result.frames.map(({ x, y, width, height, pixels }) => ({ x, y, width, height, pixels }))
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

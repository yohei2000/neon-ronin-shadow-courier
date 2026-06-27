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

const gridSheetSpecs = [
  {
    id: 'slash-runtime-spritesheet',
    source: 'src/assets/approved-art/slash-flipbook.png',
    output: 'src/assets/runtime/slash-runtime-spritesheet.png',
    sourceFrameWidth: 128,
    sourceFrameHeight: 160,
    frameWidth: 192,
    frameHeight: 160,
    columns: 4,
    frameIndices: [1, 2, 5, 6]
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
    { name: 'seal', source: 'ui', x: 86, y: 180, width: 120, height: 120 },
    { name: 'scroll', source: 'ui', x: 706, y: 385, width: 235, height: 130 },
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
  columns: 2,
  frames: [
    { name: 'dpad', x: 34, y: 112, width: 302, height: 208 },
    { name: 'slash', x: 354, y: 44, width: 190, height: 170 }
  ]
};

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

  for (const spec of gridSheetSpecs) {
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
      const sourceContext = sourceCanvas.getContext('2d');
      if (!sourceContext) throw new Error('2D canvas unavailable');
      sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      sourceContext.drawImage(image, 0, 0);

      const frameCount = spec.cropFrames?.length ?? spec.frameIndices.length;
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
      const sourceFrames =
        spec.cropFrames ??
        spec.frameIndices.map((sourceFrame) => ({
          sourceFrame,
          x: (sourceFrame % sourceColumns) * spec.sourceFrameWidth,
          y: Math.floor(sourceFrame / sourceColumns) * spec.sourceFrameHeight,
          width: spec.sourceFrameWidth,
          height: spec.sourceFrameHeight
        }));
      const shouldKeepPixel = (red, green, blue, alpha) => {
        if (spec.mask !== 'enemy-warm') return alpha > 0;
        return alpha > 20 && red > 90 && red > blue * 1.25 && (green > 25 || red > 150);
      };
      const frames = sourceFrames.map((sourceFrame, index) => {
        const sourceX = sourceFrame.x;
        const sourceY = sourceFrame.y;
        const sourceWidth = sourceFrame.width;
        const sourceHeight = sourceFrame.height;
        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
        const fitScale = Math.min((spec.frameWidth - 14) / sourceWidth, (spec.frameHeight - 14) / sourceHeight, spec.maxScale ?? 1.35);
        const drawWidth = sourceWidth * fitScale;
        const drawHeight = sourceHeight * fitScale;
        const dx = column * spec.frameWidth + (spec.frameWidth - drawWidth) / 2;
        const dy = row * spec.frameHeight + (spec.frameHeight - drawHeight) / 2;
        if (spec.mask) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = sourceWidth;
          maskCanvas.height = sourceHeight;
          const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
          if (!maskContext) throw new Error('2D canvas unavailable');
          maskContext.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
          const imageData = maskContext.getImageData(0, 0, sourceWidth, sourceHeight);
          for (let pixel = 0; pixel < imageData.data.length; pixel += 4) {
            if (!shouldKeepPixel(imageData.data[pixel], imageData.data[pixel + 1], imageData.data[pixel + 2], imageData.data[pixel + 3])) {
              imageData.data[pixel + 3] = 0;
            }
          }
          maskContext.putImageData(imageData, 0, 0);
          targetContext.drawImage(maskCanvas, 0, 0, sourceWidth, sourceHeight, dx, dy, drawWidth, drawHeight);
        } else {
          targetContext.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, dx, dy, drawWidth, drawHeight);
        }
        return {
          sourceFrame: sourceFrame.sourceFrame,
          x: sourceX,
          y: sourceY,
          width: sourceWidth,
          height: sourceHeight
        };
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

      const frames = spec.frames.map((frame, index) => {
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

        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
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

      const frames = spec.frames.map((frame, index) => {
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

        const column = index % spec.columns;
        const row = Math.floor(index / spec.columns);
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

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const rootDir = process.cwd();
const stagePath = path.resolve(rootDir, 'src', 'data', 'stage1Content.json');
const propsOutputPath = path.resolve(rootDir, 'src', 'data', 'stage1VisualProps.json');
const runtimeDir = path.resolve(rootDir, 'src', 'assets', 'runtime');
const sheetOutputPath = path.join(runtimeDir, 'stage1-props-spritesheet.png');
const runtimeManifestPath = path.join(runtimeDir, 'runtime-sprite-sheets.json');
const stage = JSON.parse(fs.readFileSync(stagePath, 'utf8'));

const frameSize = 96;
const columns = 4;
const rows = 4;
const frameNames = [
  'wet-stone-chips',
  'broken-roof-cap',
  'deep-ledge-corner',
  'paper-lantern',
  'cyan-cable',
  'magenta-cable',
  'amber-signal-lamp',
  'market-crate',
  'paper-charm-strip',
  'pipe-vent',
  'torn-shop-cloth',
  'shrine-stone',
  'steam-moss-tuft',
  'neon-sign-scrap',
  'under-ledge-bracket',
  'moon-glass-shard'
];

const requiredAssets = {
  ground: 'stage1-ground-tile.png',
  platform: 'stage1-platform-thin-tile.png',
  front: 'stage1-bg-front.png',
  near: 'stage1-bg-near.png',
  mid: 'stage1-bg-mid.png',
  itemIcons: 'stage1-item-icons.png',
  telegraph: 'telegraph-runtime-spritesheet.png',
  slash: 'slash-runtime-spritesheet.png'
};

const dataUrlFor = (fileName) => {
  const fullPath = path.join(runtimeDir, fileName);
  const bytes = fs.readFileSync(fullPath);
  return `data:image/png;base64,${bytes.toString('base64')}`;
};

const textureUrls = Object.fromEntries(Object.entries(requiredAssets).map(([key, fileName]) => [key, dataUrlFor(fileName)]));
const fract = (value) => value - Math.floor(value);
const rand = (seed) => fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const intersectsX = (rect, section) => rect.x < section.endX && rect.x + rect.width > section.startX;

const frameSizing = [
  { width: 42, height: 24 },
  { width: 68, height: 34 },
  { width: 78, height: 52 },
  { width: 42, height: 58 },
  { width: 88, height: 54 },
  { width: 84, height: 48 },
  { width: 48, height: 54 },
  { width: 66, height: 48 },
  { width: 40, height: 72 },
  { width: 82, height: 48 },
  { width: 86, height: 52 },
  { width: 58, height: 68 },
  { width: 54, height: 38 },
  { width: 92, height: 46 },
  { width: 74, height: 42 },
  { width: 44, height: 46 }
];

const sectionCounts = [25, 27, 34, 35, 28];
const props = stage.sections.flatMap((section, sectionIndex) => {
  const platforms = stage.platforms.filter((platform) => intersectsX(platform, section));
  const count = sectionCounts[sectionIndex] ?? 24;
  return Array.from({ length: count }, (_, index) => {
    const frame = (index * 5 + sectionIndex * 3) % frameNames.length;
    const platform = platforms[(index * 7 + sectionIndex * 3) % platforms.length];
    const profile = frameSizing[frame];
    const seed = sectionIndex * 100 + index * 17 + frame;
    const mode = index % 5;
    const local = 0.10 + rand(seed) * 0.80;
    const x = Math.round(clamp(platform.x + platform.width * local + (rand(seed + 1) - 0.5) * 44, section.startX + 42, section.endX - 42));
    const width = Math.round(profile.width * (0.82 + rand(seed + 2) * 0.36));
    const height = Math.round(profile.height * (0.84 + rand(seed + 3) * 0.32));
    const angle = Math.round((rand(seed + 4) - 0.5) * (frame === 4 || frame === 5 ? 18 : 10));
    const flipX = rand(seed + 5) > 0.52;
    const surfaceY = platform.y - height / 2 + 8 + (rand(seed + 6) - 0.5) * 8;
    const hangingY = platform.y + platform.height + height / 2 - 8 + rand(seed + 7) * 30;
    const facadeY = clamp(platform.y + 64 + rand(seed + 8) * 260, 80, 790);
    const y = Math.round(mode === 0 || mode === 3 ? surfaceY : mode === 1 ? hangingY : facadeY);
    const depth = Number((mode === 2 ? 12.05 + rand(seed + 9) * 0.25 : mode === 1 ? 12.35 + rand(seed + 10) * 0.35 : 13.05 + rand(seed + 11) * 0.75).toFixed(2));
    const alpha = Number((mode === 2 ? 0.38 + rand(seed + 12) * 0.24 : 0.62 + rand(seed + 13) * 0.25).toFixed(2));
    return {
      id: `stage1-prop-${String(sectionIndex + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
      frame,
      x,
      y,
      width,
      height,
      depth,
      alpha,
      angle,
      flipX,
      sectionId: section.id
    };
  });
});

fs.mkdirSync(path.dirname(propsOutputPath), { recursive: true });
fs.writeFileSync(propsOutputPath, `${JSON.stringify(props, null, 2)}\n`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: frameSize * columns, height: frameSize * rows }, deviceScaleFactor: 1 });

try {
  const pngBase64 = await page.evaluate(
    async ({ frameSize, columns, rows, frameNames, textureUrls }) => {
      const loadImage = (src) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error(`Unable to load ${src.slice(0, 40)}`));
          image.src = src;
        });

      const textures = Object.fromEntries(await Promise.all(Object.entries(textureUrls).map(async ([key, url]) => [key, await loadImage(url)])));
      const canvas = document.createElement('canvas');
      canvas.width = frameSize * columns;
      canvas.height = frameSize * rows;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D canvas unavailable');
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const frameRect = (frame) => ({
        x: (frame % columns) * frameSize,
        y: Math.floor(frame / columns) * frameSize,
        centerX: (frame % columns) * frameSize + frameSize / 2,
        centerY: Math.floor(frame / columns) * frameSize + frameSize / 2
      });
      const withFrame = (frame, draw) => {
        const r = frameRect(frame);
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.beginPath();
        ctx.rect(6, 6, frameSize - 12, frameSize - 12);
        ctx.clip();
        draw(r);
        ctx.restore();
      };
      const patternFill = (image, alpha = 1) => {
        const pattern = ctx.createPattern(image, 'repeat');
        if (!pattern) throw new Error('Unable to create pattern');
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pattern;
      };
      const rockPath = (cx, cy, rx, ry, seed) => {
        const points = 9;
        ctx.beginPath();
        for (let index = 0; index < points; index += 1) {
          const angle = (Math.PI * 2 * index) / points;
          const wobble = 0.76 + Math.abs(Math.sin(seed * 3.1 + index * 2.17)) * 0.34;
          const x = cx + Math.cos(angle) * rx * wobble;
          const y = cy + Math.sin(angle) * ry * wobble;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      };
      const drawStone = (cx, cy, rx, ry, seed, alpha = 0.92) => {
        ctx.save();
        rockPath(cx, cy, rx, ry, seed);
        ctx.clip();
        patternFill(textures.ground, alpha);
        ctx.translate(-seed * 9, seed * 7);
        ctx.fillRect(cx - rx - 18, cy - ry - 18, rx * 2 + 36, ry * 2 + 36);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        const shade = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
        shade.addColorStop(0, 'rgba(100,119,137,0.28)');
        shade.addColorStop(0.58, 'rgba(24,32,45,0.36)');
        shade.addColorStop(1, 'rgba(3,6,12,0.74)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = shade;
        ctx.fillRect(cx - rx - 18, cy - ry - 18, rx * 2 + 36, ry * 2 + 36);
        ctx.restore();
      };
      const drawNeonStroke = (points, color, width, glow = 8) => {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let index = 1; index < points.length; index += 1) {
          ctx.lineTo(points[index][0], points[index][1]);
        }
        ctx.stroke();
        ctx.restore();
      };

      withFrame(0, () => {
        drawStone(34, 56, 22, 14, 1, 0.9);
        drawStone(57, 50, 17, 11, 2, 0.82);
        drawStone(47, 68, 13, 8, 3, 0.76);
      });
      withFrame(1, () => {
        drawStone(49, 54, 34, 17, 5, 0.94);
        patternFill(textures.platform, 0.86);
        ctx.fillRect(18, 35, 60, 14);
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = 'rgb(4,7,14)';
        ctx.fillRect(18, 47, 60, 16);
      });
      withFrame(2, () => {
        drawStone(30, 54, 24, 23, 8, 0.9);
        drawStone(62, 52, 27, 26, 9, 0.88);
        drawNeonStroke([[20, 31], [42, 36], [72, 27]], 'rgba(48,184,224,0.62)', 2, 5);
      });
      withFrame(3, () => {
        drawNeonStroke([[48, 11], [48, 24]], 'rgba(190,145,83,0.55)', 2, 4);
        const glow = ctx.createRadialGradient(48, 52, 4, 48, 52, 34);
        glow.addColorStop(0, 'rgba(230,135,58,0.52)');
        glow.addColorStop(1, 'rgba(255,92,34,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(12, 18, 72, 72);
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = 'rgb(202,86,38)';
        ctx.fillRect(36, 34, 24, 34);
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = 'rgb(190,145,83)';
        ctx.lineWidth = 2;
        ctx.strokeRect(33, 30, 30, 42);
      });
      withFrame(4, () => drawNeonStroke([[13, 70], [28, 38], [48, 54], [68, 22], [83, 46]], 'rgba(48,184,224,0.72)', 5, 10));
      withFrame(5, () => drawNeonStroke([[14, 28], [31, 58], [52, 36], [69, 69], [84, 42]], 'rgba(212,52,170,0.66)', 5, 10));
      withFrame(6, () => {
        const glow = ctx.createRadialGradient(49, 48, 3, 49, 48, 35);
        glow.addColorStop(0, 'rgba(226,144,62,0.58)');
        glow.addColorStop(1, 'rgba(255,89,39,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(10, 10, 78, 78);
        drawStone(48, 56, 25, 16, 13, 0.78);
        drawNeonStroke([[33, 40], [63, 40], [63, 58], [33, 58], [33, 40]], 'rgba(224,112,46,0.72)', 3, 8);
      });
      withFrame(7, () => {
        patternFill(textures.ground, 0.88);
        ctx.fillRect(24, 38, 50, 34);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(4,7,13,0.54)';
        ctx.fillRect(24, 55, 50, 20);
        ctx.globalCompositeOperation = 'source-over';
        drawNeonStroke([[28, 38], [72, 38], [72, 72], [28, 72], [28, 38]], 'rgba(190,145,83,0.35)', 2, 2);
      });
      withFrame(8, () => {
        drawNeonStroke([[48, 9], [48, 22]], 'rgba(176,145,112,0.4)', 2, 2);
        for (let index = 0; index < 4; index += 1) {
          ctx.globalAlpha = 0.66;
          ctx.fillStyle = index % 2 === 0 ? 'rgb(176,46,58)' : 'rgb(176,145,112)';
          ctx.fillRect(32 + index * 8, 25 + index * 4, 7, 43);
        }
      });
      withFrame(9, () => {
        patternFill(textures.front, 0.74);
        ctx.fillRect(15, 45, 66, 22);
        ctx.globalAlpha = 0.62;
        ctx.fillStyle = 'rgb(2,5,11)';
        ctx.fillRect(18, 52, 60, 11);
        drawNeonStroke([[19, 44], [77, 44]], 'rgba(48,184,224,0.30)', 2, 5);
      });
      withFrame(10, () => {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = 'rgb(55,26,42)';
        ctx.beginPath();
        ctx.moveTo(18, 29);
        ctx.bezierCurveTo(34, 23, 56, 40, 77, 29);
        ctx.lineTo(69, 70);
        ctx.bezierCurveTo(50, 63, 36, 77, 21, 66);
        ctx.closePath();
        ctx.fill();
        drawNeonStroke([[18, 31], [77, 31]], 'rgba(212,52,170,0.36)', 2, 5);
      });
      withFrame(11, () => {
        drawStone(48, 55, 26, 31, 19, 0.92);
        drawNeonStroke([[35, 32], [61, 32], [61, 50], [35, 50], [35, 32]], 'rgba(190,145,83,0.38)', 2, 3);
      });
      withFrame(12, () => {
        drawStone(43, 64, 24, 12, 23, 0.72);
        drawNeonStroke([[28, 52], [36, 38], [42, 52]], 'rgba(56,190,150,0.46)', 3, 6);
        drawNeonStroke([[48, 55], [56, 34], [64, 56]], 'rgba(56,190,150,0.36)', 2, 5);
      });
      withFrame(13, () => {
        ctx.save();
        ctx.rotate(-0.08);
        patternFill(textures.mid, 0.7);
        ctx.fillRect(17, 34, 65, 30);
        ctx.restore();
        drawNeonStroke([[20, 37], [76, 34], [78, 58], [24, 62]], 'rgba(48,184,224,0.42)', 3, 8);
      });
      withFrame(14, () => {
        patternFill(textures.platform, 0.76);
        ctx.fillRect(22, 31, 52, 14);
        ctx.fillRect(31, 45, 10, 30);
        ctx.fillRect(57, 45, 10, 28);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgb(3,6,12)';
        ctx.fillRect(22, 50, 52, 24);
      });
      withFrame(15, () => {
        drawStone(46, 52, 17, 24, 29, 0.76);
        drawNeonStroke([[42, 28], [56, 49], [37, 72]], 'rgba(62,198,236,0.58)', 3, 7);
      });

      return canvas.toDataURL('image/png').split(',')[1];
    },
    { frameSize, columns, rows, frameNames, textureUrls }
  );
  fs.writeFileSync(sheetOutputPath, Buffer.from(pngBase64, 'base64'));
} finally {
  await browser.close();
}

const manifest = JSON.parse(fs.readFileSync(runtimeManifestPath, 'utf8'));
const propSheet = {
  id: 'stage1-props-spritesheet',
  source: Object.values(requiredAssets).map((file) => `src/assets/runtime/${file}`).join(', '),
  output: 'src/assets/runtime/stage1-props-spritesheet.png',
  width: frameSize * columns,
  height: frameSize * rows,
  frameWidth: frameSize,
  frameHeight: frameSize,
  mode: 'stage1-decor-prop-spritesheet',
  derivedFromApprovedArt: true,
  placementSource: 'src/data/stage1VisualProps.json',
  runtimeInstances: props.length,
  frames: frameNames.map((name, index) => ({ index, name }))
};
manifest.generatedAt = new Date().toISOString();
manifest.sheets = [...(manifest.sheets ?? []).filter((sheet) => sheet.id !== propSheet.id), propSheet];
fs.writeFileSync(runtimeManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Generated ${props.length} Stage1 prop placements and ${sheetOutputPath}`);

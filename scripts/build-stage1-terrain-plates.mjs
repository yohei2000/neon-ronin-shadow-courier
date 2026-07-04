import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const rootDir = process.cwd();
const stagePath = path.resolve(rootDir, 'src', 'data', 'stage1Content.json');
const runtimeDir = path.resolve(rootDir, 'src', 'assets', 'runtime');
const stage = JSON.parse(fs.readFileSync(stagePath, 'utf8'));
const runtimeManifestPath = path.join(runtimeDir, 'runtime-sprite-sheets.json');

const requiredAssets = {
  ground: 'stage1-ground-tile.png',
  platform: 'stage1-platform-thin-tile.png',
  front: 'stage1-bg-front.png',
  near: 'stage1-bg-near.png',
  mid: 'stage1-bg-mid.png',
  telegraph: 'telegraph-runtime-spritesheet.png',
  slash: 'slash-runtime-spritesheet.png'
};

const dataUrlFor = (fileName) => {
  const fullPath = path.join(runtimeDir, fileName);
  const bytes = fs.readFileSync(fullPath);
  return `data:image/png;base64,${bytes.toString('base64')}`;
};

const textureUrls = Object.fromEntries(Object.entries(requiredAssets).map(([key, fileName]) => [key, dataUrlFor(fileName)]));
const plates = stage.visualTerrain?.plates ?? [];
const plateOutputs = [];

if (plates.length === 0) {
  throw new Error('stage1Content.json is missing visualTerrain.plates');
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 900 }, deviceScaleFactor: 1 });

try {
  for (const plate of plates) {
    const pngBase64 = await page.evaluate(
      async ({ plate, stage, textureUrls }) => {
        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Unable to load ${src.slice(0, 40)}`));
            image.src = src;
          });

        const textures = Object.fromEntries(await Promise.all(Object.entries(textureUrls).map(async ([key, url]) => [key, await loadImage(url)])));
        const canvas = document.createElement('canvas');
        canvas.width = plate.width;
        canvas.height = plate.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D canvas unavailable');
        ctx.imageSmoothingEnabled = false;

        const localRect = (rect, extraX = 0, extraY = 0) => ({
          x: rect.x - plate.x - extraX,
          y: rect.y - plate.y - extraY,
          width: rect.width + extraX * 2,
          height: rect.height + extraY * 2
        });
        const intersectsPlate = (rect, margin = 0) =>
          rect.x < plate.x + plate.width + margin &&
          rect.x + rect.width > plate.x - margin &&
          rect.y < plate.y + plate.height + margin &&
          rect.y + rect.height > plate.y - margin;
        const wave = (seed, step, amplitude) => {
          const value = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
          return (value - Math.floor(value) - 0.5) * amplitude * 2;
        };
        const fillPattern = (image, alpha = 1) => {
          const pattern = ctx.createPattern(image, 'repeat');
          if (!pattern) throw new Error('Unable to create terrain pattern');
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pattern;
        };
        const drawWavyPath = (x, y, width, height, seed, topAmp, sideAmp) => {
          const steps = Math.max(4, Math.ceil(width / 92));
          ctx.beginPath();
          ctx.moveTo(x + wave(seed, 0, sideAmp), y + wave(seed, 1, topAmp));
          for (let index = 1; index <= steps; index += 1) {
            const px = x + (width * index) / steps;
            ctx.lineTo(px, y + wave(seed, index, topAmp));
          }
          ctx.lineTo(x + width + wave(seed, 17, sideAmp), y + height);
          ctx.lineTo(x + wave(seed, 23, sideAmp), y + height);
          ctx.closePath();
        };
        const drawRockCluster = (cx, cy, width, height, seed, alpha = 0.78) => {
          const points = Math.max(7, Math.floor((width + height) / 28));
          ctx.save();
          ctx.beginPath();
          for (let index = 0; index < points; index += 1) {
            const angle = (Math.PI * 2 * index) / points;
            const radiusX = width * (0.42 + Math.abs(wave(seed, index, 0.18)));
            const radiusY = height * (0.42 + Math.abs(wave(seed + 3, index, 0.18)));
            const x = cx + Math.cos(angle) * radiusX;
            const y = cy + Math.sin(angle) * radiusY;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.clip();
          fillPattern(textures.ground, alpha);
          ctx.fillRect(cx - width, cy - height, width * 2, height * 2);
          ctx.globalCompositeOperation = 'source-atop';
          const shade = ctx.createRadialGradient(cx - width * 0.2, cy - height * 0.38, 4, cx, cy, Math.max(width, height));
          shade.addColorStop(0, 'rgba(82,98,115,0.36)');
          shade.addColorStop(0.55, 'rgba(18,25,36,0.44)');
          shade.addColorStop(1, 'rgba(3,6,12,0.78)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = shade;
          ctx.fillRect(cx - width, cy - height, width * 2, height * 2);
          ctx.restore();
        };
        const drawMass = (rect, seed, tone = 'deep') => {
          const r = localRect(rect, 18, 0);
          ctx.save();
          drawWavyPath(r.x, r.y, r.width, r.height, seed, 5, 14);
          ctx.clip();
          fillPattern(textures.ground, 0.94);
          ctx.translate((rect.x * 0.17) % 96, (rect.y * 0.13) % 96);
          ctx.fillRect(r.x - 120, r.y - 80, r.width + 240, r.height + 160);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = 'source-atop';
          const gradient = ctx.createLinearGradient(0, r.y, 0, r.y + r.height);
          gradient.addColorStop(0, tone === 'deep' ? 'rgba(43,56,78,0.30)' : 'rgba(91,108,126,0.22)');
          gradient.addColorStop(0.62, 'rgba(10,15,24,0.58)');
          gradient.addColorStop(1, 'rgba(2,5,11,0.92)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = gradient;
          ctx.fillRect(r.x - 4, r.y - 4, r.width + 8, r.height + 8);
          fillPattern(textures.front, 0.16);
          ctx.fillRect(r.x - 30, r.y - 30, r.width + 60, r.height + 80);
          ctx.restore();

          ctx.save();
          drawWavyPath(r.x - 6, r.y - 10, r.width + 12, 36, seed + 9, 3, 7);
          ctx.clip();
          fillPattern(textures.platform, 0.92);
          ctx.fillRect(r.x - 34, r.y - 20, r.width + 68, 58);
          ctx.restore();

          const clusterCount = Math.max(3, Math.floor(r.width / 170));
          for (let index = 0; index < clusterCount; index += 1) {
            const px = r.x + (r.width * (index + 0.45)) / clusterCount + wave(seed, index, 28);
            drawRockCluster(px, r.y + 16 + wave(seed + 2, index, 8), 34 + Math.abs(wave(seed, index + 5, 18)), 18 + Math.abs(wave(seed + 4, index, 9)), seed + index, 0.52);
          }
        };
        const drawLedge = (platform, seed) => {
          const r = localRect(platform, platform.height <= 30 ? 22 : 32, 8);
          const lipHeight = platform.height <= 30 ? 42 : 56;
          ctx.save();
          drawWavyPath(r.x, r.y - 4, r.width, lipHeight, seed, 4, 8);
          ctx.clip();
          fillPattern(platform.height <= 30 ? textures.platform : textures.ground, 0.98);
          ctx.translate((platform.x * 0.31) % 128, (platform.y * 0.07) % 64);
          ctx.fillRect(r.x - 60, r.y - 28, r.width + 120, lipHeight + 52);
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = 'rgb(7,11,20)';
          ctx.fillRect(r.x - 30, r.y + lipHeight * 0.46, r.width + 60, lipHeight);
          ctx.restore();

          ctx.save();
          const underHeight = Math.max(26, platform.height * 0.72);
          drawWavyPath(r.x + 8, platform.y - plate.y + platform.height - 2, r.width - 16, underHeight, seed + 21, 2, 12);
          ctx.clip();
          fillPattern(textures.front, platform.height <= 30 ? 0.24 : 0.34);
          ctx.fillRect(r.x - 40, platform.y - plate.y + platform.height - 14, r.width + 80, underHeight + 36);
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = 0.62;
          ctx.fillStyle = 'rgb(5,8,16)';
          ctx.fillRect(r.x - 40, platform.y - plate.y + platform.height - 10, r.width + 80, underHeight + 40);
          ctx.restore();

          const chipCount = Math.max(2, Math.floor(platform.width / 115));
          for (let index = 0; index < chipCount; index += 1) {
            const x = r.x + (r.width * (index + 0.35)) / chipCount + wave(seed, index, 18);
            const y = platform.y - plate.y + platform.height + 4 + wave(seed + 5, index, 7);
            drawRockCluster(x, y, 26 + Math.abs(wave(seed, index + 2, 14)), 13 + Math.abs(wave(seed + 8, index, 8)), seed + index * 4, 0.62);
          }
          drawRockCluster(r.x + 8, r.y + lipHeight * 0.58, 38, 28, seed + 31, 0.66);
          drawRockCluster(r.x + r.width - 8, r.y + lipHeight * 0.58, 42, 30, seed + 37, 0.66);
        };
        const drawSectionProp = (x, y, w, h, seed, accent) => {
          const lx = x - plate.x;
          const ly = y - plate.y;
          if (lx + w < -80 || lx > plate.width + 80) return;
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.strokeStyle = 'rgba(4,8,16,0.82)';
          ctx.lineWidth = Math.max(3, w * 0.08);
          ctx.beginPath();
          ctx.moveTo(lx + w * 0.28, ly + 10);
          ctx.bezierCurveTo(lx + wave(seed, 2, 22), ly + h * 0.24, lx + w + wave(seed, 4, 24), ly + h * 0.66, lx + w * 0.62, ly + h);
          ctx.stroke();
          ctx.globalAlpha = 0.2;
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lx + w * 0.18, ly + 18);
          ctx.bezierCurveTo(lx + w * 0.1, ly + h * 0.28, lx + w * 0.86, ly + h * 0.54, lx + w * 0.64, ly + h - 16);
          ctx.stroke();
          ctx.restore();
        };
        const drawLantern = (x, y, seed) => {
          const lx = x - plate.x;
          const ly = y - plate.y;
          if (lx < -80 || lx > plate.width + 80) return;
          ctx.save();
          const glow = ctx.createRadialGradient(lx, ly, 4, lx, ly, 52);
          glow.addColorStop(0, 'rgba(255,190,84,0.58)');
          glow.addColorStop(1, 'rgba(255,92,38,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(lx - 60, ly - 60, 120, 120);
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = seed % 2 === 0 ? 'rgb(255,164,67)' : 'rgb(63,221,255)';
          ctx.fillRect(lx - 8, ly - 12, 16, 22);
          ctx.globalAlpha = 0.34;
          ctx.strokeStyle = 'rgb(243,222,170)';
          ctx.lineWidth = 2;
          ctx.strokeRect(lx - 10, ly - 14, 20, 26);
          ctx.restore();
        };

        ctx.clearRect(0, 0, plate.width, plate.height);

        stage.terrainSupports.filter((support) => intersectsPlate(support, 80)).forEach((support, index) => drawMass(support, support.x * 0.01 + index, index % 3 === 0 ? 'mid' : 'deep'));
        stage.platforms.filter((platform) => intersectsPlate(platform, 90)).forEach((platform, index) => drawLedge(platform, platform.x * 0.013 + index * 2));

        const propEvery = Math.max(340, Math.floor(plate.width / 5));
        for (let x = plate.x + 90; x < plate.x + plate.width - 40; x += propEvery) {
          const baseY = plate.id.includes('sign') ? 175 + Math.abs(wave(x, 1, 130)) : plate.id.includes('thorn') ? 210 + Math.abs(wave(x, 1, 210)) : 300 + Math.abs(wave(x, 1, 160));
          drawSectionProp(x, baseY, 26 + Math.abs(wave(x, 4, 12)), 130 + Math.abs(wave(x, 8, 120)), x, x % 3 === 0 ? 'rgba(73,232,255,0.52)' : 'rgba(255,74,202,0.46)');
          drawLantern(x + 30 + wave(x, 5, 42), baseY + 54 + wave(x, 7, 32), Math.round(x));
        }

        if (plate.id.includes('warden')) {
          drawSectionProp(plate.x + plate.width - 380, 312, 54, 260, 88, 'rgba(240,211,142,0.72)');
          drawLantern(plate.x + plate.width - 260, 386, 7);
        }
        if (plate.id.includes('thorn')) {
          drawSectionProp(plate.x + 690, 132, 34, 360, 17, 'rgba(73,232,255,0.46)');
          drawSectionProp(plate.x + 1170, 190, 32, 270, 23, 'rgba(255,74,202,0.42)');
        }
        if (plate.id.includes('sign')) {
          drawSectionProp(plate.x + 190, 112, 52, 370, 31, 'rgba(73,232,255,0.48)');
          drawSectionProp(plate.x + 500, 58, 54, 380, 43, 'rgba(255,74,202,0.42)');
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = 'rgb(2,4,10)';
        ctx.fillRect(0, plate.height - 140, plate.width, 140);
        ctx.globalAlpha = 1;

        return canvas.toDataURL('image/png').split(',')[1];
      },
      { plate, stage, textureUrls }
    );
    const outputName = `${plate.assetKey}.png`;
    fs.writeFileSync(path.join(runtimeDir, outputName), Buffer.from(pngBase64, 'base64'));
    plateOutputs.push({
      id: plate.assetKey,
      source: 'src/assets/runtime/stage1-ground-tile.png, src/assets/runtime/stage1-platform-thin-tile.png, src/assets/runtime/stage1-bg-front.png',
      output: `src/assets/runtime/${outputName}`,
      width: plate.width,
      height: plate.height,
      mode: 'image-first-terrain-plate',
      collisionSource: 'src/data/stage1Content.json#platforms',
      visualSource: 'src/data/stage1Content.json#visualTerrain'
    });
    console.log(`wrote ${path.relative(rootDir, path.join(runtimeDir, outputName))}`);
  }

  const manifest = JSON.parse(fs.readFileSync(runtimeManifestPath, 'utf8'));
  const terrainIds = new Set(plateOutputs.map((entry) => entry.id));
  manifest.generatedAt = new Date().toISOString();
  manifest.sheets = [...(manifest.sheets ?? []).filter((entry) => !terrainIds.has(entry.id)), ...plateOutputs];
  fs.writeFileSync(runtimeManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`updated ${path.relative(rootDir, runtimeManifestPath)}`);
} finally {
  await browser.close();
}

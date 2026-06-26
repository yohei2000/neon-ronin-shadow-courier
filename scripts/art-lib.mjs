import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

export const rootDir = process.cwd();

export const palette = {
  inkBlack: '#050508',
  deepIndigo: '#0B1020',
  darkBlueGray: '#162435',
  warmPaper: '#E8DDC6',
  paleMoonMist: '#B9CBE0',
  neutralGray: '#7B838D',
  lanternGold: '#F0A64A',
  dangerCoral: '#EF4B61',
  neonCyan: '#00E5FF',
  neonMagenta: '#FF2E7A',
  enemyAmber: '#FFB12E',
  enemyVermilion: '#FF5A24'
};

export const referenceDir = path.join(rootDir, 'art', 'references', 'neon_ronin_art_refs_impl_ready');
export const gateADir = path.join(rootDir, 'art', 'reviews', 'gate-a');
export const candidateDir = path.join(rootDir, 'art', 'reviews', 'candidates');

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function readPngInfo(filePath) {
  const buffer = await fs.readFile(filePath);
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`${filePath} is not a PNG.`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bytes: buffer.length
  };
}

export async function renderSvgToPng(svg, outputPath, width, height) {
  await ensureDir(path.dirname(outputPath));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#050508;overflow:hidden}</style></head><body>${svg}</body></html>`,
      { waitUntil: 'load' }
    );
    const localErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') localErrors.push(message.text());
    });
    await page.locator('svg').screenshot({ path: outputPath, omitBackground: false });
    if (localErrors.length > 0) {
      throw new Error(`SVG render console errors: ${localErrors.join('; ')}`);
    }
  } finally {
    await browser.close();
  }
}

export function svgShell(width, height, body, extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="paperNoise" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="3" seed="17"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.11"/>
      </feComponentTransfer>
    </filter>
    <pattern id="rain" width="34" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(14)">
      <line x1="10" y1="0" x2="10" y2="18" stroke="${palette.paleMoonMist}" stroke-width="1" opacity="0.22"/>
      <line x1="24" y1="6" x2="24" y2="32" stroke="${palette.neonCyan}" stroke-width="0.8" opacity="0.12"/>
    </pattern>
    ${extraDefs}
  </defs>
  ${body}
</svg>`;
}

export function brushRect(x, y, width, height, fill, stroke = palette.inkBlack, opacity = 1) {
  return `<path d="M ${x + 8} ${y + 2}
    C ${x + 32} ${y - 4}, ${x + width - 30} ${y + 4}, ${x + width - 8} ${y + 2}
    L ${x + width - 2} ${y + height - 8}
    C ${x + width - 42} ${y + height + 5}, ${x + 40} ${y + height - 2}, ${x + 7} ${y + height + 1}
    L ${x + 2} ${y + 8} Z"
    fill="${fill}" stroke="${stroke}" stroke-width="3" opacity="${opacity}"/>`;
}

export function playerSilhouette(x, y, scale = 1, pose = 'idle') {
  const scarfFlow = pose === 'slash' ? 88 : pose === 'run' ? 74 : pose === 'jump' ? 60 : 48;
  const lean = pose === 'run' || pose === 'slash' ? 10 : pose === 'wall' ? -8 : 0;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M ${-22 - scarfFlow} -50 C -58 -62, -42 -43, -18 -36 C -36 -31, -56 -25, ${-22 - scarfFlow} -16 C -44 -18, -30 -11, -12 -20 L 0 -32 Z"
      fill="${palette.neonMagenta}" opacity="0.92"/>
    <ellipse cx="${lean}" cy="-54" rx="15" ry="18" fill="${palette.inkBlack}" stroke="${palette.neutralGray}" stroke-width="2"/>
    <circle cx="${lean + 8}" cy="-57" r="3.8" fill="${palette.neonCyan}" filter="url(#softGlow)"/>
    <path d="M ${-14 + lean} -42 C ${-24 + lean} -18, ${-18 + lean} 6, ${-7 + lean} 30 L ${18 + lean} 30 C ${24 + lean} 4, ${18 + lean} -22, ${8 + lean} -42 Z"
      fill="${palette.inkBlack}" stroke="${palette.neutralGray}" stroke-width="2"/>
    <path d="M ${-9 + lean} -18 L ${-28 + lean} 14 L ${-17 + lean} 18 L ${-1 + lean} -10 Z" fill="${palette.inkBlack}" stroke="${palette.neutralGray}" stroke-width="1.5"/>
    <path d="M ${10 + lean} -14 L ${34 + lean} 6 L ${28 + lean} 13 L ${6 + lean} 0 Z" fill="${palette.inkBlack}" stroke="${palette.neutralGray}" stroke-width="1.5"/>
    <path d="M ${-9 + lean} 28 L ${-22 + lean} 66 L ${-6 + lean} 66 L ${4 + lean} 30 Z" fill="${palette.inkBlack}" stroke="${palette.neutralGray}" stroke-width="1.5"/>
    <path d="M ${12 + lean} 29 L ${23 + lean} 66 L ${38 + lean} 66 L ${24 + lean} 29 Z" fill="${palette.inkBlack}" stroke="${palette.neutralGray}" stroke-width="1.5"/>
    <rect x="${18 + lean}" y="-6" width="18" height="24" rx="3" fill="${palette.inkBlack}" stroke="${palette.neonCyan}" stroke-width="2"/>
    <path d="M ${22 + lean} 5 l5 -6 l6 6 l-6 6 Z" fill="none" stroke="${palette.neonCyan}" stroke-width="2"/>
  </g>`;
}

export function slashArc(x, y, scale = 1, phase = 'active') {
  const opacity = phase === 'fade' ? 0.3 : phase === 'anticipation' ? 0.55 : 0.95;
  const size = phase === 'anticipation' ? 0.55 : phase === 'breakup' ? 0.85 : 1;
  return `<g transform="translate(${x} ${y}) scale(${scale * size})" opacity="${opacity}">
    <path d="M -10 32 C 46 -42, 142 -48, 202 -8 C 128 -22, 72 6, 14 58 Z" fill="${palette.inkBlack}" opacity="0.95"/>
    <path d="M 9 25 C 58 -24, 126 -29, 182 -5 C 116 -7, 70 13, 21 48 Z" fill="${palette.neonMagenta}" filter="url(#softGlow)"/>
    <path d="M 122 -18 l12 -10 l-3 14 l14 4 l-15 3 l-6 14 l-4 -14 l-16 -3 Z" fill="${palette.neonCyan}"/>
    <path d="M 154 17 l10 -6 l-3 10 l9 4 l-11 1 l-5 9 l-2 -10 l-10 -4 Z" fill="${palette.neonMagenta}"/>
  </g>`;
}

export function sign(x, y, width, height, color, label = '') {
  return `<g transform="translate(${x} ${y})">
    ${brushRect(0, 0, width, height, '#0A0C12', color, 0.96)}
    <rect x="9" y="8" width="${width - 18}" height="${height - 16}" fill="none" stroke="${color}" stroke-width="2" opacity="0.85" filter="url(#softGlow)"/>
    <path d="M ${width * 0.34} ${height * 0.28} L ${width * 0.64} ${height * 0.28} L ${width * 0.52} ${height * 0.72} L ${width * 0.28} ${height * 0.72} Z"
      fill="none" stroke="${color}" stroke-width="4" opacity="0.78"/>
    <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${palette.warmPaper}" opacity="0.72">${escapeHtml(label)}</text>
  </g>`;
}

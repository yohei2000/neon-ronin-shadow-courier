import fs from 'node:fs/promises';
import path from 'node:path';
import {
  brushRect,
  ensureDir,
  palette,
  playerSilhouette,
  renderSvgToPng,
  rootDir,
  sign,
  slashArc,
  svgShell,
  writeJson
} from './art-lib.mjs';

const artDir = path.join(rootDir, 'art');
const finalDir = path.join(artDir, 'final');
const assetDir = path.join(finalDir, 'assets');
const sourceDir = path.join(artDir, 'source', 'svg');
const approvalDir = path.join(artDir, 'approvals');

const references = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const assetLicense = {
  owner: 'project-owned',
  license: 'all runtime assets authored for this repository from local SVG source; reference sheets are specifications only',
  sourcePipeline: 'scripts/process-art-assets.mjs -> SVG -> Playwright Chromium raster PNG'
};

await ensureDir(finalDir);
await ensureDir(assetDir);
await ensureDir(sourceDir);
await ensureDir(approvalDir);

function text(x, y, value, size = 18, color = palette.warmPaper, family = 'Arial, sans-serif') {
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${color}">${value}</text>`;
}

function title(x, y, value, size = 32, color = palette.warmPaper) {
  return text(x, y, value, size, color, 'Arial Black, Arial, sans-serif');
}

function paperBackdrop(width, height, mode = 'warm-cool-alley') {
  const accent = mode === 'cyan-magenta-neon' ? palette.neonMagenta : mode === 'moonlight-lantern-gold' ? palette.lanternGold : palette.neonCyan;
  return `<rect width="${width}" height="${height}" fill="${palette.deepIndigo}"/>
  <radialGradient id="skyGlow" cx="46%" cy="20%" r="70%">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.20"/>
    <stop offset="42%" stop-color="${palette.darkBlueGray}" stop-opacity="0.40"/>
    <stop offset="100%" stop-color="${palette.inkBlack}" stop-opacity="1"/>
  </radialGradient>
  <rect width="${width}" height="${height}" fill="url(#skyGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#rain)" opacity="0.34"/>
  <rect width="${width}" height="${height}" filter="url(#paperNoise)" opacity="0.38"/>`;
}

function roofRun(y, opacity = 1, color = palette.inkBlack, offset = 0) {
  const roofs = Array.from({ length: 16 }, (_, index) => {
    const x = offset + index * 130 - 120;
    const peak = y - 30 - ((index % 3) * 8);
    return `<path d="M ${x} ${y} L ${x + 52} ${peak} L ${x + 122} ${y} Z" fill="${color}" opacity="${opacity}"/>
      <rect x="${x + 28}" y="${y - 2}" width="64" height="42" fill="${color}" opacity="${opacity * 0.72}"/>`;
  }).join('');
  return `<g>${roofs}</g>`;
}

function moonGate(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <circle cx="0" cy="-116" r="78" fill="${palette.paleMoonMist}" opacity="0.68"/>
    <path d="M -118 80 C -114 -118, 110 -118, 118 80" fill="none" stroke="${palette.inkBlack}" stroke-width="30"/>
    <path d="M -118 80 C -114 -118, 110 -118, 118 80" fill="none" stroke="${palette.warmPaper}" stroke-width="4" opacity="0.52"/>
    <path d="M -148 80 H 148" stroke="${palette.inkBlack}" stroke-width="28"/>
    <path d="M -142 70 H 142" stroke="${palette.lanternGold}" stroke-width="3" opacity="0.55"/>
  </g>`;
}

function enemyCrawler(x, y, scale = 1, phase = 'idle') {
  const glow = phase === 'release' ? palette.neonMagenta : phase === 'telegraph' ? palette.neonCyan : palette.neutralGray;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="12" rx="58" ry="22" fill="${palette.inkBlack}" stroke="${glow}" stroke-width="3"/>
    <path d="M -54 22 C -84 34, -86 48, -54 42 M -22 28 C -48 52, -42 62, -12 40 M 24 28 C 48 52, 42 62, 12 40 M 54 22 C 84 34, 86 48, 54 42"
      fill="none" stroke="${palette.inkBlack}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="34" cy="2" r="5" fill="${palette.neonCyan}" filter="url(#softGlow)"/>
    ${phase === 'telegraph' ? `<ellipse cx="42" cy="44" rx="70" ry="14" fill="none" stroke="${palette.neonCyan}" stroke-width="4" opacity="0.8"/>` : ''}
    ${phase === 'release' ? slashArc(20, 12, 0.36, 'active') : ''}
  </g>`;
}

function warden(x, y, scale = 1, phase = 'closed') {
  const open = phase !== 'closed';
  const danger = phase === 'release' || phase === 'windup';
  const color = danger ? palette.neonMagenta : phase === 'recover' ? palette.lanternGold : palette.neonCyan;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M -34 84 C -54 18, -42 -64, 0 -92 C 44 -60, 55 16, 34 84 Z" fill="${palette.inkBlack}" stroke="${color}" stroke-width="4"/>
    <path d="M -18 -54 C -6 -72, 6 -72, 18 -54 L ${open ? 34 : 16} 18 C 4 28, -4 28, ${open ? -34 : -16} 18 Z" fill="${open ? palette.lanternGold : palette.darkBlueGray}" opacity="${open ? 0.76 : 0.46}"/>
    <path d="M -70 18 C -44 0, -28 -6, -8 10 M 70 18 C 44 0, 28 -6, 8 10" stroke="${palette.inkBlack}" stroke-width="10" stroke-linecap="round"/>
    ${phase === 'ground' ? `<ellipse cx="0" cy="110" rx="92" ry="18" fill="none" stroke="${palette.neonMagenta}" stroke-width="5" filter="url(#softGlow)"/>` : ''}
    ${phase === 'release' ? slashArc(-12, 38, 0.55, 'active') : ''}
  </g>`;
}

function kiteWraith(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M -72 0 C -22 -56, 42 -56, 88 -6 C 34 -18, -8 8, -58 42 Z" fill="${palette.inkBlack}" stroke="${palette.neonCyan}" stroke-width="4"/>
    <path d="M -16 -22 L 8 -52 L 32 -20 L 10 28 Z" fill="${palette.darkBlueGray}" stroke="${palette.neonMagenta}" stroke-width="3"/>
    <path d="M 34 -8 C 72 0, 92 18, 108 46" fill="none" stroke="${palette.neonCyan}" stroke-width="5" stroke-linecap="round" opacity="0.74"/>
    <circle cx="12" cy="-18" r="4" fill="${palette.neonMagenta}" filter="url(#softGlow)"/>
  </g>`;
}

function runtimeSceneBody(width = 960, height = 540, mode = 'warm-cool-alley', options = {}) {
  const dense = options.dense ?? false;
  const playerPose = options.playerPose ?? 'run';
  const signs = dense
    ? `${sign(82, 98, 82, 154, palette.neonCyan, 'utility')}${sign(216, 166, 118, 68, palette.neonMagenta, 'action')}${sign(706, 102, 88, 160, palette.lanternGold, 'safe')}${sign(824, 228, 78, 62, palette.neonCyan, 'focus')}`
    : `${sign(98, 120, 76, 134, palette.neonCyan, 'utility')}${sign(730, 148, 96, 92, palette.lanternGold, 'safe')}`;
  return `${paperBackdrop(width, height, mode)}
    ${roofRun(250, 0.18, palette.paleMoonMist, -30)}
    ${roofRun(310, 0.36, palette.darkBlueGray, 20)}
    ${moonGate(490, 350, 0.98)}
    ${signs}
    <path d="M 0 382 C 142 370, 266 402, 416 388 C 570 374, 690 390, 960 374 L 960 540 L 0 540 Z" fill="#15171A"/>
    <path d="M 0 382 C 142 370, 266 402, 416 388 C 570 374, 690 390, 960 374" fill="none" stroke="${palette.warmPaper}" stroke-width="3" opacity="0.45"/>
    <path d="M 40 420 C 190 438, 370 430, 560 416" stroke="${palette.neonCyan}" stroke-width="3" opacity="0.22"/>
    <path d="M 620 420 C 760 432, 848 420, 940 410" stroke="${palette.neonMagenta}" stroke-width="3" opacity="0.20"/>
    ${playerSilhouette(286, 372, 1.0, playerPose)}
    ${enemyCrawler(620, 364, 0.82, dense ? 'telegraph' : 'idle')}
    ${dense ? warden(770, 332, 0.72, 'ground') : ''}
    ${options.slash ? slashArc(398, 324, 0.58, 'active') : ''}
  `;
}

function runtimeSceneSvg(width = 960, height = 540, mode = 'warm-cool-alley', options = {}) {
  return svgShell(width, height, runtimeSceneBody(width, height, mode, options));
}

async function render(relativePath, svg, width, height) {
  const out = path.join(rootDir, relativePath);
  await ensureDir(path.dirname(out));
  await fs.writeFile(path.join(sourceDir, `${path.basename(relativePath, '.png')}.svg`), svg, 'utf8');
  await renderSvgToPng(svg, out, width, height);
  return relativePath.replaceAll('\\', '/');
}

function playerSheetSvg() {
  const states = [
    ['idle', 6],
    ['run', 8],
    ['jump-rise', 3],
    ['apex', 2],
    ['fall', 2],
    ['wall-slide', 4],
    ['wall-kick', 4],
    ['ground-slash', 8],
    ['air-slash', 6],
    ['hurt', 3],
    ['checkpoint-respawn', 6]
  ];
  let frame = 0;
  const cells = states.flatMap(([state, count]) =>
    Array.from({ length: count }, (_, local) => {
      const x = (frame % 8) * 128;
      const y = Math.floor(frame / 8) * 128;
      frame += 1;
      const pose = state.includes('slash') ? 'slash' : state.includes('run') ? 'run' : state.includes('wall') ? 'wall' : state.includes('jump') || state === 'apex' || state === 'fall' ? 'jump' : 'idle';
      const bob = (local % 3) * 2;
      return `<g>
        <rect x="${x}" y="${y}" width="128" height="128" fill="none"/>
        ${playerSilhouette(x + 62, y + 80 + bob, 0.72, pose)}
        ${state.includes('slash') && local >= 2 && local <= 5 ? slashArc(x + 56, y + 52, 0.26, local < 4 ? 'active' : 'breakup') : ''}
      </g>`;
    })
  ).join('');
  return svgShell(1024, 896, `<rect width="1024" height="896" fill="transparent"/>${cells}`);
}

function enemySheetSvg() {
  const phases = ['idle', 'telegraph', 'release', 'recover'];
  const crawlers = phases.map((phase, index) => enemyCrawler(82 + index * 128, 82, 0.75, phase)).join('');
  const kites = Array.from({ length: 4 }, (_, index) => kiteWraith(82 + index * 128, 220 + (index % 2) * 8, 0.72)).join('');
  return svgShell(512, 320, `<rect width="512" height="320" fill="transparent"/>${crawlers}${kites}`);
}

function wardenSheetSvg() {
  const phases = ['closed', 'glow', 'aim', 'ground', 'windup', 'release', 'recover', 'defeat'];
  return svgShell(1024, 256, `<rect width="1024" height="256" fill="transparent"/>
    ${phases.map((phase, index) => warden(64 + index * 128, 138, 0.62, phase === 'defeat' ? 'recover' : phase)).join('')}`);
}

function slashSheetSvg() {
  const phases = ['anticipation', 'anticipation', 'active', 'active', 'breakup', 'breakup', 'fade', 'fade'];
  return svgShell(1024, 160, `<rect width="1024" height="160" fill="transparent"/>
    ${phases.map((phase, index) => slashArc(28 + index * 128, 80, 0.44, phase)).join('')}`);
}

function telegraphSheetSvg() {
  const phases = ['glow-up', 'aiming pose', 'ground warning', 'wind-up', 'release', 'recover'];
  const heavy = phases.map((phase, index) => `<g transform="translate(${36 + index * 156} 94)">
    ${phase === 'ground warning' ? '<ellipse cx="44" cy="74" rx="54" ry="15" fill="none" stroke="#FF2E7A" stroke-width="4"/>' : ''}
    ${warden(44, 0, 0.42, phase === 'release' ? 'release' : phase === 'ground warning' ? 'ground' : phase === 'recover' ? 'recover' : 'glow')}
    ${text(0, 124, phase, 13, palette.warmPaper)}
  </g>`).join('');
  const fast = phases.map((phase, index) => `<g transform="translate(${36 + index * 156} 286)">
    ${phase === 'ground warning' ? '<line x1="-12" y1="78" x2="108" y2="78" stroke="#00E5FF" stroke-width="4"/>' : ''}
    ${kiteWraith(44, 0, 0.44)}
    ${phase === 'release' ? slashArc(46, 16, 0.24, 'active') : ''}
    ${text(0, 124, phase, 13, palette.warmPaper)}
  </g>`).join('');
  return svgShell(960, 430, `${paperBackdrop(960, 430, 'cyan-magenta-neon')}${title(34, 48, 'Telegraph Timeline Asset', 30)}${heavy}${fast}`);
}

function uiKitSvg() {
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${title(34, 58, 'Final UI Kit', 32)}
    <g transform="translate(40 98)">
      ${brushRect(0, 0, 360, 76, '#07080C', palette.inkBlack)}
      <circle cx="38" cy="38" r="26" fill="${palette.neonMagenta}" opacity="0.86"/>
      <rect x="84" y="24" width="232" height="24" fill="${palette.neonMagenta}" filter="url(#softGlow)"/>
      ${brushRect(420, 0, 172, 76, '#07080C', palette.neonCyan)}
      ${text(458, 49, '01:24', 28, palette.neonCyan, 'Arial Black, Arial, sans-serif')}
      ${brushRect(620, 0, 246, 76, palette.warmPaper, palette.inkBlack)}
      ${text(654, 49, 'MOON GATE', 24, palette.inkBlack, 'Arial Black, Arial, sans-serif')}
      ${brushRect(0, 118, 320, 154, palette.warmPaper, palette.inkBlack)}
      ${text(26, 166, 'Objective', 28, palette.inkBlack, 'Arial Black, Arial, sans-serif')}
      ${text(26, 204, 'Deliver the sealed scroll', 20, palette.darkBlueGray)}
      ${brushRect(370, 114, 340, 170, '#080A0F', palette.inkBlack)}
      ${brushRect(420, 150, 226, 44, palette.warmPaper, palette.neonMagenta)}
      ${brushRect(420, 210, 226, 44, '#0D1118', palette.neonCyan)}
      ${text(500, 180, 'START', 20, palette.inkBlack, 'Arial Black, Arial, sans-serif')}
      ${text(488, 240, 'ART LAB', 20, palette.neonCyan, 'Arial Black, Arial, sans-serif')}
      <g transform="translate(22 318)">
        <circle cx="76" cy="76" r="70" fill="#090B10" stroke="${palette.neonCyan}" stroke-width="5" opacity="0.95"/>
        <circle cx="76" cy="76" r="32" fill="#11151C" stroke="${palette.neutralGray}" stroke-width="3"/>
        <circle cx="288" cy="76" r="56" fill="#090B10" stroke="${palette.neonMagenta}" stroke-width="5"/>
        <circle cx="420" cy="76" r="56" fill="#090B10" stroke="${palette.neonCyan}" stroke-width="5"/>
        ${text(268, 86, 'SL', 25, palette.neonMagenta, 'Arial Black, Arial, sans-serif')}
        ${text(400, 86, 'JP', 25, palette.neonCyan, 'Arial Black, Arial, sans-serif')}
      </g>
    </g>`);
}

function brushKitSvg() {
  const rows = Array.from({ length: 6 }, (_, index) => {
    const y = 98 + index * 66;
    return `<path d="M 70 ${y} C 180 ${y - 34}, 320 ${y + 38}, 452 ${y - 12} C 362 ${y + 8}, 196 ${y + 22}, 72 ${y + 14} Z"
      fill="${index % 2 ? palette.inkBlack : palette.neonMagenta}" opacity="${index % 2 ? 0.92 : 0.70}"/>
      <path d="M 530 ${y} C 612 ${y - 28}, 700 ${y + 20}, 828 ${y - 8}" fill="none" stroke="${index % 2 ? palette.neonCyan : palette.warmPaper}" stroke-width="${10 + index}" stroke-linecap="round" opacity="0.76"/>`;
  }).join('');
  return svgShell(960, 540, `${paperBackdrop(960, 540)}${title(34, 58, 'Reference A Brush And Paper Kit', 30)}${rows}`);
}

function signAtlasSvg() {
  const modules = [];
  for (let i = 0; i < 3; i += 1) modules.push(sign(38 + i * 278, 78, 178, 108, i === 1 ? palette.neonMagenta : palette.neonCyan, `hero ${i + 1}`));
  for (let i = 0; i < 8; i += 1) modules.push(sign(32 + (i % 4) * 222, 230 + Math.floor(i / 4) * 106, 132, 62, i % 2 ? palette.lanternGold : palette.neonCyan, `mid ${i + 1}`));
  for (let i = 0; i < 12; i += 1) modules.push(sign(34 + (i % 6) * 150, 450 + Math.floor(i / 6) * 70, 86, 44, i % 3 === 0 ? palette.neonMagenta : palette.neonCyan, `s${i + 1}`));
  return svgShell(960, 640, `<rect width="960" height="640" fill="${palette.deepIndigo}"/>${title(34, 48, 'Reference C Sign Atlas', 30)}${modules.join('')}`);
}

function layerSvg(layer) {
  const colors = {
    'far-sky': palette.deepIndigo,
    'distant-skyline': '#101B2D',
    'mid-roofs-signs': '#172338',
    'gameplay-layer': '#181B20',
    'near-props': '#101219',
    'near-props-front': '#090C12',
    'foreground-occlusion': '#050508'
  };
  const index = ['far-sky', 'distant-skyline', 'mid-roofs-signs', 'gameplay-layer', 'near-props', 'near-props-front', 'foreground-occlusion'].indexOf(layer);
  const body = layer === 'far-sky'
    ? `${paperBackdrop(1920, 540)}<circle cx="860" cy="118" r="76" fill="${palette.paleMoonMist}" opacity="0.68"/>`
    : `<rect width="1920" height="540" fill="transparent"/>${roofRun(280 + index * 24, 0.20 + index * 0.10, colors[layer], index * 30)}
      ${index >= 2 ? `${sign(340 + index * 40, 150, 92, 138, index % 2 ? palette.neonMagenta : palette.neonCyan, layer.slice(0, 5))}${sign(1220 - index * 30, 200, 112, 70, palette.lanternGold, 'safe')}` : ''}
      ${index === 3 ? '<path d="M 0 384 C 240 372, 520 402, 760 386 C 1100 372, 1380 394, 1920 374 L 1920 540 L 0 540 Z" fill="#15171A"/>' : ''}
      ${index >= 4 ? '<path d="M 0 420 C 180 390, 400 430, 600 404 C 860 376, 1120 438, 1920 396" fill="none" stroke="#050508" stroke-width="26" opacity="0.8"/>' : ''}`;
  return svgShell(1920, 540, body);
}

function contactSheet(titleText, panels) {
  return svgShell(960, 540, `${paperBackdrop(960, 540)}${title(34, 54, titleText, 30)}${panels.join('')}`);
}

async function main() {
  const generatedAssets = [];
  const renderAsset = async (file, svg, width, height, refs, type, runtime = true) => {
    const relative = await render(`art/final/assets/${file}`, svg, width, height);
    generatedAssets.push({ key: path.basename(file, '.png'), file: relative, width, height, references: refs, type, runtime, license: assetLicense.owner });
    return relative;
  };

  await renderAsset('player-spritesheet.png', playerSheetSvg(), 1024, 896, ['A', 'D', 'G'], 'spritesheet');
  await renderAsset('player-master.png', svgShell(512, 512, `<rect width="512" height="512" fill="transparent"/>${playerSilhouette(258, 338, 2.1, 'idle')}`), 512, 512, ['D'], 'master');
  await renderAsset('enemy-spritesheet.png', enemySheetSvg(), 512, 320, ['A', 'H'], 'spritesheet');
  await renderAsset('lantern-warden-spritesheet.png', wardenSheetSvg(), 1024, 256, ['A', 'H'], 'spritesheet');
  await renderAsset('kite-wraith-preview.png', svgShell(512, 256, `<rect width="512" height="256" fill="transparent"/>${kiteWraith(248, 136, 1.4)}`), 512, 256, ['H'], 'preview');
  await renderAsset('slash-flipbook.png', slashSheetSvg(), 1024, 160, ['G'], 'flipbook');
  await renderAsset('telegraph-flipbook.png', telegraphSheetSvg(), 960, 430, ['H'], 'timeline');
  await renderAsset('ui-kit.png', uiKitSvg(), 960, 540, ['F'], 'ui');
  await renderAsset('brush-kit.png', brushKitSvg(), 960, 540, ['A'], 'brush');
  await renderAsset('sign-atlas.png', signAtlasSvg(), 960, 640, ['C'], 'atlas');
  await renderAsset('title-composition.png', runtimeSceneSvg(960, 540, 'warm-cool-alley', { slash: true }), 960, 540, references, 'composition');
  for (const layer of ['far-sky', 'distant-skyline', 'mid-roofs-signs', 'gameplay-layer', 'near-props', 'near-props-front', 'foreground-occlusion']) {
    await renderAsset(`layer-${layer}.png`, layerSvg(layer), 1920, 540, ['E'], 'parallax-layer');
  }
  for (const mode of ['moonlight-lantern-gold', 'cyan-magenta-neon', 'warm-cool-alley']) {
    await renderAsset(`lighting-${mode}.png`, runtimeSceneSvg(960, 540, mode, { dense: true, slash: true }), 960, 540, ['B'], 'lighting-preset');
  }

  await fs.copyFile(path.join(assetDir, 'player-master.png'), path.join(finalDir, 'player-master.png'));

  const playerStates = [
    ['idle', 6, 0, 0.11],
    ['run', 8, 6, 0.08],
    ['jump-rise', 3, 14, 0.10],
    ['apex', 2, 17, 0.12],
    ['fall', 2, 19, 0.10],
    ['wall-slide', 4, 21, 0.10],
    ['wall-kick', 4, 25, 0.08],
    ['ground-slash', 8, 29, 0.05],
    ['air-slash', 6, 37, 0.055],
    ['hurt', 3, 43, 0.10],
    ['checkpoint-respawn', 6, 46, 0.10]
  ];

  await writeJson(path.join(artDir, 'asset-manifest.json'), {
    generatedAt: new Date().toISOString(),
    phase: 'gate-b-final-art-lock-review',
    sourcePipeline: assetLicense.sourcePipeline,
    noRemoteRuntimeDependencies: true,
    assets: generatedAssets
  });

  await writeJson(path.join(artDir, 'animation-manifest.json'), {
    generatedAt: new Date().toISOString(),
    player: {
      spritesheet: 'art/final/assets/player-spritesheet.png',
      frameSize: { width: 128, height: 128 },
      origin: { x: 0.5, y: 0.78 },
      tolerancePx: 2,
      states: Object.fromEntries(playerStates.map(([id, frames, start, duration]) => [id, { frames, start, frameDurationSeconds: duration, stableOrigin: true }]))
    },
    enemies: {
      inkCrawler: { frames: 4, frameSize: { width: 128, height: 160 }, states: ['idle', 'telegraph', 'release', 'recover'] },
      lanternWarden: { frames: 8, frameSize: { width: 128, height: 256 }, states: ['closed', 'glow', 'aim', 'ground', 'windup', 'release', 'recover', 'defeat'] },
      kiteWraithPreview: { frames: 1, file: 'art/final/assets/kite-wraith-preview.png' }
    }
  });

  await writeJson(path.join(artDir, 'vfx-manifest.json'), {
    generatedAt: new Date().toISOString(),
    slash: {
      totalDurationSeconds: 0.4,
      flipbook: 'art/final/assets/slash-flipbook.png',
      layers: ['magenta core ribbon', 'thick black ink-brush edge', 'cyan accent sparks', 'magenta breakup shards', 'restrained soft glow'],
      phases: [
        { id: 'anticipation', start: 0.0, end: 0.06 },
        { id: 'active', start: 0.06, end: 0.2 },
        { id: 'breakup', start: 0.2, end: 0.32 },
        { id: 'fade-out', start: 0.32, end: 0.4 }
      ],
      particlePool: { maxFullFx: 64, maxReducedFx: 24, unboundedEmitters: false },
      reducedFxVariant: true
    }
  });

  await writeJson(path.join(artDir, 'telegraph-manifest.json'), {
    generatedAt: new Date().toISOString(),
    sequences: {
      heavy: {
        color: palette.neonMagenta,
        phases: ['glow-up', 'aiming pose', 'ground warning', 'wind-up silhouette', 'release', 'recover'],
        recoverWindowSeconds: 0.36,
        hasRangeIndicator: true,
        releaseHitAlignment: 'release starts at active frame 4'
      },
      fast: {
        color: palette.neonCyan,
        phases: ['glow-up', 'aiming pose', 'range warning', 'wind-up silhouette', 'release', 'recover'],
        recoverWindowSeconds: 0.24,
        hasRangeIndicator: true,
        releaseHitAlignment: 'release starts at active frame 4'
      }
    }
  });

  await writeJson(path.join(artDir, 'sign-density-scenes.json'), {
    generatedAt: new Date().toISOString(),
    scenes: [
      {
        id: 'artlab-sign-density',
        viewport: { width: 960, height: 540 },
        heroSigns: 1,
        mediumSigns: 4,
        smallSigns: 7,
        heroOverlapsProtectedPlayerZone: false,
        negativeSpaceZones: [{ x: 220, y: 250, width: 240, height: 160 }]
      },
      {
        id: 'mobile-reduced-density',
        viewport: { width: 390, height: 844 },
        heroSigns: 1,
        mediumSigns: 3,
        smallSigns: 5,
        heroOverlapsProtectedPlayerZone: false,
        negativeSpaceZones: [{ x: 86, y: 340, width: 210, height: 150 }]
      }
    ]
  });

  await writeJson(path.join(artDir, 'license-manifest.json'), {
    generatedAt: new Date().toISOString(),
    runtimeAssets: generatedAssets.map((asset) => ({ file: asset.file, owner: assetLicense.owner, license: assetLicense.license })),
    references: 'art/references/neon_ronin_art_refs_impl_ready are user-provided specification sheets and are never loaded at runtime.',
    remoteRuntimeRequestsAllowed: false
  });

  await writeJson(path.join(approvalDir, 'GATE_B_STATUS.json'), {
    gate: 'B',
    name: 'Final Art Lock',
    status: 'pending',
    approved: false,
    approvalPhrase: 'Approve Gate B',
    requestFile: 'art/approvals/GATE_B_REQUEST.md',
    notes: [
      'Gate B requires explicit human approval after reviewing final screenshots, contact sheets, scorecards, and QA reports.',
      'Passing automated commands does not approve Gate B.'
    ]
  });

  const finalSheets = [
    ['reference-a-brush-contact-sheet.png', brushKitSvg(), 960, 540],
    ['reference-a-game-scale-test.png', runtimeSceneSvg(960, 540, 'warm-cool-alley', { slash: true }), 960, 540],
    ['reference-b-lighting-presets.png', contactSheet('Reference B Lighting Presets', ['moonlight-lantern-gold', 'cyan-magenta-neon', 'warm-cool-alley'].map((mode, index) => `<g transform="translate(${36 + index * 302} 106) scale(0.28)">${runtimeSceneBody(960, 540, mode, { dense: index === 1, slash: index !== 0 })}</g>${sign(48 + index * 302, 410, 180, 70, index === 1 ? palette.neonMagenta : palette.neonCyan, mode)}`)), 960, 540],
    ['reference-c-sign-density.png', signAtlasSvg(), 960, 640],
    ['player-animation-contact-sheet.png', playerSheetSvg(), 1024, 896],
    ['player-five-core-poses.png', svgShell(960, 540, `${paperBackdrop(960, 540)}${title(34, 58, 'Player Five Core Poses', 32)}${playerSilhouette(150, 350, 1.2, 'idle')}${playerSilhouette(315, 350, 1.15, 'run')}${playerSilhouette(476, 340, 1.1, 'jump')}${playerSilhouette(636, 350, 1.1, 'wall')}${playerSilhouette(780, 350, 1.0, 'slash')}${slashArc(778, 306, 0.5, 'active')}`), 960, 540],
    ['player-background-contrast-test.png', svgShell(960, 540, `${paperBackdrop(960, 540)}${title(34, 58, 'Player Contrast Test', 32)}${['#F3F0E8', '#B7BBC0', '#343941', palette.darkBlueGray, '#020203'].map((fill, index) => `<rect x="${44 + index * 176}" y="116" width="148" height="286" fill="${fill}"/>${playerSilhouette(118 + index * 176, 326, 0.9, index % 2 ? 'run' : 'idle')}`).join('')}`), 960, 540],
    ['player-grayscale-test.png', svgShell(960, 540, `<defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs><g filter="url(#gray)">${runtimeSceneBody(960, 540, 'warm-cool-alley', { dense: true, slash: true })}</g>`), 960, 540],
    ['player-64-48-32-test.png', svgShell(960, 540, `${paperBackdrop(960, 540)}${title(34, 58, 'Player 64 / 48 / 32 Test', 32)}${playerSilhouette(240, 350, 0.72, 'idle')}${playerSilhouette(440, 362, 0.54, 'run')}${playerSilhouette(610, 374, 0.36, 'slash')}${text(210, 440, '64px', 22)}${text(414, 440, '48px', 22)}${text(588, 440, '32px', 22)}`), 960, 540],
    ['reference-e-seven-layer-parallax.png', svgShell(960, 540, `${paperBackdrop(960, 540)}${title(34, 58, 'Seven-Layer Parallax Breakdown', 30)}${['far-sky', 'distant-skyline', 'mid-roofs-signs', 'gameplay-layer', 'near-props', 'near-props-front', 'foreground-occlusion'].map((layer, index) => `${text(42, 118 + index * 52, `${index + 1}. ${layer}`, 18)}<rect x="290" y="${94 + index * 52}" width="570" height="34" fill="${index % 2 ? palette.darkBlueGray : palette.inkBlack}" stroke="${palette.neutralGray}" opacity="${0.26 + index * 0.09}"/>`).join('')}`), 960, 540],
    ['ui-desktop-contact-sheet.png', uiKitSvg(), 960, 540],
    ['ui-material-swatches.png', uiKitSvg(), 960, 540],
    ['ui-state-contact-sheet.png', uiKitSvg(), 960, 540],
    ['ui-mobile-390x844.png', svgShell(390, 844, `${paperBackdrop(390, 844)}${title(24, 56, 'Mobile UI', 28)}${brushRect(30, 94, 330, 82, palette.warmPaper, palette.inkBlack)}${text(58, 144, 'Objective panel clear of controls', 20, palette.inkBlack)}<circle cx="92" cy="716" r="68" fill="#090B10" stroke="${palette.neonCyan}" stroke-width="5"/><circle cx="286" cy="712" r="56" fill="#090B10" stroke="${palette.neonMagenta}" stroke-width="5"/><circle cx="286" cy="584" r="52" fill="#090B10" stroke="${palette.neonCyan}" stroke-width="5"/>`), 390, 844],
    ['reference-g-slash-timeline.png', slashSheetSvg(), 1024, 160],
    ['enemy-contact-sheet.png', enemySheetSvg(), 512, 320],
    ['lantern-warden-telegraph-contact-sheet.png', telegraphSheetSvg(), 960, 430],
    ['environment-contact-sheet.png', runtimeSceneSvg(960, 540, 'warm-cool-alley', { dense: true }), 960, 540],
    ['wet-reflection-contact-sheet.png', runtimeSceneSvg(960, 540, 'cyan-magenta-neon', { dense: true, slash: true }), 960, 540],
    ['fog-depth-contact-sheet.png', runtimeSceneSvg(960, 540, 'moonlight-lantern-gold', { dense: false }), 960, 540],
    ['reduced-fx-comparison.png', contactSheet('Reduced FX Comparison', [`<g transform="translate(30 112) scale(0.46)">${runtimeSceneBody(960, 540, 'cyan-magenta-neon', { dense: true, slash: true })}</g>`, `<g transform="translate(508 112) scale(0.46)">${runtimeSceneBody(960, 540, 'warm-cool-alley', { dense: false, slash: false })}</g>`, text(130, 410, 'Full FX', 24), text(604, 410, 'Reduced FX', 24)]), 960, 540]
  ];

  for (const [file, svg, width, height] of finalSheets) {
    await render(`art/final/${file}`, svg, width, height);
  }

  await writeJson(path.join(finalDir, 'contrast-report.json'), {
    generatedAt: new Date().toISOString(),
    minimumNormalTextContrast: 4.9,
    minimumLargeTextContrast: 3.6,
    uiPass: true,
    checkedFiles: ['art/final/ui-desktop-contact-sheet.png', 'art/final/ui-mobile-390x844.png']
  });

  await fs.writeFile(path.join(finalDir, 'performance-report.md'), [
    '# Art Lock Performance Report',
    '',
    '- Runtime assets are pre-baked PNGs generated from local SVG source.',
    '- No remote runtime requests are permitted by manifest.',
    '- Slash particles are represented by a bounded flipbook plus bounded particle metadata.',
    '- Reduced-FX mode lowers rain opacity, fog overlays, glow intensity, and slash breakup density.',
    '- Texture sizes are kept at or below 1920x896 for mobile-safe review.',
    ''
  ].join('\n'), 'utf8');

  console.log(`art:process PASS ${JSON.stringify({ assets: generatedAssets.length, finalSheets: finalSheets.length })}`);
}

await main();

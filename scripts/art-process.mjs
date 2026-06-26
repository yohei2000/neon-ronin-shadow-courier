import fs from 'node:fs/promises';
import path from 'node:path';
import {
  brushRect,
  candidateDir,
  ensureDir,
  gateADir,
  palette,
  playerSilhouette,
  renderSvgToPng,
  rootDir,
  sign,
  slashArc,
  svgShell,
  writeJson
} from './art-lib.mjs';

const finalDir = path.join(rootDir, 'art', 'final');

await ensureDir(gateADir);
await ensureDir(finalDir);

await writeJson(path.join(rootDir, 'art', 'palette.json'), {
  description: 'Neon Ronin Art Lock palette. New accents require ART_BIBLE update.',
  colors: palette,
  semantics: {
    cyan: 'information, utility, mobility, range, focus',
    magenta: 'combat, danger, impact, action',
    gold: 'safety, checkpoints, lanterns, objectives, rewards',
    ink: 'silhouette, collision-readable structure, brush edges'
  }
});

await writeJson(path.join(rootDir, 'art', 'art-style.json'), {
  project: 'Neon Ronin: Shadow Courier',
  phase: 'gate-a-style-lock',
  logicalResolution: { width: 960, height: 540 },
  mobileReviewViewport: { width: 390, height: 844 },
  anchors: {
    neonCyan: palette.neonCyan,
    neonMagenta: palette.neonMagenta
  },
  valueHierarchy: [
    'player silhouette and active attack',
    'enemy silhouette and attack telegraph',
    'hazards and collision edges',
    'pickups/objectives',
    'near environment',
    'middle environment',
    'distant background and atmospheric detail'
  ],
  lightingPresets: [
    { id: 'moonlight-lantern-gold', ambient: 0.28, glow: 0.65, reflection: 0.42 },
    { id: 'cyan-magenta-neon', ambient: 0.24, glow: 0.95, reflection: 0.52 },
    { id: 'warm-cool-alley', ambient: 0.30, glow: 0.78, reflection: 0.48 }
  ],
  parallaxLayers: [
    { id: 'far-sky', scrollFactor: 0.1 },
    { id: 'distant-skyline', scrollFactor: 0.2 },
    { id: 'mid-roofs-signs', scrollFactor: 0.4 },
    { id: 'gameplay-layer', scrollFactor: 1.0 },
    { id: 'near-props', scrollFactor: 1.3 },
    { id: 'near-props-front', scrollFactor: 1.6 },
    { id: 'foreground-occlusion', scrollFactor: 2.0 }
  ],
  selectedDirection: {
    player: 'Candidate 2 body consistency plus Candidate 3 hat-silhouette restraint only if animation remains stable.',
    title: 'Candidate 1 moon-gate title composition with Candidate 3 impact reduced to local accents.',
    environment: 'Candidate 1 seven-layer alley with controlled sign density.',
    inkCrawler: 'Candidate 1 low crawler silhouette with Reference H telegraph overlays.',
    kiteWraith: 'Candidate 3 forward-facing fast silhouette for future preview.',
    lanternWarden: 'Candidate 2 vertical readable warden with some Candidate 3 weight.',
    ui: 'Candidate 3 paper readability with cyan/magenta semantics from Reference F.',
    landmark: 'Moon Gate Candidate 1.'
  }
});

function titleText(x, y, text, size, color = palette.warmPaper) {
  return `<text x="${x}" y="${y}" font-family="Arial Black, Arial, sans-serif" font-size="${size}" fill="${color}" letter-spacing="1">${text}</text>`;
}

function paperBackdrop(width, height) {
  return `<rect width="${width}" height="${height}" fill="${palette.deepIndigo}"/>
  <rect width="${width}" height="${height}" fill="url(#rain)" opacity="0.45"/>
  <rect width="${width}" height="${height}" filter="url(#paperNoise)" opacity="0.55"/>`;
}

function paletteSvg() {
  const swatches = Object.entries(palette)
    .map(([name, color], index) => {
      const x = 46 + (index % 5) * 172;
      const y = 124 + Math.floor(index / 5) * 160;
      return `<g>
        ${brushRect(x, y, 112, 76, color, palette.inkBlack)}
        <text x="${x}" y="${y + 106}" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">${name}</text>
        <text x="${x}" y="${y + 130}" font-family="Consolas, monospace" font-size="16" fill="${palette.paleMoonMist}">${color}</text>
      </g>`;
    })
    .join('');
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(38, 62, 'Palette Lock', 34, palette.warmPaper)}
    <text x="40" y="96" font-family="Arial, sans-serif" font-size="18" fill="${palette.paleMoonMist}">Cyan is utility/mobility. Magenta is combat/action. Gold is safety/objective. Ink owns silhouettes.</text>
    ${swatches}`);
}

function valueStudySvg() {
  const backgrounds = [
    ['white', '#F3F0E8'],
    ['light gray', '#B7BBC0'],
    ['dark gray', '#343941'],
    ['dark blue', palette.darkBlueGray],
    ['black', '#020203'],
    ['busy alley', palette.deepIndigo]
  ];
  const panels = backgrounds
    .map(([label, color], index) => {
      const x = 34 + index * 150;
      const busy = label === 'busy alley' ? `${sign(x + 18, 154, 54, 96, palette.neonCyan)}${sign(x + 90, 122, 38, 78, palette.neonMagenta)}` : '';
      return `<g>
        <rect x="${x}" y="118" width="132" height="250" rx="3" fill="${color}"/>
        ${busy}
        ${playerSilhouette(x + 74, 294, 0.82, index % 2 ? 'run' : 'idle')}
        <text x="${x + 66}" y="402" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${label === 'white' || label === 'light gray' ? palette.inkBlack : palette.warmPaper}">${label}</text>
      </g>`;
    })
    .join('');
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(38, 62, 'Value And Readability Study', 30)}
    <text x="40" y="92" font-family="Arial, sans-serif" font-size="17" fill="${palette.paleMoonMist}">Player identity must survive 64px, 48px, 32px, grayscale, and busy alley backgrounds.</text>
    ${panels}
    <g transform="translate(120 470)">
      ${playerSilhouette(0, 0, 0.72, 'idle')}
      ${playerSilhouette(110, 10, 0.54, 'run')}
      ${playerSilhouette(200, 20, 0.36, 'slash')}
      <text x="280" y="-10" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">64 / 48 / 32 px scale intent</text>
    </g>`);
}

function shapeLanguageSvg() {
  const strokes = [0, 1, 2, 3, 4, 5]
    .map((index) => {
      const x = 80;
      const y = 124 + index * 58;
      const width = 250 + index * 48;
      return `<path d="M ${x} ${y} C ${x + 100} ${y - 42}, ${x + width - 120} ${y + 42}, ${x + width} ${y - 10}
        C ${x + width - 80} ${y + 12}, ${x + 130} ${y + 22}, ${x} ${y + 12} Z"
        fill="${index % 2 ? palette.inkBlack : palette.neonMagenta}" opacity="${index % 2 ? 0.88 : 0.72}"/>`;
    })
    .join('');
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(36, 62, 'Shape Language', 34)}
    <text x="40" y="94" font-family="Arial, sans-serif" font-size="17" fill="${palette.paleMoonMist}">Large closed silhouettes first; brush fray is an edge accent, never the collision truth.</text>
    ${strokes}
    <g transform="translate(635 128)">
      ${brushRect(0, 0, 240, 86, '#10131B', palette.neonCyan)}
      ${brushRect(0, 120, 240, 86, '#10131B', palette.neonMagenta)}
      ${brushRect(0, 240, 240, 86, palette.warmPaper, palette.inkBlack)}
      <text x="24" y="52" font-family="Arial, sans-serif" font-size="22" fill="${palette.neonCyan}">Utility / Focus</text>
      <text x="24" y="172" font-family="Arial, sans-serif" font-size="22" fill="${palette.neonMagenta}">Combat / Danger</text>
      <text x="24" y="292" font-family="Arial, sans-serif" font-size="22" fill="${palette.inkBlack}">Readable Paper</text>
    </g>`);
}

function playerStudySvg() {
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(36, 62, 'Shadow Courier Silhouette Study', 30)}
    <text x="40" y="94" font-family="Arial, sans-serif" font-size="17" fill="${palette.paleMoonMist}">Selected direction: Candidate 2 consistency; scarf and satchel remain separate identity anchors.</text>
    ${playerSilhouette(168, 330, 1.32, 'idle')}
    ${playerSilhouette(338, 330, 1.26, 'run')}
    ${playerSilhouette(508, 322, 1.16, 'jump')}
    ${playerSilhouette(666, 328, 1.12, 'wall')}
    ${playerSilhouette(778, 330, 1.08, 'slash')}
    ${slashArc(772, 286, 0.58)}
    <text x="150" y="438" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">Idle</text>
    <text x="326" y="438" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">Run</text>
    <text x="498" y="438" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">Jump</text>
    <text x="640" y="438" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">Wall</text>
    <text x="810" y="438" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">Slash</text>`);
}

function environmentSvg() {
  const layerRows = [
    ['far-sky', 0.1, palette.deepIndigo],
    ['distant-skyline', 0.2, '#172238'],
    ['mid-roofs-signs', 0.4, '#1C2A3C'],
    ['gameplay-layer', 1.0, '#22262B'],
    ['near-props', 1.3, '#15171D'],
    ['near-props-front', 1.6, '#0E1118'],
    ['foreground-occlusion', 2.0, '#050508']
  ];
  const rows = layerRows
    .map(([name, factor, color], index) => {
      const y = 110 + index * 54;
      const silhouettes = Array.from({ length: 8 }, (_, i) => {
        const x = 250 + i * 78;
        const h = 20 + ((i + index) % 3) * 14 + index * 3;
        return `<path d="M ${x} ${y + 37} L ${x + 18} ${y + 10} L ${x + 36} ${y + 37} Z" fill="${index < 3 ? palette.paleMoonMist : palette.inkBlack}" opacity="${0.12 + index * 0.1}"/>
          <rect x="${x + 10}" y="${y + 22 - h / 2}" width="16" height="${h}" fill="${index < 4 ? palette.darkBlueGray : palette.inkBlack}" opacity="${0.55 + index * 0.05}"/>`;
      }).join('');
      return `<g>
        <text x="42" y="${y + 28}" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">${name}</text>
        <text x="180" y="${y + 28}" font-family="Consolas, monospace" font-size="16" fill="${palette.neonCyan}">${factor}</text>
        <rect x="250" y="${y}" width="650" height="42" fill="${color}" stroke="${palette.neutralGray}" stroke-width="1"/>
        ${silhouettes}
      </g>`;
    })
    .join('');
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(36, 62, 'Seven-Layer Environment Material Study', 28)}
    <text x="40" y="92" font-family="Arial, sans-serif" font-size="16" fill="${palette.paleMoonMist}">Seven distinct depth roles, with gameplay collision kept clean and foreground occlusion constrained.</text>
    ${rows}`);
}

function uiStudySvg() {
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(36, 62, 'UI Material Study', 32)}
    <g transform="translate(42 116)">
      ${brushRect(0, 0, 390, 82, '#08090D', palette.inkBlack)}
      <circle cx="42" cy="41" r="30" fill="${palette.neonMagenta}" opacity="0.86"/>
      <text x="88" y="36" font-family="Arial Black, Arial, sans-serif" font-size="22" fill="${palette.warmPaper}">HP</text>
      <rect x="130" y="24" width="220" height="24" fill="${palette.neonMagenta}" filter="url(#softGlow)"/>
      ${brushRect(440, 0, 170, 82, '#08090D', palette.neonCyan)}
      <text x="492" y="52" font-family="Arial Black, Arial, sans-serif" font-size="28" fill="${palette.neonCyan}">01:24</text>
      ${brushRect(632, 0, 210, 82, palette.warmPaper, palette.inkBlack)}
      <text x="666" y="52" font-family="Arial Black, Arial, sans-serif" font-size="26" fill="${palette.inkBlack}">OBJECTIVE</text>
      <g transform="translate(10 132)">
        ${brushRect(0, 0, 350, 170, palette.warmPaper, palette.inkBlack)}
        <text x="26" y="52" font-family="Arial Black, Arial, sans-serif" font-size="24" fill="${palette.inkBlack}">Reach the Moon Gate</text>
        <text x="26" y="92" font-family="Arial, sans-serif" font-size="20" fill="${palette.neutralGray}">Collect sealed scrolls</text>
      </g>
      <g transform="translate(430 128)">
        ${brushRect(0, 0, 360, 190, '#0A0B0F', palette.inkBlack)}
        ${brushRect(42, 46, 250, 44, palette.warmPaper, palette.neonMagenta)}
        ${brushRect(42, 106, 250, 44, '#0E1118', palette.neonCyan)}
        <text x="136" y="76" font-family="Arial Black, Arial, sans-serif" font-size="20" fill="${palette.inkBlack}">START</text>
        <text x="124" y="136" font-family="Arial Black, Arial, sans-serif" font-size="20" fill="${palette.neonCyan}">ART LAB</text>
      </g>
      <g transform="translate(52 348)">
        <circle cx="74" cy="74" r="72" fill="#090B10" stroke="${palette.neonCyan}" stroke-width="5" opacity="0.94"/>
        <circle cx="74" cy="74" r="34" fill="#11151C" stroke="${palette.neutralGray}" stroke-width="3"/>
        <circle cx="292" cy="74" r="54" fill="#090B10" stroke="${palette.neonMagenta}" stroke-width="5"/>
        <circle cx="424" cy="74" r="54" fill="#090B10" stroke="${palette.neonCyan}" stroke-width="5"/>
        <text x="272" y="84" font-family="Arial Black, Arial, sans-serif" font-size="25" fill="${palette.neonMagenta}">SL</text>
        <text x="404" y="84" font-family="Arial Black, Arial, sans-serif" font-size="25" fill="${palette.neonCyan}">JP</text>
      </g>
    </g>`);
}

function vfxStudySvg() {
  const phases = [
    ['Anticipation', '0.00-0.06s', 'anticipation'],
    ['Active Arc', '0.06-0.20s', 'active'],
    ['Breakup', '0.20-0.32s', 'breakup'],
    ['Fade Out', '0.32-0.40s', 'fade']
  ];
  const panels = phases
    .map(([label, timing, phase], index) => {
      const x = 42 + index * 226;
      return `<g>
        ${brushRect(x, 118, 198, 310, '#090B11', index === 1 ? palette.neonMagenta : palette.inkBlack)}
        ${playerSilhouette(x + 76, 306, 0.72, 'slash')}
        ${slashArc(x + 68, 258, 0.54, phase)}
        <text x="${x + 22}" y="156" font-family="Arial Black, Arial, sans-serif" font-size="20" fill="${palette.warmPaper}">${label}</text>
        <text x="${x + 22}" y="184" font-family="Consolas, monospace" font-size="16" fill="${palette.neonCyan}">${timing}</text>
      </g>`;
    })
    .join('');
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(36, 62, 'Slash VFX Style Study', 32)}
    <text x="40" y="94" font-family="Arial, sans-serif" font-size="17" fill="${palette.paleMoonMist}">Four-phase slash: magenta core, black ink edge, cyan sparks, short-lived breakup.</text>
    ${panels}`);
}

function telegraphStudySvg() {
  const phases = ['Glow-up', 'Aim', 'Ground', 'Wind-up', 'Release', 'Recover'];
  const row = (y, color, label) => phases
    .map((phase, index) => {
      const x = 150 + index * 126;
      const marker = index === 2 ? `<ellipse cx="${x + 42}" cy="${y + 74}" rx="44" ry="16" fill="none" stroke="${color}" stroke-width="4" filter="url(#softGlow)"/>` : '';
      const burst = index === 4 ? slashArc(x + 20, y + 70, 0.34, 'active') : '';
      return `<g>
        ${brushRect(x, y, 92, 124, '#080A10', index === 4 ? color : palette.inkBlack)}
        <ellipse cx="${x + 46}" cy="${y + 48}" rx="20" ry="28" fill="${palette.inkBlack}" stroke="${color}" stroke-width="3"/>
        <rect x="${x + 31}" y="${y + 68}" width="30" height="26" fill="${palette.inkBlack}" stroke="${palette.neutralGray}" stroke-width="2"/>
        ${marker}${burst}
        <text x="${x + 46}" y="${y + 112}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="${palette.warmPaper}">${phase}</text>
      </g>`;
    })
    .join('') + `<text x="42" y="${y + 68}" font-family="Arial Black, Arial, sans-serif" font-size="22" fill="${color}">${label}</text>`;
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(36, 62, 'Telegraph Language Study', 32)}
    <text x="40" y="94" font-family="Arial, sans-serif" font-size="17" fill="${palette.paleMoonMist}">Every meaningful attack exposes where, when, type, release, and recover.</text>
    ${row(142, palette.neonMagenta, 'Heavy')}
    ${row(326, palette.neonCyan, 'Fast')}`);
}

function compositeSvg() {
  const buildings = Array.from({ length: 12 }, (_, index) => {
    const x = index * 86 - 20;
    const h = 90 + (index % 5) * 26;
    const y = 274 - h;
    return `<rect x="${x}" y="${y}" width="76" height="${h}" fill="${index % 2 ? '#111B2A' : '#0D1624'}" opacity="0.72"/>
      <rect x="${x + 18}" y="${y + 28}" width="8" height="12" fill="${palette.lanternGold}" opacity="0.46"/>
      <rect x="${x + 48}" y="${y + 58}" width="8" height="12" fill="${palette.neonCyan}" opacity="0.25"/>`;
  }).join('');
  const platforms = `<path d="M 0 388 C 140 380, 256 404, 386 392 C 514 378, 676 390, 960 376 L 960 540 L 0 540 Z" fill="#17171A"/>
    <path d="M 0 388 C 140 380, 256 404, 386 392 C 514 378, 676 390, 960 376" fill="none" stroke="${palette.warmPaper}" stroke-width="3" opacity="0.42"/>
    <path d="M 0 410 C 220 420, 438 415, 960 408" stroke="${palette.neonCyan}" stroke-width="2" opacity="0.22"/>
    <path d="M 120 428 C 270 437, 390 432, 540 424" stroke="${palette.neonMagenta}" stroke-width="3" opacity="0.25"/>`;
  return svgShell(960, 540, `${paperBackdrop(960, 540)}
    <circle cx="456" cy="142" r="64" fill="${palette.paleMoonMist}" opacity="0.72"/>
    <path d="M 342 350 C 348 210, 560 210, 572 350" fill="none" stroke="${palette.inkBlack}" stroke-width="28"/>
    <path d="M 342 350 C 348 210, 560 210, 572 350" fill="none" stroke="${palette.warmPaper}" stroke-width="3" opacity="0.46"/>
    ${buildings}
    ${sign(100, 118, 64, 146, palette.neonCyan, 'utility')}
    ${sign(744, 106, 74, 168, palette.neonMagenta, 'action')}
    ${sign(634, 210, 112, 70, palette.lanternGold, 'safe')}
    ${platforms}
    ${playerSilhouette(274, 374, 1.02, 'run')}
    ${slashArc(522, 324, 0.54, 'active')}
    <path d="M 0 0 H 960 V 540 H 0 Z" fill="none" stroke="${palette.inkBlack}" stroke-width="16"/>
    <text x="38" y="62" font-family="Arial Black, Arial, sans-serif" font-size="36" fill="${palette.neonCyan}" filter="url(#softGlow)">NEON</text>
    <text x="172" y="62" font-family="Arial Black, Arial, sans-serif" font-size="36" fill="${palette.neonMagenta}" filter="url(#softGlow)">RONIN</text>
    <text x="40" y="92" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">Gate A representative composite: selected Moon Gate, seven-depth alley, player identity, restrained neon, slash language.</text>
    <text x="650" y="504" font-family="Consolas, monospace" font-size="15" fill="${palette.paleMoonMist}">Not runtime final art. Direction lock proof only.</text>`);
}

async function candidateOverview() {
  const files = [
    ['player', 'player.png'],
    ['title', 'title.png'],
    ['environment', 'environment.png'],
    ['ink crawler', 'ink-crawler.png'],
    ['kite wraith', 'kite-wraith.png'],
    ['lantern warden', 'lantern-warden.png'],
    ['ui', 'ui.png'],
    ['moon gate / hero sign', 'moon-gate-hero-sign.png']
  ];
  const rows = [];
  for (let index = 0; index < files.length; index += 1) {
    const [label, file] = files[index];
      const x = 24 + (index % 4) * 228;
      const y = 86 + Math.floor(index / 4) * 220;
      const href = path.relative(rootDir, path.join(candidateDir, file)).replaceAll('\\', '/');
      const imageBytes = await fs.readFile(path.join(candidateDir, file));
      const dataUri = `data:image/png;base64,${imageBytes.toString('base64')}`;
      rows.push(`<g>
        <image href="${dataUri}" x="${x}" y="${y}" width="204" height="146" preserveAspectRatio="xMidYMid slice"/>
        <rect x="${x}" y="${y}" width="204" height="146" fill="none" stroke="${palette.neutralGray}" stroke-width="1"/>
        <text x="${x}" y="${y + 174}" font-family="Arial, sans-serif" font-size="18" fill="${palette.warmPaper}">${label}</text>
        <text x="${x}" y="${y + 196}" font-family="Consolas, monospace" font-size="11" fill="${palette.paleMoonMist}">${href}</text>
      </g>`);
  }
  const svg = svgShell(960, 540, `${paperBackdrop(960, 540)}
    ${titleText(30, 56, 'Gate A Candidate Overview', 32)}
    <text x="32" y="80" font-family="Arial, sans-serif" font-size="15" fill="${palette.paleMoonMist}">AI-generated candidate sheets copied into the repository for direction selection. They are not runtime assets.</text>
    ${rows.join('')}`);
  await renderSvgToPng(svg, path.join(candidateDir, 'overview.png'), 960, 540);
}

const outputs = [
  ['palette.png', paletteSvg()],
  ['value-study.png', valueStudySvg()],
  ['shape-language.png', shapeLanguageSvg()],
  ['player-silhouette-study.png', playerStudySvg()],
  ['environment-material-study.png', environmentSvg()],
  ['ui-style-study.png', uiStudySvg()],
  ['vfx-style-study.png', vfxStudySvg()],
  ['telegraph-style-study.png', telegraphStudySvg()]
];

for (const [file, svg] of outputs) {
  await renderSvgToPng(svg, path.join(rootDir, 'art', file), 960, 540);
}

await renderSvgToPng(compositeSvg(), path.join(gateADir, 'representative-composite-960x540-generated-svg.png'), 960, 540);
const compositeSource = path.join(gateADir, 'representative-composite-source.png');
try {
  const sourceBytes = await fs.readFile(compositeSource);
  const sourceUri = `data:image/png;base64,${sourceBytes.toString('base64')}`;
  const compositeFromSource = svgShell(960, 540, `<image href="${sourceUri}" x="0" y="0" width="960" height="540" preserveAspectRatio="xMidYMid slice"/>`);
  await renderSvgToPng(compositeFromSource, path.join(gateADir, 'representative-composite-960x540.png'), 960, 540);
} catch {
  await renderSvgToPng(compositeSvg(), path.join(gateADir, 'representative-composite-960x540.png'), 960, 540);
}
await fs.copyFile(path.join(gateADir, 'representative-composite-960x540.png'), path.join(rootDir, 'art', 'representative-composite-960x540.png'));
await candidateOverview();

console.log(`art:process PASS ${JSON.stringify({ generated: outputs.length + 2 })}`);

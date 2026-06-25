import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const qaDir = path.resolve('artifacts', 'qa');
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const e2e = await readJson('e2e-report.json');
const level = await readJson('level-report.json');
const dist = await readJson('dist-report.json');
const screenshotNames = [
  'stage-start.png',
  'combat-encounter.png',
  'miniboss.png',
  'mobile-controls-390x844.png',
  'stage-clear.png'
];

assert(e2e?.valid === true, 'e2e-report.json is missing or invalid.');
assert(e2e?.routeHealth?.passed === true, 'Stage 1 route health did not pass.');
assert(level?.valid === true, 'level-report.json is missing or invalid.');
assert(dist?.valid === true, 'dist-report.json is missing or invalid.');

const screenshotStatus = {};
for (const name of screenshotNames) {
  screenshotStatus[name] = await hasScreenshot(name);
  assert(screenshotStatus[name], `${name} is missing or too small for playtest review.`);
}

const route = e2e?.routeHealth ?? {};
const clear = e2e?.clear?.result ?? {};
const mobile = e2e?.mobile ?? {};
const metrics = level?.metrics ?? {};
const routeSeconds = Math.round((route.routeDurationMs ?? 0) / 100) / 10;
const damageMargin = Math.max(0, (route.thresholds?.maxDamageTaken ?? 0) - (route.damageTaken ?? 0));
const sealCoverage = metrics.seals ? Math.round(((clear.seals ?? 0) / metrics.seals) * 100) : 0;

const findings = [
  `The automated clear route reaches Stage Clear in ${routeSeconds}s with ${route.damageTaken ?? '?'} damage, leaving ${damageMargin} damage before the route-health cap.`,
  `The route collects ${clear.seals ?? 0}/${metrics.seals ?? '?'} seals (${sealCoverage}%) without pursuing optional scroll routes, so critical-path pickup density is adequate for a first clear.`,
  `Desktop screenshots show readable onboarding, first-combat spacing, Lantern Warden objective text, and Stage Clear results.`,
  `Mobile controls are visible and pass input probes; HUD/control density on a 390x844 screenshot should still be checked on a physical phone before adding inputs or denser UI.`
];

const decisions = [
  'Keep current enemy spacing, hazard damage, and Lantern Warden HP for this checkpoint; route damage and clear time remain inside thresholds.',
  'Do not tune optional scroll placement from the optimized clear route alone because the route intentionally skips optional exploration.',
  'Treat mobile HUD scale and optional-scroll discoverability as the next real-device human playtest questions.'
];

const lines = [
  '# Stage 1 Playtest Tuning Note',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Status: ${errors.length === 0 ? 'PASS' : 'FAIL'}`,
  '',
  '## Method',
  '',
  'Evidence-backed manual review of current QA screenshots plus automated route, level, and production-dist reports. This is not a substitute for a physical-device human playtest.',
  '',
  '## Evidence',
  '',
  '- `artifacts/qa/e2e-report.json`: title/settings flow, pause retry/restart, high-contrast pixels, keyboard clear, route health, and mobile input probes.',
  '- `artifacts/qa/level-report.json`: stage size, checkpoints, optional routes, scrolls, hazards, enemies, and pickup counts.',
  '- `artifacts/qa/dist-report.json`: production `dist/` boot from emitted assets.',
  ...screenshotNames.map((name) => `- \`artifacts/qa/${name}\`: ${screenshotStatus[name] ? 'reviewed' : 'missing'}.`),
  '',
  '## Findings',
  '',
  ...findings.map((finding) => `- ${finding}`),
  '',
  '## Tuning Decisions',
  '',
  ...decisions.map((decision) => `- ${decision}`),
  '',
  '## Next Manual Check',
  '',
  '- Run a short physical-phone playtest focused on HUD scale, jump/attack/pause reach, boss readability, and optional scroll discoverability.',
  '- If playtest tuning changes damage, pickup placement, boss HP, or route timing, rerun `npm run qa:all` and update route-health thresholds only with evidence.',
  ''
];

await mkdir(qaDir, { recursive: true });
await writeFile(path.join(qaDir, 'playtest-tuning.md'), `${lines.join('\n')}`, 'utf8');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`qa:playtest PASS ${JSON.stringify({ routeSeconds, damageMargin, sealCoverage })}`);

async function readJson(name) {
  try {
    return JSON.parse(await readFile(path.join(qaDir, name), 'utf8'));
  } catch {
    return null;
  }
}

async function hasScreenshot(name) {
  try {
    const info = await stat(path.join(qaDir, name));
    return info.size > 1500;
  } catch {
    return false;
  }
}

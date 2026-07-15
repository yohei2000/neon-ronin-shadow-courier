import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = process.cwd();
const inputArg = process.argv[2];
if (!inputArg) {
  throw new Error('Usage: node scripts/import-stage1-collision-trial.mjs <stage-collision-project.json>');
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(rootDir, 'src', 'data', 'stage1CollisionTrial.json');
const stagePath = path.resolve(rootDir, 'src', 'data', 'stage1Content.json');
const sourceBytes = fs.readFileSync(inputPath);
const source = JSON.parse(sourceBytes.toString('utf8'));
const stage = JSON.parse(fs.readFileSync(stagePath, 'utf8'));
const allowedTypes = new Set(['ground', 'wall', 'ceiling', 'oneWay', 'slope', 'hazard', 'trigger']);

if (source.version !== 1 || !Array.isArray(source.plates) || source.plates.length !== 1) {
  throw new Error('Expected a version 1 project with exactly one background plate');
}
const plate = source.plates[0];
if (Number(plate.width) !== stage.worldWidth || Number(plate.height) !== stage.worldHeight) {
  throw new Error(`Project plate must match Stage1 ${stage.worldWidth}x${stage.worldHeight}`);
}
if (!Array.isArray(source.surfaces) || source.surfaces.length === 0) {
  throw new Error('Project has no collision surfaces');
}

const cleanPoints = (points) => {
  const result = [];
  for (const value of points ?? []) {
    if (!Array.isArray(value) || value.length < 2) continue;
    const point = [Number(value[0]), Number(value[1])];
    if (!point.every(Number.isFinite)) continue;
    if (point[0] < 0 || point[0] > stage.worldWidth || point[1] < 0 || point[1] > stage.worldHeight) {
      throw new Error(`Surface point outside Stage1 world: ${point.join(',')}`);
    }
    const previous = result.at(-1);
    if (previous && Math.hypot(point[0] - previous[0], point[1] - previous[1]) < 0.5) continue;
    result.push(point);
  }
  return result;
};

const surfaces = source.surfaces.map((surface, index) => {
  const type = String(surface.type ?? 'ground');
  if (!allowedTypes.has(type)) throw new Error(`Unsupported surface type: ${type}`);
  const points = cleanPoints(surface.points);
  if (points.length < 2) throw new Error(`Surface ${surface.id ?? index} needs at least two distinct points`);
  return {
    id: String(surface.id ?? `trial-surface-${index + 1}`),
    type,
    points,
    thickness: Math.max(2, Number(surface.thickness ?? 18)),
    collisionMode: String(surface.collisionMode ?? (type === 'oneWay' ? 'one-way' : 'solid')),
    oneWay: Boolean(surface.oneWay ?? type === 'oneWay'),
    notes: String(surface.notes ?? '')
  };
});

const xs = surfaces.flatMap((surface) => surface.points.map((point) => point[0]));
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const coverageStart = Math.max(0, Math.floor(minX / 100) * 100);
const coverageEnd = Math.min(stage.worldWidth, Math.ceil(maxX / 100) * 100);
const result = {
  version: 1,
  enabled: true,
  importedAt: new Date().toISOString(),
  source: {
    fileName: path.basename(inputPath),
    sha256: crypto.createHash('sha256').update(sourceBytes).digest('hex'),
    projectName: String(source.projectName ?? 'Stage Collision Project')
  },
  plate: {
    width: Number(plate.width),
    height: Number(plate.height)
  },
  coverageRange: {
    start: coverageStart,
    end: coverageEnd
  },
  surfaces
};

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Imported ${surfaces.length} trial surfaces for worldX ${coverageStart}-${coverageEnd}`);
console.log(outputPath);

import { AbilityUnlockByStage } from './abilities';
import type { AbilityId, RectSpec, StageId, StageTheme } from '../types/game';
import type {
  BossDefinition,
  EnemySpawnDefinition,
  HazardDefinition,
  LevelDefinition,
  MovingPlatformDefinition,
  PickupDefinition,
  ScrollDefinition
} from '../types/levels';
import { TILE_SIZE } from '../config/dimensions';
import { toWorld } from '../utils/math';

interface PlatformRect extends RectSpec {
  readonly symbol?: '#' | '=' | '^' | 'F' | 'W' | 'G' | 'B';
}

interface LevelDraft {
  readonly id: StageId;
  readonly name: string;
  readonly subtitle: string;
  readonly theme: StageTheme;
  readonly width: number;
  readonly height: number;
  readonly playerSpawn: { readonly x: number; readonly y: number };
  readonly goal: { readonly x: number; readonly y: number };
  readonly checkpoints: readonly { readonly x: number; readonly y: number }[];
  readonly platforms: readonly PlatformRect[];
  readonly oneWayPlatforms?: readonly RectSpec[];
  readonly fallingPlatforms?: readonly RectSpec[];
  readonly windZones?: readonly RectSpec[];
  readonly scrolls: readonly ScrollDefinition[];
  readonly enemies: readonly EnemySpawnDefinition[];
  readonly hazards?: readonly HazardDefinition[];
  readonly movingPlatforms?: readonly MovingPlatformDefinition[];
  readonly pickups: readonly PickupDefinition[];
  readonly requiredAbilities: readonly AbilityId[];
  readonly tutorial: readonly string[];
  readonly boss?: BossDefinition;
}

function makeTiles(width: number, height: number, platforms: readonly PlatformRect[]): readonly string[] {
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => '.'));
  for (const platform of platforms) {
    const symbol = platform.symbol ?? '#';
    for (let y = platform.y; y < platform.y + platform.height; y += 1) {
      for (let x = platform.x; x < platform.x + platform.width; x += 1) {
        if (x >= 0 && y >= 0 && x < width && y < height) {
          grid[y][x] = symbol;
        }
      }
    }
  }
  return grid.map((row) => row.join(''));
}

function makeLevel(draft: LevelDraft): LevelDefinition {
  return {
    id: draft.id,
    name: draft.name,
    subtitle: draft.subtitle,
    theme: draft.theme,
    width: draft.width,
    height: draft.height,
    tiles: makeTiles(draft.width, draft.height, draft.platforms),
    playerSpawn: draft.playerSpawn,
    goal: draft.goal,
    checkpoints: draft.checkpoints,
    scrolls: draft.scrolls,
    enemies: draft.enemies,
    hazards: draft.hazards ?? [],
    movingPlatforms: draft.movingPlatforms ?? [],
    pickups: draft.pickups,
    oneWayPlatforms: draft.oneWayPlatforms ?? [],
    fallingPlatforms: draft.fallingPlatforms ?? [],
    windZones: draft.windZones ?? [],
    unlockAbility: AbilityUnlockByStage[draft.id],
    requiredAbilities: draft.requiredAbilities,
    tutorial: draft.tutorial,
    boss: draft.boss
  };
}

function wx(tileX: number): number {
  return toWorld(tileX, TILE_SIZE);
}

function wy(tileY: number): number {
  return toWorld(tileY, TILE_SIZE);
}

export const Levels = [
  makeLevel({
    id: 1,
    name: 'Neon Alley Tutorial',
    subtitle: 'The courier wakes beneath lantern rain.',
    theme: 'alley',
    width: 96,
    height: 18,
    playerSpawn: { x: 2, y: 13 },
    goal: { x: 93, y: 13 },
    checkpoints: [
      { x: 4, y: 13 },
      { x: 35, y: 12 },
      { x: 65, y: 12 }
    ],
    platforms: [
      { x: 0, y: 16, width: 96, height: 2 },
      { x: 8, y: 13, width: 8, height: 1 },
      { x: 20, y: 11, width: 8, height: 1 },
      { x: 30, y: 13, width: 12, height: 1 },
      { x: 45, y: 12, width: 10, height: 1 },
      { x: 58, y: 10, width: 8, height: 1 },
      { x: 70, y: 13, width: 10, height: 1 },
      { x: 84, y: 12, width: 8, height: 1 },
      { x: 93, y: 13, width: 1, height: 1, symbol: 'G' },
      { x: 26, y: 15, width: 3, height: 1, symbol: '^' },
      { x: 76, y: 15, width: 4, height: 1, symbol: '^' }
    ],
    scrolls: [
      { id: '1-a', x: wx(14), y: wy(12), hint: 'Above the first lantern awning.' },
      { id: '1-b', x: wx(52), y: wy(10), hint: 'Behind the blue laundry wires.' },
      { id: '1-c', x: wx(87), y: wy(11), hint: 'On the last rooftop lip.' }
    ],
    enemies: [
      { type: 'ShadowCrawler', x: wx(24), y: wy(14), patrol: 4 },
      { type: 'ShadowCrawler', x: wx(47), y: wy(11), patrol: 5 },
      { type: 'PulseJumper', x: wx(73), y: wy(12), patrol: 3 }
    ],
    pickups: [
      { id: '1-seal-1', type: 'seal', x: wx(9), y: wy(12) },
      { id: '1-seal-2', type: 'seal', x: wx(39), y: wy(12) },
      { id: '1-heart', type: 'health', x: wx(62), y: wy(9) },
      { id: '1-energy', type: 'energy', x: wx(82), y: wy(11) }
    ],
    requiredAbilities: [],
    tutorial: [
      'A/D or arrows move. W, Up, or Space jumps.',
      'Wall Kick unlocked: slide on walls, then jump away.',
      'J/Z slashes. Checkpoint shrines restore a route.'
    ]
  }),
  makeLevel({
    id: 2,
    name: 'Rain-Slick Rooftops',
    subtitle: 'A skyline of glass tiles and kite ghosts.',
    theme: 'rooftop',
    width: 116,
    height: 18,
    playerSpawn: { x: 2, y: 13 },
    goal: { x: 113, y: 11 },
    checkpoints: [
      { x: 4, y: 13 },
      { x: 42, y: 11 },
      { x: 80, y: 12 }
    ],
    platforms: [
      { x: 0, y: 16, width: 34, height: 2 },
      { x: 38, y: 14, width: 14, height: 1 },
      { x: 56, y: 12, width: 9, height: 1 },
      { x: 68, y: 15, width: 16, height: 1 },
      { x: 88, y: 13, width: 10, height: 1 },
      { x: 103, y: 12, width: 12, height: 1 },
      { x: 113, y: 11, width: 1, height: 1, symbol: 'G' },
      { x: 34, y: 17, width: 4, height: 1, symbol: '^' },
      { x: 84, y: 17, width: 4, height: 1, symbol: '^' }
    ],
    oneWayPlatforms: [
      { x: 18, y: 12, width: 6, height: 1 },
      { x: 27, y: 10, width: 5, height: 1 }
    ],
    movingPlatforms: [
      { id: '2-move-1', x: wx(51), y: wy(13), width: 4, travelX: 112, travelY: 0, durationMs: 2300 },
      { id: '2-move-2', x: wx(98), y: wy(14), width: 4, travelX: 0, travelY: -96, durationMs: 2600 }
    ],
    scrolls: [
      { id: '2-a', x: wx(21), y: wy(11), hint: 'Under the first rain sign.' },
      { id: '2-b', x: wx(61), y: wy(10), hint: 'Above the moving platform gap.' },
      { id: '2-c', x: wx(107), y: wy(10), hint: 'Behind the final antenna.' }
    ],
    enemies: [
      { type: 'KiteWraith', x: wx(31), y: wy(9), patrol: 5 },
      { type: 'ShadowCrawler', x: wx(44), y: wy(13), patrol: 5 },
      { type: 'KiteWraith', x: wx(73), y: wy(10), patrol: 6 },
      { type: 'PulseJumper', x: wx(93), y: wy(12), patrol: 4 }
    ],
    pickups: [
      { id: '2-seal-1', type: 'seal', x: wx(40), y: wy(13) },
      { id: '2-energy', type: 'energy', x: wx(59), y: wy(11) },
      { id: '2-heart', type: 'health', x: wx(90), y: wy(12) }
    ],
    requiredAbilities: ['wallKick'],
    tutorial: [
      'Neon Dash unlocked: Shift or L bursts forward.',
      'Dash recovers after a short cooldown and helps cross roof gaps.',
      'Flying wraiths telegraph their drift; strike after they pass.'
    ]
  }),
  makeLevel({
    id: 3,
    name: 'Bamboo Circuit Shrine',
    subtitle: 'Wires hum through bamboo shadows.',
    theme: 'bamboo',
    width: 128,
    height: 18,
    playerSpawn: { x: 2, y: 13 },
    goal: { x: 125, y: 12 },
    checkpoints: [
      { x: 4, y: 13 },
      { x: 48, y: 12 },
      { x: 91, y: 12 }
    ],
    platforms: [
      { x: 0, y: 16, width: 42, height: 2 },
      { x: 45, y: 14, width: 16, height: 1 },
      { x: 66, y: 13, width: 12, height: 1 },
      { x: 82, y: 15, width: 17, height: 1 },
      { x: 104, y: 13, width: 22, height: 1 },
      { x: 125, y: 12, width: 1, height: 1, symbol: 'G' },
      { x: 62, y: 15, width: 3, height: 1, symbol: '^' }
    ],
    windZones: [
      { x: 28, y: 6, width: 9, height: 9 },
      { x: 79, y: 6, width: 7, height: 8 }
    ],
    movingPlatforms: [
      { id: '3-move-1', x: wx(39), y: wy(12), width: 4, travelX: 112, travelY: -64, durationMs: 2800 },
      { id: '3-move-2', x: wx(99), y: wy(12), width: 4, travelX: 96, travelY: 0, durationMs: 2200 }
    ],
    scrolls: [
      { id: '3-a', x: wx(34), y: wy(8), hint: 'Riding the first wind lane.' },
      { id: '3-b', x: wx(75), y: wy(11), hint: 'Between shrine circuit ribs.' },
      { id: '3-c', x: wx(118), y: wy(11), hint: 'Before the exit lantern.' }
    ],
    enemies: [
      { type: 'GearSentinel', x: wx(50), y: wy(13), patrol: 4 },
      { type: 'NeonArcher', x: wx(70), y: wy(12), patrol: 0 },
      { type: 'KiteWraith', x: wx(87), y: wy(10), patrol: 5 },
      { type: 'GearSentinel', x: wx(111), y: wy(12), patrol: 4 }
    ],
    pickups: [
      { id: '3-seal-1', type: 'seal', x: wx(46), y: wy(13) },
      { id: '3-energy-1', type: 'energy', x: wx(69), y: wy(11) },
      { id: '3-energy-2', type: 'energy', x: wx(106), y: wy(12) },
      { id: '3-heart', type: 'health', x: wx(116), y: wy(12) }
    ],
    requiredAbilities: ['wallKick', 'dash'],
    tutorial: [
      'Kitsune Art unlocked: K or X launches an energy seal.',
      'Projectiles cost energy and are useful against shielded sentinels.',
      'Wind lanes lift the courier but can push jumps wide.'
    ]
  }),
  makeLevel({
    id: 4,
    name: 'Clockwork Castle Wall',
    subtitle: 'Gear teeth grind inside black stone.',
    theme: 'castle',
    width: 140,
    height: 18,
    playerSpawn: { x: 2, y: 13 },
    goal: { x: 137, y: 12 },
    checkpoints: [
      { x: 4, y: 13 },
      { x: 52, y: 12 },
      { x: 101, y: 12 }
    ],
    platforms: [
      { x: 0, y: 16, width: 32, height: 2 },
      { x: 36, y: 14, width: 16, height: 1 },
      { x: 57, y: 12, width: 12, height: 1 },
      { x: 74, y: 15, width: 18, height: 1 },
      { x: 97, y: 13, width: 16, height: 1 },
      { x: 119, y: 13, width: 20, height: 1 },
      { x: 137, y: 12, width: 1, height: 1, symbol: 'G' },
      { x: 32, y: 17, width: 4, height: 1, symbol: '^' },
      { x: 92, y: 17, width: 5, height: 1, symbol: '^' }
    ],
    fallingPlatforms: [
      { x: 53, y: 13, width: 3, height: 1 },
      { x: 70, y: 11, width: 3, height: 1 },
      { x: 114, y: 12, width: 4, height: 1 }
    ],
    movingPlatforms: [
      { id: '4-move-1', x: wx(28), y: wy(13), width: 4, travelX: 96, travelY: 0, durationMs: 2200 },
      { id: '4-move-2', x: wx(84), y: wy(12), width: 4, travelX: 96, travelY: -64, durationMs: 2500 }
    ],
    scrolls: [
      { id: '4-a', x: wx(39), y: wy(12), hint: 'Past the first gear bridge.' },
      { id: '4-b', x: wx(88), y: wy(10), hint: 'Above the clock gear lift.' },
      { id: '4-c', x: wx(130), y: wy(11), hint: 'High on the final parapet.' }
    ],
    enemies: [
      { type: 'GearSentinel', x: wx(43), y: wy(13), patrol: 5 },
      { type: 'NeonArcher', x: wx(61), y: wy(11), patrol: 0 },
      { type: 'PulseJumper', x: wx(79), y: wy(14), patrol: 4 },
      { type: 'KiteWraith', x: wx(105), y: wy(10), patrol: 6 },
      { type: 'GearSentinel', x: wx(124), y: wy(12), patrol: 5 }
    ],
    pickups: [
      { id: '4-seal-1', type: 'seal', x: wx(37), y: wy(13) },
      { id: '4-energy-1', type: 'energy', x: wx(58), y: wy(11) },
      { id: '4-heart', type: 'health', x: wx(98), y: wy(12) },
      { id: '4-energy-2', type: 'energy', x: wx(127), y: wy(12) }
    ],
    requiredAbilities: ['wallKick', 'dash', 'projectile'],
    tutorial: [
      'Charged Slash unlocked: hold Attack, release when the scarf glows.',
      'Charged hits break GearSentinel shields and stagger heavy enemies.',
      'Falling platforms twitch before they drop, then return.'
    ]
  }),
  makeLevel({
    id: 5,
    name: 'Inner Data Keep',
    subtitle: 'Moonlight becomes code inside the final shrine.',
    theme: 'keep',
    width: 154,
    height: 18,
    playerSpawn: { x: 2, y: 13 },
    goal: { x: 152, y: 13 },
    checkpoints: [
      { x: 4, y: 13 },
      { x: 55, y: 12 },
      { x: 112, y: 13 }
    ],
    platforms: [
      { x: 0, y: 16, width: 40, height: 2 },
      { x: 44, y: 14, width: 18, height: 1 },
      { x: 68, y: 12, width: 13, height: 1 },
      { x: 85, y: 15, width: 18, height: 1 },
      { x: 108, y: 16, width: 45, height: 2 },
      { x: 117, y: 14, width: 1, height: 1, symbol: 'B' },
      { x: 152, y: 13, width: 1, height: 1, symbol: 'G' },
      { x: 40, y: 17, width: 4, height: 1, symbol: '^' },
      { x: 103, y: 17, width: 5, height: 1, symbol: '^' }
    ],
    windZones: [{ x: 71, y: 6, width: 6, height: 6 }],
    movingPlatforms: [
      { id: '5-move-1', x: wx(62), y: wy(13), width: 4, travelX: 112, travelY: -64, durationMs: 2400 }
    ],
    scrolls: [
      { id: '5-a', x: wx(36), y: wy(14), hint: 'Below the first data arch.' },
      { id: '5-b', x: wx(78), y: wy(10), hint: 'Suspended in moon-code wind.' },
      { id: '5-c', x: wx(113), y: wy(12), hint: 'Before the boss seal.' }
    ],
    enemies: [
      { type: 'ShadowCrawler', x: wx(31), y: wy(15), patrol: 4 },
      { type: 'NeonArcher', x: wx(50), y: wy(13), patrol: 0 },
      { type: 'KiteWraith', x: wx(74), y: wy(9), patrol: 6 },
      { type: 'PulseJumper', x: wx(90), y: wy(14), patrol: 4 },
      { type: 'GearSentinel', x: wx(110), y: wy(15), patrol: 4 }
    ],
    pickups: [
      { id: '5-energy-1', type: 'energy', x: wx(48), y: wy(13) },
      { id: '5-heart', type: 'health', x: wx(100), y: wy(14) },
      { id: '5-energy-2', type: 'energy', x: wx(115), y: wy(13) }
    ],
    requiredAbilities: ['wallKick', 'dash', 'projectile', 'chargedSlash'],
    tutorial: [
      'Ultimate Art unlocked: spend high energy with Art when danger surrounds you.',
      'The shrine checkpoint before the sealed arena restores your push.',
      'The Onmyo-Core has three phases. Read the glyphs, then answer.'
    ],
    boss: {
      x: wx(136),
      y: wy(12),
      triggerX: wx(118),
      arenaLeft: wx(118) - 40,
      arenaRight: wx(151),
      name: 'Aogane no Onmyo-Core'
    }
  })
] as const satisfies readonly LevelDefinition[];

export function getLevel(stageId: StageId): LevelDefinition {
  const level = Levels.find((item) => item.id === stageId);
  if (!level) {
    throw new Error(`Unknown stage ${stageId}`);
  }
  return level;
}

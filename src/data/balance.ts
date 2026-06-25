export const PlayerBalance = {
  maxHp: 6,
  runSpeed: 245,
  acceleration: 2100,
  drag: 1900,
  jumpSpeed: 455,
  jumpCutMultiplier: 0.46,
  coyoteMs: 115,
  jumpBufferMs: 120,
  wallSlideSpeed: 92,
  wallJumpX: 280,
  wallJumpY: 430,
  attackStartupMs: 55,
  attackActiveMs: 120,
  attackRecoveryMs: 150,
  attackCooldownMs: 325,
  hurtInvulnerableMs: 1000,
  knockbackX: 245,
  knockbackY: 245,
  fallDeathY: 780
} as const;

export const EnemyBalance = {
  inkCrawler: { hp: 2, damage: 1, speed: 54 },
  kiteWraith: { hp: 2, damage: 1, speed: 42 },
  lanternWarden: { hp: 8, damage: 1, speed: 70 }
} as const;

export const RankThresholds = {
  S: { maxMs: 90000, minScrolls: 3, maxDamage: 1 },
  A: { maxMs: 150000, minScrolls: 2, maxDamage: 3 },
  B: { maxMs: 240000, minScrolls: 1, maxDamage: 6 }
} as const;

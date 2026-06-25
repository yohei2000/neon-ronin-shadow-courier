export const PlayerBalance = {
  maxHp: 6,
  maxEnergy: 100,
  runSpeed: 220,
  acceleration: 1850,
  drag: 1800,
  jumpSpeed: 425,
  jumpCutMultiplier: 0.48,
  coyoteMs: 110,
  jumpBufferMs: 130,
  wallSlideSpeed: 95,
  wallJumpX: 255,
  wallJumpY: 405,
  dashSpeed: 470,
  dashMs: 155,
  dashCooldownMs: 470,
  attackMs: 130,
  attackCooldownMs: 230,
  chargedAttackMs: 620,
  hurtInvulnerableMs: 950,
  longerInvulnerableMs: 1500,
  knockbackX: 240,
  knockbackY: 235,
  projectileCost: 18,
  ultimateCost: 80,
  ultimateCooldownMs: 3500,
  fallDeathY: 820
} as const;

export const EnemyBalance = {
  ShadowCrawler: { hp: 2, damage: 1, speed: 55, score: 15 },
  KiteWraith: { hp: 2, damage: 1, speed: 40, score: 20 },
  GearSentinel: { hp: 4, damage: 2, speed: 36, score: 30 },
  NeonArcher: { hp: 3, damage: 1, speed: 20, score: 25 },
  PulseJumper: { hp: 3, damage: 2, speed: 34, score: 25 }
} as const;

export const BossBalance = {
  hp: 72,
  contactDamage: 2,
  projectileDamage: 1,
  phase2At: 48,
  phase3At: 24
} as const;

export const RankThresholds = {
  S: { maxMs: 180000, minScrolls: 3, maxDamage: 2 },
  A: { maxMs: 260000, minScrolls: 2, maxDamage: 5 },
  B: { maxMs: 420000, minScrolls: 1, maxDamage: 9 }
} as const;

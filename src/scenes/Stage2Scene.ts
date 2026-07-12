import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { Palette, PaletteHex } from '../config/palette';
import { GameAudioKey, type GameAudioKey as GameAudioKeyType } from '../data/audioAssets';
import { ArtAssetKey, RuntimeEnvironmentAssetKey, RuntimeItemFrame, RuntimeSpriteAssetKey } from '../data/artAssets';
import {
  Stage2Data,
  Stage2Tuning,
  getStage2SectionForX,
  type Stage2Anchor,
  type Stage2Gimmick,
  type Stage2Hazard,
  type Stage2Platform,
  type Stage2Pickup,
  type Stage2Seal,
  type Stage2Slope,
  type Stage2Wall
} from '../data/stage2';
import type { RectData } from '../data/stage1';
import { InkCrawler } from '../entities/InkCrawler';
import { KiteWraith } from '../entities/KiteWraith';
import { LanternWarden } from '../entities/LanternWarden';
import { Player, type PlayerActionEvent } from '../entities/Player';
import type { StageEnemy } from '../entities/types';
import { CameraController } from '../systems/CameraController';
import { CombatSystem, type SlashState } from '../systems/CombatSystem';
import { InputSystem } from '../systems/InputSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { GameAudio } from '../systems/Stage1Audio';
import { centerRect, rectsOverlap } from '../systems/geometry';
import { calculateStageRank } from '../systems/rank';
import { Hud } from '../ui/Hud';
import { TouchControls } from '../ui/TouchControls';

type CollectibleVisual = {
  readonly id: string;
  readonly body: RectData;
  readonly image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
};

type AnchorVisual = Stage2Anchor & {
  readonly image: Phaser.GameObjects.Sprite;
  readonly pulse: Phaser.GameObjects.Sprite;
};

type SlopeVisual = Stage2Slope & {
  readonly image: Phaser.GameObjects.TileSprite;
  readonly glow: Phaser.GameObjects.Sprite;
};

type ParallaxLayer = {
  readonly image: Phaser.GameObjects.TileSprite;
  readonly speedX: number;
  readonly speedY: number;
};

type ShadowThreadTarget = {
  readonly id: string;
  readonly kind: 'anchor' | 'enemy' | 'keeper';
  readonly x: number;
  readonly y: number;
  readonly enemy?: StageEnemy;
};

export class Stage2Scene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;
  private touchControls!: TouchControls;
  private cameraController!: CameraController;
  private audio!: GameAudio;
  private hud!: Hud;
  private enemies: StageEnemy[] = [];
  private relayKeeper!: LanternWarden;
  private sealVisuals: CollectibleVisual[] = [];
  private pickupVisuals: (CollectibleVisual & { readonly type: Stage2Pickup['type'] })[] = [];
  private hazardVisuals: (Stage2Hazard & { readonly image: Phaser.GameObjects.Sprite })[] = [];
  private gimmickVisuals: (Stage2Gimmick & { readonly image: Phaser.GameObjects.Sprite })[] = [];
  private anchorVisuals: AnchorVisual[] = [];
  private slopeVisuals: SlopeVisual[] = [];
  private threadTrail: Phaser.GameObjects.Sprite[] = [];
  private activeThreadTarget: ShadowThreadTarget | null = null;
  private shadowThreadImpactConsumed = true;
  private collectedSeals = new Set<string>();
  private collectedPickups = new Set<string>();
  private activatedCheckpoints = new Set<string>();
  private lastEnemyHitMs = new Map<string, number>();
  private startTimeMs = 0;
  private paused = false;
  private gameOver = false;
  private completed = false;
  private checkpointMessage = '';
  private checkpointMessageUntilMs = 0;
  private pauseObjects: Phaser.GameObjects.GameObject[] = [];
  private parallaxLayers: ParallaxLayer[] = [];
  private collisionRects: RectData[] = [];
  private updraftActive = false;

  constructor() {
    super(SceneKey.Stage2);
  }

  create(): void {
    const save = SaveSystem.load();
    this.audio = new GameAudio(this, save.settings, 'stage2');
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.cameras.main.setBounds(0, 0, Stage2Data.worldWidth, Stage2Data.worldHeight);
    this.startTimeMs = this.time.now;
    this.paused = false;
    this.gameOver = false;
    this.completed = false;
    this.activeThreadTarget = null;
    this.shadowThreadImpactConsumed = true;
    this.collisionRects = [...Stage2Data.platforms, ...Stage2Data.walls.filter((wall) => wall.role !== 'back-wall')];

    this.drawEnvironment();
    this.drawStageGeometry();
    this.createCollectibles();
    this.createEnemies();
    this.player = new Player(this, Stage2Data.start.x, Stage2Data.start.y, Stage2Data);
    this.inputSystem = new InputSystem(this);
    this.touchControls = new TouchControls(this, this.inputSystem, save.settings);
    this.cameraController = new CameraController(this.cameras.main, Stage2Data);
    this.hud = new Hud(this);
    this.createThreadTrail();
    this.createPauseOverlay();
    this.publishQaState();
  }

  update(time: number, delta: number): void {
    const input = this.inputSystem.update();
    if (input.pausePressed && !this.gameOver) {
      this.setPaused(!this.paused);
    }

    if (this.paused || this.gameOver) {
      this.hideThreadTrail();
      this.updateAudioMix(Math.min(delta, 34), false);
      if (input.retryPressed || input.confirmPressed) {
        this.retryCheckpoint();
      } else if (input.restartPressed) {
        this.scene.restart();
      }
      this.publishQaState();
      return;
    }

    const gameplayDelta = Math.min(delta, 34);
    this.updateParallax();
    this.updateAnchors(time);

    if (input.techniquePressed) {
      this.tryShadowThread(time);
    }

    const shadowThreadingBeforeUpdate = this.player.getRuntimeState().shadowThreading;
    const playerFrame = this.player.update(input, this.collisionRects, time, gameplayDelta);
    const beforeSlope = this.player.getRuntimeState();
    this.resolveSlopes(gameplayDelta);
    const afterSlope = this.player.getRuntimeState();
    if (!beforeSlope.onGround && afterSlope.onGround && beforeSlope.vy > 140) {
      this.audio.play(beforeSlope.vy >= 560 ? GameAudioKey.LandHeavy : GameAudioKey.LandSoft, {
        detuneVariance: beforeSlope.vy >= 560 ? 14 : 24
      });
    }
    this.playPlayerActionSfx(playerFrame.events);
    const slash = playerFrame.slash;
    const playerPosition = this.player.getPosition();

    for (const enemy of this.enemies) {
      enemy.update(gameplayDelta, playerPosition.x, playerPosition.y);
    }
    this.relayKeeper.update(gameplayDelta, playerPosition.x, playerPosition.y);

    const shadowThreadCompleted = playerFrame.events.includes('shadowThread');
    if (!shadowThreadingBeforeUpdate && !shadowThreadCompleted) this.resolveCombat(slash, time);
    this.resolveShadowThreadStrike(time);
    this.resolveEnemyContact(time);
    this.resolveHazards(time);
    this.updraftActive = false;
    this.resolveGimmicks(time, gameplayDelta);
    this.resolveCheckpoints(time);
    this.resolveCollectibles();
    this.resolveSignalGate();
    this.updateThreadTrail();

    if (this.player.isDead()) {
      this.showGameOver();
    }

    this.updateAudioMix(gameplayDelta, this.updraftActive);

    this.cameraController.update(playerPosition, gameplayDelta);
    const section = getStage2SectionForX(playerPosition.x);
    const playerState = this.player.getRuntimeState();
    this.hud.update({
      player: playerState,
      elapsedMs: this.elapsedMs(),
      scrollsFound: 0,
      sealsFound: this.collectedSeals.size,
      sealsTotal: Stage2Data.collectibles.seals.length,
      currentSection: section.name,
      objective: this.resolveObjective(),
      checkpointMessage: time < this.checkpointMessageUntilMs ? this.checkpointMessage : '',
      techniqueLabel: 'KAGE-ITO',
      techniqueReady: playerState.shadowThreadCharge,
      bossLabel: 'RELAY',
      warden: playerPosition.x > Stage2Data.relayKeeper.arena.x - 160 || this.relayKeeper.dead ? this.relayKeeper.getHp() : null
    });
    this.publishQaState();
  }

  private drawEnvironment(): void {
    const layers = [
      { key: RuntimeEnvironmentAssetKey.BackgroundFar, alpha: 1, depth: 0, speedX: 0.03, speedY: 0.05 },
      { key: RuntimeEnvironmentAssetKey.BackgroundDistant, alpha: 0.76, depth: 1, speedX: 0.06, speedY: 0.08 },
      { key: RuntimeEnvironmentAssetKey.BackgroundMid, alpha: 0.88, depth: 2, speedX: 0.11, speedY: 0.12 },
      { key: RuntimeEnvironmentAssetKey.BackgroundNear, alpha: 0.62, depth: 3, speedX: 0.17, speedY: 0.16 },
      { key: RuntimeEnvironmentAssetKey.BackgroundFront, alpha: 0.44, depth: 4, speedX: 0.24, speedY: 0.19 }
    ];
    layers.forEach((config) => {
      const image = this.add
        .tileSprite(0, 0, BASE_WIDTH, BASE_HEIGHT, config.key)
        .setOrigin(0)
        .setDepth(config.depth)
        .setAlpha(config.alpha)
        .setScrollFactor(0);
      this.parallaxLayers.push({ image, speedX: config.speedX, speedY: config.speedY });
    });
    this.add.image(512, 284, ArtAssetKey.LightingNeon).setAlpha(0.12).setDepth(6).setScrollFactor(0);
    this.add.image(168, 392, RuntimeEnvironmentAssetKey.MoonGate).setDisplaySize(210, 202).setAlpha(0.46).setDepth(10);
  }

  private drawStageGeometry(): void {
    this.drawStageWalls();

    for (const platform of Stage2Data.platforms) {
      const key = platform.height <= 34 ? RuntimeEnvironmentAssetKey.PlatformThinTile : RuntimeEnvironmentAssetKey.GroundTile;
      const tile = this.add
        .tileSprite(platform.x + platform.width / 2, platform.y + platform.height / 2, platform.width, platform.height, key)
        .setDepth(12)
        .setAlpha(platform.height <= 34 ? 0.9 : 0.98);
      tile.tilePositionX = platform.x * 0.29;
      tile.tilePositionY = platform.y * 0.05;
      this.drawPlatformDressing(platform);
    }

    this.drawStageSlopes();

    for (const checkpoint of Stage2Data.checkpoints) {
      this.add
        .sprite(checkpoint.x + checkpoint.width / 2, checkpoint.y + checkpoint.height / 2, RuntimeEnvironmentAssetKey.ItemIcons, RuntimeItemFrame.Checkpoint)
        .setDisplaySize(78, 72)
        .setDepth(15);
      this.add.text(checkpoint.x - 16, checkpoint.y - 18, 'SAVE', {
        fontFamily: 'Consolas, monospace',
        fontSize: '10px',
        color: PaletteHex.lanternGold
      }).setDepth(16);
    }

    for (const hazard of Stage2Data.hazards) {
      const key = hazard.type === 'fall-pit' ? RuntimeSpriteAssetKey.Slash : RuntimeSpriteAssetKey.Telegraph;
      const frame = hazard.type === 'fall-pit' ? 14 : hazard.type === 'timed-spark' ? 3 : 2;
      const image = this.add
        .sprite(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, key, frame)
        .setDisplaySize(hazard.width + 38, hazard.height + 22)
        .setTint(hazard.type === 'fall-pit' ? Palette.neonMagenta : Palette.enemyVermilion)
        .setAlpha(hazard.type === 'fall-pit' ? 0.26 : 0.68)
        .setDepth(18);
      this.hazardVisuals.push({ ...hazard, image });
    }

    for (const gimmick of Stage2Data.gimmicks) {
      const image = this.add
        .sprite(gimmick.x + gimmick.width / 2, gimmick.y + gimmick.height / 2, RuntimeSpriteAssetKey.Telegraph, gimmick.type === 'updraft-vent' ? 1 : 4)
        .setDisplaySize(gimmick.width + 42, gimmick.height + 28)
        .setTint(gimmick.type === 'updraft-vent' ? Palette.neonCyan : Palette.neonMagenta)
        .setAlpha(gimmick.type === 'updraft-vent' ? 0.32 : 0.24)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(17);
      this.gimmickVisuals.push({ ...gimmick, image });
    }

    for (const anchor of Stage2Data.anchors) {
      const pulse = this.add
        .sprite(anchor.x, anchor.y, RuntimeSpriteAssetKey.Telegraph, 1)
        .setDisplaySize(anchor.radius * 2.1, anchor.radius * 1.45)
        .setTint(Palette.neonCyan)
        .setAlpha(0.18)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(18);
      const image = this.add
        .sprite(anchor.x, anchor.y, RuntimeSpriteAssetKey.Slash, 9)
        .setDisplaySize(anchor.radius * 1.36, anchor.radius * 1.05)
        .setTint(Palette.neonMagenta)
        .setAlpha(0.82)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(19);
      this.anchorVisuals.push({ ...anchor, pulse, image });
    }

    this.add.image(Stage2Data.signalGate.x + 20, Stage2Data.signalGate.y + 56, ArtAssetKey.LightingMoonlight).setDisplaySize(220, 240).setAlpha(0.32).setDepth(14);
    this.add.image(Stage2Data.signalGate.x + 18, Stage2Data.signalGate.y + 50, RuntimeEnvironmentAssetKey.MoonGate).setDisplaySize(236, 224).setDepth(19);
  }

  private drawPlatformDressing(platform: Stage2Platform): void {
    const isThin = platform.height <= 34;
    const topLip = this.add
      .tileSprite(
        platform.x + platform.width / 2,
        platform.y + 4,
        platform.width + (isThin ? 42 : 58),
        isThin ? 8 : 11,
        RuntimeEnvironmentAssetKey.PlatformThinTile
      )
      .setDepth(14)
      .setAlpha(isThin ? 0.28 : 0.2)
      .setTint(isThin ? Palette.neonCyan : Palette.paleMoonMist)
      .setBlendMode(Phaser.BlendModes.ADD);
    topLip.tilePositionX = platform.x * 0.37;

    const underside = this.add
      .tileSprite(
        platform.x + platform.width / 2,
        platform.y + platform.height + (isThin ? 9 : 12),
        platform.width + 36,
        Math.max(18, platform.height * 0.44),
        RuntimeEnvironmentAssetKey.GroundTile
      )
      .setDepth(11)
      .setAlpha(isThin ? 0.42 : 0.58)
      .setTint(Palette.inkBlack);
    underside.tilePositionX = platform.x * 0.19;
    underside.tilePositionY = platform.y * 0.09;

    const capHeight = Math.max(34, platform.height + 18);
    this.add
      .sprite(platform.x - 9, platform.y + platform.height / 2 + 2, RuntimeSpriteAssetKey.Slash, isThin ? 10 : 8)
      .setDisplaySize(58, capHeight)
      .setDepth(15)
      .setAlpha(isThin ? 0.38 : 0.46)
      .setTint(Palette.inkBlack)
      .setAngle(-8);
    this.add
      .sprite(platform.x + platform.width + 9, platform.y + platform.height / 2 + 1, RuntimeSpriteAssetKey.Slash, isThin ? 11 : 9)
      .setDisplaySize(58, capHeight)
      .setDepth(15)
      .setAlpha(isThin ? 0.34 : 0.44)
      .setTint(Palette.inkBlack)
      .setFlipX(true)
      .setAngle(7);

    if (platform.width > 330) {
      this.add
        .sprite(platform.x + platform.width / 2, platform.y + platform.height + 2, RuntimeSpriteAssetKey.Telegraph, 4)
        .setDisplaySize(platform.width * 0.72, 34)
        .setDepth(13)
        .setAlpha(0.08)
        .setTint(isThin ? Palette.neonMagenta : Palette.neonCyan)
        .setBlendMode(Phaser.BlendModes.ADD);
    }

  }

  private drawStageWalls(): void {
    for (const wall of Stage2Data.walls) {
      const isBackWall = wall.role === 'back-wall';
      const tile = this.add
        .tileSprite(
          wall.x + wall.width / 2,
          wall.y + wall.height / 2,
          wall.width,
          wall.height,
          isBackWall ? RuntimeEnvironmentAssetKey.BackgroundFront : RuntimeEnvironmentAssetKey.GroundTile
        )
        .setDepth(isBackWall ? 7 : 13)
        .setAlpha(isBackWall ? wall.alpha : Math.min(wall.alpha, 0.58))
        .setTint(Palette.darkBlueGray);
      tile.tilePositionX = wall.x * 0.16;
      tile.tilePositionY = wall.y * 0.11;

      if (isBackWall) {
        this.drawBackWallDressing(wall);
        continue;
      }
      this.drawWallDressing(wall);
      const edgeX = wall.role === 'left-wall' ? wall.x + wall.width - 8 : wall.x + 8;
      this.add
        .sprite(edgeX, wall.y + wall.height / 2, RuntimeSpriteAssetKey.Telegraph, 1)
        .setDisplaySize(42, wall.height + 34)
        .setTint(wall.role === 'left-wall' ? Palette.neonCyan : Palette.neonMagenta)
        .setAlpha(0.14)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(14);
    }
  }

  private drawBackWallDressing(wall: Stage2Wall): void {
    const crown = this.add
      .tileSprite(wall.x + wall.width / 2, wall.y + 12, wall.width + 90, 24, RuntimeEnvironmentAssetKey.BackgroundFront)
      .setDepth(8)
      .setAlpha(0.2)
      .setTint(Palette.inkBlack);
    crown.tilePositionX = wall.x * 0.07;
    const base = this.add
      .tileSprite(wall.x + wall.width / 2, wall.y + wall.height - 10, wall.width + 74, 28, RuntimeEnvironmentAssetKey.BackgroundFront)
      .setDepth(8)
      .setAlpha(0.18)
      .setTint(Palette.inkBlack);
    base.tilePositionX = wall.x * 0.09;
  }

  private drawWallDressing(wall: Stage2Wall): void {
    const edgeX = wall.role === 'left-wall' ? wall.x + wall.width - 10 : wall.x + 10;
    const innerTrim = this.add
      .tileSprite(edgeX, wall.y + wall.height / 2, 26, wall.height + 34, RuntimeEnvironmentAssetKey.PlatformThinTile)
      .setDepth(14)
      .setAlpha(0.42)
      .setTint(Palette.darkBlueGray);
    innerTrim.tilePositionY = wall.y * 0.18;

    const topCap = this.add
      .tileSprite(wall.x + wall.width / 2, wall.y - 7, wall.width + 54, 28, RuntimeEnvironmentAssetKey.GroundTile)
      .setDepth(15)
      .setAlpha(0.46)
      .setTint(Palette.inkBlack);
    topCap.tilePositionX = wall.x * 0.23;

    const bottomCap = this.add
      .tileSprite(wall.x + wall.width / 2, wall.y + wall.height + 8, wall.width + 44, 24, RuntimeEnvironmentAssetKey.GroundTile)
      .setDepth(15)
      .setAlpha(0.34)
      .setTint(Palette.inkBlack);
    bottomCap.tilePositionX = wall.x * 0.21;

    const breakCount = Math.max(1, Math.floor(wall.height / 190));
    for (let index = 0; index < breakCount; index += 1) {
      const y = wall.y + 70 + index * 172 + ((wall.x + index * 31) % 46);
      if (y > wall.y + wall.height - 44) continue;
      this.add
        .sprite(wall.x + wall.width / 2 + (index % 2 === 0 ? -wall.width * 0.12 : wall.width * 0.14), y, RuntimeSpriteAssetKey.Slash, 8 + (index % 6))
        .setDisplaySize(wall.width + 82, 58)
        .setDepth(15)
        .setAlpha(0.22)
        .setTint(index % 2 === 0 ? Palette.inkBlack : Palette.darkBlueGray)
        .setAngle((index % 2 === 0 ? -1 : 1) * (11 + (wall.x % 7)));
      this.add
        .tileSprite(wall.x + wall.width / 2, y + 22, wall.width + 34, 12, RuntimeEnvironmentAssetKey.PlatformThinTile)
        .setDepth(15)
        .setAlpha(0.18)
        .setTint(index % 2 === 0 ? Palette.neonCyan : Palette.neonMagenta)
        .setBlendMode(Phaser.BlendModes.ADD);
    }

    const cornerFrame = wall.role === 'left-wall' ? 12 : 13;
    this.add
      .sprite(edgeX, wall.y + 10, RuntimeSpriteAssetKey.Slash, cornerFrame)
      .setDisplaySize(72, 44)
      .setDepth(16)
      .setAlpha(0.34)
      .setTint(Palette.inkBlack)
      .setAngle(wall.role === 'left-wall' ? -12 : 12);
    this.add
      .sprite(edgeX, wall.y + wall.height - 8, RuntimeSpriteAssetKey.Slash, cornerFrame)
      .setDisplaySize(74, 46)
      .setDepth(16)
      .setAlpha(0.3)
      .setTint(Palette.inkBlack)
      .setFlipY(true)
      .setAngle(wall.role === 'left-wall' ? 10 : -10);
  }

  private drawStageSlopes(): void {
    for (const slope of Stage2Data.slopes) {
      const length = Math.hypot(slope.x2 - slope.x1, slope.y2 - slope.y1);
      const centerX = (slope.x1 + slope.x2) / 2;
      const centerY = (slope.y1 + slope.y2) / 2;
      const angle = Phaser.Math.RadToDeg(Math.atan2(slope.y2 - slope.y1, slope.x2 - slope.x1));
      const fascia = this.add
        .tileSprite(centerX, centerY + 20, length + 82, slope.thickness + 38, RuntimeEnvironmentAssetKey.GroundTile)
        .setDepth(13)
        .setAngle(angle)
        .setAlpha(0.58)
        .setTint(Palette.inkBlack);
      fascia.tilePositionX = slope.x1 * 0.18;
      const image = this.add
        .tileSprite(centerX, centerY, length, slope.thickness, RuntimeEnvironmentAssetKey.PlatformThinTile)
        .setDepth(14)
        .setAngle(angle)
        .setAlpha(0.95)
        .setTint(Palette.darkBlueGray);
      image.tilePositionX = slope.x1 * 0.21;
      image.tilePositionY = slope.y1 * 0.13;

      const glow = this.add
        .sprite(centerX, centerY - 4, RuntimeSpriteAssetKey.Telegraph, 4)
        .setDisplaySize(length, slope.thickness + 18)
        .setAngle(angle)
        .setTint(Palette.neonCyan)
        .setAlpha(0.2)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(15);
      this.drawSlopeEndpointBlend(slope, angle);
      this.slopeVisuals.push({ ...slope, image, glow });
    }
  }

  private drawSlopeEndpointBlend(slope: Stage2Slope, angle: number): void {
    const endpointConfigs = [
      { x: slope.x1, y: slope.y1, flip: false, tint: Palette.neonCyan },
      { x: slope.x2, y: slope.y2, flip: true, tint: Palette.neonMagenta }
    ];
    for (const endpoint of endpointConfigs) {
      this.add
        .sprite(endpoint.x, endpoint.y + slope.thickness / 2, RuntimeSpriteAssetKey.Slash, endpoint.flip ? 11 : 10)
        .setDisplaySize(118, slope.thickness + 48)
        .setDepth(16)
        .setAngle(angle)
        .setFlipX(endpoint.flip)
        .setTint(Palette.inkBlack)
        .setAlpha(0.42);
      this.add
        .sprite(endpoint.x, endpoint.y - 4, RuntimeSpriteAssetKey.Telegraph, 4)
        .setDisplaySize(96, 36)
        .setDepth(17)
        .setAngle(angle)
        .setTint(endpoint.tint)
        .setAlpha(0.12)
        .setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private createCollectibles(): void {
    this.sealVisuals = Stage2Data.collectibles.seals.map((seal) => this.createCollectible(seal, 28, 22, RuntimeItemFrame.Seal, null));
    this.pickupVisuals = Stage2Data.collectibles.pickups.map((pickup) => ({
      ...this.createCollectible(
        pickup,
        34,
        34,
        pickup.type === 'health' ? RuntimeItemFrame.Health : RuntimeItemFrame.Energy,
        pickup.type === 'health' ? Palette.dangerCoral : Palette.neonCyan
      ),
      type: pickup.type
    }));
  }

  private createCollectible(item: Stage2Seal | Stage2Pickup, width: number, height: number, frame: number, tint: number | null): CollectibleVisual {
    const image = this.add
      .sprite(item.x, item.y, RuntimeEnvironmentAssetKey.ItemIcons, frame)
      .setDisplaySize(width, height)
      .setDepth(20);
    if (tint !== null) image.setTint(tint);
    return {
      id: item.id,
      body: centerRect(item.x, item.y, width, height),
      image
    };
  }

  private createEnemies(): void {
    this.enemies = Stage2Data.enemies.map((definition) =>
      definition.type === 'ink-crawler' ? new InkCrawler(this, definition) : new KiteWraith(this, definition)
    );
    this.relayKeeper = new LanternWarden(this, Stage2Data.relayKeeper);
  }

  private createThreadTrail(): void {
    for (let index = 0; index < 8; index += 1) {
      const sprite = this.add
        .sprite(0, 0, RuntimeSpriteAssetKey.Slash, 8 + (index % 6))
        .setScale(0.34)
        .setTint(index % 2 === 0 ? Palette.neonCyan : Palette.neonMagenta)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(33)
        .setVisible(false);
      this.threadTrail.push(sprite);
    }
  }

  private tryShadowThread(nowMs: number): void {
    const target = this.findShadowThreadTarget();
    if (!target) return;
    if (!this.player.tryShadowThread({ x: target.x, y: target.y }, nowMs)) return;
    this.activeThreadTarget = target;
    this.shadowThreadImpactConsumed = false;
    this.audio.play(GameAudioKey.ShadowThreadLaunch, { sourceX: this.player.getPosition().x, variation: false });
  }

  private findShadowThreadTarget(): ShadowThreadTarget | null {
    const player = this.player.getPosition();
    const candidates: { readonly target: ShadowThreadTarget; readonly score: number }[] = [];
    for (const anchor of Stage2Data.anchors) {
      const distance = Phaser.Math.Distance.Between(player.x, player.y, anchor.x, anchor.y);
      if (distance > Stage2Tuning.shadowThreadRange) continue;
      const behindPenalty = (anchor.x - player.x) * player.facing < -48 ? 140 : 0;
      const verticalBonus = anchor.y < player.y - 80 ? -36 : 0;
      candidates.push({
        target: { id: anchor.id, kind: 'anchor', x: anchor.x, y: anchor.y },
        score: distance + behindPenalty + verticalBonus
      });
    }

    for (const enemy of [...this.enemies.filter((item) => !item.dead), this.relayKeeper.dead ? null : this.relayKeeper].filter(
      (item): item is StageEnemy => item !== null
    )) {
      const body = enemy.getBody();
      const x = body.x + body.width / 2;
      const y = body.y + body.height / 2;
      const distance = Phaser.Math.Distance.Between(player.x, player.y, x, y);
      if (distance > Stage2Tuning.shadowThreadRange) continue;
      const behindPenalty = (x - player.x) * player.facing < -48 ? 120 : 0;
      candidates.push({
        target: { id: enemy.id, kind: enemy.kind === 'lantern-warden' ? 'keeper' : 'enemy', x, y, enemy },
        score: distance + behindPenalty - 54
      });
    }

    candidates.sort((a, b) => a.score - b.score);
    return candidates[0]?.target ?? null;
  }

  private resolveCombat(slash: SlashState, nowMs: number): void {
    const targets: StageEnemy[] = [...this.enemies.filter((enemy) => !enemy.dead), this.relayKeeper];
    for (const enemy of targets) {
      const lastHit = this.lastEnemyHitMs.get(enemy.id) ?? -Infinity;
      if (nowMs - lastHit < 260) continue;
      if (CombatSystem.overlapsActiveSlash(slash, enemy.getBody())) {
        const enemyBody = enemy.getBody();
        const hitResult = enemy.takeHit(1);
        if (hitResult === 'ignored') continue;
        this.lastEnemyHitMs.set(enemy.id, nowMs);
        const sourceX = enemyBody.x + enemyBody.width / 2;
        if (enemy.kind === 'lantern-warden') {
          this.audio.play(hitResult === 'defeated' ? GameAudioKey.RelayDefeat : GameAudioKey.RelayHit, { sourceX });
        } else if (hitResult === 'defeated') {
          this.audio.play(enemy.kind === 'kite-wraith' ? GameAudioKey.EnemyDefeatWraith : GameAudioKey.EnemyDefeat, { sourceX });
        } else if (slash.mode === 'spin') {
          this.audio.play(GameAudioKey.HitHeavy, { sourceX, detune: enemy.kind === 'kite-wraith' ? 90 : -10 });
        } else {
          this.audio.playGroup('hitLight', { sourceX, detune: enemy.kind === 'kite-wraith' ? 110 : 0 });
        }
        this.cameras.main.shake(SaveSystem.load().settings.reducedShake ? 16 : 34, hitResult === 'defeated' ? 0.0022 : 0.0016);
      }
    }
  }

  private resolveShadowThreadStrike(nowMs: number): void {
    if (this.shadowThreadImpactConsumed) return;
    const strike = this.player.getShadowThreadStrike();
    if (!strike) return;
    let connected = false;
    let defeatedTarget = false;
    let hitSourceX = this.activeThreadTarget?.x ?? this.player.getPosition().x;
    for (const enemy of [...this.enemies.filter((item) => !item.dead), this.relayKeeper.dead ? null : this.relayKeeper].filter(
      (item): item is StageEnemy => item !== null
    )) {
      if (!rectsOverlap(strike, enemy.getBody())) continue;
      const enemyBody = enemy.getBody();
      const hitResult = enemy.takeHit(1);
      if (hitResult === 'ignored') continue;
      this.lastEnemyHitMs.set(enemy.id, nowMs);
      connected = true;
      defeatedTarget = defeatedTarget || hitResult === 'defeated';
      hitSourceX = enemyBody.x + enemyBody.width / 2;
      if (hitResult === 'defeated') {
        this.audio.play(
          enemy.kind === 'lantern-warden'
            ? GameAudioKey.RelayDefeat
            : enemy.kind === 'kite-wraith'
              ? GameAudioKey.EnemyDefeatWraith
              : GameAudioKey.EnemyDefeat,
          { sourceX: hitSourceX }
        );
      }
    }
    this.audio.play(GameAudioKey.ShadowThreadHit, {
      sourceX: hitSourceX,
      volume: connected ? (defeatedTarget ? 1.08 : 1) : 0.58,
      detune: connected ? 0 : 180,
      variation: false
    });
    if (connected) {
      this.player.rechargeShadowThread();
      this.cameras.main.shake(SaveSystem.load().settings.reducedShake ? 14 : 30, 0.002);
    }
    this.shadowThreadImpactConsumed = true;
  }

  private resolveEnemyContact(nowMs: number): void {
    const body = this.player.getBody();
    for (const enemy of this.enemies) {
      if (!enemy.dead && rectsOverlap(body, enemy.getBody())) {
        const enemyBody = enemy.getBody();
        if (this.player.takeDamage(enemy.damage, nowMs, 'enemy-contact', enemyBody.x + enemyBody.width / 2, enemy.id)) {
          this.audio.play(GameAudioKey.PlayerHurt);
        }
      }
    }
    for (const attack of this.relayKeeper.getAttackRects()) {
      if (rectsOverlap(body, attack)) {
        if (this.player.takeDamage(1, nowMs, 'warden-attack', attack.x + attack.width / 2, 'relay-keeper')) {
          this.audio.play(GameAudioKey.PlayerHurt);
        }
      }
    }
  }

  private resolveHazards(nowMs: number): void {
    const body = this.player.getBody();
    for (const hazard of this.hazardVisuals) {
      const active = this.isHazardActive(hazard, nowMs);
      hazard.image.setAlpha(active ? (hazard.type === 'fall-pit' ? 0.30 : 0.78) : 0.22);
      if (active && rectsOverlap(body, hazard)) {
        if (this.player.takeDamage(hazard.damage, nowMs, hazard.type === 'fall-pit' ? 'fall' : 'hazard', hazard.x + hazard.width / 2, hazard.id)) {
          this.audio.play(GameAudioKey.PlayerHurt);
        }
        if (hazard.type === 'fall-pit') this.player.respawnAtCheckpoint();
      }
    }
  }

  private isHazardActive(hazard: Stage2Hazard, nowMs: number): boolean {
    return hazard.type !== 'timed-spark' || Math.sin(nowMs / 280 + hazard.x * 0.015) > -0.25;
  }

  private resolveGimmicks(nowMs: number, deltaMs: number): void {
    const body = this.player.getBody();
    for (const gimmick of this.gimmickVisuals) {
      const pulse = 0.28 + Math.sin(nowMs / 190 + gimmick.x * 0.01) * 0.13;
      gimmick.image.setAlpha(gimmick.type === 'updraft-vent' ? pulse + 0.1 : pulse).setAngle(Math.sin(nowMs / 260 + gimmick.x * 0.006) * 4);
      if (!rectsOverlap(body, gimmick)) continue;
      if (gimmick.type === 'updraft-vent') {
        this.updraftActive = true;
        this.player.applyUpdraft(gimmick.strength);
      } else {
        this.player.applyCrosswind(gimmick.strength, deltaMs);
      }
    }
  }

  private resolveSlopes(deltaMs: number): void {
    let activeSlopeId: string | null = null;
    for (const slope of this.slopeVisuals) {
      if (this.player.applySlopeSurface(slope, deltaMs)) {
        activeSlopeId = slope.id;
      }
    }
    for (const slope of this.slopeVisuals) {
      const active = slope.id === activeSlopeId;
      slope.image.setAlpha(active ? 1 : 0.95);
      slope.glow.setAlpha(active ? 0.38 : 0.2);
    }
  }

  private resolveCheckpoints(nowMs: number): void {
    const body = this.player.getBody();
    for (const checkpoint of Stage2Data.checkpoints) {
      if (rectsOverlap(body, checkpoint) && !this.activatedCheckpoints.has(checkpoint.id)) {
        this.activatedCheckpoints.add(checkpoint.id);
        this.player.setCheckpoint(checkpoint.respawnX, checkpoint.respawnY);
        this.checkpointMessage = `Checkpoint: ${checkpoint.name}`;
        this.checkpointMessageUntilMs = nowMs + 2500;
        this.audio.playAt(GameAudioKey.Checkpoint, checkpoint.x + checkpoint.width / 2);
      }
    }
  }

  private resolveCollectibles(): void {
    const body = this.player.getBody();
    this.collect(this.sealVisuals, this.collectedSeals, body, GameAudioKey.PickupSeal);
    for (const pickup of this.pickupVisuals) {
      if (this.collectedPickups.has(pickup.id) || !rectsOverlap(body, pickup.body)) continue;
      this.collectedPickups.add(pickup.id);
      pickup.image.setVisible(false);
      this.audio.playAt(pickup.type === 'health' ? GameAudioKey.PickupHealth : GameAudioKey.PickupEnergy, pickup.image.x);
      if (pickup.type === 'health') this.player.heal(5);
      if (pickup.type === 'energy') this.player.rechargeShadowThread();
    }
  }

  private collect(visuals: readonly CollectibleVisual[], target: Set<string>, body: RectData, sfxKey: GameAudioKeyType): void {
    for (const visual of visuals) {
      if (target.has(visual.id) || !rectsOverlap(body, visual.body)) continue;
      const detune = Math.min(420, target.size * 16);
      target.add(visual.id);
      visual.image.setVisible(false);
      this.audio.play(sfxKey, { detune, sourceX: visual.image.x });
    }
  }

  private resolveSignalGate(): void {
    if (this.completed || !this.relayKeeper.dead) return;
    if (rectsOverlap(this.player.getBody(), Stage2Data.signalGate)) {
      this.completed = true;
      const timeMs = this.elapsedMs();
      const rank = calculateStageRank(timeMs, this.player.getDamageTaken(), this.collectedSeals.size);
      const save = SaveSystem.recordStage2Clear(timeMs, rank);
      this.scene.start(SceneKey.StageClear, {
        stageLabel: 'STAGE 2 CLEAR',
        retryScene: SceneKey.Stage2,
        timeMs,
        rank,
        scrollsFound: 0,
        sealsFound: this.collectedSeals.size,
        sealsTotal: Stage2Data.collectibles.seals.length,
        damageTaken: this.player.getDamageTaken(),
        bestTimeMs: save.stage2.bestTimeMs
      });
    }
  }

  private resolveObjective(): string {
    const x = this.player.getPosition().x;
    if (!this.relayKeeper.dead && x > Stage2Data.relayKeeper.arena.x - 140) return 'Use Kage-Ito to break the Relay Keeper';
    if (this.relayKeeper.dead) return 'Enter the Signal Gate';
    if (x < 1300) return 'Drop through the Moon Gate shaft';
    if (x < 2700) return 'Ascend through the drain wall gap';
    if (x < 4000) return 'Switch back through the hanging market';
    if (x < 5350) return 'Ride the diagonal billboard descent';
    return 'Climb the signal spire';
  }

  private playPlayerActionSfx(events: readonly PlayerActionEvent[]): void {
    for (const event of events) {
      if (event === 'jump') this.audio.play(GameAudioKey.Jump);
      if (event === 'speedFlipJump') this.audio.play(GameAudioKey.Jump, { detune: 180, volume: 1.08 });
      if (event === 'wallKick') this.audio.play(GameAudioKey.WallKick);
      if (event === 'landSoft') this.audio.play(GameAudioKey.LandSoft, { detuneVariance: 24 });
      if (event === 'landHeavy') this.audio.play(GameAudioKey.LandHeavy, { detuneVariance: 14 });
      if (event === 'attack') this.audio.play(GameAudioKey.Attack);
      if (event === 'spinAttack') this.audio.play(GameAudioKey.SpinAttack);
      if (event === 'hurt') this.audio.play(GameAudioKey.PlayerHurt);
    }
  }

  private updateAudioMix(deltaMs: number, updraftActive: boolean): void {
    const playerState = this.player.getRuntimeState();
    const bossDistance = Stage2Data.relayKeeper.arena.x - playerState.x;
    this.audio.update(
      {
        listenerX: playerState.x,
        velocityX: playerState.vx,
        velocityY: playerState.vy,
        onGround: playerState.onGround,
        wallSliding: playerState.wallSliding,
        bossIntensity:
          this.paused || this.gameOver || this.relayKeeper.dead
            ? 0
            : Phaser.Math.Clamp(1 - Math.max(0, bossDistance) / 820, 0, 1),
        updraftActive,
        paused: this.paused,
        gameOver: this.gameOver
      },
      deltaMs
    );
  }

  private createPauseOverlay(): void {
    const panel = this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, ArtAssetKey.TitleMenuPanel).setScale(1.02).setDepth(100).setScrollFactor(0);
    const title = this.add.text(372, 202, 'PAUSED', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '42px',
      color: PaletteHex.neonCyan
    }).setDepth(101).setScrollFactor(0);
    const body = this.add.text(248, 284, 'Esc/P: resume   R/Enter: retry checkpoint   T: restart   K/X: Kage-Ito', {
      fontFamily: 'Consolas, monospace',
      fontSize: '16px',
      color: PaletteHex.warmPaper
    }).setDepth(101).setScrollFactor(0);
    this.pauseObjects = [panel, title, body];
    this.pauseObjects.forEach((object) => (object as unknown as { setVisible: (value: boolean) => void }).setVisible(false));
  }

  private setPaused(value: boolean, announce = true): void {
    this.paused = value;
    this.pauseObjects.forEach((object) => (object as unknown as { setVisible: (value: boolean) => void }).setVisible(value));
    this.audio.setPaused(value);
    if (announce) this.audio.play(GameAudioKey.UiPause, { detune: value ? -40 : 120, variation: false });
  }

  private showGameOver(): void {
    this.gameOver = true;
    this.setPaused(true, false);
    this.audio.setGameOver(true);
    const text = this.pauseObjects[1] as Phaser.GameObjects.Text;
    text.setText('GAME OVER').setColor(PaletteHex.enemyVermilion);
  }

  private retryCheckpoint(): void {
    this.gameOver = false;
    this.player.retryCheckpoint();
    this.audio.setGameOver(false);
    this.audio.play(GameAudioKey.Respawn, { variation: false });
    this.setPaused(false, false);
    const text = this.pauseObjects[1] as Phaser.GameObjects.Text;
    text.setText('PAUSED').setColor(PaletteHex.neonCyan);
  }

  private elapsedMs(): number {
    return Math.max(0, this.time.now - this.startTimeMs);
  }

  private updateParallax(): void {
    this.parallaxLayers.forEach(({ image, speedX, speedY }) => {
      image.tilePositionX = this.cameras.main.scrollX * speedX;
      image.tilePositionY = this.cameras.main.scrollY * speedY;
    });
  }

  private updateAnchors(nowMs: number): void {
    const target = this.findShadowThreadTarget();
    for (const anchor of this.anchorVisuals) {
      const selected = target?.id === anchor.id;
      const scalePulse = 1 + Math.sin(nowMs / 180 + anchor.x * 0.02) * 0.04;
      anchor.image
        .setScale(scalePulse)
        .setAlpha(selected ? 1 : 0.78)
        .setTint(selected ? Palette.lanternGold : Palette.neonMagenta);
      anchor.pulse
        .setAlpha(selected ? 0.34 : 0.16)
        .setTint(selected ? Palette.lanternGold : Palette.neonCyan)
        .setAngle(Math.sin(nowMs / 240 + anchor.y * 0.01) * 7);
    }
  }

  private updateThreadTrail(): void {
    const playerState = this.player.getRuntimeState();
    if (!playerState.shadowThreading || !this.activeThreadTarget) {
      this.hideThreadTrail();
      if (!this.player.getShadowThreadStrike()) {
        this.activeThreadTarget = null;
      }
      return;
    }
    const player = this.player.getPosition();
    const target = this.activeThreadTarget;
    const angle = Phaser.Math.RadToDeg(Math.atan2(target.y - player.y, target.x - player.x));
    this.threadTrail.forEach((sprite, index) => {
      const t = (index + 1) / (this.threadTrail.length + 1);
      sprite
        .setVisible(true)
        .setPosition(player.x + (target.x - player.x) * t, player.y + (target.y - player.y) * t)
        .setAngle(angle)
        .setAlpha(0.72 - index * 0.055);
    });
  }

  private hideThreadTrail(): void {
    this.threadTrail.forEach((sprite) => sprite.setVisible(false).setAlpha(0));
  }

  private publishQaState(): void {
    const player = this.player?.getRuntimeState();
    const section = player ? getStage2SectionForX(player.x) : Stage2Data.sections[0];
    window.__NEON_RONIN_STAGE2__ = {
      scene: 'Stage2Scene',
      stageClear: false,
      section: section.name,
      player,
      checkpointCount: this.activatedCheckpoints.size,
      sealsFound: this.collectedSeals.size,
      hazards: this.hazardVisuals.map((hazard) => ({
        id: hazard.id,
        type: hazard.type,
        active: this.isHazardActive(hazard, this.time.now),
        x: hazard.x,
        y: hazard.y,
        width: hazard.width,
        height: hazard.height
      })),
      gimmicks: this.gimmickVisuals.map((gimmick) => ({
        id: gimmick.id,
        type: gimmick.type,
        x: gimmick.x,
        y: gimmick.y,
        width: gimmick.width,
        height: gimmick.height
      })),
      anchors: this.anchorVisuals.map((anchor) => ({
        id: anchor.id,
        x: anchor.x,
        y: anchor.y,
        radius: anchor.radius
      })),
      walls: Stage2Data.walls.map((wall: Stage2Wall) => ({
        id: wall.id,
        role: wall.role,
        x: wall.x,
        y: wall.y,
        width: wall.width,
        height: wall.height
      })),
      slopes: Stage2Data.slopes.map((slope) => ({
        id: slope.id,
        x1: slope.x1,
        y1: slope.y1,
        x2: slope.x2,
        y2: slope.y2,
        direction: slope.direction
      })),
      activeThreadTarget: this.activeThreadTarget?.id ?? null,
      enemies: this.enemies.map((enemy) => enemy.getRuntimeState()),
      relayKeeper: this.relayKeeper?.getHp(),
      relayKeeperDefeated: this.relayKeeper?.dead === true,
      signalGateActive: this.relayKeeper?.dead === true,
      paused: this.paused,
      gameOver: this.gameOver,
      touch: { visible: this.touchControls?.isVisible() === true, buttons: this.inputSystem?.getTouchButtons() },
      e2eIntegrity: {
        debugTeleport: false,
        hiddenClearStageCall: false
      }
    };
  }
}

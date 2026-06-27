import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { Palette, PaletteHex } from '../config/palette';
import { ArtAssetKey, RuntimeEnvironmentAssetKey, RuntimeItemFrame, RuntimeSpriteAssetKey } from '../data/artAssets';
import { Stage1Data, Stage1Tuning, getSectionForX, type RectData, type Stage1Hazard, type Stage1Pickup, type Stage1Scroll, type Stage1Seal } from '../data/stage1';
import { InkCrawler } from '../entities/InkCrawler';
import { KiteWraith } from '../entities/KiteWraith';
import { LanternWarden } from '../entities/LanternWarden';
import { Player } from '../entities/Player';
import type { StageEnemy } from '../entities/types';
import { CameraController } from '../systems/CameraController';
import { CombatSystem, type SlashState } from '../systems/CombatSystem';
import { InputSystem } from '../systems/InputSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { centerRect, rectsOverlap } from '../systems/geometry';
import { calculateStageRank } from '../systems/rank';
import { Hud } from '../ui/Hud';
import { TouchControls } from '../ui/TouchControls';

type CollectibleVisual = {
  readonly id: string;
  readonly body: RectData;
  readonly image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
};

type ParallaxLayer = {
  readonly image: Phaser.GameObjects.TileSprite;
  readonly speedX: number;
  readonly speedY: number;
};

export class Stage1Scene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;
  private touchControls!: TouchControls;
  private cameraController!: CameraController;
  private hud!: Hud;
  private enemies: StageEnemy[] = [];
  private warden!: LanternWarden;
  private sealVisuals: CollectibleVisual[] = [];
  private scrollVisuals: CollectibleVisual[] = [];
  private pickupVisuals: (CollectibleVisual & { readonly type: Stage1Pickup['type'] })[] = [];
  private hazardVisuals: (Stage1Hazard & { readonly image: Phaser.GameObjects.Sprite })[] = [];
  private collectedSeals = new Set<string>();
  private collectedScrolls = new Set<string>();
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

  constructor() {
    super(SceneKey.Stage1);
  }

  create(): void {
    const save = SaveSystem.load();
    this.sound.volume = save.settings.masterVolume;
    this.cameras.main.setBackgroundColor(PaletteHex.inkBlack);
    this.cameras.main.setBounds(0, 0, Stage1Data.worldWidth, Stage1Data.worldHeight);
    this.startTimeMs = this.time.now;
    this.paused = false;
    this.gameOver = false;
    this.completed = false;

    this.drawEnvironment();
    this.drawStageGeometry();
    this.createCollectibles();
    this.createEnemies();
    this.player = new Player(this, Stage1Data.start.x, Stage1Data.start.y);
    this.inputSystem = new InputSystem(this);
    this.touchControls = new TouchControls(this, this.inputSystem, save.settings);
    this.cameraController = new CameraController(this.cameras.main);
    this.hud = new Hud(this);
    this.createPauseOverlay();
    this.publishQaState();
  }

  update(time: number, delta: number): void {
    const input = this.inputSystem.update();
    if (input.pausePressed && !this.gameOver) {
      this.setPaused(!this.paused);
    }

    if (this.paused || this.gameOver) {
      if (input.retryPressed || input.confirmPressed) {
        this.retryCheckpoint();
      } else if (input.restartPressed) {
        this.scene.restart();
      }
      this.publishQaState();
      return;
    }

    const gameplayDelta = Math.min(delta, Stage1Tuning.maxFrameDeltaMs) * Stage1Tuning.gameSpeed;
    this.updateParallax();
    const slash = this.player.update(input, Stage1Data.platforms, time, gameplayDelta);
    const playerPosition = this.player.getPosition();
    for (const enemy of this.enemies) {
      enemy.update(gameplayDelta, playerPosition.x, playerPosition.y);
    }
    this.warden.update(gameplayDelta, playerPosition.x);

    this.resolveCombat(slash, time);
    this.resolveEnemyContact(time);
    this.resolveHazards(time);
    this.resolveCheckpoints(time);
    this.resolveCollectibles();
    this.resolveMoonGate();

    if (this.player.isDead()) {
      this.showGameOver();
    }

    this.cameraController.update(playerPosition, gameplayDelta);
    const section = getSectionForX(playerPosition.x);
    this.hud.update({
      player: this.player.getRuntimeState(),
      elapsedMs: this.elapsedMs(),
      scrollsFound: this.collectedScrolls.size,
      sealsFound: this.collectedSeals.size,
      currentSection: section.name,
      objective: this.resolveObjective(),
      checkpointMessage: time < this.checkpointMessageUntilMs ? this.checkpointMessage : '',
      warden: playerPosition.x > Stage1Data.warden.arena.x - 120 || this.warden.dead ? this.warden.getHp() : null
    });
    this.publishQaState();
  }

  private drawEnvironment(): void {
    const layers = [
      { key: RuntimeEnvironmentAssetKey.BackgroundFar, alpha: 1, depth: 0, speedX: 0.035, speedY: 0.012 },
      { key: RuntimeEnvironmentAssetKey.BackgroundDistant, alpha: 0.72, depth: 1, speedX: 0.07, speedY: 0.018 },
      { key: RuntimeEnvironmentAssetKey.BackgroundMid, alpha: 0.86, depth: 2, speedX: 0.12, speedY: 0.025 },
      { key: RuntimeEnvironmentAssetKey.BackgroundNear, alpha: 0.66, depth: 3, speedX: 0.18, speedY: 0.032 },
      { key: RuntimeEnvironmentAssetKey.BackgroundFront, alpha: 0.48, depth: 4, speedX: 0.24, speedY: 0.04 }
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
    this.add.tileSprite(0, 424, BASE_WIDTH, 140, RuntimeEnvironmentAssetKey.BackgroundFront).setOrigin(0).setAlpha(0.30).setDepth(5).setScrollFactor(0);
    this.add.image(512, 300, ArtAssetKey.LightingWarmCool).setAlpha(0.08).setDepth(6).setScrollFactor(0);
  }

  private drawStageGeometry(): void {
    for (const platform of Stage1Data.platforms) {
      const key = platform.height <= 30 ? RuntimeEnvironmentAssetKey.PlatformThinTile : RuntimeEnvironmentAssetKey.GroundTile;
      const tile = this.add
        .tileSprite(platform.x + platform.width / 2, platform.y + platform.height / 2, platform.width, platform.height, key)
        .setDepth(12)
        .setAlpha(platform.height <= 30 ? 0.92 : 0.98);
      tile.tilePositionX = platform.x * 0.33;
      if (platform.height <= 30) {
        tile.tilePositionY = 4;
      }
    }

    for (const checkpoint of Stage1Data.checkpoints) {
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

    for (const hazard of Stage1Data.hazards) {
      const key = hazard.type === 'fall-pit' ? RuntimeSpriteAssetKey.Slash : RuntimeSpriteAssetKey.Telegraph;
      const frame = hazard.type === 'fall-pit' ? 2 : hazard.type === 'timed-spark' ? 3 : 2;
      const image = this.add
        .sprite(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, key, frame)
        .setDisplaySize(hazard.width + 34, hazard.height + 20)
        .setTint(hazard.type === 'fall-pit' ? Palette.neonMagenta : Palette.enemyVermilion)
        .setAlpha(hazard.type === 'fall-pit' ? 0.26 : 0.68)
        .setDepth(18);
      this.hazardVisuals.push({ ...hazard, image });
    }

    this.add.image(Stage1Data.moonGate.x + 10, Stage1Data.moonGate.y + 56, ArtAssetKey.LightingMoonlight).setDisplaySize(220, 240).setAlpha(0.35).setDepth(14);
    this.add.image(Stage1Data.moonGate.x + 16, Stage1Data.moonGate.y + 42, RuntimeEnvironmentAssetKey.MoonGate).setDisplaySize(246, 230).setDepth(19);
  }

  private createCollectibles(): void {
    this.sealVisuals = Stage1Data.collectibles.seals.map((seal) => this.createCollectible(seal, 24, 24, RuntimeItemFrame.Seal, Palette.lanternGold));
    this.scrollVisuals = Stage1Data.collectibles.scrolls.map((scroll) => this.createCollectible(scroll, 44, 30, RuntimeItemFrame.Scroll, Palette.neonCyan));
    this.pickupVisuals = Stage1Data.collectibles.pickups.map((pickup) => ({
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

  private createCollectible(item: Stage1Seal | Stage1Scroll | Stage1Pickup, width: number, height: number, frame: number, tint: number): CollectibleVisual {
    const image = this.add
      .sprite(item.x, item.y, RuntimeEnvironmentAssetKey.ItemIcons, frame)
      .setDisplaySize(width, height)
      .setTint(tint)
      .setDepth(20);
    return {
      id: item.id,
      body: centerRect(item.x, item.y, width, height),
      image
    };
  }

  private createEnemies(): void {
    this.enemies = Stage1Data.enemies.map((definition) =>
      definition.type === 'ink-crawler' ? new InkCrawler(this, definition) : new KiteWraith(this, definition)
    );
    this.warden = new LanternWarden(this, Stage1Data.warden);
  }

  private resolveCombat(slash: SlashState, nowMs: number): void {
    const targets: StageEnemy[] = [...this.enemies.filter((enemy) => !enemy.dead), this.warden];
    for (const enemy of targets) {
      const lastHit = this.lastEnemyHitMs.get(enemy.id) ?? -Infinity;
      if (nowMs - lastHit < 260) continue;
      if (CombatSystem.overlapsActiveSlash(slash, enemy.getBody())) {
        const hitLanded = enemy.takeHit(1);
        if (hitLanded) {
          this.lastEnemyHitMs.set(enemy.id, nowMs);
          this.cameras.main.shake(SaveSystem.load().settings.reducedShake ? 20 : 45, 0.002);
        }
      }
    }
  }

  private resolveEnemyContact(nowMs: number): void {
    const body = this.player.getBody();
    for (const enemy of this.enemies) {
      if (!enemy.dead && rectsOverlap(body, enemy.getBody())) {
        this.player.takeDamage(enemy.damage, nowMs, 'enemy-contact');
      }
    }
    const attack = this.warden.getAttackRect();
    if (attack && rectsOverlap(body, attack)) {
      this.player.takeDamage(1, nowMs, 'warden-attack');
    }
  }

  private resolveHazards(nowMs: number): void {
    const body = this.player.getBody();
    for (const hazard of this.hazardVisuals) {
      const active = hazard.type !== 'timed-spark' || Math.sin(nowMs / 280) > -0.25;
      hazard.image.setAlpha(active ? (hazard.type === 'fall-pit' ? 0.30 : 0.78) : 0.24);
      if (active && rectsOverlap(body, hazard)) {
        this.player.takeDamage(hazard.damage, nowMs, hazard.type === 'fall-pit' ? 'fall' : 'hazard');
        if (hazard.type === 'fall-pit') this.player.respawnAtCheckpoint();
      }
    }
  }

  private resolveCheckpoints(nowMs: number): void {
    const body = this.player.getBody();
    for (const checkpoint of Stage1Data.checkpoints) {
      if (rectsOverlap(body, checkpoint) && !this.activatedCheckpoints.has(checkpoint.id)) {
        this.activatedCheckpoints.add(checkpoint.id);
        this.player.setCheckpoint(checkpoint.respawnX, checkpoint.respawnY);
        this.checkpointMessage = `Checkpoint: ${checkpoint.name}`;
        this.checkpointMessageUntilMs = nowMs + 2500;
      }
    }
  }

  private resolveCollectibles(): void {
    const body = this.player.getBody();
    this.collect(this.sealVisuals, this.collectedSeals, body);
    this.collect(this.scrollVisuals, this.collectedScrolls, body);
    for (const pickup of this.pickupVisuals) {
      if (this.collectedPickups.has(pickup.id) || !rectsOverlap(body, pickup.body)) continue;
      this.collectedPickups.add(pickup.id);
      pickup.image.setVisible(false);
      if (pickup.type === 'health') this.player.heal(1);
    }
  }

  private collect(visuals: readonly CollectibleVisual[], target: Set<string>, body: RectData): void {
    for (const visual of visuals) {
      if (target.has(visual.id) || !rectsOverlap(body, visual.body)) continue;
      target.add(visual.id);
      visual.image.setVisible(false);
    }
  }

  private resolveMoonGate(): void {
    if (this.completed || !this.warden.dead) return;
    if (rectsOverlap(this.player.getBody(), Stage1Data.moonGate)) {
      this.completed = true;
      const timeMs = this.elapsedMs();
      const rank = calculateStageRank(timeMs, this.player.getDamageTaken(), this.collectedScrolls.size);
      const save = SaveSystem.recordStage1Clear(timeMs, rank, Array.from(this.collectedScrolls));
      this.scene.start(SceneKey.StageClear, {
        timeMs,
        rank,
        scrollsFound: this.collectedScrolls.size,
        damageTaken: this.player.getDamageTaken(),
        bestTimeMs: save.stage1.bestTimeMs
      });
    }
  }

  private resolveObjective(): string {
    const x = this.player.getPosition().x;
    if (!this.warden.dead && x > Stage1Data.warden.arena.x - 100) return 'Defeat Lantern Warden';
    if (this.warden.dead) return 'Enter the Moon Gate';
    if (x < 1200) return 'Reach the sign shaft';
    if (x < 3400) return 'Cross the rooftops';
    if (x < 4920) return 'Survive the thorn run';
    return 'Rest before the Warden';
  }

  private createPauseOverlay(): void {
    const panel = this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, ArtAssetKey.TitleMenuPanel).setScale(1.02).setDepth(100).setScrollFactor(0);
    const title = this.add.text(372, 202, 'PAUSED', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '42px',
      color: PaletteHex.neonCyan
    }).setDepth(101).setScrollFactor(0);
    const body = this.add.text(318, 284, 'Esc/P: resume   R/Enter: retry checkpoint   T: restart', {
      fontFamily: 'Consolas, monospace',
      fontSize: '16px',
      color: PaletteHex.warmPaper
    }).setDepth(101).setScrollFactor(0);
    this.pauseObjects = [panel, title, body];
    this.pauseObjects.forEach((object) => (object as unknown as { setVisible: (value: boolean) => void }).setVisible(false));
  }

  private setPaused(value: boolean): void {
    this.paused = value;
    this.pauseObjects.forEach((object) => (object as unknown as { setVisible: (value: boolean) => void }).setVisible(value));
  }

  private showGameOver(): void {
    this.gameOver = true;
    this.setPaused(true);
    const text = this.pauseObjects[1] as Phaser.GameObjects.Text;
    text.setText('GAME OVER').setColor(PaletteHex.enemyVermilion);
  }

  private retryCheckpoint(): void {
    this.gameOver = false;
    this.player.retryCheckpoint();
    this.setPaused(false);
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

  private publishQaState(): void {
    const player = this.player?.getRuntimeState();
    const section = player ? getSectionForX(player.x) : Stage1Data.sections[0];
    window.__NEON_RONIN_STAGE1__ = {
      scene: 'Stage1Scene',
      stageClear: false,
      section: section.name,
      player,
      checkpointCount: this.activatedCheckpoints.size,
      scrollsFound: this.collectedScrolls.size,
      sealsFound: this.collectedSeals.size,
      warden: this.warden?.getHp(),
      wardenDefeated: this.warden?.dead === true,
      moonGateActive: this.warden?.dead === true,
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

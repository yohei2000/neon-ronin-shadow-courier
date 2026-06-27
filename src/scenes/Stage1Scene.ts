import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { Palette, PaletteHex } from '../config/palette';
import { ArtAssetKey } from '../data/artAssets';
import { Stage1Data, getSectionForX, type RectData, type Stage1Hazard, type Stage1Pickup, type Stage1Scroll, type Stage1Seal } from '../data/stage1';
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
  readonly image: Phaser.GameObjects.Image;
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
  private hazardVisuals: (Stage1Hazard & { readonly image: Phaser.GameObjects.Image })[] = [];
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
  private parallaxLayers: Phaser.GameObjects.TileSprite[] = [];

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

    this.updateParallax();
    const slash = this.player.update(input, Stage1Data.platforms, time, delta);
    const playerPosition = this.player.getPosition();
    for (const enemy of this.enemies) {
      enemy.update(delta, playerPosition.x, playerPosition.y);
    }
    this.warden.update(delta, playerPosition.x);

    this.resolveCombat(slash, time);
    this.resolveEnemyContact(time);
    this.resolveHazards(time);
    this.resolveCheckpoints(time);
    this.resolveCollectibles();
    this.resolveMoonGate();

    if (this.player.isDead()) {
      this.showGameOver();
    }

    this.cameraController.update(playerPosition, delta);
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
    const keys = [
      ArtAssetKey.LayerFarSky,
      ArtAssetKey.LayerDistantSkyline,
      ArtAssetKey.LayerMidRoofsSigns,
      ArtAssetKey.LayerGameplay,
      ArtAssetKey.LayerNearProps,
      ArtAssetKey.LayerNearPropsFront,
      ArtAssetKey.LayerForegroundOcclusion
    ];
    keys.forEach((key, index) => {
      const layer = this.add.tileSprite(0, 0, BASE_WIDTH, BASE_HEIGHT, key).setOrigin(0).setDepth(index).setScrollFactor(0);
      layer.setAlpha([1, 0.86, 0.78, 0.74, 0.42, 0.32, 0.22][index] ?? 0.6);
      this.parallaxLayers.push(layer);
    });
    this.add.tileSprite(Stage1Data.worldWidth / 2, 676, Stage1Data.worldWidth, 360, ArtAssetKey.LayerDistantSkyline).setAlpha(0.24).setDepth(1);
    this.add.image(512, 300, ArtAssetKey.LightingWarmCool).setAlpha(0.24).setDepth(4).setScrollFactor(0);
  }

  private drawStageGeometry(): void {
    for (const platform of Stage1Data.platforms) {
      const tile = this.add
        .tileSprite(platform.x + platform.width / 2, platform.y + platform.height / 2, platform.width, platform.height, ArtAssetKey.LayerGameplay)
        .setDepth(12)
        .setAlpha(0.78);
      tile.tilePositionX = platform.x * 0.18;
      if (platform.height <= 30) {
        tile.setTint(Palette.neonCyan);
        tile.setAlpha(0.50);
      }
    }

    for (const checkpoint of Stage1Data.checkpoints) {
      this.add.image(checkpoint.x + checkpoint.width / 2, checkpoint.y + checkpoint.height / 2, ArtAssetKey.TitleMenuPanel).setScale(0.16).setDepth(15);
      this.add.text(checkpoint.x - 16, checkpoint.y - 18, 'SAVE', {
        fontFamily: 'Consolas, monospace',
        fontSize: '10px',
        color: PaletteHex.lanternGold
      }).setDepth(16);
    }

    for (const hazard of Stage1Data.hazards) {
      const key = hazard.type === 'timed-spark' ? ArtAssetKey.Telegraph : ArtAssetKey.Slash;
      const image = this.add
        .image(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, key)
        .setDisplaySize(hazard.width + 34, hazard.height + 20)
        .setTint(hazard.type === 'fall-pit' ? Palette.neonMagenta : Palette.enemyVermilion)
        .setAlpha(hazard.type === 'fall-pit' ? 0.26 : 0.68)
        .setDepth(18);
      this.hazardVisuals.push({ ...hazard, image });
    }

    this.add.image(Stage1Data.moonGate.x + 10, Stage1Data.moonGate.y + 56, ArtAssetKey.LightingMoonlight).setDisplaySize(220, 240).setAlpha(0.35).setDepth(14);
    this.add.image(Stage1Data.moonGate.x + 8, Stage1Data.moonGate.y + 58, ArtAssetKey.TitleMenuPanel).setScale(0.36).setDepth(19);
  }

  private createCollectibles(): void {
    this.sealVisuals = Stage1Data.collectibles.seals.map((seal) => this.createCollectible(seal, 24, 24, ArtAssetKey.UiKit, Palette.lanternGold));
    this.scrollVisuals = Stage1Data.collectibles.scrolls.map((scroll) => this.createCollectible(scroll, 44, 30, ArtAssetKey.BrushKit, Palette.neonCyan));
    this.pickupVisuals = Stage1Data.collectibles.pickups.map((pickup) => ({
      ...this.createCollectible(pickup, 34, 34, ArtAssetKey.UiKit, pickup.type === 'health' ? Palette.dangerCoral : Palette.neonMagenta),
      type: pickup.type
    }));
  }

  private createCollectible(item: Stage1Seal | Stage1Scroll | Stage1Pickup, width: number, height: number, key: ArtAssetKey, tint: number): CollectibleVisual {
    const image = this.add.image(item.x, item.y, key).setDisplaySize(width, height).setTint(tint).setDepth(20);
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
        enemy.takeHit(1);
        this.lastEnemyHitMs.set(enemy.id, nowMs);
        this.cameras.main.shake(SaveSystem.load().settings.reducedShake ? 20 : 45, 0.002);
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
    this.parallaxLayers.forEach((layer, index) => {
      layer.tilePositionX = this.cameras.main.scrollX * [0.05, 0.10, 0.16, 0.24, 0.30, 0.36, 0.42][index];
      layer.tilePositionY = this.cameras.main.scrollY * [0.02, 0.03, 0.04, 0.05, 0.05, 0.06, 0.08][index];
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
      touch: { visible: this.touchControls?.isVisible() === true },
      e2eIntegrity: {
        debugTeleport: false,
        hiddenClearStageCall: false
      }
    };
  }
}

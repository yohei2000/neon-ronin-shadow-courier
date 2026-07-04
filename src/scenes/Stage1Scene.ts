import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { SceneKey } from '../config/keys';
import { Palette, PaletteHex } from '../config/palette';
import { Stage1SfxKey } from '../data/audioAssets';
import { ArtAssetKey, RuntimeEnvironmentAssetKey, RuntimeItemFrame, RuntimeSpriteAssetKey, RuntimeStage1LandformFrameCount } from '../data/artAssets';
import {
  Stage1CollisionPlatforms,
  Stage1Data,
  Stage1Tuning,
  getSectionForX,
  type RectData,
  type Stage1Gimmick,
  type Stage1Hazard,
  type Stage1Pickup,
  type Stage1Scroll,
  type Stage1Seal
} from '../data/stage1';
import { InkCrawler } from '../entities/InkCrawler';
import { KiteWraith } from '../entities/KiteWraith';
import { LanternWarden } from '../entities/LanternWarden';
import { Player, type PlayerActionEvent } from '../entities/Player';
import type { StageEnemy } from '../entities/types';
import { CameraController } from '../systems/CameraController';
import { CombatSystem, type SlashState } from '../systems/CombatSystem';
import { InputSystem } from '../systems/InputSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { Stage1Audio } from '../systems/Stage1Audio';
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
  private audio!: Stage1Audio;
  private hud!: Hud;
  private enemies: StageEnemy[] = [];
  private warden!: LanternWarden;
  private sealVisuals: CollectibleVisual[] = [];
  private scrollVisuals: CollectibleVisual[] = [];
  private pickupVisuals: (CollectibleVisual & { readonly type: Stage1Pickup['type'] })[] = [];
  private hazardVisuals: (Stage1Hazard & { readonly image: Phaser.GameObjects.Sprite })[] = [];
  private gimmickVisuals: (Stage1Gimmick & { readonly image: Phaser.GameObjects.Sprite })[] = [];
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
    this.audio = new Stage1Audio(this, save.settings);
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
    const playerFrame = this.player.update(input, Stage1CollisionPlatforms, time, gameplayDelta);
    this.playPlayerActionSfx(playerFrame.events);
    const slash = playerFrame.slash;
    if (!this.warden.dead && this.player.getPosition().x > Stage1Data.warden.arena.x + Stage1Data.warden.arena.width - 92) {
      this.player.constrainRight(Stage1Data.warden.arena.x + Stage1Data.warden.arena.width - 92);
    }
    const playerPosition = this.player.getPosition();
    for (const enemy of this.enemies) {
      enemy.update(gameplayDelta, playerPosition.x, playerPosition.y);
    }
    this.warden.update(gameplayDelta, playerPosition.x, playerPosition.y);

    this.resolveCombat(slash, time);
    this.resolveEnemyContact(time);
    this.resolveHazards(time);
    this.resolveGimmicks(time);
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
      sealsTotal: Stage1Data.collectibles.seals.length,
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
    this.drawVisualTerrain();

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

    for (const gimmick of Stage1Data.gimmicks) {
      const image = this.add
        .sprite(gimmick.x + gimmick.width / 2, gimmick.y + gimmick.height / 2, RuntimeSpriteAssetKey.Telegraph, 1)
        .setDisplaySize(gimmick.width + 42, gimmick.height + 26)
        .setTint(Palette.neonCyan)
        .setAlpha(0.36)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(17);
      this.gimmickVisuals.push({ ...gimmick, image });
    }

    this.add.image(Stage1Data.moonGate.x + 10, Stage1Data.moonGate.y + 56, ArtAssetKey.LightingMoonlight).setDisplaySize(220, 240).setAlpha(0.35).setDepth(14);
    this.add.image(Stage1Data.moonGate.x + 16, Stage1Data.moonGate.y + 42, RuntimeEnvironmentAssetKey.MoonGate).setDisplaySize(246, 230).setDepth(19);
    this.drawCollisionDebugOverlay();
  }

  private drawVisualTerrain(): void {
    for (const plate of Stage1Data.visualTerrain.plates) {
      this.add.image(plate.x, plate.y, plate.assetKey).setOrigin(0).setDisplaySize(plate.width, plate.height).setDepth(plate.depth).setAlpha(plate.alpha);
    }
    const params = new URLSearchParams(window.location.search);
    const showLandformAuthoring = params.get('debug') === 'landforms' || params.get('debugLandforms') === '1';
    // Normal play uses the painted terrain plates; landform sprites are authoring references for collider review.
    if (!showLandformAuthoring) return;

    for (const landform of Stage1Data.visualTerrain.landforms) {
      this.add
        .sprite(landform.x, landform.y, RuntimeEnvironmentAssetKey.Stage1Landforms, landform.frame % RuntimeStage1LandformFrameCount)
        .setOrigin(0)
        .setDisplaySize(landform.width, landform.height)
        .setDepth(landform.depth)
        .setAlpha(landform.alpha)
        .setFlipX(landform.flipX);
    }
  }

  private drawCollisionDebugOverlay(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') !== 'collision' && params.get('debugCollision') !== '1') return;

    for (const platform of Stage1Data.platforms) {
      const tile = this.add
        .tileSprite(
          platform.x + platform.width / 2,
          platform.y + platform.height / 2,
          platform.width,
          platform.height,
          RuntimeEnvironmentAssetKey.PlatformThinTile
        )
        .setDepth(70)
        .setAlpha(0.5)
        .setTint(Palette.neonCyan)
        .setBlendMode(Phaser.BlendModes.ADD);
      tile.tilePositionX = platform.x * 0.2;
    }

    for (const collider of Stage1Data.visualTerrain.landformColliders) {
      const tile = this.add
        .tileSprite(
          collider.x + collider.width / 2,
          collider.y + collider.height / 2,
          collider.width,
          collider.height,
          RuntimeEnvironmentAssetKey.PlatformThinTile
        )
        .setDepth(70)
        .setAlpha(0.42)
        .setTint(Palette.lanternGold)
        .setBlendMode(Phaser.BlendModes.ADD);
      tile.tilePositionX = collider.x * 0.25;
    }

    for (const hazard of Stage1Data.hazards) {
      this.add
        .tileSprite(
          hazard.x + hazard.width / 2,
          hazard.y + hazard.height / 2,
          hazard.width,
          hazard.height,
          RuntimeEnvironmentAssetKey.PlatformThinTile
        )
        .setDepth(71)
        .setAlpha(0.55)
        .setTint(Palette.enemyVermilion)
        .setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private createCollectibles(): void {
    this.sealVisuals = Stage1Data.collectibles.seals.map((seal) => this.createCollectible(seal, 28, 22, RuntimeItemFrame.Seal, null));
    this.scrollVisuals = Stage1Data.collectibles.scrolls.map((scroll) => this.createCollectible(scroll, 50, 32, RuntimeItemFrame.Scroll, null, 82, 58));
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

  private createCollectible(
    item: Stage1Seal | Stage1Scroll | Stage1Pickup,
    width: number,
    height: number,
    frame: number,
    tint: number | null,
    bodyWidth = width,
    bodyHeight = height
  ): CollectibleVisual {
    const image = this.add
      .sprite(item.x, item.y, RuntimeEnvironmentAssetKey.ItemIcons, frame)
      .setDisplaySize(width, height)
      .setDepth(20);
    if (tint !== null) image.setTint(tint);
    return {
      id: item.id,
      body: centerRect(item.x, item.y, bodyWidth, bodyHeight),
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
          this.audio.play(Stage1SfxKey.EnemyDefeat, {
            volume: enemy.kind === 'lantern-warden' ? 1 : 0.82,
            detune: enemy.kind === 'kite-wraith' ? 160 : enemy.kind === 'lantern-warden' ? -260 : 0
          });
          this.cameras.main.shake(SaveSystem.load().settings.reducedShake ? 20 : 45, 0.002);
        }
      }
    }
  }

  private resolveEnemyContact(nowMs: number): void {
    const body = this.player.getBody();
    for (const enemy of this.enemies) {
      if (!enemy.dead && rectsOverlap(body, enemy.getBody())) {
        const enemyBody = enemy.getBody();
        if (this.player.takeDamage(enemy.damage, nowMs, 'enemy-contact', enemyBody.x + enemyBody.width / 2, enemy.id)) {
          this.audio.play(Stage1SfxKey.PlayerHurt);
        }
      }
    }
    for (const attack of this.warden.getAttackRects()) {
      if (rectsOverlap(body, attack)) {
        if (this.player.takeDamage(1, nowMs, 'warden-attack', attack.x + attack.width / 2, 'lantern-warden')) {
          this.audio.play(Stage1SfxKey.PlayerHurt);
        }
      }
    }
  }

  private resolveHazards(nowMs: number): void {
    const body = this.player.getBody();
    for (const hazard of this.hazardVisuals) {
      const active = this.isHazardActive(hazard, nowMs);
      hazard.image.setAlpha(active ? (hazard.type === 'fall-pit' ? 0.30 : 0.78) : 0.24);
      if (active && rectsOverlap(body, hazard)) {
        if (this.player.takeDamage(hazard.damage, nowMs, hazard.type === 'fall-pit' ? 'fall' : 'hazard', hazard.x + hazard.width / 2, hazard.id)) {
          this.audio.play(Stage1SfxKey.PlayerHurt);
        }
        if (hazard.type === 'fall-pit') this.player.respawnAtCheckpoint();
      }
    }
  }

  private isHazardActive(hazard: Stage1Hazard, nowMs: number): boolean {
    return hazard.type !== 'timed-spark' || Math.sin(nowMs / 280) > -0.25;
  }

  private resolveGimmicks(nowMs: number): void {
    const body = this.player.getBody();
    for (const gimmick of this.gimmickVisuals) {
      const pulse = 0.36 + Math.sin(nowMs / 180 + gimmick.x * 0.01) * 0.14;
      gimmick.image.setAlpha(pulse).setAngle(Math.sin(nowMs / 260 + gimmick.x * 0.006) * 3);
      if (gimmick.type === 'updraft-vent' && rectsOverlap(body, gimmick)) {
        this.player.applyUpdraft(gimmick.strength);
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
        this.audio.play(Stage1SfxKey.Checkpoint);
      }
    }
  }

  private resolveCollectibles(): void {
    const body = this.player.getBody();
    this.collect(this.sealVisuals, this.collectedSeals, body, Stage1SfxKey.PickupSeal);
    this.collect(this.scrollVisuals, this.collectedScrolls, body, Stage1SfxKey.PickupScroll);
    for (const pickup of this.pickupVisuals) {
      if (this.collectedPickups.has(pickup.id) || !rectsOverlap(body, pickup.body)) continue;
      this.collectedPickups.add(pickup.id);
      pickup.image.setVisible(false);
      this.audio.play(pickup.type === 'health' ? Stage1SfxKey.PickupHealth : Stage1SfxKey.PickupEnergy);
      if (pickup.type === 'health') this.player.heal(5);
    }
  }

  private collect(visuals: readonly CollectibleVisual[], target: Set<string>, body: RectData, sfxKey: Stage1SfxKey): void {
    for (const visual of visuals) {
      if (target.has(visual.id) || !rectsOverlap(body, visual.body)) continue;
      const detune = sfxKey === Stage1SfxKey.PickupSeal ? Math.min(420, target.size * 18) : 0;
      target.add(visual.id);
      visual.image.setVisible(false);
      this.audio.play(sfxKey, { detune });
    }
  }

  private resolveMoonGate(): void {
    if (this.completed || !this.warden.dead) return;
    if (rectsOverlap(this.player.getBody(), Stage1Data.moonGate)) {
      this.completed = true;
      const timeMs = this.elapsedMs();
      const rank = calculateStageRank(timeMs, this.player.getDamageTaken(), this.collectedSeals.size);
      const save = SaveSystem.recordStage1Clear(timeMs, rank, Array.from(this.collectedScrolls));
      this.audio.play(Stage1SfxKey.StageClear);
      this.scene.start(SceneKey.StageClear, {
        timeMs,
        rank,
        scrollsFound: this.collectedScrolls.size,
        sealsFound: this.collectedSeals.size,
        sealsTotal: Stage1Data.collectibles.seals.length,
        damageTaken: this.player.getDamageTaken(),
        bestTimeMs: save.stage1.bestTimeMs
      });
    }
  }

  private resolveObjective(): string {
    const x = this.player.getPosition().x;
    if (!this.warden.dead && x > Stage1Data.warden.arena.x - 100) return 'Defeat Lantern Warden';
    if (this.warden.dead) return 'Enter the Moon Gate';
    if (x < 1600) return 'Practice the first cut';
    if (x < 3200) return 'Ride the neon sign lift';
    if (x < 5600) return 'Clear the rooftop hazard line';
    if (x < Stage1Data.safeRestBeforeMiniboss.x) return 'Climb the Neon Thorn updraft';
    return 'Rest before the Warden';
  }

  private playPlayerActionSfx(events: readonly PlayerActionEvent[]): void {
    for (const event of events) {
      if (event === 'jump') this.audio.play(Stage1SfxKey.Jump);
      if (event === 'speedFlipJump') this.audio.play(Stage1SfxKey.Jump, { detune: 180, volume: 0.68 });
      if (event === 'wallKick') this.audio.play(Stage1SfxKey.WallKick);
      if (event === 'attack') this.audio.play(Stage1SfxKey.Attack);
      if (event === 'spinAttack') this.audio.play(Stage1SfxKey.SpinAttack);
      if (event === 'hurt') this.audio.play(Stage1SfxKey.PlayerHurt);
    }
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
      enemies: this.enemies.map((enemy) => enemy.getRuntimeState()),
      warden: this.warden?.getHp(),
      wardenDefeated: this.warden?.dead === true,
      moonGateActive: this.warden?.dead === true,
      paused: this.paused,
      gameOver: this.gameOver,
      touch: { visible: this.touchControls?.isVisible() === true, buttons: this.inputSystem?.getTouchButtons() },
      visualTerrain: {
        plates: Stage1Data.visualTerrain.plates.length,
        landforms: Stage1Data.visualTerrain.landforms.length,
        landformFrames: new Set(Stage1Data.visualTerrain.landforms.map((landform) => landform.frame)).size,
        landformColliders: Stage1Data.visualTerrain.landformColliders.length
      },
      e2eIntegrity: {
        debugTeleport: false,
        hiddenClearStageCall: false
      }
    };
  }
}

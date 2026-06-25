import * as Phaser from 'phaser';
import { BASE_HEIGHT, TILE_SIZE } from '../config/dimensions';
import { AudioKey, SceneKey, TextureKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { BossBalance, PlayerBalance } from '../data/balance';
import { getLevel } from '../data/levels';
import { Boss } from '../entities/Boss';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { applyDamageAssist, checkpointHealAmount } from '../systems/AssistSystem';
import { FXSystem } from '../systems/FXSystem';
import { InputSystem } from '../systems/InputSystem';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { SaveSystem } from '../systems/SaveSystem';
import { TouchControls } from '../systems/TouchControls';
import type { GameSceneData, StageClearSceneData } from '../types/flow';
import type { AbilityId, StageId, StageTheme } from '../types/game';
import type { LevelDefinition } from '../types/levels';
import { formatTime, rankStage, toWorld } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

type StaticImage = Phaser.Physics.Arcade.Image;

export class GameScene extends Phaser.Scene {
  private stageId: StageId = 1;
  private requestedCheckpointIndex = 0;
  private level!: LevelDefinition;
  private saveSystem!: SaveSystem;
  private inputSystem!: InputSystem;
  private fx!: FXSystem;
  private player!: Player;
  private solidGroup!: Phaser.Physics.Arcade.StaticGroup;
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup;
  private checkpointGroup!: Phaser.Physics.Arcade.StaticGroup;
  private scrollGroup!: Phaser.Physics.Arcade.Group;
  private pickupGroup!: Phaser.Physics.Arcade.Group;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private windGroup!: Phaser.Physics.Arcade.StaticGroup;
  private gateGroup!: Phaser.Physics.Arcade.StaticGroup;
  private boss: Boss | null = null;
  private bossWall: Phaser.GameObjects.Rectangle | null = null;
  private enemies: Enemy[] = [];
  private collectedScrolls = new Set<string>();
  private seals = 0;
  private damageTaken = 0;
  private defeats = 0;
  private currentCheckpointIndex = 0;
  private startedAt = 0;
  private clearTriggered = false;
  private bossStarted = false;
  private hudText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private bossBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SceneKey.Game);
  }

  init(data: GameSceneData): void {
    this.stageId = data.stageId ?? 1;
    this.requestedCheckpointIndex = data.checkpointIndex ?? 0;
  }

  create(): void {
    markSceneStatus(SceneKey.Game);
    this.saveSystem = getSaveSystem(this);
    const audio = getAudioSystem(this);
    this.level = getLevel(this.stageId);
    this.saveSystem.unlockAbility(this.level.unlockAbility ?? 'wallKick');
    this.collectedScrolls = new Set(this.saveSystem.data.stageStats[this.stageId].scrolls);
    this.seals = 0;
    this.damageTaken = 0;
    this.defeats = 0;
    this.clearTriggered = false;
    this.bossStarted = false;
    this.enemies = [];
    this.physics.world.setBounds(0, 0, this.level.width * TILE_SIZE, this.level.height * TILE_SIZE + 420);
    this.drawBackground();
    this.createGroups();
    this.createTerrain();
    this.createPlatforms();
    this.createCollectibles();
    this.createEnemies();
    const checkpoint = this.getCheckpointWorld(this.requestedCheckpointIndex);
    this.currentCheckpointIndex = this.requestedCheckpointIndex;
    this.player = new Player(this, checkpoint.x, checkpoint.y, audio);
    this.createBoss();
    this.createColliders();
    this.cameras.main.setBounds(0, 0, this.level.width * TILE_SIZE, BASE_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.1, -80, 80);
    this.fx = new FXSystem(this, () => this.saveSystem.data.settings);
    const touch = new TouchControls(this, this.saveSystem.data.settings);
    this.inputSystem = new InputSystem(this, touch);
    this.createHud();
    this.createTutorialPrompt();
    this.startedAt = this.time.now;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputSystem?.destroy();
    });
  }

  update(time: number, delta: number): void {
    const input = this.inputSystem.sample();
    if (input.pause.pressed) {
      this.scene.pause();
      this.scene.launch(SceneKey.Pause);
      return;
    }
    const abilities = new Set(this.saveSystem.data.unlockedAbilities);
    const intent = this.player.updatePlayer(input, time, delta, abilities, this.saveSystem.data.settings);
    if (intent.slash || intent.chargedSlash) {
      this.performSlash(intent.chargedSlash);
    }
    if (intent.projectile) {
      this.spawnPlayerProjectile(false);
    }
    if (intent.ultimate) {
      this.performUltimate();
    }
    this.enemies = this.enemies.filter((enemy) => enemy.active);
    for (const enemy of this.enemies) {
      enemy.updateEnemy(time, this.player, this.enemyProjectiles);
    }
    this.updateProjectiles(time);
    this.updateBoss(time);
    this.applyWind();
    this.checkFall(time);
    this.updateHud();
    if (this.player.isDead() && !this.clearTriggered) {
      this.clearTriggered = true;
      this.time.delayedCall(650, () => {
        this.scene.start(SceneKey.GameOver, {
          stageId: this.stageId,
          checkpointIndex: this.currentCheckpointIndex
        });
      });
    }
  }

  restartFromCheckpoint(): void {
    this.scene.restart({ stageId: this.stageId, checkpointIndex: this.currentCheckpointIndex });
  }

  restartStage(): void {
    this.scene.restart({ stageId: this.stageId, checkpointIndex: 0 });
  }

  resumeFromPause(): void {
    this.cameras.main.flash(80, 38, 248, 255, false);
  }

  private createGroups(): void {
    this.solidGroup = this.physics.add.staticGroup();
    this.hazardGroup = this.physics.add.staticGroup();
    this.checkpointGroup = this.physics.add.staticGroup();
    this.scrollGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.pickupGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.enemyGroup = this.physics.add.group();
    this.playerProjectiles = this.physics.add.group({ allowGravity: false });
    this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
    this.windGroup = this.physics.add.staticGroup();
    this.gateGroup = this.physics.add.staticGroup();
  }

  private drawBackground(): void {
    const themeColor = this.themeColor(this.level.theme);
    this.cameras.main.setBackgroundColor(Palette.ink0);
    const far = this.add.graphics().setScrollFactor(0.15).setDepth(-20);
    far.fillStyle(Palette.ink1, 1);
    far.fillRect(0, 0, this.level.width * TILE_SIZE, BASE_HEIGHT);
    far.fillStyle(Palette.moon, 0.78);
    far.fillCircle(760, 96, 46);
    far.lineStyle(2, themeColor, 0.22);
    for (let x = -40; x < this.level.width * TILE_SIZE; x += 120) {
      far.lineBetween(x, 360 + Math.sin(x / 30) * 12, x + 82, 235);
    }
    const near = this.add.graphics().setScrollFactor(0.45).setDepth(-10);
    near.fillStyle(themeColor, 0.1);
    for (let x = 0; x < this.level.width * TILE_SIZE; x += 96) {
      near.fillRect(x, 300 + ((x / 96) % 3) * 22, 42, 180);
    }
  }

  private createTerrain(): void {
    const tileTexture = this.tileTexture(this.level.theme);
    this.level.tiles.forEach((row, y) => {
      [...row].forEach((symbol, x) => {
        const worldX = toWorld(x, TILE_SIZE);
        const worldY = toWorld(y, TILE_SIZE);
        if (symbol === '#') {
          const tile = this.physics.add.staticImage(worldX, worldY, tileTexture);
          this.solidGroup.add(tile);
        } else if (symbol === '^') {
          const hazard = this.physics.add.staticImage(worldX, worldY, TextureKey.Hazard);
          hazard.setData('damage', 1);
          this.hazardGroup.add(hazard);
        } else if (symbol === 'G') {
          const gate = this.physics.add.staticImage(worldX, worldY - 22, TextureKey.GoalGate);
          gate.setData('goal', true);
          this.gateGroup.add(gate);
        } else if (symbol === 'B') {
          const marker = this.add.rectangle(worldX, worldY, 26, 86, Palette.magenta, 0.18);
          marker.setStrokeStyle(2, Palette.magenta, 0.65);
        }
      });
    });
    for (const checkpoint of this.level.checkpoints) {
      const shrine = this.physics.add.staticImage(toWorld(checkpoint.x), toWorld(checkpoint.y) - 18, TextureKey.Checkpoint);
      shrine.setData('index', this.level.checkpoints.indexOf(checkpoint));
      this.checkpointGroup.add(shrine);
    }
  }

  private createPlatforms(): void {
    for (const platform of this.level.oneWayPlatforms) {
      for (let x = platform.x; x < platform.x + platform.width; x += 1) {
        const tile = this.physics.add.staticImage(toWorld(x), toWorld(platform.y), TextureKey.OneWay);
        this.solidGroup.add(tile);
      }
    }
    for (const platform of this.level.fallingPlatforms) {
      for (let x = platform.x; x < platform.x + platform.width; x += 1) {
        const tile = this.physics.add.staticImage(toWorld(x), toWorld(platform.y), TextureKey.FallingPlatform);
        tile.setData('falling', true);
        this.solidGroup.add(tile);
      }
    }
    for (const platform of this.level.movingPlatforms) {
      const image = this.physics.add.image(platform.x, platform.y, TextureKey.MovingPlatform);
      image.setDisplaySize(platform.width * TILE_SIZE, 18);
      image.setImmovable(true);
      image.setData('moving', true);
      const body = image.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(platform.width * TILE_SIZE, 18);
      this.solidGroup.add(image);
      this.tweens.add({
        targets: image,
        x: platform.x + platform.travelX,
        y: platform.y + platform.travelY,
        yoyo: true,
        repeat: -1,
        duration: platform.durationMs,
        ease: 'Sine.easeInOut'
      });
    }
    for (const zone of this.level.windZones) {
      const wind = this.add.rectangle(
        toWorld(zone.x + zone.width / 2 - 0.5),
        toWorld(zone.y + zone.height / 2 - 0.5),
        zone.width * TILE_SIZE,
        zone.height * TILE_SIZE,
        Palette.green,
        0.08
      );
      wind.setStrokeStyle(2, Palette.green, 0.28);
      this.physics.add.existing(wind, true);
      this.windGroup.add(wind);
    }
  }

  private createCollectibles(): void {
    for (const scroll of this.level.scrolls) {
      if (this.collectedScrolls.has(scroll.id)) {
        continue;
      }
      const sprite = this.physics.add.image(scroll.x, scroll.y, TextureKey.Scroll);
      sprite.setData('kind', 'scroll');
      sprite.setData('id', scroll.id);
      this.scrollGroup.add(sprite);
    }
    for (const pickup of this.level.pickups) {
      const texture =
        pickup.type === 'health' ? TextureKey.Health : pickup.type === 'energy' ? TextureKey.Energy : TextureKey.Seal;
      const sprite = this.physics.add.image(pickup.x, pickup.y, texture);
      sprite.setData('kind', pickup.type);
      sprite.setData('id', pickup.id);
      this.pickupGroup.add(sprite);
    }
  }

  private createEnemies(): void {
    for (const spawn of this.level.enemies) {
      this.addEnemy(spawn.type, spawn.x, spawn.y, spawn.patrol ?? 4);
    }
  }

  private addEnemy(type: Enemy['enemyType'], x: number, y: number, patrol: number): Enemy {
    const enemy = new Enemy(this, type, x, y, patrol);
    this.enemies.push(enemy);
    this.enemyGroup.add(enemy);
    return enemy;
  }

  private createBoss(): void {
    if (!this.level.boss) {
      return;
    }
    this.boss = new Boss(this, this.level.boss);
  }

  private createColliders(): void {
    this.physics.add.collider(this.player, this.solidGroup, (_playerObject, platformObject) => {
      const platform = platformObject as StaticImage;
      if (platform.getData('falling')) {
        this.triggerFallingPlatform(platform);
      }
    });
    this.physics.add.collider(this.enemyGroup, this.solidGroup);
    this.physics.add.collider(this.playerProjectiles, this.solidGroup, (projectileObject) => {
      projectileObject.destroy();
    });
    this.physics.add.collider(this.enemyProjectiles, this.solidGroup, (projectileObject) => {
      projectileObject.destroy();
    });
    this.physics.add.overlap(this.player, this.checkpointGroup, (_playerObject, checkpointObject) => {
      const checkpoint = checkpointObject as StaticImage;
      this.activateCheckpoint(Number(checkpoint.getData('index') ?? 0));
    });
    this.physics.add.overlap(this.player, this.scrollGroup, (_playerObject, scrollObject) => {
      this.collectScroll(scrollObject as Phaser.Physics.Arcade.Image);
    });
    this.physics.add.overlap(this.player, this.pickupGroup, (_playerObject, pickupObject) => {
      this.collectPickup(pickupObject as Phaser.Physics.Arcade.Image);
    });
    this.physics.add.overlap(this.player, this.hazardGroup, (_playerObject, hazardObject) => {
      this.damagePlayer(Number((hazardObject as StaticImage).getData('damage') ?? 1), hazardObject as StaticImage);
    });
    this.physics.add.overlap(this.player, this.enemyGroup, (_playerObject, enemyObject) => {
      const enemy = enemyObject as Enemy;
      this.damagePlayer(enemy.contactDamage, enemy);
    });
    this.physics.add.overlap(this.player, this.enemyProjectiles, (_playerObject, projectileObject) => {
      const projectile = projectileObject as Projectile;
      if (this.damagePlayer(projectile.damage, projectile)) {
        projectile.destroy();
      }
    });
    this.physics.add.overlap(this.player, this.gateGroup, () => this.tryStageClear());
  }

  private triggerFallingPlatform(platform: StaticImage): void {
    if (platform.getData('triggered')) {
      return;
    }
    platform.setData('triggered', true);
    this.tweens.add({
      targets: platform,
      alpha: 0.45,
      yoyo: true,
      repeat: 2,
      duration: 90
    });
    this.time.delayedCall(420, () => {
      platform.disableBody(true, true);
      this.time.delayedCall(2200, () => {
        if (platform.scene) {
          platform.enableBody(false, platform.x, platform.y, true, true);
          platform.setAlpha(1);
          platform.setData('triggered', false);
        }
      });
    });
  }

  private activateCheckpoint(index: number): void {
    if (index < this.currentCheckpointIndex) {
      return;
    }
    if (index > this.currentCheckpointIndex) {
      this.fx.burst(this.player.x, this.player.y, Palette.gold, 18);
      getAudioSystem(this).play(AudioKey.Checkpoint);
    }
    this.currentCheckpointIndex = index;
    const heal = checkpointHealAmount(this.saveSystem.data.settings);
    if (heal > 0) {
      this.player.heal(heal);
      this.player.restoreEnergy(12);
    }
  }

  private collectScroll(sprite: Phaser.Physics.Arcade.Image): void {
    const id = String(sprite.getData('id'));
    this.collectedScrolls.add(id);
    this.fx.burst(sprite.x, sprite.y, Palette.gold, 18);
    getAudioSystem(this).play(AudioKey.Pickup);
    sprite.destroy();
  }

  private collectPickup(sprite: Phaser.Physics.Arcade.Image): void {
    const kind = String(sprite.getData('kind'));
    if (kind === 'health') {
      this.player.heal(2);
    } else if (kind === 'energy') {
      this.player.restoreEnergy(35);
    } else {
      this.seals += 1;
    }
    this.fx.burst(sprite.x, sprite.y, kind === 'health' ? Palette.red : Palette.cyan, 10);
    getAudioSystem(this).play(AudioKey.Pickup);
    sprite.destroy();
  }

  private performSlash(charged: boolean): void {
    const width = charged ? 86 : 58;
    const height = charged ? 54 : 42;
    const x = this.player.x + this.player.facing * (width / 2 + 14);
    const y = this.player.y - 4;
    const hitbox = this.physics.add.image(x, y, TextureKey.Projectile);
    hitbox.setDisplaySize(width, height);
    hitbox.setAlpha(0.01);
    const body = hitbox.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.fx.slash(x, y, this.player.facing, charged);
    const hitEnemies = new Set<Enemy>();
    this.physics.add.overlap(hitbox, this.enemyGroup, (_hitboxObject, enemyObject) => {
      const enemy = enemyObject as Enemy;
      if (hitEnemies.has(enemy)) {
        return;
      }
      hitEnemies.add(enemy);
      const wasActive = enemy.active;
      if (enemy.applyDamage(charged ? 4 : 2, this.player.x, charged)) {
        this.fx.burst(enemy.x, enemy.y, Palette.magenta, charged ? 16 : 9);
        getAudioSystem(this).play(AudioKey.EnemyHit);
      }
      if (wasActive && !enemy.active) {
        this.defeats += 1;
        getAudioSystem(this).play(AudioKey.EnemyDefeat);
      }
    });
    if (this.boss) {
      this.physics.add.overlap(hitbox, this.boss, () => {
        this.damageBoss(charged ? 5 : 2);
      });
    }
    this.time.delayedCall(charged ? 160 : PlayerBalance.attackMs, () => hitbox.destroy());
  }

  private spawnPlayerProjectile(ultimateBoost: boolean): void {
    const projectile = new Projectile(this, {
      x: this.player.x + this.player.facing * 28,
      y: this.player.y - 6,
      velocityX: this.player.facing * (ultimateBoost ? 410 : 310),
      velocityY: 0,
      damage: ultimateBoost ? 4 : 2,
      friendly: true,
      lifetimeMs: 2200
    });
    this.playerProjectiles.add(projectile);
    this.physics.add.overlap(projectile, this.enemyGroup, (_projectileObject, enemyObject) => {
      const enemy = enemyObject as Enemy;
      const wasActive = enemy.active;
      if (enemy.applyDamage(projectile.damage, projectile.x, ultimateBoost)) {
        this.fx.burst(enemy.x, enemy.y, Palette.cyan, 8);
      }
      if (wasActive && !enemy.active) {
        this.defeats += 1;
      }
      projectile.destroy();
    });
    if (this.boss) {
      this.physics.add.overlap(projectile, this.boss, () => {
        this.damageBoss(projectile.damage);
        projectile.destroy();
      });
    }
  }

  private performUltimate(): void {
    getAudioSystem(this).play(AudioKey.BossPhase);
    this.fx.burst(this.player.x, this.player.y, Palette.gold, 36);
    this.fx.shake(0.009, 260);
    this.enemyProjectiles.clear(true, true);
    for (const enemy of this.enemies) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) <= 230) {
        const wasActive = enemy.active;
        enemy.applyDamage(6, this.player.x, true);
        if (wasActive && !enemy.active) {
          this.defeats += 1;
        }
      }
    }
    if (this.boss && this.boss.isFightActive()) {
      this.damageBoss(9);
    }
  }

  private damageBoss(amount: number): void {
    if (!this.boss || !this.boss.isFightActive()) {
      return;
    }
    const defeated = this.boss.damage(amount);
    this.fx.burst(this.boss.x, this.boss.y, Palette.gold, 10);
    if (defeated) {
      this.onBossDefeated();
    }
  }

  private updateProjectiles(time: number): void {
    for (const child of this.playerProjectiles.getChildren()) {
      if (child instanceof Projectile) {
        child.updateProjectile(time);
      }
    }
    for (const child of this.enemyProjectiles.getChildren()) {
      if (child instanceof Projectile) {
        child.updateProjectile(time);
      }
    }
  }

  private updateBoss(time: number): void {
    if (!this.boss || !this.level.boss) {
      return;
    }
    if (!this.bossStarted && this.player.x >= this.level.boss.triggerX) {
      this.startBoss(time);
    }
    this.boss.updateBoss(
      time,
      this.player,
      this.enemyProjectiles,
      (x, y) => this.addEnemy('ShadowCrawler', x, y, 2),
      (phase) => {
        this.fx.burst(this.boss?.x ?? this.player.x, this.boss?.y ?? this.player.y, Palette.magenta, 26);
        this.fx.shake(0.008, 220);
        getAudioSystem(this).play(AudioKey.BossPhase);
        this.promptText.setText(`Boss Phase ${phase}`);
        this.time.delayedCall(1200, () => this.promptText.setText(''));
      }
    );
  }

  private startBoss(time: number): void {
    if (!this.boss || !this.level.boss) {
      return;
    }
    this.bossStarted = true;
    this.boss.begin(time);
    this.fx.burst(this.boss.x, this.boss.y, Palette.magenta, 32);
    this.fx.shake(0.006, 200);
    const wallX = this.level.boss.arenaLeft;
    this.bossWall = this.add.rectangle(wallX, BASE_HEIGHT - 132, 24, 244, Palette.magenta, 0.25);
    this.bossWall.setStrokeStyle(3, Palette.magenta, 0.85);
    this.physics.add.existing(this.bossWall, true);
    this.physics.add.collider(this.player, this.bossWall);
    this.physics.add.overlap(this.player, this.boss, () => {
      this.damagePlayer(BossBalance.contactDamage, this.boss!);
    });
    this.promptText.setText(this.boss.bossName);
    this.time.delayedCall(1800, () => this.promptText.setText(''));
  }

  private onBossDefeated(): void {
    if (this.clearTriggered) {
      return;
    }
    this.clearTriggered = true;
    this.bossWall?.destroy();
    this.fx.burst(this.player.x + 120, this.player.y - 40, Palette.gold, 48);
    this.fx.shake(0.01, 380);
    const result = this.makeStageResult();
    this.saveSystem.completeStage(result);
    this.time.delayedCall(900, () => {
      this.scene.start(SceneKey.Ending, { result });
    });
  }

  private applyWind(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.physics.overlap(this.player, this.windGroup, () => {
      body.setVelocityY(body.velocity.y - 11);
      body.setVelocityX(body.velocity.x + 7);
    });
  }

  private checkFall(time: number): void {
    if (this.player.y < PlayerBalance.fallDeathY) {
      return;
    }
    const settings = this.saveSystem.data.settings;
    if (settings.assist.fallRescue) {
      this.damagePlayer(1, this.player);
      const point = this.getCheckpointWorld(this.currentCheckpointIndex);
      this.player.revive(point.x, point.y, false);
      this.fx.burst(point.x, point.y, Palette.cyan, 16);
    } else if (this.player.takeDamage(2, this.player.x, time, settings)) {
      this.damageTaken += applyDamageAssist(2, settings);
      const point = this.getCheckpointWorld(this.currentCheckpointIndex);
      this.player.revive(point.x, point.y, false);
    }
  }

  private damagePlayer(rawDamage: number, source: Phaser.GameObjects.Components.Transform): boolean {
    const settings = this.saveSystem.data.settings;
    const didDamage = this.player.takeDamage(rawDamage, source.x, this.time.now, settings);
    if (didDamage) {
      this.damageTaken += applyDamageAssist(rawDamage, settings);
      this.fx.burst(this.player.x, this.player.y, Palette.red, 10);
      this.fx.shake(0.005, 120);
    }
    return didDamage;
  }

  private tryStageClear(): void {
    if (this.clearTriggered) {
      return;
    }
    if (this.stageId === 5 && this.boss && this.boss.isFightActive()) {
      return;
    }
    if (this.stageId === 5 && this.level.boss && !this.saveSystem.data.hasClearedGame) {
      return;
    }
    this.clearTriggered = true;
    const result = this.makeStageResult();
    this.fx.burst(this.player.x, this.player.y, Palette.gold, 30);
    this.time.delayedCall(420, () => {
      this.scene.start(SceneKey.StageClear, result);
    });
  }

  private makeStageResult(): StageClearSceneData {
    const elapsedMs = this.time.now - this.startedAt;
    const scrolls = [...this.collectedScrolls].filter((id) => id.startsWith(`${this.stageId}-`));
    return {
      stageId: this.stageId,
      checkpointIndex: this.currentCheckpointIndex,
      elapsedMs,
      rank: rankStage(elapsedMs, scrolls.length, this.damageTaken),
      scrolls,
      damageTaken: this.damageTaken,
      defeats: this.defeats,
      seals: this.seals
    };
  }

  private getCheckpointWorld(index: number): { readonly x: number; readonly y: number } {
    const checkpoint = this.level.checkpoints[index] ?? this.level.checkpoints[0] ?? this.level.playerSpawn;
    if (!checkpoint) {
      return { x: 64, y: 360 };
    }
    return {
      x: toWorld(checkpoint.x),
      y: toWorld(checkpoint.y) - 32
    };
  }

  private createHud(): void {
    this.hudText = this.add
      .text(12, 10, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: PaletteCss.white,
        backgroundColor: 'rgba(5,7,15,0.55)',
        padding: { x: 8, y: 6 }
      })
      .setScrollFactor(0)
      .setDepth(2100);
    this.promptText = this.add
      .text(480, 72, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: PaletteCss.gold,
        backgroundColor: 'rgba(5,7,15,0.52)',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2100);
    this.bossText = this.add
      .text(480, 18, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: PaletteCss.magenta
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2100);
    this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(2099);
  }

  private createTutorialPrompt(): void {
    this.promptText.setText(`${this.level.name}\n${this.level.tutorial[0] ?? ''}`);
    this.time.delayedCall(3600, () => {
      this.promptText.setText(this.level.tutorial[1] ?? '');
    });
    this.time.delayedCall(7200, () => {
      this.promptText.setText(this.level.tutorial[2] ?? '');
    });
    this.time.delayedCall(10800, () => {
      this.promptText.setText('');
    });
  }

  private updateHud(): void {
    const settings = this.saveSystem.data.settings;
    const ability = this.level.unlockAbility ?? 'wallKick';
    this.hudText.setText(
      [
        `HP ${this.player.hp}/${PlayerBalance.maxHp}  EN ${Math.floor(this.player.energy)}/${PlayerBalance.maxEnergy}`,
        `Stage ${this.stageId}: ${this.level.name}`,
        `Time ${formatTime(this.time.now - this.startedAt)}  Seals ${this.seals}  Scrolls ${this.collectedScrolls.size}/15`,
        `Unlocked ${ability}  Assist ${settings.assist.fallRescue ? 'Fall Rescue' : 'Standard Falls'}`
      ].join('\n')
    );
    this.bossBar.clear();
    if (this.boss?.isFightActive()) {
      this.bossText.setText(`${this.boss.bossName}  Phase ${this.boss.getPhase()}`);
      this.bossBar.fillStyle(Palette.ink2, 0.85);
      this.bossBar.fillRect(298, 42, 364, 12);
      this.bossBar.fillStyle(Palette.magenta, 0.95);
      this.bossBar.fillRect(302, 45, 356 * this.boss.getHealthRatio(), 6);
    } else {
      this.bossText.setText('');
    }
  }

  private tileTexture(theme: StageTheme): TextureKey {
    switch (theme) {
      case 'alley':
        return TextureKey.TileInk;
      case 'rooftop':
        return TextureKey.TileRoof;
      case 'bamboo':
        return TextureKey.TileBamboo;
      case 'castle':
        return TextureKey.TileCastle;
      case 'keep':
        return TextureKey.TileKeep;
    }
  }

  private themeColor(theme: StageTheme): number {
    switch (theme) {
      case 'alley':
        return Palette.magenta;
      case 'rooftop':
        return Palette.cyan;
      case 'bamboo':
        return Palette.green;
      case 'castle':
        return Palette.gold;
      case 'keep':
        return Palette.violet;
    }
  }
}

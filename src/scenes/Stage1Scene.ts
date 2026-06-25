import * as Phaser from 'phaser';
import { AudioKey, SceneKey, TextureKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import stage1Data from '../data/stage1.json';
import { PlayerBalance } from '../data/balance';
import { InkCrawler } from '../entities/enemies/InkCrawler';
import { KiteWraith } from '../entities/enemies/KiteWraith';
import { LanternWarden } from '../entities/enemies/LanternWarden';
import { Player } from '../entities/Player';
import { AudioSystem } from '../systems/AudioSystem';
import { FXSystem } from '../systems/FXSystem';
import { InputSystem } from '../systems/InputSystem';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { SaveSystem } from '../systems/SaveSystem';
import { TouchControls } from '../systems/TouchControls';
import type { Stage1SceneData, StageClearSceneData } from '../types/flow';
import type { Stage1Definition, SectionDefinition } from '../types/stage';
import { formatTime, rankStage } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

type PlatformVisualKind = 'floor' | 'wall' | 'roof' | 'edge';
type EnemyInstance = InkCrawler | KiteWraith;

const stage = stage1Data as Stage1Definition;

export class Stage1Scene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private audio!: AudioSystem;
  private fx!: FXSystem;
  private inputSystem!: InputSystem;
  private touchControls: TouchControls | null = null;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: EnemyInstance[] = [];
  private enemyIds = new Map<EnemyInstance, string>();
  private warden!: LanternWarden;
  private bossBarrier!: Phaser.Physics.Arcade.Image;
  private gate!: Phaser.Physics.Arcade.Image;
  private checkpointIndex = 0;
  private startedAt = 0;
  private damageTaken = 0;
  private seals = 0;
  private collectedPickups = new Set<string>();
  private collectedScrolls = new Set<string>();
  private scrollSprites = new Map<string, Phaser.Physics.Arcade.Image>();
  private slashHitIds = new Set<string>();
  private wasAttackActive = false;
  private minibossStarted = false;
  private minibossDefeated = false;
  private stageClear = false;
  private gameOverQueued = false;
  private sectionText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private bossBar!: Phaser.GameObjects.Graphics;
  private lastSectionId = '';

  constructor() {
    super(SceneKey.Stage1);
  }

  init(data: Stage1SceneData = {}): void {
    this.checkpointIndex = Math.max(0, Math.min(stage.checkpoints.length - 1, data.checkpointIndex ?? 0));
    this.damageTaken = 0;
    this.seals = 0;
    this.collectedPickups = new Set();
    this.collectedScrolls = new Set();
    this.scrollSprites = new Map();
    this.slashHitIds = new Set();
    this.wasAttackActive = false;
    this.minibossStarted = false;
    this.minibossDefeated = false;
    this.stageClear = false;
    this.gameOverQueued = false;
    this.lastSectionId = '';
    this.enemies = [];
    this.enemyIds = new Map();
  }

  create(): void {
    markSceneStatus(SceneKey.Stage1);
    this.saveSystem = getSaveSystem(this);
    this.audio = getAudioSystem(this);
    this.fx = new FXSystem(this, () => this.saveSystem.data.settings);
    this.startedAt = this.time.now;
    this.physics.world.setBounds(0, 0, stage.width, stage.height + 140);
    this.cameras.main.setBounds(0, 0, stage.width, stage.height);
    this.createBackground();
    this.platforms = this.physics.add.staticGroup();
    this.createPlatforms();
    this.createDecor();
    this.createPlayer();
    this.createHazards();
    this.createPickups();
    this.createCheckpoints();
    this.createTutorials();
    this.createEnemies();
    this.createMinibossAndGate();
    this.createHud();
    this.touchControls = new TouchControls(this, this.saveSystem.data.settings);
    this.inputSystem = new InputSystem(this, this.touchControls);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.11, -95, 52);
    this.bindCollisions();
    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
    this.input.keyboard?.on('keydown-P', () => this.openPause());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputSystem?.destroy());
    this.updateQaState();
  }

  update(time: number, delta: number): void {
    if (this.stageClear) {
      this.updateQaState();
      return;
    }
    if (this.player.isDead()) {
      this.queueGameOver('defeated');
      this.updateQaState();
      return;
    }
    const input = this.inputSystem.sample();
    if (input.pause.pressed) {
      this.openPause();
      return;
    }
    this.player.updatePlayer(input, time, delta);
    this.enemies.forEach((enemy) => {
      if (enemy.active) {
        if (enemy instanceof KiteWraith) enemy.updateEnemy(time);
        else enemy.updateEnemy();
      }
    });
    this.updateMiniboss(time);
    this.resolvePlayerSlash(time);
    this.updateCheckpointByProgress();
    if (this.minibossDefeated && this.player.x >= stage.goal.x - 22) {
      this.tryClearStage();
    }
    this.handleFall();
    this.updateHud(time);
    this.updateQaState();
  }

  restartFromCheckpoint(): void {
    this.scene.restart({ checkpointIndex: this.checkpointIndex } satisfies Stage1SceneData);
  }

  restartStage(): void {
    this.scene.restart({ checkpointIndex: 0 } satisfies Stage1SceneData);
  }

  private createBackground(): void {
    this.add.rectangle(stage.width / 2, BASE_HEIGHT / 2, stage.width, BASE_HEIGHT, Palette.ink0).setDepth(-80);
    for (let i = 0; i < 9; i += 1) {
      const x = 180 + i * 920;
      const moon = this.add.circle(x, 86 + (i % 3) * 28, 34, i % 2 ? Palette.moon : Palette.violet, 0.11);
      moon.setDepth(-72).setScrollFactor(0.16);
    }
    for (let i = 0; i < 28; i += 1) {
      const width = 70 + (i % 5) * 18;
      const height = 120 + (i % 6) * 34;
      const x = i * 320 + 80;
      this.add.rectangle(x, 498 - height / 2, width, height, i % 2 ? Palette.ink1 : Palette.ink2, 0.72)
        .setDepth(-60)
        .setScrollFactor(0.38);
      if (i % 3 === 0) {
        this.add.rectangle(x, 420 - height * 0.38, width * 0.6, 8, Palette.cyan, 0.32)
          .setDepth(-58)
          .setScrollFactor(0.38);
      }
    }
    for (let i = 0; i < 70; i += 1) {
      const rain = this.add.rectangle(i * 126, 20 + (i % 9) * 54, 2, 24, Palette.cyan, 0.23);
      rain.setAngle(-16).setDepth(-40).setScrollFactor(0.72);
      this.tweens.add({
        targets: rain,
        y: rain.y + 70,
        alpha: 0.08,
        duration: 900 + (i % 6) * 130,
        yoyo: true,
        repeat: -1
      });
    }
  }

  private createPlatforms(): void {
    for (const platform of stage.platforms) {
      const texture = this.platformTexture(platform.kind);
      const visual = this.add
        .tileSprite(platform.x + platform.width / 2, platform.y + platform.height / 2, platform.width, platform.height, texture)
        .setDepth(platform.kind === 'wall' ? 5 : 4);
      this.platforms.add(visual);
      const body = visual.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(platform.width, platform.height);
      body.updateFromGameObject();
    }
  }

  private createDecor(): void {
    const decor = [
      { key: TextureKey.TileLantern, x: 520, y: 282 },
      { key: TextureKey.TileSign, x: 980, y: 250 },
      { key: TextureKey.TilePaint, x: 1716, y: 218 },
      { key: TextureKey.TilePipe, x: 2076, y: 174 },
      { key: TextureKey.TileWindow, x: 3050, y: 238 },
      { key: TextureKey.TileShrine, x: 3560, y: 432 },
      { key: TextureKey.TileSign, x: 5140, y: 300 },
      { key: TextureKey.TileLantern, x: 6100, y: 318 },
      { key: TextureKey.TileMoonGate, x: 7350, y: 420 }
    ];
    for (const item of decor) {
      this.add.image(item.x, item.y, item.key).setDepth(2);
    }
  }

  private createHazards(): void {
    for (const hazard of stage.hazards) {
      const texture = hazard.kind === 'thorn' ? TextureKey.TileThorn : hazard.id === 'falling-sign-a' ? TextureKey.FallingSign : TextureKey.TimedSpark;
      const sprite = this.physics.add.staticImage(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, texture);
      sprite.setDisplaySize(hazard.width, hazard.height).refreshBody();
      sprite.setDepth(hazard.kind === 'thorn' ? 9 : 13);
      this.physics.add.overlap(this.player, sprite, () => {
        this.damagePlayer(hazard.safeIntro ? 1 : 1, sprite.x);
      });
    }
  }

  private createPickups(): void {
    for (const pickup of stage.pickups) {
      const texture =
        pickup.type === 'seal' ? TextureKey.Seal : pickup.type === 'health' ? TextureKey.Health : TextureKey.Energy;
      const sprite = this.physics.add.image(pickup.x, pickup.y, texture);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      sprite.setDepth(18);
      this.tweens.add({ targets: sprite, y: pickup.y - 8, duration: 850, yoyo: true, repeat: -1 });
      this.physics.add.overlap(this.player, sprite, () => this.collectPickup(pickup.id, pickup.type, sprite));
    }
    for (const scroll of stage.scrolls) {
      const sprite = this.physics.add.image(scroll.x, scroll.y, TextureKey.Scroll);
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      sprite.setDepth(19);
      if (scroll.route === 'combat') {
        sprite.disableBody(true, true);
      }
      this.scrollSprites.set(scroll.id, sprite);
      this.tweens.add({ targets: sprite, angle: 8, duration: 700, yoyo: true, repeat: -1 });
      this.physics.add.overlap(this.player, sprite, () => this.collectScroll(scroll.id, sprite));
    }
  }

  private createCheckpoints(): void {
    stage.checkpoints.forEach((checkpoint, index) => {
      const sprite = this.physics.add.staticImage(checkpoint.x, checkpoint.y, TextureKey.Checkpoint);
      sprite.setDepth(16);
      sprite.refreshBody();
      this.physics.add.overlap(this.player, sprite, () => {
        if (index > this.checkpointIndex) {
          this.checkpointIndex = index;
          this.audio.play(AudioKey.Checkpoint);
          this.fx.burst(sprite.x, sprite.y - 26, Palette.gold, 18);
        }
      });
    });
  }

  private createTutorials(): void {
    for (const marker of stage.tutorials) {
      this.add.rectangle(marker.x, marker.y + 18, 178, 34, Palette.ink1, 0.84).setDepth(12);
      this.add.text(marker.x, marker.y + 18, marker.text, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: PaletteCss.white,
        align: 'center',
        fixedWidth: 166
      }).setOrigin(0.5).setDepth(13);
      this.add.line(marker.x, marker.y + 41, 0, 0, 0, 24, Palette.cyan, 0.48).setDepth(12);
    }
  }

  private createEnemies(): void {
    for (const spawn of stage.enemies) {
      const enemy = spawn.type === 'kiteWraith'
        ? new KiteWraith(this, spawn.x, spawn.y, spawn.patrol)
        : new InkCrawler(this, spawn.x, spawn.y, spawn.patrol);
      this.enemies.push(enemy);
      this.enemyIds.set(enemy, spawn.id);
      this.physics.add.collider(enemy, this.platforms);
      this.physics.add.overlap(this.player, enemy, () => this.damagePlayer(enemy.damage, enemy.x));
    }
  }

  private createMinibossAndGate(): void {
    this.warden = new LanternWarden(this, 6460, 436);
    this.warden.setAlpha(0.78);
    this.physics.add.collider(this.warden, this.platforms);
    this.physics.add.overlap(this.player, this.warden, () => {
      if (this.warden.active && this.warden.isDangerous(this.time.now)) {
        this.damagePlayer(this.warden.damage, this.warden.x);
      }
    });
    this.bossBarrier = this.physics.add.staticImage(6900, 392, TextureKey.TileWall);
    this.bossBarrier.setDisplaySize(42, 240).setVisible(false).refreshBody();
    this.gate = this.physics.add.staticImage(stage.goal.x, stage.goal.y, TextureKey.GoalGate);
    this.gate.setDepth(14);
    this.gate.setTint(Palette.smoke);
    this.physics.add.overlap(this.player, this.gate, () => this.tryClearStage());
    this.bossBar = this.add.graphics().setDepth(1002).setScrollFactor(0);
  }

  private createPlayer(): void {
    const spawn = stage.checkpoints[this.checkpointIndex] ?? stage.playerSpawn;
    this.player = new Player(this, spawn.x, spawn.y - 22, this.audio);
  }

  private bindCollisions(): void {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.bossBarrier);
  }

  private createHud(): void {
    this.add.rectangle(BASE_WIDTH / 2, 26, BASE_WIDTH, 52, Palette.ink0, 0.64).setDepth(998).setScrollFactor(0);
    this.hudText = this.add.text(18, 10, '', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: PaletteCss.white
    }).setDepth(1000).setScrollFactor(0);
    this.sectionText = this.add.text(BASE_WIDTH / 2, 74, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: PaletteCss.cyan,
      align: 'center'
    }).setOrigin(0.5).setDepth(1000).setScrollFactor(0);
    this.objectiveText = this.add.text(BASE_WIDTH - 18, 12, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: PaletteCss.gold,
      align: 'right',
      fixedWidth: 310
    }).setOrigin(1, 0).setDepth(1000).setScrollFactor(0);
  }

  private updateHud(time: number): void {
    const section = this.currentSection();
    if (section.id !== this.lastSectionId) {
      this.lastSectionId = section.id;
      this.sectionText.setText(section.name);
      this.sectionText.setAlpha(1);
      this.tweens.add({ targets: this.sectionText, alpha: 0, duration: 1800, delay: 900 });
    }
    this.hudText.setText(
      `HP ${this.player.hp}/${PlayerBalance.maxHp}  Time ${formatTime(time - this.startedAt)}  Seals ${this.seals}/22  Scrolls ${this.collectedScrolls.size}/3`
    );
    this.objectiveText.setText(this.objectiveForSection(section));
    this.drawBossBar();
  }

  private updateMiniboss(time: number): void {
    if (!this.minibossStarted && this.player.x >= stage.minibossTriggerX) {
      this.minibossStarted = true;
      this.warden.setAlpha(1);
      this.warden.begin(time);
      this.audio.play(AudioKey.MinibossStart);
      this.fx.shake(0.006, 180);
      this.fx.burst(this.warden.x, this.warden.y, Palette.gold, 24);
    }
    if (this.warden.active) {
      this.warden.updateWarden(time, this.player.x);
    }
  }

  private resolvePlayerSlash(time: number): void {
    const active = this.player.isAttackActive(time);
    if (active && !this.wasAttackActive) {
      this.slashHitIds.clear();
      this.fx.slash(this.player.x + this.player.facing * 34, this.player.y - 10, this.player.facing, false);
    }
    this.wasAttackActive = active;
    if (!active) return;
    const rect = this.player.attackRect(time);
    if (!rect) return;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const id = this.enemyIds.get(enemy) ?? enemy.name;
      if (this.slashHitIds.has(id)) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, enemy.getBounds())) {
        this.slashHitIds.add(id);
        const defeated = enemy.hit(1);
        this.audio.play(defeated ? AudioKey.EnemyDefeat : AudioKey.EnemyHit);
        this.fx.burst(enemy.x, enemy.y, defeated ? Palette.magenta : Palette.cyan, defeated ? 16 : 9);
      }
    }
    if (this.warden.active && !this.slashHitIds.has('lantern-warden') && Phaser.Geom.Intersects.RectangleToRectangle(rect, this.warden.getBounds())) {
      this.slashHitIds.add('lantern-warden');
      if (this.warden.hit(2)) {
        this.defeatMiniboss();
      } else {
        this.audio.play(AudioKey.EnemyHit);
        this.fx.burst(this.warden.x, this.warden.y, Palette.gold, 10);
      }
    }
  }

  private defeatMiniboss(): void {
    this.minibossDefeated = true;
    this.audio.play(AudioKey.MinibossDefeated);
    this.fx.shake(0.007, 220);
    this.fx.burst(this.warden.x, this.warden.y, Palette.gold, 34);
    this.bossBarrier.disableBody(true, true);
    this.gate.clearTint();
    this.gate.setTint(Palette.gold);
    const reward = this.scrollSprites.get('scroll-warden-reward');
    reward?.enableBody(false, stage.scrolls.find((scroll) => scroll.id === 'scroll-warden-reward')?.x ?? 6760, 410, true, true);
  }

  private collectPickup(id: string, type: 'seal' | 'health' | 'energy', sprite: Phaser.Physics.Arcade.Image): void {
    if (this.collectedPickups.has(id)) return;
    this.collectedPickups.add(id);
    sprite.disableBody(true, true);
    if (type === 'seal') {
      this.seals += 1;
      this.audio.play(AudioKey.PickupSeal);
      this.fx.burst(sprite.x, sprite.y, Palette.cyan, 8);
    } else if (type === 'health') {
      this.player.heal(1);
      this.audio.play(AudioKey.Confirm);
      this.fx.burst(sprite.x, sprite.y, Palette.red, 10);
    } else {
      this.player.heal(1);
      this.audio.play(AudioKey.Confirm);
      this.fx.burst(sprite.x, sprite.y, Palette.magenta, 10);
    }
  }

  private collectScroll(id: string, sprite: Phaser.Physics.Arcade.Image): void {
    if (this.collectedScrolls.has(id)) return;
    this.collectedScrolls.add(id);
    sprite.disableBody(true, true);
    this.audio.play(AudioKey.PickupScroll);
    this.fx.burst(sprite.x, sprite.y, Palette.gold, 18);
  }

  private damagePlayer(rawDamage: number, sourceX: number): void {
    const accepted = this.player.takeDamage(rawDamage, sourceX, this.time.now, this.saveSystem.data.settings);
    if (!accepted) return;
    this.damageTaken += rawDamage;
    this.fx.shake(0.004, 110);
    this.fx.burst(this.player.x, this.player.y - 12, Palette.red, 10);
    if (this.player.isDead()) {
      this.queueGameOver('defeated');
    }
  }

  private queueGameOver(reason: 'defeated' | 'fall'): void {
    if (this.gameOverQueued || this.stageClear) return;
    this.gameOverQueued = true;
    this.time.delayedCall(420, () => this.scene.start(SceneKey.GameOver, { checkpointIndex: this.checkpointIndex, reason }));
  }

  private handleFall(): void {
    if (this.player.y <= PlayerBalance.fallDeathY) return;
    if (this.saveSystem.data.settings.assist.fallRescue) {
      this.damagePlayer(1, this.player.x);
      this.respawnAtCheckpoint();
      return;
    }
    this.queueGameOver('fall');
  }

  private respawnAtCheckpoint(): void {
    const checkpoint = stage.checkpoints[this.checkpointIndex] ?? stage.checkpoints[0];
    this.player.revive(checkpoint.x, checkpoint.y - 22);
    this.fx.burst(checkpoint.x, checkpoint.y, Palette.cyan, 14);
  }

  private updateCheckpointByProgress(): void {
    for (let index = this.checkpointIndex + 1; index < stage.checkpoints.length; index += 1) {
      const checkpoint = stage.checkpoints[index];
      if (this.player.x >= checkpoint.x - 18) {
        this.checkpointIndex = index;
        this.audio.play(AudioKey.Checkpoint);
        this.fx.burst(checkpoint.x, checkpoint.y, Palette.gold, 16);
      }
    }
  }

  private tryClearStage(): void {
    if (this.stageClear) return;
    if (!this.minibossDefeated) {
      this.objectiveText.setText('The Moon Gate is sealed.');
      return;
    }
    this.stageClear = true;
    const elapsedMs = this.time.now - this.startedAt;
    const scrolls = [...this.collectedScrolls];
    const rank = rankStage(elapsedMs, scrolls.length, this.damageTaken);
    const result: StageClearSceneData = {
      elapsedMs,
      rank,
      scrolls,
      damageTaken: this.damageTaken,
      seals: this.seals,
      checkpointIndex: this.checkpointIndex
    };
    this.saveSystem.completeStage(result);
    this.audio.play(AudioKey.StageClear);
    this.time.delayedCall(450, () => this.scene.start(SceneKey.StageClear, result));
  }

  private openPause(): void {
    if (this.stageClear || this.scene.isActive(SceneKey.Pause)) return;
    this.scene.pause(SceneKey.Stage1);
    this.scene.launch(SceneKey.Pause);
  }

  private drawBossBar(): void {
    this.bossBar.clear();
    if (!this.minibossStarted || this.minibossDefeated) return;
    this.bossBar.fillStyle(Palette.ink0, 0.78);
    this.bossBar.fillRoundedRect(312, 48, 336, 18, 5);
    this.bossBar.fillStyle(Palette.red, 0.92);
    this.bossBar.fillRoundedRect(316, 52, 328 * this.warden.healthRatio(), 10, 4);
    this.bossBar.lineStyle(2, Palette.gold, 0.8);
    this.bossBar.strokeRoundedRect(312, 48, 336, 18, 5);
  }

  private currentSection(): SectionDefinition {
    const x = this.player?.x ?? 0;
    return (
      [...stage.sections]
        .filter((section) => x >= section.x && x <= section.x + section.width)
        .sort((a, b) => b.x - a.x)[0] ?? stage.sections[0]
    );
  }

  private objectiveForSection(section: SectionDefinition): string {
    if (section.id === 'lantern-warden-encounter') {
      return this.minibossDefeated ? 'Moon Gate unsealed' : 'Defeat Lantern Warden';
    }
    if (section.id === 'moon-gate-finish') {
      return this.minibossDefeated ? 'Enter the Moon Gate' : 'Return to the warden';
    }
    if (section.id.includes('hidden')) return 'Optional scroll route';
    if (section.id.includes('checkpoint')) return 'Touch the shrine';
    if (section.id.includes('wall')) return 'Climb the sign shaft';
    if (section.id.includes('thorn')) return 'Cross the neon thorns';
    return 'Deliver the shadow parcel';
  }

  private platformTexture(kind: PlatformVisualKind): TextureKey {
    if (kind === 'wall') return TextureKey.TileWall;
    if (kind === 'roof') return TextureKey.TileRoof;
    if (kind === 'edge') return TextureKey.TileEdge;
    return TextureKey.TileFloor;
  }

  private updateQaState(): void {
    if (typeof window === 'undefined' || !this.player) return;
    const section = this.currentSection();
    window.__NEON_RONIN_QA__ = {
      scene: SceneKey.Stage1,
      player: this.player.snapshot(this.time.now),
      sectionId: section.id,
      sectionName: section.name,
      checkpointIndex: this.checkpointIndex,
      scrolls: [...this.collectedScrolls],
      seals: this.seals,
      damageTaken: this.damageTaken,
      minibossActive: this.minibossStarted && !this.minibossDefeated,
      minibossDefeated: this.minibossDefeated,
      minibossHealthRatio: this.warden?.active ? this.warden.healthRatio() : 0,
      gateActive: this.minibossDefeated,
      stageClear: this.stageClear,
      mobileControlsVisible: typeof document !== 'undefined' && document.body.dataset.touchControls === 'visible',
      elapsedMs: this.time.now - this.startedAt
    };
  }
}

import * as Phaser from 'phaser';
import { AudioKey, SceneKey, TextureKey } from '../config/keys';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Palette, PaletteCss } from '../config/palette';
import stage1Data from '../data/stage1.json';
import { PlayerBalance } from '../data/balance';
import { Player } from '../entities/Player';
import { AudioSystem } from '../systems/AudioSystem';
import { CameraController } from '../systems/CameraController';
import { FXSystem } from '../systems/FXSystem';
import { InputSystem } from '../systems/InputSystem';
import { getAudioSystem, getSaveSystem } from '../systems/Registry';
import { SaveSystem } from '../systems/SaveSystem';
import { StageCombat } from '../systems/StageCombat';
import { StageCollectibles } from '../systems/StageCollectibles';
import { StageHazards } from '../systems/StageHazards';
import { StageHud } from '../systems/StageHud';
import { TouchControls } from '../systems/TouchControls';
import type { Stage1SceneData, StageClearSceneData } from '../types/flow';
import type { Stage1Definition, SectionDefinition } from '../types/stage';
import { rankStage } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

type PlatformVisualKind = 'floor' | 'wall' | 'roof' | 'edge';

const stage = stage1Data as Stage1Definition;

export class Stage1Scene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private audio!: AudioSystem;
  private fx!: FXSystem;
  private inputSystem!: InputSystem;
  private cameraController!: CameraController;
  private touchControls: TouchControls | null = null;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private checkpointIndex = 0;
  private startedAt = 0;
  private damageTaken = 0;
  private stageClear = false;
  private gameOverQueued = false;
  private combat!: StageCombat;
  private collectibles!: StageCollectibles;
  private hud!: StageHud;

  constructor() {
    super(SceneKey.Stage1);
  }

  init(data: Stage1SceneData = {}): void {
    this.checkpointIndex = Math.max(0, Math.min(stage.checkpoints.length - 1, data.checkpointIndex ?? 0));
    this.damageTaken = 0;
    this.stageClear = false;
    this.gameOverQueued = false;
  }

  create(): void {
    markSceneStatus(SceneKey.Stage1);
    this.saveSystem = getSaveSystem(this);
    this.audio = getAudioSystem(this);
    this.fx = new FXSystem(this, () => this.saveSystem.data.settings);
    this.startedAt = this.time.now;
    this.physics.world.setBounds(0, 0, stage.width, stage.height + 140);
    this.createBackground();
    this.platforms = this.physics.add.staticGroup();
    this.createPlatforms();
    this.createDecor();
    this.createPlayer();
    new StageHazards(this, stage, this.player, this.saveSystem.data.settings.highContrast, (damage, sourceX) =>
      this.damagePlayer(damage, sourceX)
    ).create();
    this.collectibles = new StageCollectibles(this, stage, this.player, this.audio, this.fx);
    this.collectibles.create();
    this.createCheckpoints();
    this.createTutorials();
    this.combat = new StageCombat(this, stage, this.player, this.platforms, this.audio, this.fx, {
      damagePlayer: (damage, sourceX) => this.damagePlayer(damage, sourceX),
      onGateTouched: () => this.tryClearStage(),
      onMinibossDefeated: () => this.collectibles.enableWardenReward()
    });
    this.combat.create();
    this.hud = new StageHud(this);
    this.touchControls = new TouchControls(this, this.saveSystem.data.settings);
    this.inputSystem = new InputSystem(this, this.touchControls);
    this.cameraController = new CameraController(this, this.player, stage.width, stage.height);
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
    this.cameraController.update(delta);
    this.combat.update(time);
    this.updateCheckpointByProgress();
    if (this.combat.defeated && this.player.x >= stage.goal.x - 22) {
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
      if (this.saveSystem.data.settings.highContrast) {
        visual.setTint(platform.kind === 'wall' ? Palette.magenta : Palette.white);
        const outline = this.add.graphics().setDepth(visual.depth + 0.1);
        outline.lineStyle(2, platform.kind === 'wall' ? Palette.magenta : Palette.cyan, 0.95);
        outline.strokeRect(platform.x, platform.y, platform.width, platform.height);
      }
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

  private createPlayer(): void {
    const spawn = stage.checkpoints[this.checkpointIndex] ?? stage.playerSpawn;
    this.player = new Player(this, spawn.x, spawn.y - 22, this.audio);
  }

  private bindCollisions(): void {
    this.physics.add.collider(this.player, this.platforms);
  }

  private updateHud(time: number): void {
    const section = this.currentSection();
    this.hud.update({
      elapsedMs: time - this.startedAt,
      hp: this.player.hp,
      seals: this.collectibles.sealCount,
      scrolls: this.collectibles.scrollCount,
      section,
      minibossStarted: this.combat.started,
      minibossDefeated: this.combat.defeated,
      minibossHealthRatio: this.combat.healthRatio
    });
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
    if (!this.combat.defeated) {
      this.hud.setObjective('The Moon Gate is sealed.');
      return;
    }
    this.stageClear = true;
    const elapsedMs = this.time.now - this.startedAt;
    const scrolls = this.collectibles.scrollIds;
    const rank = rankStage(elapsedMs, scrolls.length, this.damageTaken);
    const result: StageClearSceneData = {
      elapsedMs,
      rank,
      scrolls,
      damageTaken: this.damageTaken,
      seals: this.collectibles.sealCount,
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

  private currentSection(): SectionDefinition {
    const x = this.player?.x ?? 0;
    return (
      [...stage.sections]
        .filter((section) => x >= section.x && x <= section.x + section.width)
        .sort((a, b) => b.x - a.x)[0] ?? stage.sections[0]
    );
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
      scrolls: this.collectibles.scrollIds,
      seals: this.collectibles.sealCount,
      damageTaken: this.damageTaken,
      minibossActive: this.combat.started && !this.combat.defeated,
      minibossDefeated: this.combat.defeated,
      minibossHealthRatio: this.combat.healthRatio,
      gateActive: this.combat.defeated,
      stageClear: this.stageClear,
      mobileControlsVisible: typeof document !== 'undefined' && document.body.dataset.touchControls === 'visible',
      elapsedMs: this.time.now - this.startedAt
    };
  }
}

import * as Phaser from 'phaser';
import { AudioKey, SceneKey } from '../config/keys';
import { Palette } from '../config/palette';
import stage1Data from '../data/stage1.json';
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
import { clampCheckpointIndex, stageSpawnPoint, StageProgression } from '../systems/StageProgression';
import { StageWorld } from '../systems/StageWorld';
import { TouchControls } from '../systems/TouchControls';
import type { Stage1SceneData, StageClearSceneData } from '../types/flow';
import type { Stage1Definition } from '../types/stage';
import { rankStage } from '../utils/math';
import { markSceneStatus } from '../utils/sceneStatus';

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
  private initialCheckpointIndex = 0;
  private startedAt = 0;
  private damageTaken = 0;
  private stageClear = false;
  private gameOverQueued = false;
  private combat!: StageCombat;
  private collectibles!: StageCollectibles;
  private hud!: StageHud;
  private progression!: StageProgression;

  constructor() {
    super(SceneKey.Stage1);
  }

  init(data: Stage1SceneData = {}): void {
    this.initialCheckpointIndex = clampCheckpointIndex(stage.checkpoints, data.checkpointIndex ?? 0);
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
    this.platforms = new StageWorld(this, stage, this.saveSystem.data.settings.highContrast).create();
    this.createPlayer();
    new StageHazards(this, stage, this.player, this.saveSystem.data.settings.highContrast, (damage, sourceX) =>
      this.damagePlayer(damage, sourceX)
    ).create();
    this.collectibles = new StageCollectibles(this, stage, this.player, this.audio, this.fx);
    this.collectibles.create();
    this.progression = new StageProgression(
      this,
      stage,
      this.player,
      this.audio,
      this.fx,
      this.initialCheckpointIndex,
      (damage, sourceX) => this.damagePlayer(damage, sourceX),
      (reason) => this.queueGameOver(reason)
    );
    this.progression.create();
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
    this.progression.updateCheckpointByProgress();
    if (this.combat.defeated && this.player.x >= stage.goal.x - 22) {
      this.tryClearStage();
    }
    this.handleFall();
    this.updateHud(time);
    this.updateQaState();
  }

  restartFromCheckpoint(): void {
    this.scene.restart({ checkpointIndex: this.currentCheckpointIndex() } satisfies Stage1SceneData);
  }

  restartStage(): void {
    this.scene.restart({ checkpointIndex: 0 } satisfies Stage1SceneData);
  }

  private createPlayer(): void {
    const spawn = stageSpawnPoint(stage, this.initialCheckpointIndex);
    this.player = new Player(this, spawn.x, spawn.y, this.audio);
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
    this.time.delayedCall(420, () => this.scene.start(SceneKey.GameOver, { checkpointIndex: this.currentCheckpointIndex(), reason }));
  }

  private handleFall(): void {
    this.progression.handleFall(this.saveSystem.data.settings.assist.fallRescue);
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
      checkpointIndex: this.currentCheckpointIndex()
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

  private currentSection() {
    return this.progression.currentSection();
  }

  private currentCheckpointIndex(): number {
    return this.progression?.checkpointIndex ?? this.initialCheckpointIndex;
  }

  private updateQaState(): void {
    if (typeof window === 'undefined' || !this.player) return;
    const section = this.currentSection();
    window.__NEON_RONIN_QA__ = {
      scene: SceneKey.Stage1,
      player: this.player.snapshot(this.time.now),
      sectionId: section.id,
      sectionName: section.name,
      checkpointIndex: this.currentCheckpointIndex(),
      scrolls: this.collectibles.scrollIds,
      seals: this.collectibles.sealCount,
      damageTaken: this.damageTaken,
      minibossActive: this.combat.started && !this.combat.defeated,
      minibossDefeated: this.combat.defeated,
      minibossHealthRatio: this.combat.healthRatio,
      gateActive: this.combat.defeated,
      stageClear: this.stageClear,
      mobileControlsVisible: typeof document !== 'undefined' && document.body.dataset.touchControls === 'visible',
      touchControls: this.touchControls?.getLayout() ?? [],
      elapsedMs: this.time.now - this.startedAt
    };
  }
}

import * as Phaser from 'phaser';
import { AudioKey, TextureKey } from '../config/keys';
import { Palette } from '../config/palette';
import { InkCrawler } from '../entities/enemies/InkCrawler';
import { KiteWraith } from '../entities/enemies/KiteWraith';
import { LanternWarden } from '../entities/enemies/LanternWarden';
import type { Player } from '../entities/Player';
import type { Stage1Definition } from '../types/stage';
import type { AudioSystem } from './AudioSystem';
import type { FXSystem } from './FXSystem';

type EnemyInstance = InkCrawler | KiteWraith;

interface StageCombatCallbacks {
  readonly damagePlayer: (damage: number, sourceX: number) => void;
  readonly onGateTouched: () => void;
  readonly onMinibossDefeated: () => void;
}

export class StageCombat {
  private readonly enemies: EnemyInstance[] = [];
  private readonly enemyIds = new Map<EnemyInstance, string>();
  private warden!: LanternWarden;
  private bossBarrier!: Phaser.Physics.Arcade.Image;
  private gate!: Phaser.Physics.Arcade.Image;
  private slashHitIds = new Set<string>();
  private wasAttackActive = false;
  private minibossStarted = false;
  private minibossDefeated = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: Stage1Definition,
    private readonly player: Player,
    private readonly platforms: Phaser.Physics.Arcade.StaticGroup,
    private readonly audio: AudioSystem,
    private readonly fx: FXSystem,
    private readonly callbacks: StageCombatCallbacks
  ) {}

  get started(): boolean {
    return this.minibossStarted;
  }

  get defeated(): boolean {
    return this.minibossDefeated;
  }

  get healthRatio(): number {
    return this.warden.active ? this.warden.healthRatio() : 0;
  }

  create(): void {
    this.createEnemies();
    this.createMinibossAndGate();
  }

  update(time: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (enemy instanceof KiteWraith) enemy.updateEnemy(time);
      else enemy.updateEnemy();
    }
    this.updateMiniboss(time);
    this.resolvePlayerSlash(time);
  }

  private createEnemies(): void {
    for (const spawn of this.stage.enemies) {
      const enemy =
        spawn.type === 'kiteWraith'
          ? new KiteWraith(this.scene, spawn.x, spawn.y, spawn.patrol)
          : new InkCrawler(this.scene, spawn.x, spawn.y, spawn.patrol);
      this.enemies.push(enemy);
      this.enemyIds.set(enemy, spawn.id);
      this.scene.physics.add.collider(enemy, this.platforms);
      this.scene.physics.add.overlap(this.player, enemy, () => this.callbacks.damagePlayer(enemy.damage, enemy.x));
    }
  }

  private createMinibossAndGate(): void {
    this.warden = new LanternWarden(this.scene, 6460, 436);
    this.warden.setAlpha(0.78);
    this.scene.physics.add.collider(this.warden, this.platforms);
    this.scene.physics.add.overlap(this.player, this.warden, () => {
      if (this.warden.active && this.warden.isDangerous(this.scene.time.now)) {
        this.callbacks.damagePlayer(this.warden.damage, this.warden.x);
      }
    });
    this.bossBarrier = this.scene.physics.add.staticImage(6900, 392, TextureKey.TileWall);
    this.bossBarrier.setDisplaySize(42, 240).setVisible(false).refreshBody();
    this.scene.physics.add.collider(this.player, this.bossBarrier);
    this.gate = this.scene.physics.add.staticImage(this.stage.goal.x, this.stage.goal.y, TextureKey.GoalGate);
    this.gate.setDepth(14);
    this.gate.setTint(Palette.smoke);
    this.scene.physics.add.overlap(this.player, this.gate, () => this.callbacks.onGateTouched());
  }

  private updateMiniboss(time: number): void {
    if (!this.minibossStarted && this.player.x >= this.stage.minibossTriggerX) {
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
    this.resolveEnemyHits(rect);
    this.resolveWardenHit(rect);
  }

  private resolveEnemyHits(rect: Phaser.Geom.Rectangle): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const id = this.enemyIds.get(enemy) ?? enemy.name;
      if (this.slashHitIds.has(id)) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, enemy.getBounds())) {
        this.slashHitIds.add(id);
        const defeated = enemy.hit(1);
        this.audio.play(defeated ? AudioKey.EnemyDefeat : AudioKey.EnemyHit);
        this.fx.hitPause(defeated ? 70 : 45);
        this.fx.burst(enemy.x, enemy.y, defeated ? Palette.magenta : Palette.cyan, defeated ? 16 : 9);
      }
    }
  }

  private resolveWardenHit(rect: Phaser.Geom.Rectangle): void {
    if (
      !this.warden.active ||
      this.slashHitIds.has('lantern-warden') ||
      !Phaser.Geom.Intersects.RectangleToRectangle(rect, this.warden.getBounds())
    ) {
      return;
    }
    this.slashHitIds.add('lantern-warden');
    if (this.warden.hit(2)) {
      this.defeatMiniboss();
      return;
    }
    this.audio.play(AudioKey.EnemyHit);
    this.fx.hitPause(55);
    this.fx.burst(this.warden.x, this.warden.y, Palette.gold, 10);
  }

  private defeatMiniboss(): void {
    this.minibossDefeated = true;
    this.audio.play(AudioKey.MinibossDefeated);
    this.fx.shake(0.007, 220);
    this.fx.burst(this.warden.x, this.warden.y, Palette.gold, 34);
    this.bossBarrier.disableBody(true, true);
    this.gate.clearTint();
    this.gate.setTint(Palette.gold);
    this.callbacks.onMinibossDefeated();
  }
}

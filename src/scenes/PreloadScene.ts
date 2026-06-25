import * as Phaser from 'phaser';
import { SceneKey, TextureKey } from '../config/keys';
import { Palette } from '../config/palette';
import { markSceneStatus } from '../utils/sceneStatus';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  create(): void {
    markSceneStatus(SceneKey.Preload);
    this.generateTextures();
    this.scene.start(SceneKey.Title);
  }

  private generateTextures(): void {
    this.makePlayer(TextureKey.PlayerIdle, Palette.cyan);
    this.makePlayer(TextureKey.PlayerRun, Palette.green);
    this.makePlayer(TextureKey.PlayerJump, Palette.gold);
    this.makePlayer(TextureKey.PlayerFall, Palette.moon);
    this.makePlayer(TextureKey.PlayerWall, Palette.magenta);
    this.makePlayer(TextureKey.PlayerDash, Palette.cyan, true);
    this.makePlayer(TextureKey.PlayerAttack, Palette.gold, true);
    this.makePlayer(TextureKey.PlayerHurt, Palette.red);
    this.makeEnemy(TextureKey.ShadowCrawler, Palette.magenta, 'crawler');
    this.makeEnemy(TextureKey.KiteWraith, Palette.cyan, 'wraith');
    this.makeEnemy(TextureKey.GearSentinel, Palette.gold, 'sentinel');
    this.makeEnemy(TextureKey.NeonArcher, Palette.green, 'archer');
    this.makeEnemy(TextureKey.PulseJumper, Palette.violet, 'jumper');
    this.makeBoss(TextureKey.Boss, Palette.magenta);
    this.makeBoss(TextureKey.BossPhase, Palette.gold);
    this.makeTile(TextureKey.TileInk, Palette.ink2, Palette.magenta);
    this.makeTile(TextureKey.TileRoof, Palette.ink2, Palette.cyan);
    this.makeTile(TextureKey.TileBamboo, Palette.ink2, Palette.green);
    this.makeTile(TextureKey.TileCastle, Palette.ink2, Palette.gold);
    this.makeTile(TextureKey.TileKeep, Palette.ink2, Palette.violet);
    this.makeTile(TextureKey.OneWay, Palette.ink1, Palette.cyan, true);
    this.makeHazard();
    this.makeRect(TextureKey.MovingPlatform, 128, 18, Palette.cyan, Palette.ink2);
    this.makeRect(TextureKey.FallingPlatform, 96, 18, Palette.gold, Palette.ink2);
    this.makeRect(TextureKey.WindZone, 32, 32, Palette.green, Palette.cyan, 0.25);
    this.makeShrine();
    this.makeGate();
    this.makePickup(TextureKey.Scroll, Palette.gold, 'scroll');
    this.makePickup(TextureKey.Seal, Palette.cyan, 'seal');
    this.makePickup(TextureKey.Health, Palette.red, 'orb');
    this.makePickup(TextureKey.Energy, Palette.magenta, 'orb');
    this.makePickup(TextureKey.Projectile, Palette.cyan, 'star');
    this.makePickup(TextureKey.EnemyProjectile, Palette.red, 'star');
    this.makePickup(TextureKey.HeartIcon, Palette.red, 'orb');
    this.makePickup(TextureKey.EnergyIcon, Palette.cyan, 'orb');
    this.makePickup(TextureKey.ScrollIcon, Palette.gold, 'scroll');
    this.makeRect(TextureKey.Button, 96, 96, Palette.cyan, Palette.ink2, 0.7);
    this.makeRect(TextureKey.Dpad, 96, 96, Palette.magenta, Palette.ink2, 0.7);
  }

  private graphics(): Phaser.GameObjects.Graphics {
    return this.add.graphics();
  }

  private makePlayer(key: TextureKey, accent: number, scarf = false): void {
    if (this.textures.exists(key)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    g.fillRoundedRect(16, 12, 22, 34, 7);
    g.fillStyle(accent, 1);
    g.fillTriangle(26, 6, 36, 16, 18, 16);
    g.fillRect(18, 24, 25, 4);
    if (scarf) {
      g.fillStyle(Palette.magenta, 0.9);
      g.fillTriangle(36, 22, 58, 18, 38, 28);
    } else {
      g.fillStyle(Palette.cyan, 0.85);
      g.fillRect(35, 18, 16, 5);
    }
    g.lineStyle(2, Palette.white, 0.35);
    g.strokeRoundedRect(16, 12, 22, 34, 7);
    g.generateTexture(key, 64, 56);
    g.destroy();
  }

  private makeEnemy(key: TextureKey, accent: number, shape: string): void {
    if (this.textures.exists(key)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    if (shape === 'wraith') {
      g.fillTriangle(16, 6, 42, 20, 16, 38);
      g.fillTriangle(42, 20, 60, 12, 52, 30);
    } else if (shape === 'sentinel') {
      g.fillRoundedRect(12, 6, 38, 42, 5);
      g.fillStyle(accent, 0.8);
      g.fillRect(10, 14, 10, 28);
    } else if (shape === 'archer') {
      g.fillRoundedRect(20, 10, 22, 38, 8);
      g.lineStyle(4, accent, 0.9);
      g.strokeCircle(44, 24, 14);
    } else if (shape === 'jumper') {
      g.fillEllipse(30, 28, 38, 34);
      g.fillStyle(accent, 0.8);
      g.fillCircle(30, 16, 8);
    } else {
      g.fillRoundedRect(10, 24, 44, 20, 8);
      g.fillTriangle(18, 24, 26, 12, 34, 24);
    }
    g.lineStyle(2, accent, 1);
    g.strokeRect(8, 6, 48, 44);
    g.generateTexture(key, 64, 56);
    g.destroy();
  }

  private makeBoss(key: TextureKey, accent: number): void {
    if (this.textures.exists(key)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    g.fillCircle(42, 42, 34);
    g.fillStyle(accent, 0.85);
    g.fillCircle(42, 42, 16);
    g.lineStyle(5, accent, 0.7);
    g.strokeCircle(42, 42, 31);
    g.lineBetween(12, 42, 72, 42);
    g.lineBetween(42, 12, 42, 72);
    g.generateTexture(key, 84, 84);
    g.destroy();
  }

  private makeTile(key: TextureKey, base: number, accent: number, thin = false): void {
    if (this.textures.exists(key)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(base, 1);
    g.fillRect(0, thin ? 10 : 0, 32, thin ? 10 : 32);
    g.lineStyle(2, accent, 0.75);
    g.strokeRect(1, thin ? 10 : 1, 30, thin ? 9 : 30);
    g.lineStyle(1, Palette.black, 0.35);
    g.lineBetween(2, thin ? 17 : 18, 30, thin ? 17 : 18);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makeHazard(): void {
    if (this.textures.exists(TextureKey.Hazard)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(Palette.red, 0.95);
    for (let x = 0; x < 32; x += 8) {
      g.fillTriangle(x, 32, x + 4, 6, x + 8, 32);
    }
    g.generateTexture(TextureKey.Hazard, 32, 32);
    g.destroy();
  }

  private makeRect(key: TextureKey, width: number, height: number, accent: number, base: number, alpha = 1): void {
    if (this.textures.exists(key)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(base, alpha);
    g.fillRoundedRect(0, 0, width, height, 5);
    g.lineStyle(3, accent, 0.85);
    g.strokeRoundedRect(1, 1, width - 2, height - 2, 5);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private makeShrine(): void {
    if (this.textures.exists(TextureKey.Checkpoint)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    g.fillRect(16, 16, 28, 42);
    g.fillStyle(Palette.cyan, 0.9);
    g.fillCircle(30, 20, 10);
    g.lineStyle(3, Palette.gold, 0.9);
    g.strokeTriangle(8, 18, 30, 0, 52, 18);
    g.generateTexture(TextureKey.Checkpoint, 60, 64);
    g.destroy();
  }

  private makeGate(): void {
    if (this.textures.exists(TextureKey.GoalGate)) {
      return;
    }
    const g = this.graphics();
    g.lineStyle(5, Palette.gold, 0.95);
    g.strokeRoundedRect(8, 2, 48, 72, 16);
    g.lineStyle(3, Palette.cyan, 0.7);
    g.lineBetween(32, 8, 32, 70);
    g.generateTexture(TextureKey.GoalGate, 64, 76);
    g.destroy();
  }

  private makePickup(key: TextureKey, accent: number, shape: string): void {
    if (this.textures.exists(key)) {
      return;
    }
    const g = this.graphics();
    g.fillStyle(accent, 0.9);
    if (shape === 'scroll') {
      g.fillRoundedRect(8, 12, 28, 20, 4);
      g.fillStyle(Palette.ink0, 1);
      g.fillRect(14, 18, 16, 2);
      g.fillRect(14, 24, 12, 2);
    } else if (shape === 'star') {
      g.fillTriangle(22, 2, 28, 18, 44, 22);
      g.fillTriangle(44, 22, 28, 28, 22, 44);
      g.fillTriangle(22, 44, 16, 28, 0, 22);
      g.fillTriangle(0, 22, 16, 18, 22, 2);
    } else if (shape === 'seal') {
      g.fillCircle(22, 22, 13);
      g.lineStyle(2, Palette.white, 0.55);
      g.strokeCircle(22, 22, 10);
    } else {
      g.fillCircle(22, 22, 14);
      g.lineStyle(2, Palette.white, 0.5);
      g.strokeCircle(22, 22, 12);
    }
    g.generateTexture(key, 44, 44);
    g.destroy();
  }
}

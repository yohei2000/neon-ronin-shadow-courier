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
    this.makePlayer(TextureKey.PlayerIdle, 0, Palette.cyan);
    this.makePlayer(TextureKey.PlayerRun1, 1, Palette.green);
    this.makePlayer(TextureKey.PlayerRun2, 2, Palette.green);
    this.makePlayer(TextureKey.PlayerRun3, 3, Palette.cyan);
    this.makePlayer(TextureKey.PlayerRun4, 4, Palette.green);
    this.makePlayer(TextureKey.PlayerJump, 5, Palette.gold);
    this.makePlayer(TextureKey.PlayerFall, 6, Palette.moon);
    this.makePlayer(TextureKey.PlayerWall, 7, Palette.magenta);
    this.makePlayer(TextureKey.PlayerSlash1, 8, Palette.gold);
    this.makePlayer(TextureKey.PlayerSlash2, 9, Palette.gold);
    this.makePlayer(TextureKey.PlayerSlash3, 10, Palette.magenta);
    this.makePlayer(TextureKey.PlayerHurt, 11, Palette.red);

    this.makeInkCrawler();
    this.makeKiteWraith();
    this.makeLanternWarden(TextureKey.LanternWarden, Palette.gold);
    this.makeLanternWarden(TextureKey.LanternWardenHurt, Palette.red);

    this.makeTile(TextureKey.TileFloor, Palette.ink2, Palette.cyan, 'pavement');
    this.makeTile(TextureKey.TileWall, Palette.ink1, Palette.magenta, 'wall');
    this.makeTile(TextureKey.TileRoof, Palette.ink2, Palette.gold, 'roof');
    this.makeTile(TextureKey.TileEdge, Palette.ink1, Palette.green, 'edge');
    this.makeTile(TextureKey.TileSign, Palette.magentaDark, Palette.cyan, 'sign');
    this.makeTile(TextureKey.TileLantern, Palette.gold, Palette.red, 'lantern');
    this.makeTile(TextureKey.TilePipe, Palette.cyanDark, Palette.moon, 'pipe');
    this.makeTile(TextureKey.TileWindow, Palette.ink0, Palette.cyan, 'window');
    this.makeTile(TextureKey.TilePaint, Palette.ink2, Palette.magenta, 'paint');
    this.makeTile(TextureKey.TileShrine, Palette.ink0, Palette.gold, 'shrine');
    this.makeThorn();
    this.makeGateTexture(TextureKey.TileMoonGate, 72, 92, true);

    this.makeSpark(TextureKey.TimedSpark);
    this.makeFallingSign(TextureKey.FallingSign);
    this.makeCheckpoint();
    this.makeGateTexture(TextureKey.GoalGate, 64, 76, false);

    this.makePickup(TextureKey.Scroll, Palette.gold, 'scroll');
    this.makePickup(TextureKey.Seal, Palette.cyan, 'seal');
    this.makePickup(TextureKey.Health, Palette.red, 'heart');
    this.makePickup(TextureKey.Energy, Palette.magenta, 'diamond');
    this.makePickup(TextureKey.HeartIcon, Palette.red, 'heart');
    this.makePickup(TextureKey.ScrollIcon, Palette.gold, 'scroll');
    this.makePickup(TextureKey.TimerIcon, Palette.green, 'timer');
    this.makePickup(TextureKey.SealIcon, Palette.cyan, 'seal');
    this.makeControlTexture(TextureKey.Button, 96, 96, 'button');
    this.makeControlTexture(TextureKey.Dpad, 112, 112, 'dpad');
    this.makeControlTexture(TextureKey.PauseIcon, 36, 36, 'pause');
  }

  private graphics(): Phaser.GameObjects.Graphics {
    return this.add.graphics();
  }

  private makePlayer(key: TextureKey, pose: number, accent: number): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    const lean = pose % 2 === 0 ? -2 : 2;
    g.fillStyle(Palette.ink0, 1);
    g.fillRoundedRect(19 + lean, 13, 24, 36, 7);
    g.fillStyle(accent, 1);
    g.fillTriangle(30 + lean, 5, 43 + lean, 17, 19 + lean, 17);
    g.fillStyle(Palette.white, 0.9);
    g.fillRect(28 + lean, 20, 9, 3);
    g.fillStyle(Palette.cyan, 0.85);
    g.fillRect(41 + lean, 22, 17, 5);
    g.fillStyle(Palette.magenta, 0.9);
    if (pose >= 8 && pose <= 10) {
      g.fillTriangle(45, 18, 62, 8 + pose, 46, 34);
      g.lineStyle(5, Palette.cyan, 0.95);
      g.beginPath();
      g.arc(42, 28, 24 + (pose - 8) * 6, Phaser.Math.DegToRad(308), Phaser.Math.DegToRad(42), false);
      g.strokePath();
    } else if (pose === 7) {
      g.fillTriangle(18, 20, 5, 32, 20, 36);
    } else {
      g.fillTriangle(42 + lean, 27, 59 + lean, 25, 42 + lean, 34);
    }
    g.fillStyle(Palette.ink2, 1);
    g.fillRect(22 + lean, 47, 8, 7 + (pose % 2) * 3);
    g.fillRect(35 + lean, 47, 8, 10 - (pose % 2) * 3);
    g.lineStyle(2, Palette.white, 0.35);
    g.strokeRoundedRect(19 + lean, 13, 24, 36, 7);
    g.generateTexture(key, 70, 60);
    g.destroy();
  }

  private makeInkCrawler(): void {
    if (this.textures.exists(TextureKey.InkCrawler)) return;
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    g.fillRoundedRect(8, 26, 48, 20, 8);
    g.fillTriangle(18, 27, 27, 12, 36, 27);
    g.lineStyle(3, Palette.magenta, 0.95);
    g.strokeRoundedRect(8, 26, 48, 20, 8);
    g.fillStyle(Palette.cyan, 0.9);
    g.fillRect(42, 31, 7, 3);
    g.generateTexture(TextureKey.InkCrawler, 64, 56);
    g.destroy();
  }

  private makeKiteWraith(): void {
    if (this.textures.exists(TextureKey.KiteWraith)) return;
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    g.fillTriangle(12, 12, 48, 25, 13, 44);
    g.fillTriangle(44, 24, 61, 14, 54, 37);
    g.lineStyle(3, Palette.cyan, 0.92);
    g.strokeTriangle(12, 12, 48, 25, 13, 44);
    g.lineStyle(2, Palette.magenta, 0.8);
    g.lineBetween(22, 24, 45, 25);
    g.generateTexture(TextureKey.KiteWraith, 68, 56);
    g.destroy();
  }

  private makeLanternWarden(key: TextureKey, accent: number): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    g.fillRoundedRect(18, 18, 44, 58, 9);
    g.fillStyle(accent, 0.9);
    g.fillCircle(40, 42, 16);
    g.fillStyle(Palette.ink1, 1);
    g.fillCircle(40, 42, 8);
    g.lineStyle(4, accent, 0.88);
    g.strokeRoundedRect(14, 12, 52, 68, 12);
    g.lineStyle(2, Palette.cyan, 0.7);
    g.lineBetween(20, 15, 8, 4);
    g.lineBetween(60, 15, 72, 4);
    g.generateTexture(key, 82, 88);
    g.destroy();
  }

  private makeTile(key: TextureKey, base: number, accent: number, pattern: string): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    g.fillStyle(base, 1);
    g.fillRect(0, 0, 64, 64);
    g.lineStyle(2, accent, 0.75);
    if (pattern === 'pipe') {
      g.strokeRoundedRect(10, 18, 44, 26, 12);
      g.lineBetween(20, 18, 20, 44);
      g.lineBetween(44, 18, 44, 44);
    } else if (pattern === 'lantern') {
      g.fillStyle(accent, 0.9);
      g.fillEllipse(32, 31, 28, 38);
      g.lineStyle(3, Palette.red, 0.8);
      g.strokeEllipse(32, 31, 28, 38);
    } else if (pattern === 'window') {
      g.strokeRect(8, 8, 48, 48);
      g.lineBetween(32, 8, 32, 56);
      g.lineBetween(8, 32, 56, 32);
    } else if (pattern === 'paint') {
      g.lineStyle(4, accent, 0.8);
      g.lineBetween(14, 50, 50, 12);
      g.lineBetween(20, 52, 55, 17);
    } else if (pattern === 'sign') {
      g.fillStyle(accent, 0.22);
      g.fillRoundedRect(6, 14, 52, 30, 5);
      g.strokeRoundedRect(6, 14, 52, 30, 5);
    } else if (pattern === 'shrine') {
      g.strokeTriangle(8, 28, 32, 8, 56, 28);
      g.fillRect(23, 27, 18, 24);
    } else {
      for (let y = 12; y <= 52; y += 18) {
        g.lineBetween(2, y, 62, y);
      }
      for (let x = 14; x <= 52; x += 20) {
        g.lineBetween(x, 0, x, 64);
      }
    }
    g.lineStyle(1, Palette.white, 0.18);
    g.strokeRect(1, 1, 62, 62);
    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  private makeThorn(): void {
    if (this.textures.exists(TextureKey.TileThorn)) return;
    const g = this.graphics();
    g.fillStyle(Palette.red, 0.98);
    for (let x = 0; x < 64; x += 10) {
      g.fillTriangle(x, 64, x + 5, 10, x + 10, 64);
    }
    g.lineStyle(2, Palette.magenta, 0.9);
    g.lineBetween(0, 62, 64, 62);
    g.generateTexture(TextureKey.TileThorn, 64, 64);
    g.destroy();
  }

  private makeSpark(key: TextureKey): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    g.lineStyle(4, Palette.cyan, 0.95);
    g.beginPath();
    g.moveTo(5, 24);
    g.lineTo(22, 8);
    g.lineTo(31, 34);
    g.lineTo(48, 10);
    g.lineTo(60, 30);
    g.strokePath();
    g.generateTexture(key, 64, 42);
    g.destroy();
  }

  private makeFallingSign(key: TextureKey): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    g.fillStyle(Palette.ink1, 1);
    g.fillRoundedRect(4, 8, 84, 30, 6);
    g.lineStyle(3, Palette.magenta, 0.9);
    g.strokeRoundedRect(4, 8, 84, 30, 6);
    g.lineStyle(2, Palette.cyan, 0.8);
    g.lineBetween(16, 23, 76, 23);
    g.generateTexture(key, 92, 48);
    g.destroy();
  }

  private makeCheckpoint(): void {
    if (this.textures.exists(TextureKey.Checkpoint)) return;
    const g = this.graphics();
    g.fillStyle(Palette.ink0, 1);
    g.fillRect(18, 18, 28, 44);
    g.fillStyle(Palette.cyan, 0.9);
    g.fillCircle(32, 22, 10);
    g.lineStyle(3, Palette.gold, 0.95);
    g.strokeTriangle(8, 20, 32, 2, 56, 20);
    g.lineStyle(2, Palette.magenta, 0.7);
    g.lineBetween(32, 28, 32, 60);
    g.generateTexture(TextureKey.Checkpoint, 64, 68);
    g.destroy();
  }

  private makeGateTexture(key: TextureKey, width: number, height: number, moon: boolean): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    g.lineStyle(5, moon ? Palette.moon : Palette.gold, 0.95);
    g.strokeRoundedRect(8, 4, width - 16, height - 8, 16);
    g.lineStyle(3, Palette.cyan, 0.75);
    g.lineBetween(width / 2, 11, width / 2, height - 12);
    if (moon) {
      g.fillStyle(Palette.moon, 0.16);
      g.fillCircle(width / 2, height / 2, 24);
    }
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private makePickup(key: TextureKey, accent: number, shape: string): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    g.fillStyle(accent, 0.92);
    if (shape === 'scroll') {
      g.fillRoundedRect(7, 12, 30, 21, 4);
      g.fillStyle(Palette.ink0, 1);
      g.fillRect(13, 18, 18, 2);
      g.fillRect(13, 25, 13, 2);
    } else if (shape === 'heart') {
      g.fillCircle(17, 18, 8);
      g.fillCircle(28, 18, 8);
      g.fillTriangle(9, 22, 36, 22, 22, 39);
    } else if (shape === 'diamond') {
      g.fillTriangle(22, 4, 40, 22, 22, 40);
      g.fillTriangle(22, 4, 4, 22, 22, 40);
    } else if (shape === 'timer') {
      g.fillCircle(22, 24, 15);
      g.fillStyle(Palette.ink0, 1);
      g.fillRect(21, 14, 3, 12);
      g.fillRect(22, 24, 10, 3);
    } else {
      g.fillCircle(22, 22, 13);
      g.lineStyle(2, Palette.white, 0.6);
      g.strokeCircle(22, 22, 10);
    }
    g.generateTexture(key, 44, 44);
    g.destroy();
  }

  private makeControlTexture(key: TextureKey, width: number, height: number, shape: string): void {
    if (this.textures.exists(key)) return;
    const g = this.graphics();
    g.fillStyle(Palette.ink2, 0.7);
    g.fillCircle(width / 2, height / 2, Math.min(width, height) / 2 - 4);
    g.lineStyle(3, Palette.cyan, 0.8);
    g.strokeCircle(width / 2, height / 2, Math.min(width, height) / 2 - 5);
    g.fillStyle(Palette.white, 0.85);
    if (shape === 'pause') {
      g.fillRect(width / 2 - 8, height / 2 - 11, 5, 22);
      g.fillRect(width / 2 + 3, height / 2 - 11, 5, 22);
    } else if (shape === 'dpad') {
      g.fillTriangle(56, 20, 46, 38, 66, 38);
      g.fillTriangle(56, 92, 46, 74, 66, 74);
      g.fillTriangle(20, 56, 38, 46, 38, 66);
      g.fillTriangle(92, 56, 74, 46, 74, 66);
    } else {
      g.fillCircle(width / 2, height / 2, 16);
    }
    g.generateTexture(key, width, height);
    g.destroy();
  }
}

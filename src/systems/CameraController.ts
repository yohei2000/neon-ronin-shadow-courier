import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import type { Player } from '../entities/Player';
import { lerp } from '../utils/math';

export class CameraController {
  private leadX = -96;
  private readonly camera: Phaser.Cameras.Scene2D.Camera;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    stageWidth: number,
    stageHeight: number
  ) {
    this.camera = scene.cameras.main;
    this.camera.setBounds(0, 0, stageWidth, stageHeight);
    this.camera.startFollow(player, false, 0.12, 0.1);
    this.camera.setDeadzone(BASE_WIDTH * 0.18, BASE_HEIGHT * 0.18);
    this.camera.setFollowOffset(this.leadX, 50);
  }

  update(deltaMs: number): void {
    const targetLead = this.player.facing > 0 ? -118 : 118;
    const amount = Math.min(1, deltaMs / 260);
    this.leadX = lerp(this.leadX, targetLead, amount);
    this.camera.setFollowOffset(Math.round(this.leadX), 50);
  }
}

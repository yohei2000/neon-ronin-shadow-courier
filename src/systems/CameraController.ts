import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../config/dimensions';
import { Stage1Data, Stage1Tuning } from '../data/stage1';
import { clamp } from './geometry';

export type CameraTarget = {
  readonly x: number;
  readonly y: number;
  readonly facing: -1 | 1;
};

export class CameraController {
  constructor(private readonly camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera.setBounds(0, 0, Stage1Data.worldWidth, Stage1Data.worldHeight);
  }

  update(target: CameraTarget, deltaMs: number): void {
    const desiredX = clamp(target.x + target.facing * Stage1Tuning.cameraLead - BASE_WIDTH / 2, 0, Stage1Data.worldWidth - BASE_WIDTH);
    const desiredY = clamp(target.y - BASE_HEIGHT * 0.58, 0, Stage1Data.worldHeight - BASE_HEIGHT);
    const lerp = Math.min(1, deltaMs / 180);
    this.camera.scrollX += (desiredX - this.camera.scrollX) * lerp;
    this.camera.scrollY += (desiredY - this.camera.scrollY) * lerp;
  }
}

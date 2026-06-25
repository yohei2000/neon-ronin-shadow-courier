import * as Phaser from 'phaser';
import { TextureKey } from '../config/keys';
import { Palette } from '../config/palette';
import type { Player } from '../entities/Player';
import type { Stage1Definition } from '../types/stage';

type DamagePlayer = (damage: number, sourceX: number) => void;

export class StageHazards {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: Stage1Definition,
    private readonly player: Player,
    private readonly highContrast: boolean,
    private readonly damagePlayer: DamagePlayer
  ) {}

  create(): void {
    for (const hazard of this.stage.hazards) {
      const texture =
        hazard.kind === 'thorn'
          ? TextureKey.TileThorn
          : hazard.id === 'falling-sign-a'
            ? TextureKey.FallingSign
            : TextureKey.TimedSpark;
      const sprite = this.scene.physics.add.staticImage(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2, texture);
      sprite.setDisplaySize(hazard.width, hazard.height).refreshBody();
      sprite.setDepth(hazard.kind === 'thorn' ? 9 : 13);
      if (this.highContrast) {
        sprite.setTint(Palette.red);
      }
      this.scene.physics.add.overlap(this.player, sprite, () => this.damagePlayer(1, sprite.x));
    }
  }
}

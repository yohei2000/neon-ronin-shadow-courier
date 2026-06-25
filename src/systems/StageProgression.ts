import * as Phaser from 'phaser';
import { AudioKey, TextureKey } from '../config/keys';
import { Palette, PaletteCss } from '../config/palette';
import { PlayerBalance } from '../data/balance';
import type { Player } from '../entities/Player';
import type { CheckpointDefinition, SectionDefinition, Stage1Definition } from '../types/stage';
import type { AudioSystem } from './AudioSystem';
import type { FXSystem } from './FXSystem';

type DamagePlayer = (damage: number, sourceX: number) => void;
type QueueGameOver = (reason: 'defeated' | 'fall') => void;

export type FallProgressionOutcome = 'none' | 'rescued' | 'game-over';

export function clampCheckpointIndex(checkpoints: readonly CheckpointDefinition[], requested: number): number {
  if (checkpoints.length === 0) return 0;
  return Math.max(0, Math.min(checkpoints.length - 1, Math.floor(requested)));
}

export function checkpointIndexAfterProgress(
  checkpoints: readonly CheckpointDefinition[],
  currentIndex: number,
  playerX: number
): number {
  let nextIndex = clampCheckpointIndex(checkpoints, currentIndex);
  for (let index = nextIndex + 1; index < checkpoints.length; index += 1) {
    if (playerX >= checkpoints[index].x - 18) {
      nextIndex = index;
    }
  }
  return nextIndex;
}

export function stageSpawnPoint(stage: Stage1Definition, checkpointIndex: number): { readonly x: number; readonly y: number } {
  const checkpoint = stage.checkpoints[clampCheckpointIndex(stage.checkpoints, checkpointIndex)] ?? stage.playerSpawn;
  return { x: checkpoint.x, y: checkpoint.y - 22 };
}

export function sectionAtX(sections: readonly SectionDefinition[], x: number): SectionDefinition {
  return (
    [...sections]
      .filter((section) => x >= section.x && x <= section.x + section.width)
      .sort((a, b) => b.x - a.x)[0] ?? sections[0]
  );
}

export class StageProgression {
  private checkpointIndexValue: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stage: Stage1Definition,
    private readonly player: Player,
    private readonly audio: AudioSystem,
    private readonly fx: FXSystem,
    initialCheckpointIndex: number,
    private readonly damagePlayer: DamagePlayer,
    private readonly queueGameOver: QueueGameOver
  ) {
    this.checkpointIndexValue = clampCheckpointIndex(stage.checkpoints, initialCheckpointIndex);
  }

  get checkpointIndex(): number {
    return this.checkpointIndexValue;
  }

  create(): void {
    this.createCheckpoints();
    this.createTutorials();
  }

  updateCheckpointByProgress(): void {
    const nextIndex = checkpointIndexAfterProgress(this.stage.checkpoints, this.checkpointIndexValue, this.player.x);
    if (nextIndex === this.checkpointIndexValue) return;
    const checkpoint = this.stage.checkpoints[nextIndex];
    this.activateCheckpoint(nextIndex, checkpoint.x, checkpoint.y, 16);
  }

  handleFall(fallRescue: boolean): FallProgressionOutcome {
    if (this.player.y <= PlayerBalance.fallDeathY) return 'none';
    if (fallRescue) {
      this.damagePlayer(1, this.player.x);
      this.respawnAtCheckpoint();
      return 'rescued';
    }
    this.queueGameOver('fall');
    return 'game-over';
  }

  currentSection(): SectionDefinition {
    return sectionAtX(this.stage.sections, this.player.x);
  }

  respawnAtCheckpoint(): void {
    const checkpoint = this.stage.checkpoints[this.checkpointIndexValue] ?? this.stage.checkpoints[0];
    this.player.revive(checkpoint.x, checkpoint.y - 22);
    this.fx.burst(checkpoint.x, checkpoint.y, Palette.cyan, 14);
  }

  private createCheckpoints(): void {
    this.stage.checkpoints.forEach((checkpoint, index) => {
      const sprite = this.scene.physics.add.staticImage(checkpoint.x, checkpoint.y, TextureKey.Checkpoint);
      sprite.setDepth(16);
      sprite.refreshBody();
      this.scene.physics.add.overlap(this.player, sprite, () => {
        if (index > this.checkpointIndexValue) {
          this.activateCheckpoint(index, sprite.x, sprite.y - 26, 18);
        }
      });
    });
  }

  private createTutorials(): void {
    for (const marker of this.stage.tutorials) {
      this.scene.add.rectangle(marker.x, marker.y + 18, 178, 34, Palette.ink1, 0.84).setDepth(12);
      this.scene.add
        .text(marker.x, marker.y + 18, marker.text, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: PaletteCss.white,
          align: 'center',
          fixedWidth: 166
        })
        .setOrigin(0.5)
        .setDepth(13);
      this.scene.add.line(marker.x, marker.y + 41, 0, 0, 0, 24, Palette.cyan, 0.48).setDepth(12);
    }
  }

  private activateCheckpoint(index: number, x: number, y: number, particles: number): void {
    this.checkpointIndexValue = index;
    this.audio.play(AudioKey.Checkpoint);
    this.fx.burst(x, y, Palette.gold, particles);
  }
}

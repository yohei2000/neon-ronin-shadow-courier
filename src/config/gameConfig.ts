import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from './dimensions';
import { BootScene } from '../scenes/BootScene';
import { ArtLabScene } from '../scenes/ArtLabScene';
import { ControlsScene } from '../scenes/ControlsScene';
import { CreditsScene } from '../scenes/CreditsScene';
import { GateAReviewScene } from '../scenes/GateAReviewScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { Stage1Scene } from '../scenes/Stage1Scene';
import { Stage2Scene } from '../scenes/Stage2Scene';
import { StageClearScene } from '../scenes/StageClearScene';
import { TitleScene } from '../scenes/TitleScene';

export { BASE_HEIGHT, BASE_WIDTH };

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#050508',
  pixelArt: false,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 4
  },
  scene: [BootScene, PreloadScene, TitleScene, ControlsScene, SettingsScene, CreditsScene, Stage1Scene, Stage2Scene, StageClearScene, ArtLabScene, GateAReviewScene],
  title: 'Neon Ronin: Shadow Courier',
  banner: false
};

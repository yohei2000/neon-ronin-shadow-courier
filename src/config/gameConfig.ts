import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from './dimensions';
import { BootScene } from '../scenes/BootScene';
import { ArtLabScene } from '../scenes/ArtLabScene';
import { GateAReviewScene } from '../scenes/GateAReviewScene';
import { PreloadScene } from '../scenes/PreloadScene';
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
  scene: [BootScene, PreloadScene, TitleScene, ArtLabScene, GateAReviewScene],
  title: 'Neon Ronin: Shadow Courier - Art Lock',
  banner: false
};

import * as Phaser from 'phaser';
import { SceneKey } from './keys';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { TitleScene } from '../scenes/TitleScene';
import { ControlsScene } from '../scenes/ControlsScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { WorldMapScene } from '../scenes/WorldMapScene';
import { GameScene } from '../scenes/GameScene';
import { PauseScene } from '../scenes/PauseScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { StageClearScene } from '../scenes/StageClearScene';
import { EndingScene } from '../scenes/EndingScene';
import { BASE_HEIGHT, BASE_WIDTH } from './dimensions';

export { BASE_HEIGHT, BASE_WIDTH, TILE_SIZE } from './dimensions';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#05070f',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 980 },
      debug: false
    }
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    ControlsScene,
    SettingsScene,
    WorldMapScene,
    GameScene,
    PauseScene,
    GameOverScene,
    StageClearScene,
    EndingScene
  ],
  title: 'Neon Ronin: Shadow Courier',
  banner: false
};

export const firstScene = SceneKey.Boot;
